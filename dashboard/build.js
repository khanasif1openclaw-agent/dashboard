const Parser = require('rss-parser');
const axios = require('axios');
const fs = require('fs');

const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (OpenClaw dashboard builder)',
    Accept: 'application/rss+xml,application/xml;q=0.9,*/*;q=0.8',
  },
});

const FEEDS = {
  // If you want true AU-local headlines, swap this to an AU RSS feed.
  world: 'https://feeds.bbci.co.uk/news/world/rss.xml',
  tech: 'https://techcrunch.com/feed/',
  aiLabs: 'https://deepmind.google/blog/rss.xml',
  benchmarks: 'https://huggingface.co/blog/feed.xml',
};

async function fetchFeed(url, limit = 5) {
  const feed = await parser.parseURL(url);
  return feed.items.slice(0, limit).map((item) => ({
    title: item.title,
    link: item.link,
    summary: item.contentSnippet || item.summary || '',
    image: item.enclosure?.url || item['media:content']?.$.url || '',
    date: item.pubDate,
  }));
}

async function safeWrite(path, data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

async function fetchWeather() {
  const res = await axios.get(
    'https://api.open-meteo.com/v1/forecast?latitude=-33.87&longitude=151.21&current_weather=true&hourly=temperature_2m,precipitation_probability,weathercode'
  );
  return res.data.current_weather;
}

async function fetchStocks() {
  const symbols = ['AAPL', 'MSFT', 'GOOGL', 'NVDA', 'META'];
  const results = [];

  for (const sym of symbols) {
    try {
      const res = await axios.get(
        `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&range=5d`,
        { headers: { 'User-Agent': 'Mozilla/5.0' } }
      );
      const quote = res.data.chart.result[0].meta;
      results.push({
        symbol: sym,
        price: quote.regularMarketPrice,
        change: quote.regularMarketPrice - quote.chartPreviousClose,
        changePercent: (
          ((quote.regularMarketPrice - quote.chartPreviousClose) /
            quote.chartPreviousClose) *
          100
        ).toFixed(2),
      });
    } catch (e) {
      console.log(`Stock ${sym} failed: ${e.message}`);
    }
  }

  return results;
}

async function main() {
  if (!fs.existsSync('data')) fs.mkdirSync('data');

  console.log('Fetching weather...');
  safeWrite('data/weather.json', await fetchWeather());

  console.log('Fetching World news...');
  safeWrite('data/news-au.json', await fetchFeed(FEEDS.world));

  console.log('Fetching Tech news...');
  safeWrite('data/news-tech.json', await fetchFeed(FEEDS.tech));

  console.log('Fetching AI lab news...');
  safeWrite('data/news-ai.json', await fetchFeed(FEEDS.aiLabs));

  console.log('Fetching Benchmark news...');
  safeWrite('data/benchmarks.json', await fetchFeed(FEEDS.benchmarks));

  console.log('Fetching stocks...');
  safeWrite('data/stocks.json', await fetchStocks());

  console.log('All data fetched successfully!');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
