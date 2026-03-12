const Parser = require('rss-parser');

(async () => {
  const p = new Parser();
  const urls = [
    'https://www.anthropic.com/rss.xml',
    'https://openai.com/blog/rss/',
    'https://deepmind.google/blog/rss.xml',
    'https://huggingface.co/blog/feed.xml',
  ];

  for (const u of urls) {
    try {
      const f = await p.parseURL(u);
      console.log('OK', u, 'items', f.items.length);
    } catch (e) {
      console.log('FAIL', u, e.message);
    }
  }
})();
