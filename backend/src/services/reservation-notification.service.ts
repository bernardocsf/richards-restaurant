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
  statusLabel: string;
};

type NotificationResult = {
  emailSent: boolean;
  restaurantEmailSent: boolean;
};

function formatGuestLabel(guests: number) {
  return guests === 1 ? '1 pessoa' : `${guests} pessoas`;
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

export async function sendReservationNotifications(payload: ReservationNotificationPayload): Promise<NotificationResult> {
  const customerText = reservationSummary(payload);
  const restaurantText = restaurantSummary(payload);

  const [emailSent, restaurantEmailSent] = await Promise.all([
    payload.email
      ? sendEmail({
          to: payload.email,
          subject: `Confirmacao da sua reserva - ${payload.dateLabel} as ${payload.time}`,
          text: customerText
        })
      : Promise.resolve(false),
    env.restaurantEmail
      ? sendEmail({
          to: env.restaurantEmail,
          subject: `Nova reserva confirmada - ${payload.dateLabel} as ${payload.time}`,
          text: restaurantText
        })
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
