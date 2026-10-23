import nodemailer from "nodemailer";

let transporter;
const getTransporter = () => {
  if (!transporter)
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      // fail fast instead of hanging for minutes if the SMTP port is blocked
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
  return transporter;
};

export const sendEmail = async (to, subject, html) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("⚠️ SMTP not configured, email skipped:", subject);
    return;
  }
  await getTransporter().sendMail({
    from: `"AUCTECH MARCOM" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
};