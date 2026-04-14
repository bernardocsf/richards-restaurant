import { env } from '../config/env';
import { AvailabilitySuggestion, getZoneLabel, ReservationZone } from '../config/reservation-policy';
import { sendEmail } from './reservation-email.service';

type ReservationNotificationPayload = {
  customerName: string;
  phone: string;
  email?: string;
  dateLabel: string;
  time: string;
  guests: number;
  zone: ReservationZone;
  referenceCode: string;
  tableIds: string[];
  statusLabel: string;
};

type NotificationResult = {
  emailSent: boolean;
  whatsappSent: boolean;
  restaurantEmailSent: boolean;
  restaurantWhatsappSent: boolean;
};

function reservationSummary(payload: ReservationNotificationPayload) {
  return [
    `Olá, ${payload.customerName}. A sua reserva foi confirmada para ${payload.dateLabel} às ${payload.time}, para ${payload.guests} pessoa(s), na ${getZoneLabel(payload.zone)}. Referência: ${payload.referenceCode}. Obrigado.`,
    '',
    `Mesas atribuídas: ${payload.tableIds.join(', ')}`,
    `Estado: ${payload.statusLabel}`
  ].join('\n');
}

function restaurantSummary(payload: ReservationNotificationPayload) {
  return [
    `Nova reserva confirmada: ${payload.referenceCode}`,
    `Cliente: ${payload.customerName}`,
    `Telefone: ${payload.phone}`,
    `Email: ${payload.email || 'sem email'}`,
    `Data: ${payload.dateLabel}`,
    `Hora: ${payload.time}`,
    `Pessoas: ${payload.guests}`,
    `Zona: ${getZoneLabel(payload.zone)}`,
    `Mesas: ${payload.tableIds.join(', ')}`,
    `Estado: ${payload.statusLabel}`
  ].join('\n');
}

async function sendWhatsappMessage(to: string | undefined, body: string) {
  if (!to || !env.whatsappWebhookUrl) return false;

  const response = await fetch(env.whatsappWebhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(env.whatsappApiToken ? { Authorization: `Bearer ${env.whatsappApiToken}` } : {})
    },
    body: JSON.stringify({
      to,
      body,
      sender: env.whatsappSender
    })
  });

  return response.ok;
}

export async function sendReservationNotifications(payload: ReservationNotificationPayload): Promise<NotificationResult> {
  const customerText = reservationSummary(payload);
  const restaurantText = restaurantSummary(payload);

  const [emailSent, whatsappSent, restaurantEmailSent, restaurantWhatsappSent] = await Promise.all([
    payload.email
      ? sendEmail({
          to: payload.email,
          subject: `Reserva confirmada - ${payload.dateLabel} às ${payload.time}`,
          text: customerText
        })
      : Promise.resolve(false),
    sendWhatsappMessage(payload.phone, customerText),
    env.restaurantEmail
      ? sendEmail({
          to: env.restaurantEmail,
          subject: `Nova reserva confirmada - ${payload.referenceCode}`,
          text: restaurantText
        })
      : Promise.resolve(false),
    sendWhatsappMessage(env.restaurantWhatsApp, restaurantText)
  ]);

  return {
    emailSent,
    whatsappSent,
    restaurantEmailSent,
    restaurantWhatsappSent
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
