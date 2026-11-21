<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your PayPen Password</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, a, span { font-family: Arial, Helvetica, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; color: #1e293b;">

  <!-- Outer Background Table -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f1f5f9; width: 100%; min-height: 100vh; padding: 40px 16px;">
    <tr>
      <td align="center" valign="top">

        <!-- Main Email Container -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 580px; width: 100%; margin: 0 auto;">

          <!-- Brand Logo Header -->
          <tr>
            <td align="center" style="padding-bottom: 28px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td valign="middle" style="background-color: #059669; border-radius: 12px; width: 44px; height: 44px; text-align: center;">
                    <span style="color: #ffffff; font-weight: 800; font-size: 20px; font-family: monospace; letter-spacing: -0.5px;">PP</span>
                  </td>
                  <td valign="middle" style="padding-left: 12px;">
                    <span style="font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">PayPen</span>
                    <span style="display: inline-block; margin-left: 6px; padding: 2px 8px; background-color: #ecfdf5; color: #065f46; font-size: 11px; font-weight: 700; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid #a7f3d0;">Fintech</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main White Content Card -->
          <tr>
            <td style="background-color: #ffffff; border-radius: 20px; padding: 40px 36px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);">

              <!-- Security Shield Pill -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px;">
                <tr>
                  <td style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 20px; padding: 4px 12px;">
                    <span style="color: #1d4ed8; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                      🛡️ Security Verification
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Heading -->
              <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; line-height: 1.3;">
                Password Reset Request
              </h1>

              <!-- Greeting & Context -->
              <p style="margin: 0 0 14px 0; font-size: 15px; line-height: 1.6; color: #334155;">
                Hello <strong>{{ $user->name }}</strong>,
              </p>
              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #475569;">
                We received an account security request to reset the password for your PayPen digital wallet (<strong style="color: #0f172a;">{{ $user->email }}</strong>).
              </p>

              <!-- Call to Action Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <a href="{{ $resetUrl }}" target="_blank" style="display: inline-block; background-color: #059669; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 700; padding: 15px 36px; border-radius: 12px; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.25); text-align: center; letter-spacing: 0.2px;">
                      Reset Your Password &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Expiry Alert Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; margin: 24px 0 20px 0;">
                <tr>
                  <td style="padding: 14px 18px;">
                    <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #92400e;">
                      <strong>⏱️ 15-Minute Expiry:</strong> For your security, this password reset authorization link is valid for exactly <strong>15 minutes</strong>. After expiration, a new request must be initiated.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Safety Notice -->
              <p style="margin: 0 0 24px 0; font-size: 13px; line-height: 1.6; color: #64748b;">
                If you did not request this password reset, no action is required. Your account credentials and digital wallet balance remain completely secure.
              </p>

              <!-- Divider -->
              <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 28px 0 24px 0;">

              <!-- Fallback Link Section -->
              <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">
                Button not working? Copy and paste this URL into your browser:
              </p>
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; word-break: break-all; font-family: monospace; font-size: 11px; line-height: 1.5; color: #0284c7;">
                <a href="{{ $resetUrl }}" target="_blank" style="color: #0284c7; text-decoration: underline;">
                  {{ $resetUrl }}
                </a>
              </div>

            </td>
          </tr>

          <!-- Security Tip Footer -->
          <tr>
            <td style="padding: 24px 20px 0 20px; text-align: center;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding-bottom: 12px;">
                    <span style="font-size: 12px; color: #64748b;">
                      🔒 <strong>Fintech Security Rule:</strong> PayPen staff will never ask for your password, 4-digit MPIN, or full card details.
                    </span>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <p style="margin: 0; font-size: 11px; color: #94a3b8; line-height: 1.5;">
                      &copy; {{ date('Y') }} PayPen Fintech Ltd. Built with bank-grade double-entry ledger security.<br>
                      This is an automated system notification. Please do not reply directly to this email.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
