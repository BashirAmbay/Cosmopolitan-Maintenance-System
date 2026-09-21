import nodemailer from 'nodemailer';

// Helper to construct SMTP (App Password), OAuth2 or fallback transporter
function createTransporter() {
  const {
    EMAIL_USER,
    EMAIL_PASS,
    EMAIL_PASSWORD,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REFRESH_TOKEN
  } = process.env;

  const appPassword = (EMAIL_PASS || EMAIL_PASSWORD || '').replace(/\s+/g, '');

  // 1. Primary & Recommended: Gmail SMTP with 16-character Google App Password
  if (EMAIL_USER && appPassword) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: EMAIL_USER,
        pass: appPassword
      }
    });
  }

  // 2. Secondary: OAuth2 configuration
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

  // 3. Fallback: Console logger transporter when keys are unconfigured
  return {
    sendMail: async (options) => {
      console.log('----------------------------------------------------');
      console.log('[EMAIL NOTIFICATION SERVICE (DEMO/FALLBACK MODE)]');
      console.log(`TO: ${options.to}`);
      console.log(`SUBJECT: ${options.subject}`);
      console.log(`FROM: ${options.from || 'operations@cosmopolitan.edu.ng'}`);
      console.log('----------------------------------------------------');
      return { messageId: 'demo-mail-' + Date.now() };
    }
  };
}

/**
 * Send Login Notification Email to Student, Staff, Technician, Admin, or Management
 */
export async function sendLoginNotificationEmail({ to, name, role, ipAddress, userAgent }) {
  try {
    const transporter = createTransporter();
    const senderEmail = process.env.EMAIL_USER || 'operations@cosmopolitan.edu.ng';
    const clientUrl = process.env.CLIENT_URL || 'https://cosmopolitan-maintenance.vercel.app';

    // Format current date and time in West Africa / Nigerian time format
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedTime = now.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    });

    const roleBadge = (role || 'User').toUpperCase();

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; padding: 32px 16px; color: #1e293b;">
        <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.07), 0 4px 6px -4px rgba(0,0,0,0.05);">
          
          <!-- Header Banner -->
          <div style="background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); padding: 28px 24px; text-align: center; border-bottom: 4px solid #3b82f6;">
            <div style="display: inline-block; background: rgba(255,255,255,0.1); padding: 6px 14px; border-radius: 20px; margin-bottom: 8px;">
              <span style="color: #60a5fa; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">Campus Security Alert</span>
            </div>
            <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px;">
              COSMOPOLITAN UNIVERSITY
            </h1>
            <p style="color: #94a3b8; margin: 6px 0 0 0; font-size: 13px; font-weight: 500;">
              Operations & Maintenance Management Portal
            </p>
          </div>

          <!-- Body Content -->
          <div style="padding: 28px 24px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <div style="display: inline-block; width: 48px; height: 48px; line-height: 48px; border-radius: 50%; background-color: #dbeafe; color: #1d4ed8; font-size: 24px; text-align: center;">
                ✓
              </div>
              <h2 style="color: #0f172a; margin: 12px 0 4px 0; font-size: 18px; font-weight: 700;">
                Successful Portal Login
              </h2>
              <p style="color: #64748b; margin: 0; font-size: 14px;">
                Hello <strong style="color: #0f172a;">${name || 'Valued Member'}</strong>, you have successfully logged into your account.
              </p>
            </div>

            <!-- Login Details Table -->
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: 600; width: 120px;">Account Role:</td>
                  <td style="padding: 6px 0;">
                    <span style="background-color: #e0f2fe; color: #0284c7; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 700;">
                      ${roleBadge}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Account Email:</td>
                  <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${to}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Date & Time:</td>
                  <td style="padding: 6px 0; color: #0f172a;">${formattedDate} at ${formattedTime}</td>
                </tr>
                ${ipAddress ? `
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: 600;">IP Address:</td>
                  <td style="padding: 6px 0; color: #64748b; font-family: monospace;">${ipAddress}</td>
                </tr>
                ` : ''}
              </table>
            </div>

            <!-- Security Notice Box -->
            <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px 16px; border-radius: 4px; margin: 20px 0;">
              <p style="margin: 0; font-size: 13px; color: #1e40af; line-height: 1.5;">
                <strong>Security Notice:</strong> If this login was performed by you, you can safely ignore this message. If you did not log in or suspect unauthorized access, please immediately change your password or contact the University IT Helpdesk.
              </p>
            </div>

            <!-- Action Button -->
            <div style="text-align: center; margin-top: 24px;">
              <a href="${clientUrl}" style="background-color: #1e40af; color: #ffffff; text-decoration: none; padding: 11px 24px; border-radius: 6px; font-weight: 700; font-size: 13px; display: inline-block; box-shadow: 0 2px 4px rgba(30,64,175,0.2);">
                Open Maintenance Portal
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #f8fafc; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; line-height: 1.5;">
            <p style="margin: 0;">This is an automated security notification from Cosmopolitan University Abuja O&M System.</p>
            <p style="margin: 3px 0 0 0;">Central Campus, Airport Road, Abuja, Nigeria</p>
          </div>
        </div>
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"Cosmopolitan University O&M" <${senderEmail}>`,
      to,
      subject: `[Cosmopolitan Security] Successful Login - ${name || 'Portal User'}`,
      html: htmlContent
    });

    console.log(`[EmailService] Login notification sent successfully to ${to} (MessageId: ${info?.messageId})`);
    return info;
  } catch (error) {
    console.error(`[EmailService] Failed to send login notification to ${to}:`, error.message);
    return null;
  }
}

export async function sendNotificationEmail({ to, subject, requestRef, title, status, details, actionUrl }) {
  try {
    const transporter = createTransporter();
    const senderEmail = process.env.EMAIL_USER || 'operations@cosmopolitan.edu.ng';

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
      from: `"Cosmopolitan University O&M" <${senderEmail}>`,
      to,
      subject: `[${requestRef}] ${subject}`,
      html: htmlContent
    });

    return info;
  } catch (error) {
    console.error('Failed to send email notification:', error.message);
    return null;
  }
}

/**
 * Send Password Reset Link Email
 */
export async function sendPasswordResetEmail({ to, name, resetUrl, expiresInMinutes = 60 }) {
  try {
    const transporter = createTransporter();
    const senderEmail = process.env.EMAIL_USER || 'operations@cosmopolitan.edu.ng';

    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; padding: 32px 16px; color: #1e293b;">
        <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.07), 0 4px 6px -4px rgba(0,0,0,0.05);">
          
          <!-- Header Banner -->
          <div style="background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); padding: 28px 24px; text-align: center; border-bottom: 4px solid #3b82f6;">
            <div style="display: inline-block; background: rgba(255,255,255,0.1); padding: 6px 14px; border-radius: 20px; margin-bottom: 8px;">
              <span style="color: #60a5fa; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">Password Recovery</span>
            </div>
            <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px;">
              COSMOPOLITAN UNIVERSITY
            </h1>
            <p style="color: #94a3b8; margin: 6px 0 0 0; font-size: 13px; font-weight: 500;">
              Operations & Maintenance Management Portal
            </p>
          </div>

          <!-- Body Content -->
          <div style="padding: 32px 24px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="display: inline-block; width: 52px; height: 52px; line-height: 52px; border-radius: 50%; background-color: #fef3c7; color: #b45309; font-size: 24px; text-align: center;">
                🔑
              </div>
              <h2 style="color: #0f172a; margin: 14px 0 6px 0; font-size: 20px; font-weight: 800;">
                Reset Your Portal Password
              </h2>
              <p style="color: #64748b; margin: 0; font-size: 14px; line-height: 1.5;">
                Hello <strong style="color: #0f172a;">${name || 'Valued User'}</strong>,<br/>
                We received a request to reset the password for your Cosmopolitan University account (<strong>${to}</strong>).
              </p>
            </div>

            <!-- Primary Action Button -->
            <div style="text-align: center; margin: 28px 0;">
              <a href="${resetUrl}" style="background-color: #1e3a8a; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(30,58,138,0.3); letter-spacing: 0.3px;">
                Reset Password
              </a>
            </div>

            <!-- Expiry info -->
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; margin: 20px 0; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #64748b;">
                ⏰ This password reset confirmation link will expire in <strong>${expiresInMinutes} minutes</strong> (for security reasons).
              </p>
            </div>

            <!-- Fallback URL -->
            <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #f1f5f9;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #64748b; font-weight: 600;">
                Button not working? Copy and paste this URL into your web browser:
              </p>
              <p style="margin: 0; word-break: break-all; font-size: 11px; background-color: #f8fafc; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0; color: #1e40af; font-family: monospace;">
                <a href="${resetUrl}" style="color: #1e40af; text-decoration: none;">${resetUrl}</a>
              </p>
            </div>

            <!-- Security Notice -->
            <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; border-radius: 4px; margin-top: 24px;">
              <p style="margin: 0; font-size: 12px; color: #991b1b; line-height: 1.5;">
                <strong>Didn't request this?</strong> If you did not make this request, you can safely ignore this email. Your password will remain unchanged, and nobody can access your account without your email confirmation.
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #f8fafc; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; line-height: 1.5;">
            <p style="margin: 0;">This is an automated security transmission from Cosmopolitan University Abuja O&M System.</p>
            <p style="margin: 3px 0 0 0;">Central Campus, Airport Road, Abuja, Nigeria &bull; ${formattedDate}</p>
          </div>
        </div>
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"Cosmopolitan University Security" <${senderEmail}>`,
      to,
      subject: `[Cosmopolitan Security] Password Reset Confirmation Link`,
      html: htmlContent
    });

    console.log(`[EmailService] Password reset link email sent to ${to} (MessageId: ${info?.messageId})`);
    return info;
  } catch (error) {
    console.error(`[EmailService] Failed to send password reset email to ${to}:`, error.message);
    return null;
  }
}


