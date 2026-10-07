export const verificationOTPTemplate = (
  firstName: string,
  otp: string,
  type: "verify" | "reset" = "verify"
): string => {
  const title =
    type === "verify"
      ? "Welcome to EventZentro "
      : "Reset Your EventZentro Password";

  const message =
    type === "verify"
      ? "Thank you for registering with EventZentro. Please use the OTP below to verify your email address."
      : "We received a request to reset your password. Please use the OTP below to continue.";

  const footer =
    type === "verify"
      ? "If you did not create this account, you can safely ignore this email."
      : "If you didn't request a password reset, you can safely ignore this email.";

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8" />
        <title>${
          type === "verify" ? "Email Verification" : "Reset Password"
        }</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 30px;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 30px; border-radius: 8px;">

            <h2 style="color: #2563eb;">
                ${title}
            </h2>

            <p>Hi <strong>${firstName}</strong>,</p>

            <p>
                ${message}
            </p>

            <div
                style="
                    text-align:center;
                    font-size:32px;
                    font-weight:bold;
                    letter-spacing:8px;
                    margin:30px 0;
                    color:#2563eb;
                "
            >
                ${otp}
            </div>

            <p>
                This OTP is valid for <strong>10 minutes</strong>.
            </p>

            <p>
                ${footer}
            </p>

            <hr />

            <p style="font-size:12px;color:#777;">
                © EventZentro
            </p>

        </div>
    </body>
    </html>
    `;
};