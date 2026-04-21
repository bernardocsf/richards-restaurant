export type ReservationZone = 'interior' | 'terrace';
export type ReservationRequestZone = ReservationZone | 'either';

export type ReservationStatus =
  | 'confirmed_auto'
  | 'cancelled_by_customer'
  | 'cancelled_by_restaurant'
  | 'completed'
  | 'no_show';

export type ReservationSource = 'website' | 'phone' | 'walk_in';

export type BlockType = 'zone';

export type ServiceWindow = {
  start: string;
  end: string;
};

export type OpeningHoursByDay = Record<number, ServiceWindow[]>;

export type ReservationPolicySettings = {
  slotIntervalMinutes: number;
  reservationDurationMinutes: number;
  bufferMinutes: number;
  maxGuestsPerReservation: number;
  zoneCapacities: Record<ReservationZone, { total: number; online: number }>;
  openingHours: OpeningHoursByDay;
};

export type ReservationLikeRecord = {
  _id?: string | { toString(): string };
  fullName?: string;
  phone?: string;
  email?: string;
  date?: Date | string;
  startAt?: Date | string;
  endAt?: Date | string;
  time?: string;
  guests: number;
  zone: ReservationZone;
  status?: string;
  referenceCode?: string;
};

export type OperationalBlockRecord = {
  _id?: string | { toString(): string };
  date?: Date | string;
  startAt?: Date | string;
  endAt?: Date | string;
  zone: ReservationZone;
  blockType: BlockType;
  reason?: string;
  active?: boolean;
};

export type AvailabilitySuggestion = {
  date: string;
  time: string;
  zone: ReservationZone;
  label: string;
};

export type AvailabilityEvaluation =
  | {
      success: true;
      suggestions: AvailabilitySuggestion[];
      reasons: [];
      remainingCapacity: number;
    }
  | {
      success: false;
      suggestions: AvailabilitySuggestion[];
      reasons: string[];
      remainingCapacity: number;
    };

export const RESTAURANT_CAPACITY = 60;

export const BLOCKING_RESERVATION_STATUSES: ReservationStatus[] = ['confirmed_auto'];

export const DEFAULT_RESERVATION_SETTINGS: ReservationPolicySettings = {
  slotIntervalMinutes: 30,
  reservationDurationMinutes: 120,
  bufferMinutes: 15,
  maxGuestsPerReservation: 30,
  zoneCapacities: {
    interior: { total: 30, online: 15 },
    terrace: { total: 30, online: 15 }
  },
  openingHours: {
    0: [{ start: '12:00', end: '15:00' }],
    1: [],
    2: [
      { start: '12:00', end: '15:00' },
      { start: '19:00', end: '22:30' }
    ],
    3: [
      { start: '12:00', end: '15:00' },
      { start: '19:00', end: '22:30' }
    ],
    4: [
      { start: '12:00', end: '15:00' },
      { start: '19:00', end: '22:30' }
    ],
    5: [
      { start: '12:00', end: '15:00' },
      { start: '19:00', end: '23:00' }
    ],
    6: [
      { start: '12:00', end: '15:30' },
      { start: '19:00', end: '23:00' }
    ]
  }
};

export function isValidDateKey(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function isValidTimeValue(value: string, slotIntervalMinutes = DEFAULT_RESERVATION_SETTINGS.slotIntervalMinutes) {
  if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(value)) return false;
  const minutes = Number(value.split(':')[1]);
  return minutes % slotIntervalMinutes === 0;
}

export function isValidClockTime(value: string) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
}

export function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

export function buildDateTime(dateKey: string, time: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

export function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatTime(date: Date) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60000);
}

export function getDayBounds(dateKey: string) {
  const start = parseDateKey(dateKey);
  return {
    start,
    end: addMinutes(start, 24 * 60)
  };
}

export function getOpeningWindows(dateKey: string, settings: ReservationPolicySettings) {
  const date = parseDateKey(dateKey);
  return settings.openingHours[date.getDay()] ?? [];
}

export function getOpeningSlots(dateKey: string, settings: ReservationPolicySettings, reference = new Date()) {
  const windows = getOpeningWindows(dateKey, settings);
  const slots: string[] = [];

  for (const window of windows) {
    let cursor = buildDateTime(dateKey, window.start);
    const windowEnd = buildDateTime(dateKey, window.end);

    while (cursor < windowEnd) {
      if (cursor > reference) {
        slots.push(formatTime(cursor));
      }

      cursor = addMinutes(cursor, settings.slotIntervalMinutes);
    }
  }

  return slots;
}

export function isTimeWithinOpeningHours(dateKey: string, time: string, settings: ReservationPolicySettings) {
  return getOpeningSlots(dateKey, settings, new Date(0)).includes(time);
}

export function getZoneLabel(zone: ReservationZone) {
  return zone === 'interior' ? 'Sala interior' : 'Esplanada';
}

export function getRequestedZones(zone: ReservationRequestZone): ReservationZone[] {
  return zone === 'either' ? ['interior', 'terrace'] : [zone];
}

export function getZoneCapacityLimit(
  zone: ReservationZone,
  settings: ReservationPolicySettings,
  source: ReservationSource
) {
  const configured = settings.zoneCapacities[zone];
  return source === 'website' ? configured.online : configured.total;
}

export function getReservationStatusLabel(status: ReservationStatus) {
  const labels: Record<ReservationStatus, string> = {
    confirmed_auto: 'Confirmada automaticamente',
    cancelled_by_customer: 'Cancelada pelo cliente',
    cancelled_by_restaurant: 'Cancelada pelo restaurante',
    completed: 'Concluída',
    no_show: 'No-show'
  };

  return labels[status];
}

export function overlaps(startA: Date, endA: Date, startB: Date, endB: Date) {
  return startA < endB && endA > startB;
}

function toDate(value?: Date | string) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function normalizeReservationWindow(
  reservation: ReservationLikeRecord,
  settings: ReservationPolicySettings
) {
  const reservationId =
    typeof reservation._id === 'string'
      ? reservation._id
      : reservation._id?.toString() ?? `${reservation.referenceCode ?? reservation.time ?? 'reservation'}-${reservation.guests}`;

  const startAt = toDate(reservation.startAt);
  const endAt = toDate(reservation.endAt);

  if (startAt && endAt) {
    return {
      reservationId,
      guests: reservation.guests,
      zone: reservation.zone,
      startAt,
      endAt
    };
  }

  if (!reservation.date || !reservation.time) return null;

  const date = toDate(reservation.date);
  if (!date) return null;

  const dateKey = formatDateKey(date);
  const derivedStart = buildDateTime(dateKey, reservation.time);
  const derivedEnd = addMinutes(derivedStart, settings.reservationDurationMinutes + settings.bufferMinutes);

  return {
    reservationId,
    guests: reservation.guests,
    zone: reservation.zone,
    startAt: derivedStart,
    endAt: derivedEnd
  };
}

export function normalizeBlockWindow(block: OperationalBlockRecord) {
  const startAt = toDate(block.startAt);
  const endAt = toDate(block.endAt);

  if (startAt && endAt) {
    return {
      blockId: typeof block._id === 'string' ? block._id : block._id?.toString() ?? 'block',
      zone: block.zone,
      blockType: block.blockType,
      startAt,
      endAt
    };
  }

  return null;
}

function runAvailabilityEvaluation(params: {
  date: string;
  time: string;
  guests: number;
  zone: ReservationZone;
  source: ReservationSource;
  reservations: ReservationLikeRecord[];
  blocks: OperationalBlockRecord[];
  settings: ReservationPolicySettings;
  excludeReservationId?: string;
}) {
  const { date, time, guests, zone, source, reservations, blocks, settings, excludeReservationId } = params;
  const startAt = buildDateTime(date, time);
  const endAt = addMinutes(startAt, settings.reservationDurationMinutes + settings.bufferMinutes);
  const reasons: string[] = [];

  const overlappingReservations = reservations
    .filter((reservation) => {
      const reservationId =
        typeof reservation._id === 'string'
          ? reservation._id
          : reservation._id?.toString();

      if (excludeReservationId && reservationId === excludeReservationId) {
        return false;
      }

      const normalized = normalizeReservationWindow(reservation, settings);
      return normalized ? overlaps(normalized.startAt, normalized.endAt, startAt, endAt) : false;
    })
    .map((reservation) => normalizeReservationWindow(reservation, settings))
    .filter((reservation): reservation is NonNullable<ReturnType<typeof normalizeReservationWindow>> => Boolean(reservation));

  const overlappingBlocks = blocks
    .filter((block) => block.active !== false)
    .map(normalizeBlockWindow)
    .filter((block): block is NonNullable<ReturnType<typeof normalizeBlockWindow>> => Boolean(block))
    .filter((block) => overlaps(block.startAt, block.endAt, startAt, endAt));

  const zoneGuests = overlappingReservations
    .filter((reservation) => reservation.zone === zone)
    .reduce((sum, reservation) => sum + reservation.guests, 0);

  const totalGuests = overlappingReservations.reduce((sum, reservation) => sum + reservation.guests, 0);
  const capacityLimit = getZoneCapacityLimit(zone, settings, source);
  const remainingCapacity = Math.max(0, capacityLimit - zoneGuests);

  if (guests > settings.maxGuestsPerReservation) {
    reasons.push(`Máximo de ${settings.maxGuestsPerReservation} pessoas por reserva.`);
  }

  if (guests > capacityLimit) {
    reasons.push(`A ${getZoneLabel(zone).toLowerCase()} permite no máximo ${capacityLimit} pessoas para este canal de reserva.`);
  }

  if (zoneGuests + guests > capacityLimit) {
    reasons.push(`A ${getZoneLabel(zone).toLowerCase()} não tem capacidade disponível suficiente para esse horário.`);
  }

  if (totalGuests + guests > RESTAURANT_CAPACITY) {
    reasons.push('O restaurante atinge a lotação máxima total.');
  }

  const zoneBlocked = overlappingBlocks.some((block) => block.zone === zone && block.blockType === 'zone');
  if (zoneBlocked) {
    reasons.push(`${getZoneLabel(zone)} indisponível nesse período.`);
  }

  if (reasons.length > 0) {
    return {
      success: false,
      reasons,
      suggestions: [],
      remainingCapacity
    } satisfies AvailabilityEvaluation;
  }

    return {
      success: true,
      reasons: [],
      suggestions: [],
      remainingCapacity: Math.max(0, capacityLimit - zoneGuests - guests)
    } satisfies AvailabilityEvaluation;
}

function evaluateAvailabilityWithoutSuggestions(params: {
  date: string;
  time: string;
  guests: number;
  zone: ReservationZone;
  source: ReservationSource;
  reservations: ReservationLikeRecord[];
  blocks: OperationalBlockRecord[];
  settings: ReservationPolicySettings;
  excludeReservationId?: string;
}) {
  return runAvailabilityEvaluation(params);
}

export function buildAlternativeSuggestions(params: {
  date: string;
  time: string;
  guests: number;
  preferredZone: ReservationRequestZone;
  source: ReservationSource;
  reservations: ReservationLikeRecord[];
  blocks: OperationalBlockRecord[];
  settings: ReservationPolicySettings;
  excludeReservationId?: string;
  includeExactSlot?: boolean;
}) {
  const {
    date,
    time,
    guests,
    preferredZone,
    source,
    reservations,
    blocks,
    settings,
    excludeReservationId,
    includeExactSlot = true
  } = params;

  const openingSlots = getOpeningSlots(date, settings, new Date(0));
  const preferredIndex = openingSlots.findIndex((slot) => slot === time);
  const candidateTimes = openingSlots
    .map((slot, index) => ({ slot, distance: preferredIndex === -1 ? index : Math.abs(index - preferredIndex) }))
    .sort((left, right) => left.distance - right.distance || left.slot.localeCompare(right.slot))
    .map((item) => item.slot);

  const requestedZones = getRequestedZones(preferredZone);
  const candidateZones: ReservationZone[] =
    requestedZones.length > 1
      ? requestedZones
      : requestedZones[0] === 'interior'
        ? ['interior', 'terrace']
        : ['terrace', 'interior'];
  const suggestions: AvailabilitySuggestion[] = [];
  const seen = new Set<string>();

  for (const zone of candidateZones) {
    for (const slot of candidateTimes) {
      if (!includeExactSlot && zone === preferredZone && slot === time) continue;

      const evaluation = evaluateAvailabilityWithoutSuggestions({
        date,
        time: slot,
        guests,
        zone,
        source,
        reservations,
        blocks,
        settings,
        excludeReservationId
      });

      if (!evaluation.success) continue;

      const key = `${date}-${slot}-${zone}`;
      if (seen.has(key)) continue;
      seen.add(key);

      suggestions.push({
        date,
        time: slot,
        zone,
        label: `${slot} · ${getZoneLabel(zone)}`
      });

      if (suggestions.length >= 6) {
        return suggestions;
      }
    }
  }

  return suggestions;
}

export function evaluateAvailability(params: {
  date: string;
  time: string;
  guests: number;
  zone: ReservationZone;
  source: ReservationSource;
  reservations: ReservationLikeRecord[];
  blocks: OperationalBlockRecord[];
  settings: ReservationPolicySettings;
  excludeReservationId?: string;
}) {
  const { date, time, guests, zone, source, reservations, blocks, settings, excludeReservationId } = params;
  const result = runAvailabilityEvaluation(params);

  if (!result.success) {
    return {
      ...result,
      suggestions: buildAlternativeSuggestions({
        date,
        time,
        guests,
        preferredZone: zone,
        source,
        reservations,
        blocks,
        settings,
        excludeReservationId
      })
    } satisfies AvailabilityEvaluation;
  }

  return {
    ...result,
    suggestions: buildAlternativeSuggestions({
        date,
        time,
        guests,
        preferredZone: zone,
        source,
        reservations,
        blocks,
        settings,
      excludeReservationId,
      includeExactSlot: false
    })
  } satisfies AvailabilityEvaluation;
}

export function generateReservationReference() {
  const randomChunk = Math.random().toString(36).slice(2, 6).toUpperCase();
  const timeChunk = Date.now().toString(36).slice(-4).toUpperCase();
  return `RGR-${timeChunk}${randomChunk}`;
}
