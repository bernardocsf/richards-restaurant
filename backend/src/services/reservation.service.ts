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
  getTableDefinitions,
  getZoneLabel,
  isTimeWithinOpeningHours,
  isValidDateKey,
  isValidTimeValue,
  normalizeReservationWindow,
  ReservationPolicySettings,
  ReservationSource,
  ReservationStatus,
  ReservationZone,
  TABLE_MAP,
  ZONE_CAPACITY
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
  zone: ReservationZone;
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
  tableIds?: string[];
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

export async function getReservationSettings() {
  const settings = await RestaurantSettingsModel.findOne({ key: 'default' }).lean();

  if (!settings) {
    return DEFAULT_RESERVATION_SETTINGS;
  }

  return {
    slotIntervalMinutes: settings.slotIntervalMinutes ?? DEFAULT_RESERVATION_SETTINGS.slotIntervalMinutes,
    reservationDurationMinutes:
      settings.reservationDurationMinutes ?? DEFAULT_RESERVATION_SETTINGS.reservationDurationMinutes,
    bufferMinutes: settings.bufferMinutes ?? DEFAULT_RESERVATION_SETTINGS.bufferMinutes,
    maxGuestsPerReservation:
      settings.maxGuestsPerReservation ?? DEFAULT_RESERVATION_SETTINGS.maxGuestsPerReservation,
    openingHours: normalizeOpeningHours(settings.openingHours)
  } satisfies ReservationPolicySettings;
}

export async function updateReservationSettings(input: Partial<ReservationPolicySettings>) {
  const current = await getReservationSettings();

  const next = {
    ...current,
    ...input,
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
  const evaluation = evaluateAvailability({
    date: data.date,
    time: data.time,
    guests: data.guests,
    zone: data.zone,
    reservations,
    blocks,
    settings,
    excludeReservationId
  });

  return {
    startAt,
    reservations,
    blocks,
    evaluation
  };
}

function formatTableCombination(tableIds: string[]) {
  return tableIds.join(' + ');
}

async function createReservationRecord(data: ReservationInput, source: ReservationSource) {
  const settings = await getReservationSettings();
  const { startAt, evaluation } = await evaluateReservationInput(data, settings);

  if (!evaluation.success || !evaluation.assignment) {
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
    endAt: evaluation.assignment
      ? new Date(startAt.getTime() + (settings.reservationDurationMinutes + settings.bufferMinutes) * 60000)
      : startAt,
    source,
    status: 'confirmed_auto',
    referenceCode: generateReservationReference(),
    tableIds: evaluation.assignment.tableIds,
    tableCombinationLabel: formatTableCombination(evaluation.assignment.tableIds),
    consentAccepted: Boolean(data.consentAccepted)
  });

  let emailNotificationStatus: 'pending' | 'sent' | 'skipped' | 'failed' = reservation.email ? 'failed' : 'skipped';
  let whatsappNotificationStatus: 'pending' | 'sent' | 'skipped' | 'failed' = reservation.phone ? 'failed' : 'skipped';

  try {
    const notificationResult = await sendReservationNotifications({
      customerName: reservation.fullName,
      phone: reservation.phone,
      email: reservation.email,
      dateLabel: formatReservationDate(startAt),
      time: reservation.time,
      guests: reservation.guests,
      zone: reservation.zone,
      referenceCode: reservation.referenceCode,
      tableIds: reservation.tableIds,
      statusLabel: getReservationStatusLabel(reservation.status)
    });

    emailNotificationStatus = reservation.email
      ? notificationResult.emailSent
        ? 'sent'
        : 'failed'
      : 'skipped';
    whatsappNotificationStatus = reservation.phone
      ? notificationResult.whatsappSent
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

export async function getReservationAvailability(date: string, guests: number, zone: ReservationZone) {
  const settings = await getReservationSettings();

  if (!isValidDateKey(date)) {
    throw new ReservationError('Data inválida.', 400);
  }

  const [reservations, blocks] = await Promise.all([getReservationsForDate(date), getBlocksForDate(date)]);
  const openingSlots = getOpeningSlots(date, settings);

  const slots = openingSlots
    .map((time) => {
      const evaluation = evaluateAvailability({
        date,
        time,
        guests,
        zone,
        reservations,
        blocks,
        settings
      });

      return evaluation.success
        ? {
            time,
            zone,
            tableIds: evaluation.assignment.tableIds,
            seats: evaluation.assignment.seats
          }
        : null;
    })
    .filter((slot): slot is { time: string; zone: ReservationZone; tableIds: string[]; seats: number } => Boolean(slot));

  const suggestions = getClosestSuggestions(date, guests, zone, reservations, blocks, settings);

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
  reservations: Awaited<ReturnType<typeof getReservationsForDate>>,
  blocks: Awaited<ReturnType<typeof getBlocksForDate>>,
  settings: ReservationPolicySettings
) {
  const openingSlots = getOpeningSlots(date, settings);
  const collected: AvailabilitySuggestion[] = [];

  for (const candidateZone of [zone, zone === 'interior' ? 'terrace' : 'interior'] as ReservationZone[]) {
    for (const time of openingSlots) {
      const evaluation = evaluateAvailability({
        date,
        time,
        guests,
        zone: candidateZone,
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
  const { startAt, evaluation } = await evaluateReservationInput(nextData, settings, reservation.id);

  if (!evaluation.success || !evaluation.assignment) {
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
  reservation.zone = nextData.zone;
  reservation.notes = nextData.notes ?? '';
  reservation.tableIds = evaluation.assignment.tableIds;
  reservation.tableCombinationLabel = formatTableCombination(evaluation.assignment.tableIds);
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

  if (input.blockType === 'table' && (!input.tableIds || input.tableIds.length === 0)) {
    throw new ReservationError('Seleciona pelo menos uma mesa para bloquear.', 400);
  }

  return OperationalBlockModel.create({
    label: input.label,
    reason: input.reason ?? '',
    date: buildDateTime(input.date, '00:00'),
    startAt,
    endAt,
    zone: input.zone,
    blockType: input.blockType,
    tableIds: input.blockType === 'zone' ? [] : input.tableIds ?? [],
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

export async function getReservationDashboardSummary(date: string, zone?: ReservationZone) {
  const settings = await getReservationSettings();
  const dayStart = buildDateTime(date, '00:00');
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
        .filter((reservation) => reservation.zone === currentZone && BLOCKING_RESERVATION_STATUSES.includes(reservation.status))
        .reduce((sum, reservation) => sum + reservation.guests, 0);

      return [
        currentZone,
        {
          guests,
          capacity: ZONE_CAPACITY[currentZone],
          occupancyRate: ZONE_CAPACITY[currentZone] === 0 ? 0 : Math.round((guests / ZONE_CAPACITY[currentZone]) * 100)
        }
      ];
    })
  );

  const tableMap = TABLE_MAP.map((table) => {
    const activeReservation = reservations.find((reservation) => {
      if (reservation.zone !== table.zone || !BLOCKING_RESERVATION_STATUSES.includes(reservation.status)) return false;
      const window = normalizeReservationWindow(reservation, settings);
      return window ? window.tableIds.includes(table.id) : false;
    });

    const activeBlock = blocks.find((block) => {
      if (!block.active || block.zone !== table.zone) return false;
      if (block.blockType === 'zone') return true;
      return (block.tableIds ?? []).includes(table.id);
    });

    return {
      id: table.id,
      zone: table.zone,
      seats: table.seats,
      neighbors: table.neighbors,
      state: activeBlock ? 'blocked' : activeReservation ? 'occupied' : 'free',
      reservationReference: activeReservation?.referenceCode ?? null,
      reservationName: activeReservation?.fullName ?? null
    };
  });

  return {
    settings,
    date,
    zone: zone ?? 'all',
    occupancyByZone,
    tables: tableMap,
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
