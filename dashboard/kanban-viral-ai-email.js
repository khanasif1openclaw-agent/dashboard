/* Generate an HTML email: top 5 viral AI GitHub repos */
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'data', 'viral-ai-repos.json');
const outPath = path.join(__dirname, 'data', 'viral-ai-email.html');

if (!fs.existsSync(dataPath)) {
  throw new Error(`Missing ${dataPath}. Run node viral-ai-repos.js first.`);
}

const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const top = (data.repos || []).slice(0, 5);

function row(it, idx) {
  const url = esc(it.url);
  const title = esc((it.title || '').replace(/\s+-\s+GitHub$/i, ''));
  const desc = esc(it.description || '');
  const source = esc(it.sourceQuery || '');
  return `
  <tr>
    <td style="padding:10px 0;vertical-align:top;width:34px;font-family:Arial,Helvetica,sans-serif;font-weight:800;color:#111827;">#${idx + 1}</td>
    <td style="padding:10px 0;vertical-align:top;">
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.3;margin:0 0 4px 0;font-weight:800;">
        <a href="${url}" style="color:#111827;text-decoration:none;">${title}</a>
      </div>
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:12.5px;line-height:1.45;color:#4B5563;margin:0 0 6px 0;">${desc}</div>
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:11.5px;color:#6B7280;">signal: ${source}</div>
    </td>
  </tr>`;
}

const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Viral AI GitHub Repos</title>
  </head>
  <body style="margin:0;padding:0;background:#F3F4F6;">
    <div style="display:none;max-height:0;overflow:hidden;">Top 5 viral AI GitHub repos</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#F3F4F6;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="border-collapse:collapse;width:640px;max-width:640px;">
            <tr>
              <td style="padding:0 0 14px 0;">
                <div style="font-family:Arial,Helvetica,sans-serif;font-size:20px;line-height:1.2;font-weight:900;color:#111827;">Top 5 “viral” AI GitHub repos</div>
                <div style="font-family:Arial,Helvetica,sans-serif;font-size:12.5px;line-height:1.4;color:#6B7280;margin-top:4px;">Generated: ${esc(new Date(data.generatedAt).toUTCString())}</div>
              </td>
            </tr>

            <tr>
              <td style="padding:12px 14px;border:1px solid #E5E7EB;border-radius:12px;background:#FFFFFF;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                  ${(top.length ? top.map(row).join('') : '<tr><td style="color:#6B7280;font-size:12.5px;">No results.</td></tr>')}
                </table>
                <div style="margin-top:10px;font-family:Arial,Helvetica,sans-serif;font-size:11.5px;line-height:1.4;color:#6B7280;">
                  Note: This is a heuristic “viral” signal based on web search results, not official GitHub Trending.
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

fs.writeFileSync(outPath, html, 'utf8');
console.log(outPath);
