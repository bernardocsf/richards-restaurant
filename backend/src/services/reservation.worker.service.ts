import { Document, Filter, ObjectId } from 'mongodb';
import {
  AvailabilitySuggestion,
  BLOCKING_RESERVATION_STATUSES,
  BlockType,
  buildDateTime,
  DEFAULT_RESERVATION_SETTINGS,
  evaluateAvailability,
  formatDateKey,
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
import { collection, serializeForJson, toObjectId, withMongoDb } from '../config/database';
import {
  buildAlternativeMessage,
  buildRejectionMessage,
  sendWorkerReservationNotifications
} from './reservation-notification.worker.service';

type WorkerReservationEnv = {
  MAIL_FROM?: string;
  MONGODB_URI?: string;
  SMTP_HOST?: string;
  SMTP_PASS?: string;
  SMTP_PORT?: string;
  SMTP_SECURE?: string;
  SMTP_USER?: string;
};

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

type ReservationRecord = {
  _id?: ObjectId;
  referenceCode: string;
  fullName: string;
  phone: string;
  email: string;
  date: Date;
  startAt: Date;
  endAt: Date;
  time: string;
  guests: number;
  zone: ReservationZone;
  notes: string;
  consentAccepted: boolean;
  source: ReservationSource;
  status: ReservationStatus;
  emailNotificationStatus: 'pending' | 'sent' | 'skipped' | 'failed';
  whatsappNotificationStatus: 'pending' | 'sent' | 'skipped' | 'failed';
  createdAt: Date;
  updatedAt: Date;
};

type OperationalBlockRecord = {
  _id?: ObjectId;
  label: string;
  reason: string;
  date: Date;
  startAt: Date;
  endAt: Date;
  zone: ReservationZone;
  blockType: BlockType;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type RestaurantSettingsRecord = {
  _id?: ObjectId;
  key: string;
  slotIntervalMinutes?: number;
  reservationDurationMinutes?: number;
  bufferMinutes?: number;
  maxGuestsPerReservation?: number;
  zoneCapacities?: unknown;
  openingHours?: unknown;
  createdAt?: Date;
  updatedAt?: Date;
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
      .filter(
        (window): window is { start: string; end: string } =>
          Boolean(window && typeof window === 'object' && 'start' in window && 'end' in window)
      )
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

function formatReservationDate(date: Date) {
  return new Intl.DateTimeFormat('pt-PT', { dateStyle: 'medium' }).format(date);
}

function normalizeReservationInput(data: ReservationInput) {
  return {
    ...data,
    fullName: data.fullName.trim(),
    phone: data.phone.trim(),
    email: (data.email ?? '').trim().toLowerCase(),
    notes: (data.notes ?? '').trim()
  };
}

function reservationCollectionQuery(filters?: {
  date?: string;
  zone?: ReservationZone;
  status?: ReservationStatus;
  search?: string;
}) {
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

  return query;
}

async function getReservationSettingsRecord(mongoUri: string) {
  return withMongoDb(mongoUri, async (db) =>
    collection<RestaurantSettingsRecord>(db, 'restaurantsettings').findOne({ key: 'default' })
  );
}

export async function getWorkerReservationSettings(mongoUri: string) {
  const settings = await getReservationSettingsRecord(mongoUri);

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

export async function updateWorkerReservationSettings(
  mongoUri: string,
  input: Partial<ReservationPolicySettings>
) {
  const current = await getWorkerReservationSettings(mongoUri);
  const now = new Date();
  const next = {
    ...current,
    ...input,
    slotIntervalMinutes: DEFAULT_RESERVATION_SETTINGS.slotIntervalMinutes,
    zoneCapacities: input.zoneCapacities ? normalizeZoneCapacities(input.zoneCapacities) : current.zoneCapacities,
    openingHours: input.openingHours ? normalizeOpeningHours(input.openingHours) : current.openingHours
  };

  await withMongoDb(mongoUri, async (db) => {
    await collection<RestaurantSettingsRecord>(db, 'restaurantsettings').updateOne(
      { key: 'default' },
      {
        $set: {
          key: 'default',
          ...next,
          updatedAt: now
        },
        $setOnInsert: {
          createdAt: now
        }
      },
      { upsert: true }
    );
  });

  return next;
}

async function getReservationsForDate(mongoUri: string, date: string) {
  const { start, end } = getDayBounds(date);

  return withMongoDb(mongoUri, async (db) =>
    collection<ReservationRecord>(db, 'reservations')
      .find({
        status: { $in: [...BLOCKING_RESERVATION_STATUSES] },
        date: {
          $gte: start,
          $lt: end
        }
      })
      .toArray()
  );
}

async function getBlocksForDate(mongoUri: string, date: string) {
  const { start, end } = getDayBounds(date);

  return withMongoDb(mongoUri, async (db) =>
    collection<OperationalBlockRecord>(db, 'operationalblocks')
      .find({
        active: true,
        date: {
          $gte: start,
          $lt: end
        }
      })
      .toArray()
  );
}

async function evaluateReservationInput(
  mongoUri: string,
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

  const [reservations, blocks] = await Promise.all([
    getReservationsForDate(mongoUri, data.date),
    getBlocksForDate(mongoUri, data.date)
  ]);

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

function generateReservationReference() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';

  for (let index = 0; index < 6; index += 1) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return `RGR-${suffix}`;
}

async function createReservationRecord(
  mongoUri: string,
  data: ReservationInput,
  source: ReservationSource,
  env: WorkerReservationEnv
) {
  const normalizedData = normalizeReservationInput(data);
  const settings = await getWorkerReservationSettings(mongoUri);
  const { startAt, evaluation, resolvedZone } = await evaluateReservationInput(
    mongoUri,
    normalizedData,
    settings,
    source
  );

  if (!evaluation.success) {
    const suggestions = evaluation.suggestions;

    throw new ReservationError(
      suggestions.length > 0 ? buildAlternativeMessage(suggestions) : buildRejectionMessage(),
      suggestions.length > 0 ? 409 : 422,
      { suggestions }
    );
  }

  const now = new Date();
  const reservation: ReservationRecord = {
    referenceCode: generateReservationReference(),
    fullName: normalizedData.fullName,
    phone: normalizedData.phone,
    email: normalizedData.email,
    date: buildDateTime(normalizedData.date, '00:00'),
    startAt,
    endAt: new Date(startAt.getTime() + (settings.reservationDurationMinutes + settings.bufferMinutes) * 60000),
    time: normalizedData.time,
    guests: normalizedData.guests,
    zone: resolvedZone,
    notes: normalizedData.notes ?? '',
    consentAccepted: Boolean(normalizedData.consentAccepted),
    source,
    status: 'confirmed_auto',
    emailNotificationStatus: normalizedData.email ? 'failed' : 'skipped',
    whatsappNotificationStatus: 'skipped',
    createdAt: now,
    updatedAt: now
  };

  const insertedId = await withMongoDb(mongoUri, async (db) => {
    const result = await collection<ReservationRecord>(db, 'reservations').insertOne(reservation);
    return result.insertedId;
  });

  const insertedReservation = { ...reservation, _id: insertedId };

  try {
    const notificationResult = await sendWorkerReservationNotifications(
      {
        customerName: insertedReservation.fullName,
        phone: insertedReservation.phone,
        email: insertedReservation.email,
        dateLabel: formatReservationDate(startAt),
        time: insertedReservation.time,
        guests: insertedReservation.guests,
        zone: insertedReservation.zone,
        statusLabel: getReservationStatusLabel(insertedReservation.status)
      },
      env
    );

    insertedReservation.emailNotificationStatus = insertedReservation.email
      ? notificationResult.emailSent
        ? 'sent'
        : 'failed'
      : 'skipped';
  } catch (error) {
    console.error('Notification error:', error);
  }

  insertedReservation.updatedAt = new Date();

  await withMongoDb(mongoUri, async (db) => {
    await collection<ReservationRecord>(db, 'reservations').updateOne(
      { _id: insertedId },
      {
        $set: {
          emailNotificationStatus: insertedReservation.emailNotificationStatus,
          whatsappNotificationStatus: insertedReservation.whatsappNotificationStatus,
          updatedAt: insertedReservation.updatedAt
        }
      }
    );
  });

  return {
    reservation: serializeForJson(insertedReservation),
    suggestions: evaluation.suggestions,
    manualReview: false
  };
}

function getClosestSuggestions(
  date: string,
  guests: number,
  zone: ReservationZone,
  requestedZone: ReservationRequestZone,
  reservations: ReservationRecord[],
  blocks: OperationalBlockRecord[],
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

export async function getWorkerReservationAvailability(
  mongoUri: string,
  date: string,
  guests: number,
  zone: ReservationRequestZone
) {
  const settings = await getWorkerReservationSettings(mongoUri);

  if (!isValidDateKey(date)) {
    throw new ReservationError('Data inválida.', 400);
  }

  const [reservations, blocks] = await Promise.all([
    getReservationsForDate(mongoUri, date),
    getBlocksForDate(mongoUri, date)
  ]);
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

  const suggestions = getClosestSuggestions(
    date,
    guests,
    zone === 'either' ? 'interior' : zone,
    zone,
    reservations,
    blocks,
    settings
  );

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

export async function createWorkerReservation(
  mongoUri: string,
  data: ReservationInput,
  env: WorkerReservationEnv
) {
  return createReservationRecord(mongoUri, data, 'website', env);
}

export async function createWorkerManualReservation(
  mongoUri: string,
  data: ReservationInput,
  env: WorkerReservationEnv
) {
  return createReservationRecord(mongoUri, data, 'phone', env);
}

export async function getWorkerReservations(
  mongoUri: string,
  filters?: { date?: string; zone?: ReservationZone; status?: ReservationStatus; search?: string }
) {
  return withMongoDb(mongoUri, async (db) => {
    const reservations = await collection<ReservationRecord>(db, 'reservations')
      .find(reservationCollectionQuery(filters))
      .sort({ startAt: 1, time: 1 })
      .toArray();

    return serializeForJson(reservations);
  });
}

export async function getWorkerReservationById(mongoUri: string, id: string) {
  const objectId = toObjectId(id);
  if (!objectId) return null;

  return withMongoDb(mongoUri, async (db) => {
    const reservation = await collection<ReservationRecord>(db, 'reservations').findOne({ _id: objectId });
    return reservation ? serializeForJson(reservation) : null;
  });
}

export async function updateWorkerReservationStatus(
  mongoUri: string,
  id: string,
  status: ReservationStatus
) {
  const objectId = toObjectId(id);
  if (!objectId) return null;

  return withMongoDb(mongoUri, async (db) => {
    const now = new Date();
    const reservation = await collection<ReservationRecord>(db, 'reservations').findOneAndUpdate(
      { _id: objectId },
      { $set: { status, updatedAt: now } },
      { returnDocument: 'after' }
    );

    return reservation ? serializeForJson(reservation) : null;
  });
}

export async function updateWorkerReservation(
  mongoUri: string,
  id: string,
  patch: ReservationPatchInput
) {
  const objectId = toObjectId(id);
  if (!objectId) return null;

  const existing = await withMongoDb(mongoUri, async (db) =>
    collection<ReservationRecord>(db, 'reservations').findOne({ _id: objectId })
  );
  if (!existing) return null;

  const nextData: ReservationInput = {
    fullName: patch.fullName ?? existing.fullName,
    phone: patch.phone ?? existing.phone,
    email: patch.email ?? existing.email,
    date: patch.date ?? formatDateKey(existing.startAt),
    time: patch.time ?? existing.time,
    guests: patch.guests ?? existing.guests,
    zone: patch.zone ?? existing.zone,
    notes: patch.notes ?? existing.notes,
    consentAccepted: existing.consentAccepted
  };

  const settings = await getWorkerReservationSettings(mongoUri);
  const { startAt, evaluation, resolvedZone } = await evaluateReservationInput(
    mongoUri,
    normalizeReservationInput(nextData),
    settings,
    existing.source,
    objectId.toHexString()
  );

  if (!evaluation.success) {
    throw new ReservationError(
      evaluation.suggestions.length > 0 ? buildAlternativeMessage(evaluation.suggestions) : buildRejectionMessage(),
      evaluation.suggestions.length > 0 ? 409 : 422,
      { suggestions: evaluation.suggestions }
    );
  }

  return withMongoDb(mongoUri, async (db) => {
    const now = new Date();
    const reservation = await collection<ReservationRecord>(db, 'reservations').findOneAndUpdate(
      { _id: objectId },
      {
        $set: {
          fullName: nextData.fullName.trim(),
          phone: nextData.phone.trim(),
          email: (nextData.email ?? '').trim().toLowerCase(),
          date: buildDateTime(nextData.date, '00:00'),
          startAt,
          endAt: new Date(startAt.getTime() + (settings.reservationDurationMinutes + settings.bufferMinutes) * 60000),
          time: nextData.time,
          guests: nextData.guests,
          zone: resolvedZone,
          notes: (nextData.notes ?? '').trim(),
          ...(patch.status ? { status: patch.status } : {}),
          updatedAt: now
        }
      },
      { returnDocument: 'after' }
    );

    return reservation ? serializeForJson(reservation) : null;
  });
}

export async function deleteWorkerReservation(mongoUri: string, id: string) {
  const objectId = toObjectId(id);
  if (!objectId) return null;

  return withMongoDb(mongoUri, async (db) => {
    const reservation = await collection<ReservationRecord>(db, 'reservations').findOneAndDelete({ _id: objectId });
    return reservation ? serializeForJson(reservation) : null;
  });
}

export async function getWorkerOperationalBlocks(
  mongoUri: string,
  filters?: { date?: string; zone?: ReservationZone }
) {
  const query: Record<string, unknown> = {};

  if (filters?.date && isValidDateKey(filters.date)) {
    const { start, end } = getDayBounds(filters.date);
    query.date = { $gte: start, $lt: end };
  }

  if (filters?.zone) {
    query.zone = filters.zone;
  }

  return withMongoDb(mongoUri, async (db) => {
    const blocks = await collection<OperationalBlockRecord>(db, 'operationalblocks')
      .find(query)
      .sort({ startAt: 1 })
      .toArray();

    return serializeForJson(blocks);
  });
}

export async function createWorkerOperationalBlock(mongoUri: string, input: BlockInput) {
  const settings = await getWorkerReservationSettings(mongoUri);

  if (
    !isValidDateKey(input.date) ||
    !isValidTimeValue(input.startTime, settings.slotIntervalMinutes) ||
    !isValidTimeValue(input.endTime, settings.slotIntervalMinutes)
  ) {
    throw new ReservationError('Data ou horário do bloqueio inválido.', 400);
  }

  const startAt = buildDateTime(input.date, input.startTime);
  const endAt = buildDateTime(input.date, input.endTime);

  if (endAt <= startAt) {
    throw new ReservationError('O bloqueio deve terminar depois da hora de início.', 400);
  }

  const now = new Date();
  const block: OperationalBlockRecord = {
    label: input.label.trim(),
    reason: (input.reason ?? '').trim(),
    date: buildDateTime(input.date, '00:00'),
    startAt,
    endAt,
    zone: input.zone,
    blockType: 'zone',
    active: input.active ?? true,
    createdAt: now,
    updatedAt: now
  };

  return withMongoDb(mongoUri, async (db) => {
    const result = await collection<OperationalBlockRecord>(db, 'operationalblocks').insertOne(block);
    return serializeForJson({
      _id: result.insertedId,
      ...block
    });
  });
}

export async function toggleWorkerOperationalBlock(mongoUri: string, id: string, active: boolean) {
  const objectId = toObjectId(id);
  if (!objectId) return null;

  return withMongoDb(mongoUri, async (db) => {
    const now = new Date();
    const block = await collection<OperationalBlockRecord>(db, 'operationalblocks').findOneAndUpdate(
      { _id: objectId },
      { $set: { active, updatedAt: now } },
      { returnDocument: 'after' }
    );

    return block ? serializeForJson(block) : null;
  });
}

export async function deleteWorkerOperationalBlock(mongoUri: string, id: string) {
  const objectId = toObjectId(id);
  if (!objectId) return null;

  return withMongoDb(mongoUri, async (db) => {
    const block = await collection<OperationalBlockRecord>(db, 'operationalblocks').findOneAndDelete({ _id: objectId });
    return block ? serializeForJson(block) : null;
  });
}

export async function getWorkerReservationDashboardSummary(
  mongoUri: string,
  date: string,
  zone?: ReservationZone,
  time = '12:00'
) {
  const settings = await getWorkerReservationSettings(mongoUri);
  const dayStart = buildDateTime(date, '00:00');
  const referenceTime = isValidClockTime(time) ? time : '12:00';
  const referenceAt = buildDateTime(date, referenceTime);
  const weekEnd = new Date(dayStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const monthEnd = new Date(dayStart);
  monthEnd.setMonth(monthEnd.getMonth() + 1);

  const [reservations, blocks, weekReservations, monthReservations] = await Promise.all([
    withMongoDb(mongoUri, async (db) =>
      collection<ReservationRecord>(db, 'reservations')
        .find(reservationCollectionQuery({ date, zone }))
        .sort({ startAt: 1, time: 1 })
        .toArray()
    ),
    withMongoDb(mongoUri, async (db) =>
      collection<OperationalBlockRecord>(db, 'operationalblocks')
        .find(
          zone
            ? {
                date: {
                  $gte: getDayBounds(date).start,
                  $lt: getDayBounds(date).end
                },
                zone
              }
            : {
                date: {
                  $gte: getDayBounds(date).start,
                  $lt: getDayBounds(date).end
                }
              }
        )
        .sort({ startAt: 1 })
        .toArray()
    ),
    withMongoDb(mongoUri, async (db) =>
      collection<ReservationRecord>(db, 'reservations')
        .find({
          status: { $in: [...BLOCKING_RESERVATION_STATUSES] },
          startAt: { $gte: dayStart, $lt: weekEnd },
          ...(zone ? { zone } : {})
        })
        .toArray()
    ),
    withMongoDb(mongoUri, async (db) =>
      collection<ReservationRecord>(db, 'reservations')
        .find({
          status: { $in: [...BLOCKING_RESERVATION_STATUSES] },
          startAt: { $gte: dayStart, $lt: monthEnd },
          ...(zone ? { zone } : {})
        })
        .toArray()
    )
  ]);

  const targetZones = zone ? [zone] : (['interior', 'terrace'] as ReservationZone[]);
  const occupancyByZone = Object.fromEntries(
    targetZones.map((currentZone) => {
      const guests = reservations
        .filter((reservation) => {
          if (reservation.zone !== currentZone || !BLOCKING_RESERVATION_STATUSES.includes(reservation.status)) {
            return false;
          }

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
    reservations: serializeForJson(reservations),
    blocks: serializeForJson(blocks),
    report: {
      day: reservations.reduce((sum, reservation) => sum + reservation.guests, 0),
      week: weekReservations.reduce((sum, reservation) => sum + reservation.guests, 0),
      month: monthReservations.reduce((sum, reservation) => sum + reservation.guests, 0)
    }
  };
}

export function isWorkerReservationError(error: unknown): error is ReservationError {
  return error instanceof ReservationError;
}
