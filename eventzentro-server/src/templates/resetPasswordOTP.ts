export const resetPasswordOTPTemplate = (
  firstName: string,
  otp: string
): string => {
  return `
    <!DOCTYPE html>
    <html>
      <body>
        <h2>Password Reset</h2>
        <p>Hello ${firstName},</p>
        <p>Your OTP for resetting your password is:</p>
        <h1>${otp}</h1>
        <p>This OTP is valid for 10 minutes.</p>
      </body>
    </html>
  `;
};