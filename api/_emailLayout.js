// The one header and footer every website email uses. The leading underscore
// keeps this file from becoming a Vercel function (the plan allows 12).
//
// emailLayout({ title, subtitle, body, css }) returns a full HTML email:
// a plum band across the full width with the logo and title, the body in a
// 640px white column, and a light footer band. `css` carries any classes the
// body uses (info rows, boxes); `title` and `subtitle` are HTML, so escape
// any donor-supplied text before passing it in.
//
// Layout is tables and inline styles so Outlook and Gmail render it. Outlook
// on Windows ignores the gradient and max-width; the MSO blocks give it the
// solid plum and a fixed 640px column instead.

const PLUM = '#9B1B5D';
const FONT = `'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif`;
const DISPLAY = `'Montserrat','Inter',-apple-system,'Segoe UI',Helvetica,Arial,sans-serif`;
const LOGO = 'https://supportworkshousing.org/images/logo-white.png';

const column = inner => `<!--[if mso]><table role="presentation" width="640" align="center" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;max-width:640px"><tr><td>${inner}</td></tr></table>
<!--[if mso]></td></tr></table><![endif]-->`;

export function emailLayout({ title, subtitle = '', body, css = '' }) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@700;800&display=swap" rel="stylesheet">
<style>body{margin:0;padding:0;background:#fff}
@media (max-width:620px){.swh-pad{padding-left:20px!important;padding-right:20px!important}.swh-title{font-size:26px!important}}
${css}</style></head>
<body style="margin:0;padding:0;background:#fff;font-family:${FONT};font-size:15px;line-height:1.6;color:#4A4A4A">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse">
<tr><td align="center" bgcolor="${PLUM}" style="background-color:${PLUM};background-image:linear-gradient(120deg,#7D1649,${PLUM} 60%,#B4246C)">${column(`<div class="swh-pad" style="padding:30px 32px 32px;text-align:left">
<img src="${LOGO}" alt="SupportWorks Housing" height="28" style="display:block;height:28px;width:auto;border:0">
<div class="swh-title" style="font-family:${DISPLAY};font-size:30px;font-weight:800;color:#ffffff;letter-spacing:-.01em;line-height:1.15;margin-top:30px">${title}</div>
${subtitle ? `<div style="font-size:15px;color:#F5DCE8;margin-top:6px">${subtitle}</div>` : ''}</div>`)}</td></tr>
<tr><td align="center" style="background:#ffffff">${column(`<div class="swh-pad" style="padding:30px 32px 34px;text-align:left">${body}</div>`)}</td></tr>
<tr><td align="center" style="background:#F5EFF3;padding:22px 16px"><p style="margin:0;text-align:center;font-size:12px;line-height:1.6;color:#76666F">SupportWorks Housing &middot; Making Homelessness History<br><a href="https://supportworkshousing.org" style="color:#76666F;text-decoration:none">supportworkshousing.org</a></p></td></tr>
</table></body></html>`;
}
