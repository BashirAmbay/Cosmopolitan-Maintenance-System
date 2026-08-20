import nodemailer from 'nodemailer';

// Helper to construct OAuth2 or fallback transporter
function createTransporter() {
  const {
    EMAIL_USER,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REFRESH_TOKEN
  } = process.env;

  if (EMAIL_USER && GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && GOOGLE_REFRESH_TOKEN) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: EMAIL_USER,
        clientId: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        refreshToken: GOOGLE_REFRESH_TOKEN
      }
    });
  }

  // Fallback: console logger transporter when OAuth keys are unconfigured
  return {
    sendMail: async (options) => {
      console.log('----------------------------------------------------');
      console.log('[EMAIL NOTIFICATION SERVICE (DEMO MODE)]');
      console.log(`TO: ${options.to}`);
      console.log(`SUBJECT: ${options.subject}`);
      console.log(`CONTENT:\n${options.text || options.html}`);
      console.log('----------------------------------------------------');
      return { messageId: 'demo-mail-' + Date.now() };
    }
  };
}

export async function sendNotificationEmail({ to, subject, requestRef, title, status, details, actionUrl }) {
  try {
    const transporter = createTransporter();

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 24px; color: #1e293b;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <div style="background-color: #0f172a; padding: 20px; text-align: center; border-bottom: 4px solid #3b82f6;">
            <h2 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: bold; letter-spacing: 0.5px;">
              COSMOPOLITAN UNIVERSITY ABUJA
            </h2>
            <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 13px;">Operations & Maintenance Management System</p>
          </div>
          
          <div style="padding: 24px;">
            <h3 style="color: #0f172a; margin-top: 0;">${subject}</h3>
            
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
              <tr>
                <td style="padding: 8px; font-weight: bold; color: #64748b; width: 140px;">Reference Code:</td>
                <td style="padding: 8px; font-weight: bold; color: #1e40af;">${requestRef}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold; color: #64748b;">Title:</td>
                <td style="padding: 8px; color: #0f172a;">${title}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold; color: #64748b;">Status:</td>
                <td style="padding: 8px;"><span style="background-color: #e0f2fe; color: #0369a1; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: bold; text-transform: uppercase;">${status}</span></td>
              </tr>
            </table>

            <div style="background-color: #f1f5f9; border-left: 4px solid #3b82f6; padding: 12px 16px; border-radius: 4px; margin: 16px 0;">
              <p style="margin: 0; font-size: 14px; color: #334155;">${details}</p>
            </div>

            ${actionUrl ? `
              <div style="text-align: center; margin-top: 24px;">
                <a href="${actionUrl}" style="background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">
                  View Request Details
                </a>
              </div>
            ` : ''}
          </div>

          <div style="background-color: #f8fafc; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
            <p style="margin: 0;">This is an automated notification from Cosmopolitan University Abuja O&M System.</p>
            <p style="margin: 4px 0 0 0;">Location: Central Campus, Abuja, Nigeria</p>
          </div>
        </div>
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"Cosmopolitan University O&M" <${process.env.EMAIL_USER || 'operations@cosmopolitan.edu.ng'}>`,
      to,
      subject: `[${requestRef}] ${subject}`,
      html: htmlContent
    });

    return info;
  } catch (error) {
    console.error('Failed to send email notification:', error.message);
    // Don't throw to avoid crashing ticket creation or status transition
    return null;
  }
}
