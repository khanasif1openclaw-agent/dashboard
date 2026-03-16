/* Generate an HTML email from dashboard/kanban/board.json */
const fs = require('fs');
const path = require('path');

const boardPath = path.join(__dirname, 'kanban', 'board.json');
const outPath = path.join(__dirname, 'data', 'kanban-email.html');

const board = JSON.parse(fs.readFileSync(boardPath, 'utf8'));

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const fmt = (d) => {
  if (!d) return '';
  try { return new Date(d).toUTCString(); } catch { return String(d); }
};

const ymdUTC = () => {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const da = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${da}`;
};

const today = ymdUTC();

function card(it) {
  const title = esc(it.title || 'Untitled');
  const notes = it.notes ? esc(it.notes) : '';
  const due = it.dueDate ? esc(it.dueDate) : '';
  const dueChip = due ? `<span style="display:inline-block;padding:3px 8px;border-radius:999px;border:1px solid #E5E7EB;background:${due === today ? '#FEF3C7' : '#F3F4F6'};font-size:11px;">Due: ${due}</span>`
    : `<span style="display:inline-block;padding:3px 8px;border-radius:999px;border:1px solid #E5E7EB;background:#F3F4F6;font-size:11px;">Due: —</span>`;

  return `
  <div style="border:1px solid #E5E7EB;border-radius:12px;padding:10px 12px;margin:10px 0;background:#FFFFFF;">
    <div style="font-size:14px;line-height:1.3;font-weight:700;color:#111827;margin:0 0 6px 0;">${title}</div>
    <div style="margin:0 0 6px 0;">${dueChip}</div>
    ${notes ? `<div style="font-size:12.5px;line-height:1.45;color:#4B5563;white-space:pre-wrap;">${notes}</div>` : ''}
  </div>`;
}

function section(title, items) {
  const list = items || [];
  const body = list.length ? list.map(card).join('\n') : `<div style="font-size:12.5px;line-height:1.45;color:#6B7280;">No items.</div>`;
  return `
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 0 18px 0;">
    <tr>
      <td style="padding:12px 14px;background:#111827;color:#FFFFFF;border-radius:12px 12px 0 0;font-size:14px;font-weight:700;letter-spacing:0.2px;">${esc(title)} <span style="font-weight:600;opacity:0.85;">(${list.length})</span></td>
    </tr>
    <tr>
      <td style="padding:10px 14px;border:1px solid #E5E7EB;border-top:none;border-radius:0 0 12px 12px;background:#FFFFFF;">${body}</td>
    </tr>
  </table>`;
}

const repo = 'khanasif1openclaw-agent/dashboard';
const baseUrl = process.env.DASHBOARD_URL || `https://${repo.split('/')[0]}.github.io/${repo.split('/')[1]}/`;
const kanbanUrl = `${baseUrl}kanban/`;

const todo = board.columns?.find(c => c.id === 'todo')?.items || [];
const inprog = board.columns?.find(c => c.id === 'in_progress')?.items || [];
const done = board.columns?.find(c => c.id === 'done')?.items || [];

const dueToday = [];
for (const c of board.columns || []) {
  for (const it of (c.items || [])) {
    if (it.dueDate && it.dueDate === today) dueToday.push({ ...it, _col: c.name || c.id });
  }
}

const dueTodayBlock = dueToday.length
  ? dueToday.map(it => `<li style="margin:0 0 6px 0;"><b>${esc(it.title)}</b> <span style="color:#6B7280;">(${esc(it._col)})</span></li>`).join('')
  : '<li style="margin:0;">None</li>';

const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Kanban Status</title>
  </head>
  <body style="margin:0;padding:0;background:#F3F4F6;">
    <div style="display:none;max-height:0;overflow:hidden;">Kanban status • ${esc(fmt(board.updatedAt))}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#F3F4F6;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="border-collapse:collapse;width:640px;max-width:640px;">
            <tr>
              <td style="padding:0 0 14px 0;">
                <div style="font-family:Arial,Helvetica,sans-serif;font-size:20px;line-height:1.2;font-weight:800;color:#111827;">Kanban Board Status</div>
                <div style="font-family:Arial,Helvetica,sans-serif;font-size:12.5px;line-height:1.4;color:#6B7280;margin-top:4px;">Updated: ${esc(fmt(board.updatedAt)) || '—'}</div>
                <div style="font-family:Arial,Helvetica,sans-serif;font-size:12.5px;line-height:1.4;margin-top:6px;">
                  <a href="${esc(kanbanUrl)}" style="color:#2563EB;text-decoration:underline;">Open Kanban board</a>
                </div>
              </td>
            </tr>

            <tr>
              <td style="font-family:Arial,Helvetica,sans-serif;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 0 18px 0;">
                  <tr>
                    <td style="padding:12px 14px;background:#FFFFFF;border:1px solid #E5E7EB;border-radius:12px;">
                      <div style="font-size:14px;font-weight:800;margin:0 0 6px 0;color:#111827;">Due today (UTC)</div>
                      <ul style="margin:0;padding-left:18px;color:#111827;font-size:12.5px;line-height:1.45;">${dueTodayBlock}</ul>
                      <div style="margin-top:8px;color:#6B7280;font-size:11.5px;">(You said tasks default to “no due date” unless explicitly provided.)</div>
                    </td>
                  </tr>
                </table>

                ${section('To Do', todo)}
                ${section('In Progress', inprog)}
                ${section('Done', done)}
              </td>
            </tr>

            <tr>
              <td style="padding:10px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11.5px;line-height:1.4;color:#6B7280;">
                This is an automated daily Kanban report.
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
