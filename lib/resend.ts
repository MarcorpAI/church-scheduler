import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

export async function sendEmail({
    to,
    subject,
    text,
    html
}: {
    to: string;
    subject: string;
    text: string;
    html?: string;
}) {
    if (!resend) {
        console.log("RESEND_API_KEY not found. Email log:", { to, subject, text });
        return { id: "log-only" };
    }

    try {
        const data = await resend.emails.send({
            from: "ServeFlow <notifications@serveflow.dev>", // Replace with verified domain
            to,
            subject,
            text,
            html: html || text,
        });

        return data;
    } catch (error) {
        console.error("Error sending email:", error);
        throw error;
    }
}
