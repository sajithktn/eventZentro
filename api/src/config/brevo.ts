import { BrevoClient } from "@getbrevo/brevo";

const brevoClient = new BrevoClient({
    apiKey: process.env.BREVO_API_KEY as string,
});


export default brevoClient;