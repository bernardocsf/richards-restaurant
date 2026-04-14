import nodemailer from 'nodemailer';
import { env } from '../config/env';

type EmailMessage = {
  to: string;
  subject: string;
  text: string;
};

function hasSmtpConfig() {
  return Boolean(env.smtpHost && env.smtpUser && env.smtpPass && env.mailFrom);
}

function createTransporter() {
  if (!hasSmtpConfig()) return null;

  return nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass
    }
  });
}

export async function sendEmail(message: EmailMessage) {
  if (!message.to) return false;

  if (!hasSmtpConfig()) {
    console.warn(
      'Email not sent: SMTP config incomplete. Configure SMTP_PASS for the Gmail sender in backend/.env.'
    );
    return false;
  }

  const transporter = createTransporter();
  if (!transporter) return false;

  await transporter.sendMail({
    from: env.mailFrom,
    to: message.to,
    subject: message.subject,
    text: message.text
  });

  return true;
}
