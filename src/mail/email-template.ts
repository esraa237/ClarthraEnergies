// src/mail/email-template.ts
export interface EmailTemplateParams {
  title: string;
  greeting: string;
  message: string;
  ctaText?: string;
  ctaUrl?: string;
  warning?: string;
  companyName: string;
  logoUrl: string;
  supportEmail: string;
}

export function generateEmailTemplate(params: EmailTemplateParams) {
  const { title, greeting, message, ctaText, ctaUrl, warning, companyName, logoUrl, supportEmail } = params;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin:0; padding:0; background-color:#f4f6f7; }
        .email-container { max-width:600px; margin:20px auto; background-color:#fff; border-radius:8px; overflow:hidden; }
        .header { padding:25px; text-align:center; background: linear-gradient(135deg, #ADD0B3, #afcbe5); }
        .header img { max-width:150px; height:auto; }
        .title-section { text-align:center; padding:15px 0; border-bottom:1px solid #e0e0e0; }
        .title-section h2 { color:#388E3C; font-size:20px; margin:0; font-weight:700; }
        .content { padding:25px 30px; font-size:15px; line-height:1.6; }
        .content p { margin:10px 0; }
        .cta-button { display:inline-block; text-align:center; background-color:#388E3C; color:#fff !important; text-decoration:none; padding:12px 30px; border-radius:6px; font-weight:600; margin:25px auto; font-size:15px; }
        .cta-button:hover { background-color:#2E7D32; }
        .warning { color:#cc0000; font-weight:600; font-size:14px; margin-top:10px; }
        .footer { border-top:1px solid #e0e0e0; background-color:#fafafa; padding:20px 30px; text-align:center; font-size:13px; color:#666; }
        .footer a { color:#004aad; font-weight:600; text-decoration:none; }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header"><img src="${logoUrl}" alt="${companyName} Logo"></div>
        <div class="title-section"><h2>${title}</h2></div>
        <div class="content">
          <p>${greeting}</p>
          <p>${message}</p>
          ${ctaUrl ? `<div style="text-align:center;"><a href="${ctaUrl}" class="cta-button">${ctaText}</a></div>` : ""}
          ${warning ? `<p class="warning">${warning}</p>` : ""}
        </div>
        <div class="footer">
          <p>If you have any questions, contact our support team immediately.</p>
          <p>Best regards,<br><strong>The ${companyName} Team</strong></p>
          <p>Support: <a href="mailto:${supportEmail}">${supportEmail}</a></p>
          <p>&copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const plainText = `
${title}
${greeting}
${message}
${ctaUrl ? `Action: ${ctaText}\nLink: ${ctaUrl}` : ""}
${warning ? `Warning: ${warning}` : ""}
---
${companyName} Team
Support: ${supportEmail}
  `;

  return { html, plainText };
}
