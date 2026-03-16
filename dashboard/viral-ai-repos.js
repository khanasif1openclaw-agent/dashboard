/*
  Find "viral" AI-focused GitHub repos via Firecrawl search.
  NOTE: This is heuristic (search-based), not GitHub Trending API.

  Output:
    - dashboard/data/viral-ai-repos.json
*/

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const outPath = path.join(__dirname, 'data', 'viral-ai-repos.json');
const tmpDir = path.join(__dirname, '.firecrawl');
fs.mkdirSync(tmpDir, { recursive: true });

function run(cmd) {
  cp.execSync(cmd, { stdio: 'inherit' });
}

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function uniqBy(arr, keyFn) {
  const seen = new Set();
  const out = [];
  for (const x of arr) {
    const k = keyFn(x);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(x);
  }
  return out;
}

function isRepoUrl(u) {
  try {
    const url = new URL(u);
    if (url.hostname !== 'github.com') return false;
    const parts = url.pathname.split('/').filter(Boolean);
    return parts.length >= 2 && !['topics', 'trending', 'marketplace', 'search'].includes(parts[0]);
  } catch {
    return false;
  }
}

function query(name, q, limit = 8, tbs = 'qdr:d') {
  const out = path.join(tmpDir, `${name}.json`);
  const cmd = `firecrawl search "${q.replace(/\"/g, '\\"')}" --categories github --tbs ${tbs} --limit ${limit} -o ${out} --json`;
  run(cmd);
  const j = loadJson(out);
  const items = (j?.data?.web || []).map(r => ({
    url: r.url,
    title: r.title,
    description: r.description,
    sourceQuery: name,
    position: r.position
  }));
  return items;
}

const all = [
  ...query('ai-github-trending', 'github trending ai repository', 10, 'qdr:d'),
  ...query('ai-meeting', 'open source ai meeting assistant github', 8, 'qdr:w'),
  ...query('ai-agents', 'open-source ai agent github', 8, 'qdr:w'),
  ...query('rag', 'open-source RAG framework github', 8, 'qdr:w'),
  ...query('vector', 'open-source vector database github', 8, 'qdr:w'),
];

const repos = uniqBy(all.filter(x => isRepoUrl(x.url)), x => x.url.toLowerCase());

const output = {
  generatedAt: new Date().toISOString(),
  note: 'Heuristic list based on web search results; treat as a "viral" signal, not definitive trending.',
  repos
};

fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
console.log(outPath);
