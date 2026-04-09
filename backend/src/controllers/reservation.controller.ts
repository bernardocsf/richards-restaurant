import { Request, Response } from 'express';
import { ParsedQs } from 'qs';
import {
  createReservation as createReservationService,
  createManualReservation as createManualReservationService,
  deleteReservation as deleteReservationService,
  getReservationById,
  getReservationAvailability,
  getReservations,
  updateReservationStatus as updateReservationStatusService
} from '../services/reservation.service';
import {
  manualReservationSchema,
  reservationAvailabilitySchema,
  reservationSchema,
  reservationStatusSchema
} from '../validators/reservation.validator';

function getParamId(value: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function getQueryValue(value: string | ParsedQs | (string | ParsedQs)[] | undefined) {
  if (Array.isArray(value)) {
    const first = value[0];
    return typeof first === 'string' ? first : undefined;
  }

  return typeof value === 'string' ? value : undefined;
}

export async function createReservation(req: Request, res: Response) {
  const parsed = reservationSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: parsed.error.issues[0]?.message ?? 'Dados de reserva inválidos.'
    });
  }

  const { consent, ...payload } = parsed.data;
  const result = await createReservationService(payload);

  return res.status(201).json({
    message: result.emailSent
      ? 'Reserva confirmada com sucesso. Enviámos um email com os detalhes.'
      : 'Reserva confirmada com sucesso.',
    reservation: result.reservation
  });
}

export async function createManualReservation(req: Request, res: Response) {
  const parsed = manualReservationSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: parsed.error.issues[0]?.message ?? 'Dados de reserva inválidos.'
    });
  }

  const result = await createManualReservationService(parsed.data);

  return res.status(201).json({
    message: 'Reserva telefónica registada com sucesso.',
    reservation: result.reservation
  });
}

export async function listReservationAvailability(req: Request, res: Response) {
  const parsed = reservationAvailabilitySchema.safeParse({
    date: getQueryValue(req.query.date),
    guests: getQueryValue(req.query.guests)
  });

  if (!parsed.success) {
    return res.status(400).json({
      message: parsed.error.issues[0]?.message ?? 'Parâmetros inválidos.'
    });
  }

  const availability = await getReservationAvailability(parsed.data.date, parsed.data.guests);
  return res.json(availability);
}

export async function listReservations(_req: Request, res: Response) {
  const reservations = await getReservations();
  return res.json({ reservations });
}

export async function getReservation(req: Request, res: Response) {
  const reservation = await getReservationById(getParamId(req.params.id));

  if (!reservation) {
    return res.status(404).json({ message: 'Reserva não encontrada.' });
  }

  return res.json({ reservation });
}

export async function patchReservationStatus(req: Request, res: Response) {
  const parsed = reservationStatusSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Status inválido.' });
  }

  const reservation = await updateReservationStatusService(getParamId(req.params.id), parsed.data.status);

  if (!reservation) {
    return res.status(404).json({ message: 'Reserva não encontrada.' });
  }

  return res.json({ message: 'Estado da reserva atualizado com sucesso.', reservation });
}

export async function removeReservation(req: Request, res: Response) {
  const reservation = await deleteReservationService(getParamId(req.params.id));

  if (!reservation) {
    return res.status(404).json({ message: 'Reserva não encontrada.' });
  }

  return res.json({ message: 'Reserva removida com sucesso.' });
}
