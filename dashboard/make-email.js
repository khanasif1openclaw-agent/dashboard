/* Generate an HTML email from dashboard/data/content.json */
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'data', 'content.json');
const outPath = path.join(__dirname, 'data', 'email.html');

const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const fmt = (d) => {
  if (!d) return '';
  try { return new Date(d).toUTCString(); } catch { return String(d); }
};

function itemRow(it) {
  const title = esc(it.title);
  const src = esc(it.source || '');
  const blurb = esc(it.blurb || '');
  const link = esc(it.link || '#');
  const pub = it.published ? fmt(it.published) : '';
  // Email clients may block hotlinked images (mixed content http://, referrer restrictions, bot blocking).
  // Route images through an HTTPS proxy to improve reliability.
  let imgUrl = String(it.image || '').trim();
  if (imgUrl.startsWith('http://')) imgUrl = 'https://' + imgUrl.slice('http://'.length);
  const proxied = imgUrl
    ? `https://images.weserv.nl/?url=${encodeURIComponent(imgUrl.replace(/^https?:\/\//, ''))}&w=240&h=160&fit=cover&output=jpg`
    : '';

  const img = proxied
    ? `<img src="${esc(proxied)}" width="120" height="80" style="display:block;width:120px;height:80px;object-fit:cover;border-radius:10px;border:1px solid #E5E7EB;" alt="">`
    : `<div style="width:120px;height:80px;border-radius:10px;border:1px solid #E5E7EB;background:#F3F4F6;"></div>`;

  return `
  <tr>
    <td style="padding:10px 0;vertical-align:top;width:132px;">${img}</td>
    <td style="padding:10px 0;vertical-align:top;">
      <div style="font-size:14px;line-height:1.3;margin:0 0 4px 0;font-weight:700;">
        <a href="${link}" style="color:#111827;text-decoration:none;">${title}</a>
      </div>
      <div style="font-size:12.5px;line-height:1.45;color:#4B5563;margin:0 0 6px 0;">${blurb}</div>
      <div style="font-size:12px;line-height:1.3;color:#6B7280;">${src}${pub ? ` • ${esc(pub)}` : ''}</div>
    </td>
  </tr>`;
}

function sectionBlock(name, items, limit = 5) {
  const list = (items || []).slice(0, limit);
  const rows = list.map(itemRow).join('\n');

  return `
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 0 18px 0;">
    <tr>
      <td style="padding:12px 14px;background:#111827;color:#FFFFFF;border-radius:12px 12px 0 0;font-size:14px;font-weight:700;letter-spacing:0.2px;">${esc(name)}</td>
    </tr>
    <tr>
      <td style="padding:6px 14px 4px 14px;border:1px solid #E5E7EB;border-top:none;border-radius:0 0 12px 12px;background:#FFFFFF;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
          ${rows || '<tr><td style="padding:12px 0;color:#6B7280;font-size:12.5px;">No items.</td></tr>'}
        </table>
      </td>
    </tr>
  </table>`;
}

const weather = data?.sections?.weather;

// Public dashboard link (GitHub Pages). If your Pages base differs, set DASHBOARD_URL env var.
const repo = 'khanasif1openclaw-agent/dashboard';
const dashboardUrl = process.env.DASHBOARD_URL || `https://${repo.split('/')[0]}.github.io/${repo.split('/')[1]}/`;

const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Daily Dashboard</title>
  </head>
  <body style="margin:0;padding:0;background:#F3F4F6;">
    <div style="display:none;max-height:0;overflow:hidden;">Daily Dashboard • ${esc(fmt(data.generatedAt))}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#F3F4F6;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="border-collapse:collapse;width:640px;max-width:640px;">
            <tr>
              <td style="padding:0 0 14px 0;">
                <div style="font-family:Arial,Helvetica,sans-serif;font-size:20px;line-height:1.2;font-weight:800;color:#111827;">Daily Dashboard</div>
                <div style="font-family:Arial,Helvetica,sans-serif;font-size:12.5px;line-height:1.4;color:#6B7280;margin-top:4px;">Updated: ${esc(fmt(data.generatedAt))}${weather?.city ? ` • Region: ${esc(weather.city)}` : ''}</div>
                <div style="font-family:Arial,Helvetica,sans-serif;font-size:12.5px;line-height:1.4;margin-top:6px;">
                  <a href="${esc(dashboardUrl)}" style="color:#2563EB;text-decoration:underline;">Open dashboard in browser</a>
                </div>
              </td>
            </tr>

            <tr>
              <td style="font-family:Arial,Helvetica,sans-serif;">
                ${sectionBlock('World', data.sections.world)}
                ${sectionBlock('Australia', data.sections.australia)}
                ${sectionBlock('Technology', data.sections.tech)}
                ${sectionBlock('Top 5 AI News', data.sections.ai_top, 5)}
                ${sectionBlock('AI', data.sections.ai)}
                ${sectionBlock('Markets', data.sections.finance)}
              </td>
            </tr>

            <tr>
              <td style="padding:10px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11.5px;line-height:1.4;color:#6B7280;">
                You’re receiving this as an HTML snapshot of the dashboard feed data.
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
