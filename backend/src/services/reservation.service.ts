import { Types } from 'mongoose';
import {
  AvailabilitySuggestion,
  BLOCKING_RESERVATION_STATUSES,
  BlockType,
  buildDateTime,
  DEFAULT_RESERVATION_SETTINGS,
  evaluateAvailability,
  formatDateKey,
  formatTime,
  generateReservationReference,
  getDayBounds,
  getOpeningSlots,
  getReservationStatusLabel,
  getRequestedZones,
  getZoneLabel,
  isTimeWithinOpeningHours,
  isValidClockTime,
  isValidDateKey,
  isValidTimeValue,
  normalizeReservationWindow,
  ReservationPolicySettings,
  ReservationRequestZone,
  ReservationSource,
  ReservationStatus,
  ReservationZone
} from '../config/reservation-policy';
import { OperationalBlockModel } from '../models/operational-block.model';
import { ReservationModel } from '../models/reservation.model';
import { RestaurantSettingsModel } from '../models/restaurant-settings.model';
import {
  buildAlternativeMessage,
  buildRejectionMessage,
  sendReservationNotifications
} from './reservation-notification.service';

type ReservationInput = {
  fullName: string;
  phone: string;
  email?: string;
  date: string;
  time: string;
  guests: number;
  zone: ReservationRequestZone;
  notes?: string;
  consentAccepted?: boolean;
};

type ReservationPatchInput = Partial<ReservationInput> & {
  status?: ReservationStatus;
};

type BlockInput = {
  label: string;
  reason?: string;
  date: string;
  startTime: string;
  endTime: string;
  zone: ReservationZone;
  blockType: BlockType;
  active?: boolean;
};

class ReservationError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(message: string, statusCode: number, details?: unknown) {
    super(message);
    this.name = 'ReservationError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

function normalizeOpeningHours(raw: unknown): ReservationPolicySettings['openingHours'] {
  const source = raw instanceof Map ? Object.fromEntries(raw.entries()) : raw;
  const normalized: ReservationPolicySettings['openingHours'] = { ...DEFAULT_RESERVATION_SETTINGS.openingHours };

  if (!source || typeof source !== 'object') {
    return normalized;
  }

  for (const [dayKey, windows] of Object.entries(source)) {
    const numericDay = Number(dayKey);
    if (!Number.isInteger(numericDay) || numericDay < 0 || numericDay > 6 || !Array.isArray(windows)) {
      continue;
    }

    normalized[numericDay] = windows
      .filter((window): window is { start: string; end: string } => Boolean(window && typeof window === 'object' && 'start' in window && 'end' in window))
      .map((window) => ({
        start: String(window.start),
        end: String(window.end)
      }));
  }

  return normalized;
}

function normalizeZoneCapacities(raw: unknown): ReservationPolicySettings['zoneCapacities'] {
  const base = DEFAULT_RESERVATION_SETTINGS.zoneCapacities;

  if (!raw || typeof raw !== 'object') {
    return base;
  }

  const source = raw as Partial<Record<ReservationZone, Partial<{ total: number; online: number }>>>;

  return {
    interior: {
      total: Math.max(0, Number(source.interior?.total ?? base.interior.total)),
      online: Math.max(0, Number(source.interior?.online ?? base.interior.online))
    },
    terrace: {
      total: Math.max(0, Number(source.terrace?.total ?? base.terrace.total)),
      online: Math.max(0, Number(source.terrace?.online ?? base.terrace.online))
    }
  };
}

export async function getReservationSettings() {
  const settings = await RestaurantSettingsModel.findOne({ key: 'default' }).lean();

  if (!settings) {
    return DEFAULT_RESERVATION_SETTINGS;
  }

  return {
    slotIntervalMinutes: DEFAULT_RESERVATION_SETTINGS.slotIntervalMinutes,
    reservationDurationMinutes:
      settings.reservationDurationMinutes ?? DEFAULT_RESERVATION_SETTINGS.reservationDurationMinutes,
    bufferMinutes: settings.bufferMinutes ?? DEFAULT_RESERVATION_SETTINGS.bufferMinutes,
    maxGuestsPerReservation:
      settings.maxGuestsPerReservation ?? DEFAULT_RESERVATION_SETTINGS.maxGuestsPerReservation,
    zoneCapacities: normalizeZoneCapacities(settings.zoneCapacities),
    openingHours: normalizeOpeningHours(settings.openingHours)
  } satisfies ReservationPolicySettings;
}

export async function updateReservationSettings(input: Partial<ReservationPolicySettings>) {
  const current = await getReservationSettings();

  const next = {
    ...current,
    ...input,
    slotIntervalMinutes: DEFAULT_RESERVATION_SETTINGS.slotIntervalMinutes,
    zoneCapacities: input.zoneCapacities ? normalizeZoneCapacities(input.zoneCapacities) : current.zoneCapacities,
    openingHours: input.openingHours ? normalizeOpeningHours(input.openingHours) : current.openingHours
  };

  await RestaurantSettingsModel.findOneAndUpdate(
    { key: 'default' },
    {
      key: 'default',
      ...next
    },
    { upsert: true, new: true }
  );

  return next;
}

async function getReservationsForDate(date: string) {
  const { start, end } = getDayBounds(date);

  return ReservationModel.find({
    status: { $in: [...BLOCKING_RESERVATION_STATUSES] },
    date: {
      $gte: start,
      $lt: end
    }
  }).lean();
}

async function getBlocksForDate(date: string) {
  const { start, end } = getDayBounds(date);

  return OperationalBlockModel.find({
    active: true,
    date: {
      $gte: start,
      $lt: end
    }
  }).lean();
}

function formatReservationDate(date: Date) {
  return new Intl.DateTimeFormat('pt-PT', { dateStyle: 'medium' }).format(date);
}

async function evaluateReservationInput(
  data: ReservationInput,
  settings: ReservationPolicySettings,
  source: ReservationSource,
  excludeReservationId?: string
) {
  if (!isValidDateKey(data.date) || !isValidTimeValue(data.time, settings.slotIntervalMinutes)) {
    throw new ReservationError('Data ou hora inválida.', 400);
  }

  if (!isTimeWithinOpeningHours(data.date, data.time, settings)) {
    throw new ReservationError('Esse horário não está disponível durante o horário de funcionamento.', 400);
  }

  const startAt = buildDateTime(data.date, data.time);
  if (startAt <= new Date()) {
    throw new ReservationError('A reserva tem de ser feita para um horário futuro.', 400);
  }

  const [reservations, blocks] = await Promise.all([getReservationsForDate(data.date), getBlocksForDate(data.date)]);
  const zoneEvaluations = getRequestedZones(data.zone).map((zone) => ({
    zone,
    evaluation: evaluateAvailability({
      date: data.date,
      time: data.time,
      guests: data.guests,
      zone,
      source,
      reservations,
      blocks,
      settings,
      excludeReservationId
    })
  }));

  const selected = zoneEvaluations.find((entry) => entry.evaluation.success) ?? zoneEvaluations[0];

  return {
    startAt,
    reservations,
    blocks,
    evaluation: selected.evaluation,
    resolvedZone: selected.zone
  };
}

async function createReservationRecord(data: ReservationInput, source: ReservationSource) {
  const settings = await getReservationSettings();
  const { startAt, evaluation, resolvedZone } = await evaluateReservationInput(data, settings, source);

  if (!evaluation.success) {
    const suggestions = evaluation.suggestions;

    throw new ReservationError(
      suggestions.length > 0 ? buildAlternativeMessage(suggestions) : buildRejectionMessage(),
      suggestions.length > 0 ? 409 : 422,
      { suggestions }
    );
  }

  const reservation = await ReservationModel.create({
    ...data,
    email: data.email ?? '',
    date: buildDateTime(data.date, '00:00'),
    startAt,
    endAt: new Date(startAt.getTime() + (settings.reservationDurationMinutes + settings.bufferMinutes) * 60000),
    source,
    status: 'confirmed_auto',
    referenceCode: generateReservationReference(),
    zone: resolvedZone,
    consentAccepted: Boolean(data.consentAccepted)
  });

  let emailNotificationStatus: 'pending' | 'sent' | 'skipped' | 'failed' = reservation.email ? 'failed' : 'skipped';
  const whatsappNotificationStatus: 'pending' | 'sent' | 'skipped' | 'failed' = 'skipped';

  try {
    const notificationResult = await sendReservationNotifications({
      customerName: reservation.fullName,
      phone: reservation.phone,
      email: reservation.email,
      dateLabel: formatReservationDate(startAt),
      time: reservation.time,
      guests: reservation.guests,
      zone: reservation.zone,
      statusLabel: getReservationStatusLabel(reservation.status)
    });

    emailNotificationStatus = reservation.email
      ? notificationResult.emailSent
        ? 'sent'
        : 'failed'
      : 'skipped';
  } catch (error) {
    console.error('Notification error:', error);
  }

  reservation.emailNotificationStatus = emailNotificationStatus;
  reservation.whatsappNotificationStatus = whatsappNotificationStatus;
  await reservation.save();

  return {
    reservation,
    suggestions: evaluation.suggestions,
    manualReview: false
  };
}

export async function getReservationAvailability(date: string, guests: number, zone: ReservationRequestZone) {
  const settings = await getReservationSettings();

  if (!isValidDateKey(date)) {
    throw new ReservationError('Data inválida.', 400);
  }

  const [reservations, blocks] = await Promise.all([getReservationsForDate(date), getBlocksForDate(date)]);
  const openingSlots = getOpeningSlots(date, settings);

  const slots = openingSlots
    .flatMap((time) =>
      getRequestedZones(zone).map((candidateZone) => {
        const evaluation = evaluateAvailability({
          date,
          time,
          guests,
          zone: candidateZone,
          source: 'website',
          reservations,
          blocks,
          settings
        });

        return evaluation.success
          ? {
              time,
              zone: candidateZone,
              remainingCapacity: evaluation.remainingCapacity
            }
          : null;
      })
    )
    .filter((slot): slot is { time: string; zone: ReservationZone; remainingCapacity: number } => Boolean(slot))
    .reduce<Array<{ time: string; zone: ReservationZone; remainingCapacity: number }>>((accumulator, slot) => {
      const existing = accumulator.find((item) => item.time === slot.time);

      if (!existing) {
        accumulator.push(slot);
        return accumulator;
      }

      if (slot.remainingCapacity > existing.remainingCapacity) {
        existing.zone = slot.zone;
        existing.remainingCapacity = slot.remainingCapacity;
      }

      return accumulator;
    }, []);

  const suggestions = getClosestSuggestions(date, guests, zone === 'either' ? 'interior' : zone, zone, reservations, blocks, settings);

  return {
    date,
    guests,
    zone,
    slots,
    suggestions,
    durationMinutes: settings.reservationDurationMinutes,
    bufferMinutes: settings.bufferMinutes
  };
}

function getClosestSuggestions(
  date: string,
  guests: number,
  zone: ReservationZone,
  requestedZone: ReservationRequestZone,
  reservations: Awaited<ReturnType<typeof getReservationsForDate>>,
  blocks: Awaited<ReturnType<typeof getBlocksForDate>>,
  settings: ReservationPolicySettings
) {
  const openingSlots = getOpeningSlots(date, settings);
  const collected: AvailabilitySuggestion[] = [];

  const orderedZones =
    requestedZone === 'either'
      ? (['interior', 'terrace'] as ReservationZone[])
      : ([zone, zone === 'interior' ? 'terrace' : 'interior'] as ReservationZone[]);

  for (const candidateZone of orderedZones) {
    for (const time of openingSlots) {
      const evaluation = evaluateAvailability({
        date,
        time,
        guests,
        zone: candidateZone,
        source: 'website',
        reservations,
        blocks,
        settings
      });

      if (evaluation.success) {
        collected.push({
          date,
          time,
          zone: candidateZone,
          label: `${time} · ${getZoneLabel(candidateZone)}`
        });
      }

      if (collected.length >= 6) {
        return collected;
      }
    }
  }

  return collected;
}

export async function createReservation(data: ReservationInput) {
  return createReservationRecord(data, 'website');
}

export async function createManualReservation(data: ReservationInput) {
  return createReservationRecord(data, 'phone');
}

export async function getReservations(filters?: { date?: string; zone?: ReservationZone; status?: ReservationStatus; search?: string }) {
  const query: Record<string, unknown> = {};

  if (filters?.date && isValidDateKey(filters.date)) {
    const { start, end } = getDayBounds(filters.date);
    query.date = { $gte: start, $lt: end };
  }

  if (filters?.zone) {
    query.zone = filters.zone;
  }

  if (filters?.status) {
    query.status = filters.status;
  }

  if (filters?.search) {
    query.$or = [
      { fullName: { $regex: filters.search, $options: 'i' } },
      { phone: { $regex: filters.search, $options: 'i' } },
      { referenceCode: { $regex: filters.search, $options: 'i' } }
    ];
  }

  return ReservationModel.find(query).sort({ startAt: 1, time: 1 });
}

export async function getReservationById(id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  return ReservationModel.findById(id);
}

export async function updateReservationStatus(id: string, status: ReservationStatus) {
  if (!Types.ObjectId.isValid(id)) return null;
  return ReservationModel.findByIdAndUpdate(id, { status }, { new: true });
}

export async function updateReservation(id: string, patch: ReservationPatchInput) {
  if (!Types.ObjectId.isValid(id)) return null;

  const reservation = await ReservationModel.findById(id);
  if (!reservation) return null;

  const nextData: ReservationInput = {
    fullName: patch.fullName ?? reservation.fullName,
    phone: patch.phone ?? reservation.phone,
    email: patch.email ?? reservation.email,
    date: patch.date ?? formatDateKey(reservation.startAt),
    time: patch.time ?? reservation.time,
    guests: patch.guests ?? reservation.guests,
    zone: patch.zone ?? reservation.zone,
    notes: patch.notes ?? reservation.notes,
    consentAccepted: reservation.consentAccepted
  };

  const settings = await getReservationSettings();
  const { startAt, evaluation, resolvedZone } = await evaluateReservationInput(nextData, settings, reservation.source, reservation.id);

  if (!evaluation.success) {
    throw new ReservationError(
      evaluation.suggestions.length > 0 ? buildAlternativeMessage(evaluation.suggestions) : buildRejectionMessage(),
      evaluation.suggestions.length > 0 ? 409 : 422,
      { suggestions: evaluation.suggestions }
    );
  }

  reservation.fullName = nextData.fullName;
  reservation.phone = nextData.phone;
  reservation.email = nextData.email ?? '';
  reservation.date = buildDateTime(nextData.date, '00:00');
  reservation.startAt = startAt;
  reservation.endAt = new Date(startAt.getTime() + (settings.reservationDurationMinutes + settings.bufferMinutes) * 60000);
  reservation.time = nextData.time;
  reservation.guests = nextData.guests;
  reservation.zone = resolvedZone;
  reservation.notes = nextData.notes ?? '';
  if (patch.status) {
    reservation.status = patch.status;
  }

  await reservation.save();
  return reservation;
}

export async function deleteReservation(id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  return ReservationModel.findByIdAndDelete(id);
}

export async function getOperationalBlocks(filters?: { date?: string; zone?: ReservationZone }) {
  const query: Record<string, unknown> = {};

  if (filters?.date && isValidDateKey(filters.date)) {
    const { start, end } = getDayBounds(filters.date);
    query.date = { $gte: start, $lt: end };
  }

  if (filters?.zone) {
    query.zone = filters.zone;
  }

  return OperationalBlockModel.find(query).sort({ startAt: 1 });
}

export async function createOperationalBlock(input: BlockInput) {
  const settings = await getReservationSettings();

  if (!isValidDateKey(input.date) || !isValidTimeValue(input.startTime, settings.slotIntervalMinutes) || !isValidTimeValue(input.endTime, settings.slotIntervalMinutes)) {
    throw new ReservationError('Data ou horário do bloqueio inválido.', 400);
  }

  const startAt = buildDateTime(input.date, input.startTime);
  const endAt = buildDateTime(input.date, input.endTime);

  if (endAt <= startAt) {
    throw new ReservationError('O bloqueio deve terminar depois da hora de início.', 400);
  }

  return OperationalBlockModel.create({
    label: input.label,
    reason: input.reason ?? '',
    date: buildDateTime(input.date, '00:00'),
    startAt,
    endAt,
    zone: input.zone,
    blockType: 'zone',
    active: input.active ?? true
  });
}

export async function toggleOperationalBlock(id: string, active: boolean) {
  if (!Types.ObjectId.isValid(id)) return null;
  return OperationalBlockModel.findByIdAndUpdate(id, { active }, { new: true });
}

export async function deleteOperationalBlock(id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  return OperationalBlockModel.findByIdAndDelete(id);
}

export async function getReservationDashboardSummary(date: string, zone?: ReservationZone, time = '12:00') {
  const settings = await getReservationSettings();
  const dayStart = buildDateTime(date, '00:00');
  const referenceTime = isValidClockTime(time) ? time : '12:00';
  const referenceAt = buildDateTime(date, referenceTime);
  const weekEnd = new Date(dayStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const monthEnd = new Date(dayStart);
  monthEnd.setMonth(monthEnd.getMonth() + 1);
  const [reservations, blocks, weekReservations, monthReservations] = await Promise.all([
    getReservations({ date, zone }),
    getOperationalBlocks({ date, zone }),
    ReservationModel.find({
      status: { $in: [...BLOCKING_RESERVATION_STATUSES] },
      startAt: { $gte: dayStart, $lt: weekEnd },
      ...(zone ? { zone } : {})
    }).lean(),
    ReservationModel.find({
      status: { $in: [...BLOCKING_RESERVATION_STATUSES] },
      startAt: { $gte: dayStart, $lt: monthEnd },
      ...(zone ? { zone } : {})
    }).lean()
  ]);

  const targetZones = zone ? [zone] : (['interior', 'terrace'] as ReservationZone[]);
  const occupancyByZone = Object.fromEntries(
    targetZones.map((currentZone) => {
      const guests = reservations
        .filter((reservation) => {
          if (reservation.zone !== currentZone || !BLOCKING_RESERVATION_STATUSES.includes(reservation.status)) return false;
          const window = normalizeReservationWindow(reservation, settings);
          return window ? referenceAt >= window.startAt && referenceAt < window.endAt : false;
        })
        .reduce((sum, reservation) => sum + reservation.guests, 0);

      return [
        currentZone,
        {
          guests,
          capacity: settings.zoneCapacities[currentZone].total,
          onlineCapacity: settings.zoneCapacities[currentZone].online,
          occupancyRate:
            settings.zoneCapacities[currentZone].total === 0
              ? 0
              : Math.round((guests / settings.zoneCapacities[currentZone].total) * 100)
        }
      ];
    })
  );

  const blockedZones = targetZones.reduce<Record<ReservationZone, boolean>>(
    (accumulator, currentZone) => {
      accumulator[currentZone] = blocks.some((block) => {
        if (!block.active || block.zone !== currentZone) return false;
        return referenceAt >= new Date(block.startAt) && referenceAt < new Date(block.endAt);
      });
      return accumulator;
    },
    { interior: false, terrace: false }
  );

  return {
    settings,
    date,
    referenceTime,
    zone: zone ?? 'all',
    occupancyByZone,
    blockedZones,
    reservations,
    blocks,
    report: {
      day: reservations.reduce((sum, reservation) => sum + reservation.guests, 0),
      week: weekReservations.reduce((sum, reservation) => sum + reservation.guests, 0),
      month: monthReservations.reduce((sum, reservation) => sum + reservation.guests, 0)
    }
  };
}

export function isReservationError(error: unknown): error is ReservationError {
  return error instanceof ReservationError;
}
