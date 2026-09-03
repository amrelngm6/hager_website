import nodemailer from "nodemailer";

import dotenv from "dotenv";
dotenv.config();

export async function sendEmail(to: string, subject: string, text: string, html: string) {

  // Create a transporter using SMTP configuration
  const transporter = mailConfig();

  const info = await transporter.sendMail({
    from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
    html,
  });

  console.log("Sent:", info.messageId);
}

function mailConfig() {
    const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
  return transporter;
}