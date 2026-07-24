import brevoClient from "../config/brevo";

interface SendEmailOptions {
    to: string;
    subject: string;
    htmlContent: string;
}

export const sendEmail = async ({
    to,
    subject,
    htmlContent,
}: SendEmailOptions): Promise<void> => {
    await brevoClient.transactionalEmails.sendTransacEmail({
        sender: {
            name: process.env.EMAIL_FROM_NAME as string,
            email: process.env.EMAIL_FROM as string,
        },
        to: [
            {
                email: to,
            },
        ],
        subject,
        htmlContent,
    });
};