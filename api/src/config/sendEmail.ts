import brevoClient from "./brevo";

interface SendEmailOptions {
    to: string;
    subject: string;
    htmlContent: string;
    otp?: string;
}

export const sendEmail = async ({
    to,
    subject,
    htmlContent,
    otp,
}: SendEmailOptions): Promise<void> => {
    // Extract OTP if not explicitly provided
    const extractedOtp = otp || htmlContent.match(/\b(\d{6})\b/)?.[1];

    if (extractedOtp && process.env.NODE_ENV !== "production") {
        console.log("\n=================================================");
        console.log(`🔑 [DEV OTP] Email: ${to} | OTP: [ ${extractedOtp} ]`);
        console.log("=================================================\n");
    }

    try {
        await brevoClient.transactionalEmails.sendTransacEmail({
            sender: {
                name: process.env.EMAIL_FROM_NAME as string || "EventZentro",
                email: process.env.EMAIL_FROM as string || "eventzentro@gmail.com",
            },
            to: [
                {
                    email: to,
                },
            ],
            subject,
            htmlContent,
        });

        console.log(`✅ [EMAIL SENT] Successfully dispatched email to ${to}`);
    } catch (error: any) {
        console.error(`❌ [EMAIL ERROR] Failed to send email to ${to}:`, error?.message || error);

        if (error?.body) {
            console.error("Brevo API Response Body:", error.body);
        }

        // In development, if Brevo blocks the IP or fails, do not throw so testing/registration continues
        if (process.env.NODE_ENV !== "production") {
            console.warn(
                `⚠️ [DEV NOTICE] Email sending failed (likely Brevo IP restriction). The OTP is saved in Redis and displayed above.`
            );
            return;
        }

        throw error;
    }
};