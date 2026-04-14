export type ReservationZone = 'interior' | 'terrace';

export type ReservationStatus =
  | 'confirmed_auto'
  | 'cancelled_by_customer'
  | 'cancelled_by_restaurant'
  | 'completed'
  | 'no_show';

export type ReservationSource = 'website' | 'phone' | 'walk_in';

export type BlockType = 'table' | 'zone';

export type TableDefinition = {
  id: string;
  zone: ReservationZone;
  seats: number;
  neighbors: string[];
};

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
  tableIds?: string[];
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
  tableIds?: string[];
  reason?: string;
  active?: boolean;
};

export type TableAssignment = {
  zone: ReservationZone;
  tableIds: string[];
  seats: number;
  wastedSeats: number;
  score: number;
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
      assignment: TableAssignment;
      suggestions: AvailabilitySuggestion[];
      reasons: [];
    }
  | {
      success: false;
      assignment: null;
      suggestions: AvailabilitySuggestion[];
      reasons: string[];
    };

const INTERIOR_TABLES: TableDefinition[] = [
  { id: 'I1', zone: 'interior', seats: 2, neighbors: ['I2'] },
  { id: 'I2', zone: 'interior', seats: 2, neighbors: ['I1', 'I3'] },
  { id: 'I3', zone: 'interior', seats: 2, neighbors: ['I2', 'I4'] },
  { id: 'I4', zone: 'interior', seats: 2, neighbors: ['I3', 'I5'] },
  { id: 'I5', zone: 'interior', seats: 2, neighbors: ['I4', 'I6'] },
  { id: 'I6', zone: 'interior', seats: 2, neighbors: ['I5'] },
  { id: 'I7', zone: 'interior', seats: 4, neighbors: ['I8'] },
  { id: 'I8', zone: 'interior', seats: 4, neighbors: ['I7', 'I9'] },
  { id: 'I9', zone: 'interior', seats: 4, neighbors: ['I8', 'I10'] },
  { id: 'I10', zone: 'interior', seats: 4, neighbors: ['I9', 'I11'] },
  { id: 'I11', zone: 'interior', seats: 4, neighbors: ['I10', 'I12'] },
  { id: 'I12', zone: 'interior', seats: 4, neighbors: ['I11', 'I13'] },
  { id: 'I13', zone: 'interior', seats: 4, neighbors: ['I12'] }
];

const TERRACE_TABLES: TableDefinition[] = [
  { id: 'E1', zone: 'terrace', seats: 2, neighbors: ['E2'] },
  { id: 'E2', zone: 'terrace', seats: 2, neighbors: ['E1', 'E3'] },
  { id: 'E3', zone: 'terrace', seats: 2, neighbors: ['E2', 'E4'] },
  { id: 'E4', zone: 'terrace', seats: 2, neighbors: ['E3'] },
  { id: 'E5', zone: 'terrace', seats: 4, neighbors: ['E6'] },
  { id: 'E6', zone: 'terrace', seats: 4, neighbors: ['E5', 'E7'] },
  { id: 'E7', zone: 'terrace', seats: 4, neighbors: ['E6'] }
];

export const TABLE_MAP = [...INTERIOR_TABLES, ...TERRACE_TABLES];

export const ZONE_CAPACITY: Record<ReservationZone, number> = {
  interior: 40,
  terrace: 20
};

export const RESTAURANT_CAPACITY = 60;

export const BLOCKING_RESERVATION_STATUSES: ReservationStatus[] = ['confirmed_auto'];

export const DEFAULT_RESERVATION_SETTINGS: ReservationPolicySettings = {
  slotIntervalMinutes: 15,
  reservationDurationMinutes: 120,
  bufferMinutes: 15,
  maxGuestsPerReservation: 15,
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

const TABLES_BY_ZONE: Record<ReservationZone, TableDefinition[]> = {
  interior: INTERIOR_TABLES,
  terrace: TERRACE_TABLES
};

function isConnectedSubset(tableIds: string[], tablesById: Map<string, TableDefinition>) {
  if (tableIds.length <= 1) return true;

  const target = new Set(tableIds);
  const visited = new Set<string>();
  const queue = [tableIds[0]];

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (!currentId || visited.has(currentId)) continue;
    visited.add(currentId);

    const table = tablesById.get(currentId);
    if (!table) continue;

    for (const neighborId of table.neighbors) {
      if (target.has(neighborId) && !visited.has(neighborId)) {
        queue.push(neighborId);
      }
    }
  }

  return visited.size === tableIds.length;
}

function enumerateConnectedSubsets(zone: ReservationZone) {
  const tables = TABLES_BY_ZONE[zone];
  const tablesById = new Map(tables.map((table) => [table.id, table]));
  const seen = new Set<string>();
  const results: string[][] = [];

  for (const table of tables) {
    const stack: string[][] = [[table.id]];

    while (stack.length > 0) {
      const current = stack.pop();
      if (!current) continue;

      const key = [...current].sort().join('|');
      if (seen.has(key)) continue;
      seen.add(key);
      results.push(current);

      const neighborCandidates = new Set<string>();

      for (const currentId of current) {
        const currentTable = tablesById.get(currentId);
        if (!currentTable) continue;

        for (const neighborId of currentTable.neighbors) {
          if (!current.includes(neighborId)) {
            neighborCandidates.add(neighborId);
          }
        }
      }

      for (const neighborId of neighborCandidates) {
        const next = [...current, neighborId];
        if (isConnectedSubset(next, tablesById)) {
          stack.push(next);
        }
      }
    }
  }

  return results;
}

const CONNECTED_SUBSETS_BY_ZONE: Record<ReservationZone, string[][]> = {
  interior: enumerateConnectedSubsets('interior'),
  terrace: enumerateConnectedSubsets('terrace')
};

export function isValidDateKey(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function isValidTimeValue(value: string, slotIntervalMinutes = DEFAULT_RESERVATION_SETTINGS.slotIntervalMinutes) {
  if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(value)) return false;
  const minutes = Number(value.split(':')[1]);
  return minutes % slotIntervalMinutes === 0;
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
    const latestStart = addMinutes(windowEnd, -(settings.reservationDurationMinutes + settings.bufferMinutes));

    while (cursor <= latestStart) {
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

export function getTableDefinitions(zone: ReservationZone) {
  return TABLES_BY_ZONE[zone];
}

export function getTableById(tableId: string) {
  return TABLE_MAP.find((table) => table.id === tableId) ?? null;
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
      endAt,
      tableIds: reservation.tableIds ?? []
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
    endAt: derivedEnd,
    tableIds: reservation.tableIds ?? []
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
      tableIds: block.tableIds ?? [],
      startAt,
      endAt
    };
  }

  return null;
}

function calculateAssignmentScore(tables: TableDefinition[], guests: number) {
  const seats = tables.reduce((sum, table) => sum + table.seats, 0);
  const wastedSeats = seats - guests;
  const tablesCount = tables.length;
  const twoTopCount = tables.filter((table) => table.seats === 2).length;
  const fourTopCount = tables.filter((table) => table.seats === 4).length;
  const usesLargeForSmallGroup = guests <= 2 && fourTopCount > 0 ? 8 : 0;
  const fragmentationPenalty = Math.max(0, tablesCount - 1) * 5;
  const preserveLargeTablePenalty = guests <= 4 ? fourTopCount * 2 : 0;
  const preferSingleTableBonus = tablesCount === 1 ? -3 : 0;

  return wastedSeats * 10 + fragmentationPenalty + preserveLargeTablePenalty + usesLargeForSmallGroup - twoTopCount + preferSingleTableBonus;
}

export function findBestTableAssignment(params: {
  zone: ReservationZone;
  guests: number;
  occupiedTableIds: Set<string>;
}) {
  const { zone, guests, occupiedTableIds } = params;
  const tablesById = new Map(getTableDefinitions(zone).map((table) => [table.id, table]));
  const possibleAssignments = CONNECTED_SUBSETS_BY_ZONE[zone]
    .filter((subset) => subset.every((tableId) => !occupiedTableIds.has(tableId)))
    .map((subset) => subset.map((tableId) => tablesById.get(tableId)).filter((table): table is TableDefinition => Boolean(table)))
    .filter((tables) => tables.reduce((sum, table) => sum + table.seats, 0) >= guests)
    .map((tables) => {
      const seats = tables.reduce((sum, table) => sum + table.seats, 0);
      return {
        zone,
        tableIds: tables.map((table) => table.id).sort(),
        seats,
        wastedSeats: seats - guests,
        score: calculateAssignmentScore(tables, guests)
      } satisfies TableAssignment;
    })
    .sort(
      (left, right) =>
        left.score - right.score ||
        left.wastedSeats - right.wastedSeats ||
        left.tableIds.length - right.tableIds.length ||
        left.tableIds.join(',').localeCompare(right.tableIds.join(','))
    );

  return possibleAssignments[0] ?? null;
}

function runAvailabilityEvaluation(params: {
  date: string;
  time: string;
  guests: number;
  zone: ReservationZone;
  reservations: ReservationLikeRecord[];
  blocks: OperationalBlockRecord[];
  settings: ReservationPolicySettings;
  excludeReservationId?: string;
}) {
  const { date, time, guests, zone, reservations, blocks, settings, excludeReservationId } = params;
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

  if (guests > settings.maxGuestsPerReservation) {
    reasons.push(`Máximo de ${settings.maxGuestsPerReservation} pessoas por reserva.`);
  }

  if (zoneGuests + guests > ZONE_CAPACITY[zone]) {
    reasons.push(`A ${getZoneLabel(zone).toLowerCase()} excede a lotação máxima.`);
  }

  if (totalGuests + guests > RESTAURANT_CAPACITY) {
    reasons.push('O restaurante atinge a lotação máxima total.');
  }

  const zoneBlocked = overlappingBlocks.some((block) => block.zone === zone && block.blockType === 'zone');
  if (zoneBlocked) {
    reasons.push(`${getZoneLabel(zone)} indisponível nesse período.`);
  }

  const occupiedTableIds = new Set<string>();

  for (const reservation of overlappingReservations.filter((entry) => entry.zone === zone)) {
    for (const tableId of reservation.tableIds) {
      occupiedTableIds.add(tableId);
    }
  }

  for (const block of overlappingBlocks.filter((entry) => entry.zone === zone && entry.blockType === 'table')) {
    for (const tableId of block.tableIds) {
      occupiedTableIds.add(tableId);
    }
  }

  const assignment = reasons.length === 0 ? findBestTableAssignment({ zone, guests, occupiedTableIds }) : null;

  if (!assignment) {
    if (!reasons.includes('Não existe combinação válida de mesas adjacentes para esse pedido.')) {
      reasons.push('Não existe combinação válida de mesas adjacentes para esse pedido.');
    }

    return {
      success: false,
      assignment: null,
      reasons,
      suggestions: []
    } satisfies AvailabilityEvaluation;
  }

  return {
    success: true,
    assignment,
    reasons: [],
    suggestions: []
  } satisfies AvailabilityEvaluation;
}

export function evaluateAvailability(params: {
  date: string;
  time: string;
  guests: number;
  zone: ReservationZone;
  reservations: ReservationLikeRecord[];
  blocks: OperationalBlockRecord[];
  settings: ReservationPolicySettings;
  excludeReservationId?: string;
}) {
  const { date, time, guests, zone, reservations, blocks, settings, excludeReservationId } = params;
  const result = runAvailabilityEvaluation(params);

  if (!result.success) {
    return {
      ...result,
      suggestions: buildAlternativeSuggestions({
        date,
        time,
        guests,
        preferredZone: zone,
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
      reservations,
      blocks,
      settings,
      excludeReservationId,
      includeExactSlot: false
    })
  } satisfies AvailabilityEvaluation;
}

export function buildAlternativeSuggestions(params: {
  date: string;
  time: string;
  guests: number;
  preferredZone: ReservationZone;
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

  const candidateZones: ReservationZone[] = preferredZone === 'interior' ? ['interior', 'terrace'] : ['terrace', 'interior'];
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

function evaluateAvailabilityWithoutSuggestions(params: {
  date: string;
  time: string;
  guests: number;
  zone: ReservationZone;
  reservations: ReservationLikeRecord[];
  blocks: OperationalBlockRecord[];
  settings: ReservationPolicySettings;
  excludeReservationId?: string;
}) {
  return runAvailabilityEvaluation(params);
}

export function generateReservationReference() {
  const randomChunk = Math.random().toString(36).slice(2, 6).toUpperCase();
  const timeChunk = Date.now().toString(36).slice(-4).toUpperCase();
  return `RGR-${timeChunk}${randomChunk}`;
}
