import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.example.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || "user@example.com",
    pass: process.env.SMTP_PASS || "password",
  },
});

export const sendReminderEmail = async (to: string, name: string) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || "noreply@example.com",
    to,
    subject: "Time to get back to Codeforces problem solving!",
    text: `Hello ${name},\n\nWe noticed you haven't made any Codeforces submissions in the last 7 days. It's a great time to solve a few problems and keep improving!\n\nHappy coding!`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Reminder email sent to ${to}`);
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
  }
};
