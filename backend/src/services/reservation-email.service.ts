import nodemailer from 'nodemailer';
import { env } from '../config/env';

type ReservationEmailInput = {
  customerName: string;
  email?: string;
  dateLabel: string;
  time: string;
  guests: number;
  tableLabel: string;
  tableId: string;
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

export async function sendReservationConfirmationEmail(input: ReservationEmailInput) {
  if (!input.email || !hasSmtpConfig()) return false;

  const transporter = createTransporter();
  if (!transporter) return false;

  await transporter.sendMail({
    from: env.mailFrom,
    to: input.email,
    subject: `Reserva confirmada - ${input.dateLabel} às ${input.time}`,
    text: [
      `Olá ${input.customerName},`,
      '',
      'A tua reserva foi confirmada automaticamente.',
      `Data: ${input.dateLabel}`,
      `Hora: ${input.time}`,
      `Pessoas: ${input.guests}`,
      `Mesa atribuída: ${input.tableLabel} (${input.tableId})`,
      '',
      'Se precisares de alterar ou cancelar, entra em contacto connosco.',
      '',
      "Richard's Garden Restaurant"
    ].join('\n')
  });

  return true;
}
