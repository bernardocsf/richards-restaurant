import { Request, Response } from 'express';
import { ParsedQs } from 'qs';
import {
  createManualReservation as createManualReservationService,
  createOperationalBlock as createOperationalBlockService,
  createReservation as createReservationService,
  deleteOperationalBlock as deleteOperationalBlockService,
  deleteReservation as deleteReservationService,
  getOperationalBlocks,
  getReservationAvailability,
  getReservationById,
  getReservationDashboardSummary,
  getReservationSettings,
  getReservations,
  isReservationError,
  toggleOperationalBlock,
  updateReservation as updateReservationService,
  updateReservationSettings,
  updateReservationStatus as updateReservationStatusService
} from '../services/reservation.service';
import {
  manualReservationSchema,
  operationalBlockSchema,
  operationalBlockToggleSchema,
  reservationAvailabilitySchema,
  reservationSchema,
  reservationSettingsSchema,
  reservationStatusSchema,
  reservationUpdateSchema
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

function handleServiceError(res: Response, error: unknown) {
  if (!isReservationError(error)) {
    throw error;
  }

  return res.status(error.statusCode).json({
    message: error.message,
    ...(error.details ? { details: error.details } : {})
  });
}

export async function createReservation(req: Request, res: Response) {
  const parsed = reservationSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: parsed.error.issues[0]?.message ?? 'Dados de reserva inválidos.'
    });
  }

  const { consent, ...payload } = parsed.data;

  try {
    const result = await createReservationService({
      ...payload,
      consentAccepted: consent
    });

    return res.status(201).json({
      message: 'Reserva confirmada com sucesso. Enviámos confirmação imediata por email e WhatsApp sempre que configurados.',
      reservation: result.reservation,
      suggestions: result.suggestions
    });
  } catch (error) {
    return handleServiceError(res, error);
  }
}

export async function createManualReservation(req: Request, res: Response) {
  const parsed = manualReservationSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: parsed.error.issues[0]?.message ?? 'Dados de reserva inválidos.'
    });
  }

  try {
    const result = await createManualReservationService(parsed.data);

    return res.status(201).json({
      message: 'Reserva telefónica confirmada com sucesso.',
      reservation: result.reservation,
      suggestions: result.suggestions
    });
  } catch (error) {
    return handleServiceError(res, error);
  }
}

export async function listReservationAvailability(req: Request, res: Response) {
  const parsed = reservationAvailabilitySchema.safeParse({
    date: getQueryValue(req.query.date),
    guests: getQueryValue(req.query.guests),
    zone: getQueryValue(req.query.zone)
  });

  if (!parsed.success) {
    return res.status(400).json({
      message: parsed.error.issues[0]?.message ?? 'Parâmetros inválidos.'
    });
  }

  const availability = await getReservationAvailability(parsed.data.date, parsed.data.guests, parsed.data.zone);
  return res.json(availability);
}

export async function listReservations(req: Request, res: Response) {
  const reservations = await getReservations({
    date: getQueryValue(req.query.date),
    zone: (getQueryValue(req.query.zone) as 'interior' | 'terrace' | undefined) ?? undefined,
    status: (getQueryValue(req.query.status) as
      | 'confirmed_auto'
      | 'cancelled_by_customer'
      | 'cancelled_by_restaurant'
      | 'completed'
      | 'no_show'
      | undefined) ?? undefined,
    search: getQueryValue(req.query.search)
  });

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
    return res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Estado inválido.' });
  }

  const reservation = await updateReservationStatusService(getParamId(req.params.id), parsed.data.status);

  if (!reservation) {
    return res.status(404).json({ message: 'Reserva não encontrada.' });
  }

  return res.json({ message: 'Estado da reserva atualizado com sucesso.', reservation });
}

export async function patchReservation(req: Request, res: Response) {
  const parsed = reservationUpdateSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Dados inválidos.' });
  }

  try {
    const reservation = await updateReservationService(getParamId(req.params.id), parsed.data);

    if (!reservation) {
      return res.status(404).json({ message: 'Reserva não encontrada.' });
    }

    return res.json({ message: 'Reserva atualizada com sucesso.', reservation });
  } catch (error) {
    return handleServiceError(res, error);
  }
}

export async function removeReservation(req: Request, res: Response) {
  const reservation = await deleteReservationService(getParamId(req.params.id));

  if (!reservation) {
    return res.status(404).json({ message: 'Reserva não encontrada.' });
  }

  return res.json({ message: 'Reserva removida com sucesso.' });
}

export async function getSettings(_req: Request, res: Response) {
  const settings = await getReservationSettings();
  return res.json({ settings });
}

export async function patchSettings(req: Request, res: Response) {
  const parsed = reservationSettingsSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Configuração inválida.' });
  }

  const settings = await updateReservationSettings(parsed.data);
  return res.json({ message: 'Configurações atualizadas com sucesso.', settings });
}

export async function listBlocks(req: Request, res: Response) {
  const blocks = await getOperationalBlocks({
    date: getQueryValue(req.query.date),
    zone: (getQueryValue(req.query.zone) as 'interior' | 'terrace' | undefined) ?? undefined
  });

  return res.json({ blocks });
}

export async function createBlock(req: Request, res: Response) {
  const parsed = operationalBlockSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Bloqueio inválido.' });
  }

  try {
    const block = await createOperationalBlockService(parsed.data);
    return res.status(201).json({ message: 'Bloqueio criado com sucesso.', block });
  } catch (error) {
    return handleServiceError(res, error);
  }
}

export async function patchBlock(req: Request, res: Response) {
  const parsed = operationalBlockToggleSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Dados inválidos.' });
  }

  const block = await toggleOperationalBlock(getParamId(req.params.id), parsed.data.active);

  if (!block) {
    return res.status(404).json({ message: 'Bloqueio não encontrado.' });
  }

  return res.json({ message: 'Bloqueio atualizado com sucesso.', block });
}

export async function removeBlock(req: Request, res: Response) {
  const block = await deleteOperationalBlockService(getParamId(req.params.id));

  if (!block) {
    return res.status(404).json({ message: 'Bloqueio não encontrado.' });
  }

  return res.json({ message: 'Bloqueio removido com sucesso.' });
}

export async function getDashboardSummary(req: Request, res: Response) {
  const date = getQueryValue(req.query.date);

  if (!date) {
    return res.status(400).json({ message: 'Indica uma data para o painel.' });
  }

  const summary = await getReservationDashboardSummary(
    date,
    (getQueryValue(req.query.zone) as 'interior' | 'terrace' | undefined) ?? undefined,
    getQueryValue(req.query.time) ?? undefined
  );

  return res.json(summary);
}
