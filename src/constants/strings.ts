export const kDefaultSuccessMessage = "Request Successful";
export const kDefaultAccessTokenExpirationIn = "1 Day";
export const kDefaultRefreshTokenExpirationIn = "14 Days";
export const kRrefreshTokenKey = "refreshToken";
export const kUserIdStoreKey = "user-id";
export const kUserSessionIdStoreKey = "session-id";
export const kDefaultSearchQuery = String();
export const kUserRoleStoreKey = "user-role";
export const kDefaultUserKey = "user";
export const kDefaultIpKey = "ip";
export const kDefaultRedirectKey = "redirect";
export const kDefaultCacheKey = "cache";
export const kUsernameStoreKey = "username";
export const kUserEmailStoreKey = "email";
export const kBaseName = "Shortly";
export const kWelcomeEmailSubject = `Welcome aboard to ${kBaseName}`;
export const kEmailverificationSubject = `${kBaseName} Email Verification`;
export const kForgotPasswordSubject = `Reset Password`;
export const kDeadletterExchangeKey = "x-dead-letter-exchange";
export const kDeadletterRoutingKey = "x-dead-letter-routing-key";
export const kDeadLetterMessageTTL = "x-message-ttl";
export const kBaseUrl = "http://www.shortly.com/";
export const kLocalHost = "127.0.0.1.3000/v1/";
export const BASE62 =
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
export const kRateLimitKey = "rate_limit";
export const kPaystackAPIURL = "https://api.paystack.co/";
export const kDefaultApiVersion = "v1";
export const kDefaultBucketName = "urlshortner-uploads";
export const kFileFormDataKey = "files";
export const kWelcomeHTMLText = (name: string) => `<h1> Welcome, ${name} </h1> 
        <p> This is the text email! </p>
        `;
export const kEmailVerificationHTMLText = (name: string, token: string) => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Verify Your Email</title>
  </head>

  <body
    style="
      margin: 0;
      padding: 0;
      background-color: #f4f7fb;
      font-family: Arial, Helvetica, sans-serif;
    "
  >
    <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px">
      <tr>
        <td align="center">
          <table
            width="100%"
            cellpadding="0"
            cellspacing="0"
            style="
              max-width: 600px;
              background-color: #ffffff;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            "
          >
            <!-- Header -->
            <tr>
              <td
                align="center"
                style="
                  background-color: #456149;
                  padding: 40px 20px;
                  color: #ffffff;
                "
              >
                <h1 style="margin: 0; font-size: 28px; font-weight: bold">
                  Welcome to ${kBaseName}
                </h1>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding: 40px 30px; color: #374151">
                <h2 style="margin-top: 0; font-size: 22px; color: #111827">
                  Hello ${name},
                </h2>

                <p style="font-size: 16px; line-height: 1.7; margin-bottom: 20px">
                  We’re happy to have you onboard. To get started with
                  <strong>${kBaseName}</strong>, please verify your email address.
                </p>

                <!-- Button -->
                <table cellpadding="0" cellspacing="0" style="margin: 30px 0">
                  <tr>
                    <td align="center">
                      <a
                        href="${kBaseUrl}/verify?token=${token}"
                        style="
                          background-color: #588157;
                          color: #ffffff;
                          text-decoration: none;
                          padding: 14px 28px;
                          border-radius: 8px;
                          display: inline-block;
                          font-size: 16px;
                          font-weight: bold;
                        "
                      >
                        Verify Email
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="font-size: 14px; line-height: 1.7; color: #6b7280">
                  If you did not create an account, you can safely ignore this email.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td
                align="center"
                style="
                  padding: 24px;
                  background-color: #f9fafb;
                  color: #6b7280;
                  font-size: 13px;
                "
              >
                © 2026 ${kBaseName}. All rights reserved.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

export const kForgotPasswordHTMLText = (name: string, token: string) =>
    `html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Password Reset</title>
  </head>

  <body
    style="
      margin: 0;
      padding: 0;
      background-color: #f4f7fb;
      font-family: Arial, Helvetica, sans-serif;
    "
  >
    <table
      width="100%"
      cellpadding="0"
      cellspacing="0"
      style="padding: 40px 20px"
    >
      <tr>
        <td align="center">
          <table
            width="100%"
            cellpadding="0"
            cellspacing="0"
            style="
              max-width: 600px;
              background-color: #ffffff;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            "
          >
            <!-- Header -->
            <tr>
              <td
                align="center"
                style="
                  background-color: #456149;
                  padding: 40px 20px;
                  color: #ffffff;
                "
              >
                <h1
                  style="
                    margin: 0;
                    font-size: 28px;
                    font-weight: bold;
                  "
                >
                  Password Reset
                </h1>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding: 40px 30px; color: #374151">
                <h2
                  style="
                    margin-top: 0;
                    font-size: 22px;
                    color: #111827;
                  "
                >
                  Reset Your Password
                </h2>

                <p
                  style="
                    font-size: 16px;
                    line-height: 1.7;
                    margin-bottom: 20px;
                  "
                >
                  Hi ${name} We received a request to reset your password. Click the
                  button below to create a new password.
                </p>

                <!-- Button -->
                <table
                  cellpadding="0"
                  cellspacing="0"
                  style="margin: 30px 0"
                >
                  <tr>
                    <td align="center">
                      <a
                        href="${kBaseUrl}/reset-password?token=${token}"
                        style="
                          background-color: #588157;
                          color: #ffffff;
                          text-decoration: none;
                          padding: 14px 28px;
                          border-radius: 8px;
                          display: inline-block;
                          font-size: 16px;
                          font-weight: bold;
                        "
                      >
                        Reset Password
                      </a>
                    </td>
                  </tr>
                </table>

                <p
                  style="
                    font-size: 15px;
                    line-height: 1.7;
                    margin-bottom: 10px;
                  "
                >
                  This password reset link will expire in
                  <strong>15 minutes</strong>.
                </p>

                <p
                  style="
                    font-size: 15px;
                    line-height: 1.7;
                    margin-bottom: 0;
                  "
                >
                  If you did not request a password reset, you can safely ignore
                  this email.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td
                align="center"
                style="
                  padding: 24px;
                  background-color: #f9fafb;
                  color: #6b7280;
                  font-size: 13px;
                "
              >
                © 2026 ${kBaseName}. All rights reserved.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

export const kPasswordChangedHTMLText = (name: string) => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Password Changed</title>
  </head>

  <body
    style="
      margin: 0;
      padding: 0;
      background-color: #f4f7fb;
      font-family: Arial, Helvetica, sans-serif;
    "
  >
    <table
      width="100%"
      cellpadding="0"
      cellspacing="0"
      style="padding: 40px 20px"
    >
      <tr>
        <td align="center">
          <table
            width="100%"
            cellpadding="0"
            cellspacing="0"
            style="
              max-width: 600px;
              background-color: #ffffff;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            "
          >
            <!-- Header -->
            <tr>
              <td
                align="center"
                style="
                  background-color: #456149;
                  padding: 40px 20px;
                  color: #ffffff;
                "
              >
                <h1
                  style="
                    margin: 0;
                    font-size: 28px;
                    font-weight: bold;
                  "
                >
                  Password Updated
                </h1>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding: 40px 30px; color: #374151">
                <h2
                  style="
                    margin-top: 0;
                    font-size: 22px;
                    color: #111827;
                  "
                >
               ${name}, Your Password Was Successfully Changed
                </h2>

                <p
                  style="
                    font-size: 16px;
                    line-height: 1.7;
                    margin-bottom: 20px;
                  "
                >
                  Your account password has been successfully updated. You can
                  now continue using your account with your new password.
                </p>

                <!-- Success Box -->
                <table
                  width="100%"
                  cellpadding="0"
                  cellspacing="0"
                  style="
                    background-color: #f3f8f2;
                    border: 1px solid #d8e6d5;
                    border-radius: 8px;
                    margin: 30px 0;
                  "
                >
                  <tr>
                    <td
                      style="
                        padding: 18px 20px;
                        color: #456149;
                        font-size: 15px;
                        line-height: 1.6;
                      "
                    >
                      ✓ Your password was changed successfully.
                    </td>
                  </tr>
                </table>

                <p
                  style="
                    font-size: 15px;
                    line-height: 1.7;
                    margin-bottom: 10px;
                  "
                >
                  If you made this change, no further action is required.
                </p>

                <p
                  style="
                    font-size: 15px;
                    line-height: 1.7;
                    margin-bottom: 0;
                  "
                >
                  If you did not change your password, please secure your
                  account immediately or contact support ${process.env.EMAIL_ADDRESS}.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td
                align="center"
                style="
                  padding: 24px;
                  background-color: #f9fafb;
                  color: #6b7280;
                  font-size: 13px;
                "
              >
                © 2026 ${kBaseName}. All rights reserved.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
