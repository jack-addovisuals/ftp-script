import { Resend } from "resend";
import { MAIL_API_KEY, MAIL_FROM, MAIL_TO } from "./const.js";

const resend = new Resend(MAIL_API_KEY);

export async function sendEmail(subject, text) {
  try {
    await resend.emails.send({
      from: MAIL_FROM,
      to: MAIL_TO,
      subject: subject,
      html: text,
    });

    console.log(`📧 Email sent: ${subject}`);
  } catch (err) {
    console.error("🚨 Email failed:", err.message);
  }
}
