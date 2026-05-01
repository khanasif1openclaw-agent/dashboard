/*
  build.js (local)

  Goal:
  - NO RSS.
  - Scrape/crawl source pages to collect links.
  - For each article: fetch HTML, extract title + og:image + short text.
  - Use OpenClaw's configured model (GPT 5.2) locally to produce a crisp 1–2 line summary.

  Notes:
  - We keep this script local-run only. You (the user) run `node build.js` then commit+push.
*/

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const { JSDOM } = require('jsdom');
const { Readability } = require('@mozilla/readability');

const OUT_DIR = path.join(__dirname, 'data');

const UA = 'Mozilla/5.0 (OpenClaw dashboard builder)';

const SOURCES = {
  world: {
    name: 'BBC World',
    url: 'https://www.bbc.com/news/world',
    // selectors are best-effort; we also fall back to generic link harvesting
  },
  au: {
    name: 'ABC Australia',
    url: 'https://www.abc.net.au/news/',
  },
  tech: {
    name: 'The Verge',
    url: 'https://www.theverge.com/tech',
  },
  tech2: {
    name: 'TechCrunch',
    url: 'https://techcrunch.com/',
  },
  finance: {
    name: 'Financial Times Markets',
    url: 'https://www.ft.com/markets',
  },
  crypto: {
    name: 'CoinDesk',
    url: 'https://www.coindesk.com/',
  },
  ai1: {
    name: 'OpenAI News',
    url: 'https://openai.com/news/',
  },
  ai2: {
    name: 'Anthropic',
    url: 'https://www.anthropic.com/news',
  },
  ai3: {
    name: 'Google DeepMind',
    url: 'https://deepmind.google/discover/blog/',
  },
  ai4: {
    name: 'Hugging Face',
    url: 'https://huggingface.co/blog',
  },
};

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

async function httpGet(url) {
  const res = await axios.get(url, {
    headers: { 'User-Agent': UA, Accept: 'text/html,*/*;q=0.8' },
    timeout: 30000,
    maxRedirects: 5,
  });
  return res.data;
}

function absUrl(base, href) {
  try {
    return new URL(href, base).toString();
  } catch {
    return null;
  }
}

function isLikelyArticleUrl(u) {
  if (!u) return false;
  // Avoid obvious non-articles
  if (u.includes('#')) return false;
  if (u.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i)) return false;
  if (u.match(/\.(css|js|json|xml)(\?|$)/i)) return false;
  if (u.includes('/video') || u.includes('/live')) return true; // sometimes still content
  // Prefer URLs with path depth
  try {
    const url = new URL(u);
    return url.pathname.split('/').filter(Boolean).length >= 2;
  } catch {
    return false;
  }
}

function uniq(arr) {
  return [...new Set(arr)];
}

async function collectLinksFromListing(sourceKey, limit = 8) {
  const src = SOURCES[sourceKey];
  const html = await httpGet(src.url);
  const $ = cheerio.load(html);

  const links = [];
  $('a[href]').each((_, a) => {
    const href = $(a).attr('href');
    const u = absUrl(src.url, href);
    if (!u) return;
    // stay on same origin if possible
    try {
      if (new URL(u).hostname !== new URL(src.url).hostname) return;
    } catch {
      return;
    }
    if (!isLikelyArticleUrl(u)) return;
    links.push(u);
  });

  // de-dupe and take first N
  return uniq(links).slice(0, limit);
}

function extractMetaFromHtml(url, html) {
  const $ = cheerio.load(html);

  const ogTitle = $('meta[property="og:title"]').attr('content');
  const twTitle = $('meta[name="twitter:title"]').attr('content');
  const title = ogTitle || twTitle || $('title').text().trim();

  const ogImage = $('meta[property="og:image"]').attr('content');
  const twImage = $('meta[name="twitter:image"]').attr('content');
  const image = ogImage || twImage || '';

  const ogDesc = $('meta[property="og:description"]').attr('content');
  const twDesc = $('meta[name="twitter:description"]').attr('content');
  const desc = ogDesc || twDesc || '';

  const published =
    $('meta[property="article:published_time"]').attr('content') ||
    $('time[datetime]').attr('datetime') ||
    '';

  return { url, title, image, desc, published };
}

function extractReadableText(url, html) {
  try {
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();
    const text = (article?.textContent || '').replace(/\s+/g, ' ').trim();
    return text;
  } catch {
    return '';
  }
}

function summarizeHeuristic({ title, sourceName, text, fallback }) {
  // IMPORTANT: This builder must run in GitHub Actions too.
  // So we do NOT call OpenClaw/LLMs here.

  const clean = (s) => String(s || '').replace(/\s+/g, ' ').trim();

  // Prefer publisher-written description.
  const desc = clean(fallback);
  if (desc) {
    // Ensure single sentence.
    const one = desc.split(/(?<=[.!?])\s+/)[0] || desc;
    return clean(one);
  }

  // Fallback: compress article text to ~22 words.
  const body = clean(text);
  if (!body) return clean(title);

  const words = body.split(' ').slice(0, 22);
  let out = words.join(' ');
  if (!/[.!?]$/.test(out)) out += '.';
  return out;
}

async function buildSection(sectionId, sourceKeys, limitPerSource = 4) {
  const items = [];

  for (const key of sourceKeys) {
    const src = SOURCES[key];
    let links = [];
    try {
      links = await collectLinksFromListing(key, limitPerSource);
    } catch (e) {
      console.log(`[${sectionId}] link collect failed for ${src.name}: ${e.message}`);
      continue;
    }

    for (const u of links) {
      try {
        const html = await httpGet(u);
        const meta = extractMetaFromHtml(u, html);
        const text = extractReadableText(u, html);

        // Compose a fallback summary from meta
        const fallback = (meta.desc || '').trim();

        const blurb = summarizeHeuristic({
          title: meta.title,
          sourceName: src.name,
          text,
          fallback,
        });

        items.push({
          source: src.name,
          link: u,
          title: meta.title,
          image: meta.image,
          published: meta.published,
          blurb,
        });
      } catch (e) {
        // skip
      }
    }
  }

  // Filter items with images first; keep tile visuals strong.
  const withImg = items.filter((x) => x.image);
  const withoutImg = items.filter((x) => !x.image);

  const final = [...withImg, ...withoutImg].slice(0, 10);
  return final;
}

async function main() {
  ensureDir(OUT_DIR);

  console.log('Building sections (local scrape + GPT summaries)...');

  const payload = {
    generatedAt: new Date().toISOString(),
    sections: {
      weather: { city: 'Sydney', note: 'Weather tile uses Open-Meteo in the client for now.' },
      world: await buildSection('world', ['world']),
      australia: await buildSection('australia', ['au']),
      tech: await buildSection('tech', ['tech', 'tech2']),
      // "ai" remains as-is for the dashboard section.
      ai: await buildSection('ai', ['ai1', 'ai2', 'ai3', 'ai4']),
      // "ai_top" is the email-requested Top 5 AI news (OpenAI/Anthropic/DeepMind + major media).
      ai_top: (await buildSection('ai_top', ['ai1', 'ai2', 'ai3', 'tech', 'tech2'], 5)).slice(0, 5),
      finance: await buildSection('finance', ['finance', 'crypto'], 6),
    },
  };

  fs.writeFileSync(path.join(OUT_DIR, 'content.json'), JSON.stringify(payload, null, 2));
  console.log('Wrote data/content.json');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
