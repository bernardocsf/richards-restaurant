export type TableType = 'two_top' | 'four_top' | 'round_eight';

type TableDefinition = {
  type: TableType;
  ids: string[];
  label: string;
};

type ServiceWindow = {
  start: string;
  end: string;
};

export const SLOT_INTERVAL_MINUTES = 15;
export const RESERVATION_DURATION_MINUTES = 180;
export const BLOCKING_STATUSES = ['pending', 'confirmed'] as const;

const TABLE_DEFINITIONS: TableDefinition[] = [
  {
    type: 'two_top',
    ids: Array.from({ length: 8 }, (_value, index) => `M2-${String(index + 1).padStart(2, '0')}`),
    label: 'Mesa para 2'
  },
  {
    type: 'four_top',
    ids: Array.from({ length: 12 }, (_value, index) => `M4-${String(index + 1).padStart(2, '0')}`),
    label: 'Mesa para 4'
  },
  {
    type: 'round_eight',
    ids: Array.from({ length: 2 }, (_value, index) => `MR-${String(index + 1).padStart(2, '0')}`),
    label: 'Mesa redonda para 5 a 8'
  }
];

const OPENING_HOURS_BY_DAY: Record<number, ServiceWindow[]> = {
  0: [{ start: '12:00', end: '15:00' }],
  1: [],
  2: [
    { start: '12:00', end: '15:00' },
    { start: '19:00', end: '22:00' }
  ],
  3: [
    { start: '12:00', end: '15:00' },
    { start: '19:00', end: '22:00' }
  ],
  4: [
    { start: '12:00', end: '15:00' },
    { start: '19:00', end: '22:00' }
  ],
  5: [
    { start: '12:00', end: '15:00' },
    { start: '19:00', end: '22:00' }
  ],
  6: [
    { start: '12:00', end: '15:00' },
    { start: '19:00', end: '22:00' }
  ]
};

export type ReservationSlotRecord = {
  _id?: string | { toString(): string };
  guests: number;
  date?: Date | string;
  time?: string;
  startAt?: Date | string;
  endAt?: Date | string;
  assignedTableId?: string;
  assignedTableType?: TableType;
  status?: string;
};

export type TableAssignment = {
  tableId: string;
  tableType: TableType;
  tableLabel: string;
};

type SchedulableReservation = {
  reservationId: string;
  guests: number;
  startAt: Date;
  endAt: Date;
  assignedTableId?: string;
  assignedTableType?: TableType;
};

export function isValidDateKey(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function isValidTimeValue(value: string) {
  return /^([01]\d|2[0-3]):(00|15|30|45)$/.test(value);
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

export function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60000);
}

export function getDayBounds(dateKey: string) {
  const start = parseDateKey(dateKey);
  const end = addMinutes(start, 24 * 60);
  return { start, end };
}

export function getOpeningWindows(dateKey: string) {
  const date = parseDateKey(dateKey);
  return OPENING_HOURS_BY_DAY[date.getDay()] ?? [];
}

export function getOpeningSlots(dateKey: string, reference = new Date()) {
  const windows = getOpeningWindows(dateKey);
  const slots: string[] = [];

  for (const window of windows) {
    let cursor = buildDateTime(dateKey, window.start);
    const end = buildDateTime(dateKey, window.end);

    while (cursor < end) {
      if (cursor > reference) {
        slots.push(formatTime(cursor));
      }
      cursor = addMinutes(cursor, SLOT_INTERVAL_MINUTES);
    }
  }

  return slots;
}

export function getEligibleTableTypes(guests: number): TableType[] {
  if (guests <= 2) return ['two_top', 'four_top'];
  if (guests <= 4) return ['four_top'];
  if (guests <= 8) return ['round_eight'];
  return [];
}

export function getTableLabel(tableType: TableType) {
  return TABLE_DEFINITIONS.find((table) => table.type === tableType)?.label ?? 'Mesa';
}

export function getTableIdsForType(tableType: TableType) {
  return TABLE_DEFINITIONS.find((table) => table.type === tableType)?.ids ?? [];
}

export function getTableTypeFromId(tableId: string): TableType | null {
  const table = TABLE_DEFINITIONS.find((definition) => definition.ids.includes(tableId));
  return table?.type ?? null;
}

export function isTimeWithinOpeningHours(dateKey: string, time: string) {
  return getOpeningSlots(dateKey, new Date(0)).includes(time);
}

function formatTime(date: Date) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function overlaps(startA: Date, endA: Date, startB: Date, endB: Date) {
  return startA < endB && endA > startB;
}

function toDate(value?: Date | string) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeReservationWindow(reservation: ReservationSlotRecord): SchedulableReservation | null {
  const reservationId = typeof reservation._id === 'string' ? reservation._id : reservation._id?.toString() ?? `${reservation.time ?? 'slot'}-${reservation.guests}`;
  const startAt = toDate(reservation.startAt);
  const endAt = toDate(reservation.endAt);

  if (startAt && endAt) {
    return {
      reservationId,
      guests: reservation.guests,
      startAt,
      endAt,
      assignedTableId: reservation.assignedTableId,
      assignedTableType: reservation.assignedTableType
    };
  }

  if (!reservation.date || !reservation.time) return null;

  const date = toDate(reservation.date);
  if (!date || !isValidTimeValue(reservation.time)) return null;

  const dateKey = formatDateKey(date);
  const derivedStart = buildDateTime(dateKey, reservation.time);
  const derivedEnd = addMinutes(derivedStart, RESERVATION_DURATION_MINUTES);

  return {
    reservationId,
    guests: reservation.guests,
    startAt: derivedStart,
    endAt: derivedEnd,
    assignedTableId: reservation.assignedTableId,
    assignedTableType: reservation.assignedTableType
  };
}

function resolveAssignmentForReservation(
  reservation: SchedulableReservation,
  occupiedTableIds: Set<string>
): TableAssignment | null {
  if (reservation.assignedTableId) {
    const preferredType = reservation.assignedTableType ?? getTableTypeFromId(reservation.assignedTableId);
    const allowedTypes = getEligibleTableTypes(reservation.guests);

    if (
      preferredType &&
      allowedTypes.includes(preferredType) &&
      !occupiedTableIds.has(reservation.assignedTableId)
    ) {
      return {
        tableId: reservation.assignedTableId,
        tableType: preferredType,
        tableLabel: getTableLabel(preferredType)
      };
    }
  }

  for (const tableType of getEligibleTableTypes(reservation.guests)) {
    const freeTableId = getTableIdsForType(tableType).find((tableId) => !occupiedTableIds.has(tableId));

    if (freeTableId) {
      return {
        tableId: freeTableId,
        tableType,
        tableLabel: getTableLabel(tableType)
      };
    }
  }

  return null;
}

export function findTableAssignment(
  reservations: ReservationSlotRecord[],
  candidate: { reservationId: string; guests: number; date: string; time: string },
  excludeReservationId?: string
) {
  const candidateStart = buildDateTime(candidate.date, candidate.time);
  const candidateEnd = addMinutes(candidateStart, RESERVATION_DURATION_MINUTES);

  const existingReservations = reservations
    .filter((reservation) => reservation._id !== excludeReservationId)
    .map(normalizeReservationWindow)
    .filter((reservation): reservation is SchedulableReservation => Boolean(reservation))
    .sort((left, right) => left.startAt.getTime() - right.startAt.getTime() || left.reservationId.localeCompare(right.reservationId));

  const plannedAssignments = new Map<string, TableAssignment | null>();

  for (const reservation of existingReservations) {
    const occupiedTableIds = new Set(
      existingReservations
        .filter((scheduled) => scheduled.reservationId !== reservation.reservationId && overlaps(scheduled.startAt, scheduled.endAt, reservation.startAt, reservation.endAt))
        .map((scheduled) => plannedAssignments.get(scheduled.reservationId)?.tableId)
        .filter((tableId): tableId is string => Boolean(tableId))
    );

    plannedAssignments.set(reservation.reservationId, resolveAssignmentForReservation(reservation, occupiedTableIds));
  }

  const candidateReservation: SchedulableReservation = {
    reservationId: candidate.reservationId,
    guests: candidate.guests,
    startAt: candidateStart,
    endAt: candidateEnd
  };

  const occupiedTableIds = new Set(
    existingReservations
      .filter((reservation) => overlaps(reservation.startAt, reservation.endAt, candidateStart, candidateEnd))
      .map((reservation) => plannedAssignments.get(reservation.reservationId)?.tableId)
      .filter((tableId): tableId is string => Boolean(tableId))
  );

  return resolveAssignmentForReservation(candidateReservation, occupiedTableIds);
}
