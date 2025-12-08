/*
 * Calily - Email Service (Brevo/Sendinblue)
 * Handles sending password reset emails
 * 
 * Author: Ava Raper
 * Version: 1.0
 */

const SibApiV3Sdk = require('@getbrevo/brevo');

// Initialize Brevo API client
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
const apiKey = apiInstance.authentications['apiKey'];
apiKey.apiKey = process.env.BREVO_API_KEY;

/**
 * Send password reset email with 6-digit code
 * @param {string} email - Recipient email address
 * @param {string} resetToken - 6-digit reset code
 */
const sendPasswordResetEmail = async (email, resetToken) => {
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

  // Email configuration
  sendSmtpEmail.subject = 'Calily - Password Reset Code';
  sendSmtpEmail.to = [{ email: email }];
  sendSmtpEmail.sender = {
    name: 'Calily',
    email: process.env.EMAIL_FROM || 'noreply@yourdomain.com'
  };

  // HTML email template
  sendSmtpEmail.htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              
              <!-- Header -->
              <tr>
                <td style="background-color: #333; padding: 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">CALILY</h1>
                  <p style="color: #cccccc; margin: 5px 0 0 0; font-size: 14px;">Your AI-powered health journal</p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">Reset Your Password</h2>
                  
                  <p style="color: #666; line-height: 1.6; margin: 0 0 20px 0;">
                    You requested a password reset for your Calily account. Use the code below to reset your password:
                  </p>
                  
                  <!-- Reset Code Box -->
                  <div style="background-color: #f8f8f8; border: 2px solid #e0e0e0; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0;">
                    <p style="color: #999; margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Your Reset Code</p>
                    <h1 style="color: #333; margin: 0; font-size: 48px; font-weight: bold; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                      ${resetToken}
                    </h1>
                  </div>
                  
                  <p style="color: #666; line-height: 1.6; margin: 20px 0;">
                    This code will expire in <strong>1 hour</strong>.
                  </p>
                  
                  <p style="color: #666; line-height: 1.6; margin: 20px 0;">
                    If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f8f8f8; padding: 20px 30px; border-top: 1px solid #e0e0e0;">
                  <p style="color: #999; font-size: 12px; line-height: 1.6; margin: 0;">
                    This is an automated message from Calily. Please do not reply to this email.
                  </p>
                  <p style="color: #999; font-size: 12px; margin: 10px 0 0 0;">
                    © ${new Date().getFullYear()} Calily. All rights reserved.
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

  // Plain text fallback
  sendSmtpEmail.textContent = `
    CALILY - Reset Your Password
    
    You requested a password reset for your Calily account.
    
    Your reset code is: ${resetToken}
    
    This code will expire in 1 hour.
    
    If you didn't request this, you can safely ignore this email.
    
    © ${new Date().getFullYear()} Calily
  `;

  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('✓ Password reset email sent to:', email);
    return { success: true };
  } catch (error) {
    console.error('✗ Brevo email error:', error);
    throw new Error('Failed to send email');
  }
};

module.exports = { sendPasswordResetEmail };