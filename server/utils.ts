
const nodemailer = require("nodemailer");

/**
 * Sends an email using the provided email and password as the sender.
 * @param senderEmail - The sender's email address (must match the SMTP account).
 * @param senderPassword - The sender's email password or app password.
 * @param recipientEmail - The recipient's email address.
 * @param subject - The subject of the email.
 * @param text - The plain text body of the email.
 */
export async function sendEmail(
  senderEmail: string,
  senderPassword: string,
  recipientEmail: string,
  subject: string,
  text: string
): Promise<void> {
  const transporter = nodemailer.createTransport({
    service: "gmail", // Change to your provider if needed
    auth: {
      user: senderEmail,
      pass: senderPassword,
    },
  });

  await transporter.sendMail({
    from: senderEmail,
    to: recipientEmail,
    subject,
    text,
  });
}

sendEmail(
  "jirudagutema@gmail.com",
  "your-email-password",
  "jethior1@gmail.com",
  "Test Subject",
  "Hello, this is a test email!"
);