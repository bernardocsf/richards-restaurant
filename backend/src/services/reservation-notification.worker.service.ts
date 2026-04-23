import nodemailer from 'nodemailer';
import { AvailabilitySuggestion, getZoneLabel, ReservationZone } from '../config/reservation-policy';

type WorkerNotificationEnv = {
  MAIL_FROM?: string;
  SMTP_HOST?: string;
  SMTP_PASS?: string;
  SMTP_PORT?: string;
  SMTP_SECURE?: string;
  SMTP_USER?: string;
};

type EmailMessage = {
  to: string;
  subject: string;
  text: string;
};

type ReservationNotificationPayload = {
  customerName: string;
  phone: string;
  email?: string;
  dateLabel: string;
  time: string;
  guests: number;
  zone: ReservationZone;
  statusLabel: string;
};

type NotificationResult = {
  emailSent: boolean;
  restaurantEmailSent: boolean;
};

function formatGuestLabel(guests: number) {
  return guests === 1 ? '1 pessoa' : `${guests} pessoas`;
}

function hasSmtpConfig(env: WorkerNotificationEnv) {
  return Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS && env.MAIL_FROM);
}

function createTransporter(env: WorkerNotificationEnv) {
  if (!hasSmtpConfig(env)) return null;

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: Number(env.SMTP_PORT ?? 587),
    secure: env.SMTP_SECURE === 'true',
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS
    }
  });
}

async function sendEmail(message: EmailMessage, env: WorkerNotificationEnv) {
  if (!message.to) return false;
  if (!hasSmtpConfig(env)) return false;

  const transporter = createTransporter(env);
  if (!transporter) return false;

  await transporter.sendMail({
    from: env.MAIL_FROM,
    to: message.to,
    subject: message.subject,
    text: message.text
  });

  return true;
}

function reservationSummary(payload: ReservationNotificationPayload) {
  return [
    `Caro(a) ${payload.customerName},`,
    '',
    'Agradecemos a sua preferência.',
    '',
    `Confirmamos a sua reserva para o dia ${payload.dateLabel}, às ${payload.time}, para ${formatGuestLabel(payload.guests)}, na ${getZoneLabel(payload.zone)}.`,
    `Estado: ${payload.statusLabel}`,
    '',
    'Caso necessite de alterar ou cancelar a reserva, por favor entre em contacto connosco.',
    '',
    'Com os melhores cumprimentos,',
    "Richard's Garden Restaurant"
  ].join('\n');
}

function restaurantSummary(payload: ReservationNotificationPayload) {
  return [
    'Nova reserva confirmada',
    `Cliente: ${payload.customerName}`,
    `Telefone: ${payload.phone}`,
    `Email: ${payload.email || 'sem email'}`,
    `Data: ${payload.dateLabel}`,
    `Hora: ${payload.time}`,
    `Pessoas: ${formatGuestLabel(payload.guests)}`,
    `Zona: ${getZoneLabel(payload.zone)}`,
    `Estado: ${payload.statusLabel}`
  ].join('\n');
}

export async function sendWorkerReservationNotifications(
  payload: ReservationNotificationPayload,
  env: WorkerNotificationEnv
): Promise<NotificationResult> {
  const customerText = reservationSummary(payload);
  const restaurantText = restaurantSummary(payload);
  const restaurantEmail = env.MAIL_FROM;

  const [emailSent, restaurantEmailSent] = await Promise.all([
    payload.email
      ? sendEmail(
          {
            to: payload.email,
            subject: `Confirmacao da sua reserva - ${payload.dateLabel} as ${payload.time}`,
            text: customerText
          },
          env
        )
      : Promise.resolve(false),
    restaurantEmail
      ? sendEmail(
          {
            to: restaurantEmail,
            subject: `Nova reserva confirmada - ${payload.dateLabel} as ${payload.time}`,
            text: restaurantText
          },
          env
        )
      : Promise.resolve(false)
  ]);

  return {
    emailSent,
    restaurantEmailSent
  };
}

export function buildAlternativeMessage(suggestions: AvailabilitySuggestion[]) {
  return `Não temos disponibilidade exata para esse horário, mas temos estas opções próximas: ${suggestions
    .map((item) => item.label)
    .join(', ')}.`;
}

export function buildRejectionMessage() {
  return 'Lamentamos, mas não temos disponibilidade para esse pedido. Por favor escolha outro horário, data ou zona.';
}
