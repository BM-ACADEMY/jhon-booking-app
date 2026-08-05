export const getReplyEmailTemplate = ({ recipientName, replySubject, replyText, originalMessage, originalSubject }) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const logoUrl = `${clientUrl}/assets/LogoBalified-uQH2isdr.png`; // Fallback logo reference or clean text logo

  const formattedReplyText = replyText
    ? replyText.split('\n').map(p => p.trim() ? `<p style="margin: 0 0 16px 0; color: #334155; font-size: 15px; line-height: 1.7;">${p}</p>` : '').join('')
    : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${replySubject || 'Response from The Balified Villa'}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 40px 15px;">
    <tr>
      <td align="center">
        <!-- Main Email Container -->
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; max-width: 600px; width: 100%;">
          
          <!-- Header Banner -->
          <tr>
            <td align="center" style="background-color: #0f172a; padding: 32px 24px; border-bottom: 3px solid #eab308;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: 2px; text-transform: uppercase;">
                The Balified Villa
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 11px; font-weight: 600; color: #fbbf24; text-transform: uppercase; letter-spacing: 3px;">
                LUXURY STAYS &amp; HOSPITALITY
              </p>
            </td>
          </tr>

          <!-- Main Content Body -->
          <tr>
            <td style="padding: 36px 32px; background-color: #ffffff;">
              
              <!-- Greeting -->
              <h2 style="margin: 0 0 20px 0; font-size: 18px; font-weight: 700; color: #0f172a;">
                Hello ${recipientName || 'Valued Guest'},
              </h2>

              <!-- Reply Message Body -->
              <div style="margin-bottom: 28px;">
                ${formattedReplyText}
              </div>

              <!-- Original Inquiry Context Block -->
              ${originalMessage ? `
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border-radius: 12px; border-left: 4px solid #f59e0b; border-top: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; margin: 28px 0;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <span style="font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-bottom: 6px;">
                      YOUR ORIGINAL INQUIRY (${originalSubject || 'Message'}):
                    </span>
                    <p style="margin: 0; font-size: 13px; color: #475569; line-height: 1.6; font-style: italic;">
                      "${originalMessage}"
                    </p>
                  </td>
                </tr>
              </table>
              ` : ''}

              <!-- Call to Action Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 32px; margin-bottom: 16px;">
                <tr>
                  <td align="center">
                    <a href="${clientUrl}" target="_blank" style="display: inline-block; background-color: #0f172a; color: #ffffff; font-size: 13px; font-weight: 700; text-decoration: none; padding: 14px 28px; border-radius: 10px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 12px rgba(15,23,42,0.15);">
                      Visit Our Website
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Sign off -->
              <div style="border-top: 1px solid #f1f5f9; pt-24; margin-top: 32px; padding-top: 24px;">
                <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: #475569;">
                  Warm regards,
                </p>
                <p style="margin: 0; font-size: 15px; font-weight: 800; color: #0f172a;">
                  The Balified Villa Management Team
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer Banner -->
          <tr>
            <td align="center" style="background-color: #f8fafc; padding: 24px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #64748b; font-weight: 500;">
                The Balified Villa &bull; Luxury Resort &amp; Private Villas
              </p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                &copy; ${new Date().getFullYear()} The Balified Villa. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};
