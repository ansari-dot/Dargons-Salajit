// HTML email template for the 6-digit email verification code
const verificationEmailHtml = ({ name, code }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#f4f1ea;font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f1ea;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background-color:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e8e2d4;">

          <!-- Header -->
          <tr>
            <td style="background-color:#636830;padding:28px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;letter-spacing:0.18em;text-transform:uppercase;font-weight:normal;">
                Palses Pure Wellness
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 16px 40px;">
              <p style="margin:0 0 8px 0;color:#636830;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;font-weight:bold;">
                One Last Step
              </p>
              <h2 style="margin:0 0 12px 0;color:#2c3319;font-size:28px;font-weight:normal;">
                Verify Your Email
              </h2>
              <p style="margin:0 0 6px 0;color:#555a3c;font-size:15px;line-height:1.6;">
                Hi ${name || 'there'},
              </p>
              <p style="margin:0 0 24px 0;color:#555a3c;font-size:15px;line-height:1.6;">
                A secure step toward your natural wellness journey. Enter the 6-digit code below to verify your email address.
              </p>

              <!-- Code Box -->
              <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto 24px auto;">
                <tr>
                  <td align="center" style="background-color:#f7f5ef;border:1px solid #d9d3bf;border-radius:12px;padding:18px 34px;">
                    <span style="font-size:34px;font-weight:bold;letter-spacing:0.35em;color:#2c3319;font-family:'Courier New',monospace;">
                      ${code}
                    </span>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 6px 0;color:#8a8a72;font-size:13px;line-height:1.6;text-align:center;">
                This code expires in <strong style="color:#636830;">10 minutes</strong>.
              </p>
              <p style="margin:0;color:#8a8a72;font-size:13px;line-height:1.6;text-align:center;">
                Didn't request this? You can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px 32px 40px;border-top:1px solid #eee9dc;margin-top:16px;">
              <p style="margin:0;color:#a3a390;font-size:12px;text-align:center;letter-spacing:0.06em;">
                &copy; ${new Date().getFullYear()} Palses Pure Wellness &middot; Pure Ingredients. Real Results.
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

  // Password reset email — sends the user to /reset-password?token=…
const passwordResetEmailHtml = ({ name, resetUrl }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#f4f1ea;font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f1ea;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background-color:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e8e2d4;">

          <!-- Header -->
          <tr>
            <td style="background-color:#636830;padding:28px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;letter-spacing:0.18em;text-transform:uppercase;font-weight:normal;">
                Palses Pure Wellness
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 16px 40px;">
              <p style="margin:0 0 8px 0;color:#636830;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;font-weight:bold;">
                Forgot Password?
              </p>
              <h2 style="margin:0 0 12px 0;color:#2c3319;font-size:28px;font-weight:normal;">
                Reset Your Password
              </h2>
              <p style="margin:0 0 6px 0;color:#555a3c;font-size:15px;line-height:1.6;">
                Hi ${name || 'there'},
              </p>
              <p style="margin:0 0 24px 0;color:#555a3c;font-size:15px;line-height:1.6;">
                We received a request to reset the password for your account. Click the button below to choose a new one.
              </p>

              <!-- Reset Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto 24px auto;">
                <tr>
                  <td align="center" style="background-color:#636830;border-radius:10px;">
                    <a href="${resetUrl}" style="display:inline-block;padding:14px 34px;color:#ffffff;font-size:13px;letter-spacing:0.14em;text-transform:uppercase;text-decoration:none;font-weight:bold;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 6px 0;color:#8a8a72;font-size:13px;line-height:1.6;text-align:center;">
                This link expires in <strong style="color:#636830;">30 minutes</strong>.
              </p>
              <p style="margin:0;color:#8a8a72;font-size:13px;line-height:1.6;text-align:center;">
                Didn't request this? You can safely ignore this email — your password stays unchanged.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px 32px 40px;border-top:1px solid #eee9dc;margin-top:16px;">
              <p style="margin:0;color:#a3a390;font-size:12px;text-align:center;letter-spacing:0.06em;">
                &copy; ${new Date().getFullYear()} Palses Pure Wellness &middot; Pure Ingredients. Real Results.
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

module.exports = { verificationEmailHtml, passwordResetEmailHtml };