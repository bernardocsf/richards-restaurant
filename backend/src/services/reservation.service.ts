import { Types } from 'mongoose';
import {
  BLOCKING_STATUSES,
  RESERVATION_DURATION_MINUTES,
  addMinutes,
  buildDateTime,
  findTableAssignment,
  getDayBounds,
  getOpeningSlots,
  getTableLabel,
  isTimeWithinOpeningHours,
  isValidDateKey,
  isValidTimeValue
} from '../config/reservation-policy';
import { ReservationModel } from '../models/reservation.model';
import { sendReservationConfirmationEmail } from './reservation-email.service';

type ReservationInput = {
  fullName: string;
  phone: string;
  email?: string;
  date: string;
  time: string;
  guests: number;
  notes?: string;
  tablePreference?: string;
};

class ReservationError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'ReservationError';
    this.statusCode = statusCode;
  }
}

async function getReservationsForDate(date: string) {
  const { start, end } = getDayBounds(date);

  return ReservationModel.find({
    status: { $in: [...BLOCKING_STATUSES] },
    date: {
      $gte: start,
      $lt: end
    }
  }).lean();
}

export async function getReservationAvailability(date: string, guests: number) {
  if (!isValidDateKey(date)) {
    throw new ReservationError('Data inválida.', 400);
  }

  const openingSlots = getOpeningSlots(date);
  const reservations = await getReservationsForDate(date);

  const slots = openingSlots
    .filter((time) => {
      const assignment = findTableAssignment(reservations, {
        reservationId: `availability-${date}-${time}-${guests}`,
        guests,
        date,
        time
      });

      return Boolean(assignment);
    })
    .map((time) => ({ time }));

  return {
    date,
    guests,
    slots,
    durationMinutes: RESERVATION_DURATION_MINUTES
  };
}

async function createConfirmedReservation(data: ReservationInput, source: 'website' | 'phone') {
  if (!isValidDateKey(data.date) || !isValidTimeValue(data.time)) {
    throw new ReservationError('Data ou hora inválida.', 400);
  }

  if (!isTimeWithinOpeningHours(data.date, data.time)) {
    throw new ReservationError('Esse horário não está disponível durante o horário de funcionamento.', 400);
  }

  const startAt = buildDateTime(data.date, data.time);
  if (startAt <= new Date()) {
    throw new ReservationError('A reserva tem de ser feita para um horário futuro.', 400);
  }

  const reservations = await getReservationsForDate(data.date);
  const assignment = findTableAssignment(reservations, {
    reservationId: `reservation-${Date.now()}`,
    guests: data.guests,
    date: data.date,
    time: data.time
  });

  if (!assignment) {
    throw new ReservationError('Não existe mesa disponível para esse horário e número de pessoas.', 409);
  }

  const endAt = addMinutes(startAt, RESERVATION_DURATION_MINUTES);
  const reservation = await ReservationModel.create({
    ...data,
    email: data.email ?? '',
    date: startAt,
    startAt,
    endAt,
    source,
    assignedTableId: assignment.tableId,
    assignedTableType: assignment.tableType,
    status: 'confirmed'
  });

  let emailSent = false;

  try {
    emailSent = await sendReservationConfirmationEmail({
      customerName: reservation.fullName,
      email: reservation.email,
      dateLabel: new Intl.DateTimeFormat('pt-PT', { dateStyle: 'medium' }).format(startAt),
      time: reservation.time,
      guests: reservation.guests,
      tableLabel: getTableLabel(assignment.tableType),
      tableId: assignment.tableId
    });
  } catch (error) {
    console.error('❌ Email error:', error);
  }

  return { reservation, emailSent };
}

export async function createReservation(data: ReservationInput) {
  return createConfirmedReservation(data, 'website');
}

export async function createManualReservation(data: ReservationInput) {
  return createConfirmedReservation(data, 'phone');
}

export async function getReservations() {
  return ReservationModel.find().sort({ startAt: 1, time: 1 });
}

export async function getReservationById(id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  return ReservationModel.findById(id);
}

export async function updateReservationStatus(id: string, status: 'pending' | 'confirmed' | 'cancelled' | 'completed') {
  if (!Types.ObjectId.isValid(id)) return null;
  return ReservationModel.findByIdAndUpdate(id, { status }, { new: true });
}

export async function deleteReservation(id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  return ReservationModel.findByIdAndDelete(id);
}
