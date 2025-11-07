import formData from "form-data";
import Mailgun from "mailgun.js";
import { MAIL_API_KEY, MAIL_FROM, MAIL_FROM_DOMAIN, MAIL_TO } from "./const.js";

const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: "api",
  key: MAIL_API_KEY,
});

export async function sendEmail(subject, text) {
  try {
    await mg.messages.create(MAIL_FROM_DOMAIN, {
      from: MAIL_FROM,
      to: [MAIL_TO], // only verified emails in sandbox
      subject: subject,
      text: text,
    });

    console.log(`📧 Email sent: ${subject}`);
  } catch (err) {
    console.error("🚨 Email failed:", err.message);
  }
}
