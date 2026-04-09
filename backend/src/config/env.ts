import dotenv from 'dotenv';

dotenv.config();

function required(name: string, fallback?: string) {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  mongoUri: required('MONGODB_URI', process.env.NODE_ENV === 'test' ? 'mongodb://localhost/test' : undefined),
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:3000',
  adminAccessKey: required('ADMIN_ACCESS_KEY'),
  smtpHost: process.env.SMTP_HOST,
  smtpPort: Number(process.env.SMTP_PORT ?? 587),
  smtpSecure: process.env.SMTP_SECURE === 'true',
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  mailFrom: process.env.MAIL_FROM
};
