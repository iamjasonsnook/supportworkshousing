// Shared email template builder
// This generates the full HTML email so we control everything in code

const LOGO_URL = 'https://supportworkshousing.vercel.app/images/logo-white.png';

// Helper to generate table row HTML
export const tableRow = (label, value, isLast = false) => `
  <tr>
    <td style="padding: 12px 0; ${isLast ? '' : 'border-bottom: 1px solid #eee;'} color: #666; font-size: 14px; width: 110px; vertical-align: top;">${label}</td>
    <td style="padding: 12px 0; ${isLast ? '' : 'border-bottom: 1px solid #eee;'} font-size: 14px;">${value}</td>
  </tr>`;

// Build complete email HTML
export const buildEmailHTML = ({ title, intro, contentHtml }) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff;">
    <div style="background-color: #9B1B5D; padding: 24px; text-align: center;">
      <img src="${LOGO_URL}" alt="SupportWorks Housing" style="max-width: 180px; height: auto;">
    </div>
    <div style="padding: 24px;">
      <h1 style="color: #9B1B5D; margin: 0 0 16px 0; font-size: 22px; font-weight: 600;">${title}</h1>
      <p style="margin: 0 0 20px 0; font-size: 14px; color: #333; line-height: 1.5;">
        ${intro}
      </p>
      <table style="width: 100%; border-collapse: collapse;">
        ${contentHtml}
      </table>
    </div>
    <div style="padding: 20px 24px; background-color: #9B1B5D; color: #ffffff;">
      <p style="margin: 0 0 12px 0; font-size: 13px; line-height: 1.5; text-align: center;">
        SupportWorks Housing provides stable, affordable housing combined with comprehensive support services to help Virginians rebuild their lives and achieve lasting independence.
      </p>
      <p style="margin: 0; font-size: 12px; text-align: center; opacity: 0.8;">
        SupportWorks Housing &bull; <a href="https://supportworkshousing.org" style="color: #ffffff;">supportworkshousing.org</a>
      </p>
    </div>
  </div>
</body>
</html>`;
