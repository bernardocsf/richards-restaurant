import {
  AdminReservationPayload,
  AdminReservationUpdatePayload,
  OperationalBlockPayload,
  ReservationPayload,
  ReviewPayload
} from '@/lib/schemas';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api';

export type ReservationZone = 'interior' | 'terrace';
export type ReservationStatus =
  | 'confirmed_auto'
  | 'cancelled_by_customer'
  | 'cancelled_by_restaurant'
  | 'completed'
  | 'no_show';

export type AvailabilitySuggestion = {
  date: string;
  time: string;
  zone: ReservationZone;
  label: string;
};

export type ReservationRecord = {
  _id: string;
  referenceCode: string;
  fullName: string;
  phone: string;
  email?: string;
  date: string;
  startAt: string;
  endAt: string;
  time: string;
  guests: number;
  zone: ReservationZone;
  notes?: string;
  source: 'website' | 'phone' | 'walk_in';
  tableIds: string[];
  tableCombinationLabel?: string;
  status: ReservationStatus;
  emailNotificationStatus?: 'pending' | 'sent' | 'skipped' | 'failed';
  whatsappNotificationStatus?: 'pending' | 'sent' | 'skipped' | 'failed';
  createdAt?: string;
  updatedAt?: string;
};

export type OperationalBlockRecord = {
  _id: string;
  label: string;
  reason?: string;
  date: string;
  startAt: string;
  endAt: string;
  zone: ReservationZone;
  blockType: 'table' | 'zone';
  tableIds?: string[];
  active: boolean;
};

export type ReservationSettings = {
  slotIntervalMinutes: number;
  reservationDurationMinutes: number;
  bufferMinutes: number;
  maxGuestsPerReservation: number;
  openingHours: Record<string, Array<{ start: string; end: string }>>;
};

export type DashboardSummary = {
  settings: ReservationSettings;
  date: string;
  referenceTime: string;
  zone: ReservationZone | 'all';
  occupancyByZone: Record<string, { guests: number; capacity: number; occupancyRate: number }>;
  tables: Array<{
    id: string;
    zone: ReservationZone;
    seats: number;
    neighbors: string[];
    state: 'free' | 'occupied' | 'blocked';
    reservationReference: string | null;
    reservationName: string | null;
  }>;
  reservations: ReservationRecord[];
  blocks: OperationalBlockRecord[];
  report: {
    day: number;
    week: number;
    month: number;
  };
};

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || 'Ocorreu um erro inesperado.') as Error & {
      details?: unknown;
    };
    error.details = data.details;
    throw error;
  }
  return data as T;
}

export async function createReservation(payload: ReservationPayload) {
  const response = await fetch(`${API_BASE_URL}/reservations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  return handleResponse<{ message: string; reservation?: ReservationRecord; suggestions?: AvailabilitySuggestion[] }>(response);
}

export async function createManualReservation(payload: AdminReservationPayload, adminKey: string) {
  const response = await fetch(`${API_BASE_URL}/reservations/manual`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': adminKey
    },
    body: JSON.stringify(payload)
  });

  return handleResponse<{ message: string; reservation?: ReservationRecord; suggestions?: AvailabilitySuggestion[] }>(response);
}

export async function fetchReservationAvailability(date: string, guests: number, zone: ReservationZone) {
  const response = await fetch(
    `${API_BASE_URL}/reservations/availability?date=${encodeURIComponent(date)}&guests=${encodeURIComponent(guests)}&zone=${encodeURIComponent(zone)}`,
    {
      cache: 'no-store'
    }
  );

  return handleResponse<{
    date: string;
    guests: number;
    zone: ReservationZone;
    slots: Array<{ time: string; zone: ReservationZone; tableIds: string[]; seats: number }>;
    suggestions: AvailabilitySuggestion[];
    durationMinutes: number;
    bufferMinutes: number;
  }>(response);
}

export async function createReview(payload: ReviewPayload) {
  const response = await fetch(`${API_BASE_URL}/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  return handleResponse<{ message: string }>(response);
}

export async function fetchReviews() {
  const response = await fetch(`${API_BASE_URL}/reviews`, {
    cache: 'no-store'
  });

  return handleResponse<{ reviews: Array<{ _id: string; customerName: string; rating: number; comment: string; createdAt: string }> }>(response);
}

export async function fetchAdminReservations(adminKey: string, params?: { date?: string; zone?: ReservationZone | 'all'; search?: string; status?: ReservationStatus | 'all' }) {
  const query = new URLSearchParams();

  if (params?.date) query.set('date', params.date);
  if (params?.zone && params.zone !== 'all') query.set('zone', params.zone);
  if (params?.search) query.set('search', params.search);
  if (params?.status && params.status !== 'all') query.set('status', params.status);

  const response = await fetch(`${API_BASE_URL}/reservations?${query.toString()}`, {
    headers: {
      'x-admin-key': adminKey
    },
    cache: 'no-store'
  });

  return handleResponse<{ reservations: ReservationRecord[] }>(response);
}

export async function updateReservationStatus(id: string, status: ReservationStatus, adminKey: string) {
  const response = await fetch(`${API_BASE_URL}/reservations/${id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': adminKey
    },
    body: JSON.stringify({ status })
  });

  return handleResponse<{ message: string; reservation: ReservationRecord }>(response);
}

export async function updateReservation(id: string, payload: AdminReservationUpdatePayload, adminKey: string) {
  const response = await fetch(`${API_BASE_URL}/reservations/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': adminKey
    },
    body: JSON.stringify(payload)
  });

  return handleResponse<{ message: string; reservation: ReservationRecord }>(response);
}

export async function fetchReservationSettings(adminKey: string) {
  const response = await fetch(`${API_BASE_URL}/reservations/settings`, {
    headers: {
      'x-admin-key': adminKey
    },
    cache: 'no-store'
  });

  return handleResponse<{ settings: ReservationSettings }>(response);
}

export async function updateReservationSettings(payload: Partial<ReservationSettings>, adminKey: string) {
  const response = await fetch(`${API_BASE_URL}/reservations/settings`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': adminKey
    },
    body: JSON.stringify(payload)
  });

  return handleResponse<{ message: string; settings: ReservationSettings }>(response);
}

export async function fetchBlocks(adminKey: string, params?: { date?: string; zone?: ReservationZone | 'all' }) {
  const query = new URLSearchParams();
  if (params?.date) query.set('date', params.date);
  if (params?.zone && params.zone !== 'all') query.set('zone', params.zone);

  const response = await fetch(`${API_BASE_URL}/reservations/blocks?${query.toString()}`, {
    headers: {
      'x-admin-key': adminKey
    },
    cache: 'no-store'
  });

  return handleResponse<{ blocks: OperationalBlockRecord[] }>(response);
}

export async function createOperationalBlock(payload: OperationalBlockPayload, adminKey: string) {
  const response = await fetch(`${API_BASE_URL}/reservations/blocks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': adminKey
    },
    body: JSON.stringify(payload)
  });

  return handleResponse<{ message: string; block: OperationalBlockRecord }>(response);
}

export async function updateOperationalBlock(id: string, active: boolean, adminKey: string) {
  const response = await fetch(`${API_BASE_URL}/reservations/blocks/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': adminKey
    },
    body: JSON.stringify({ active })
  });

  return handleResponse<{ message: string; block: OperationalBlockRecord }>(response);
}

export async function fetchDashboardSummary(adminKey: string, date: string, zone: ReservationZone | 'all' = 'all', time?: string) {
  const query = new URLSearchParams({ date });
  if (zone !== 'all') query.set('zone', zone);
  if (time) query.set('time', time);

  const response = await fetch(`${API_BASE_URL}/reservations/dashboard?${query.toString()}`, {
    headers: {
      'x-admin-key': adminKey
    },
    cache: 'no-store'
  });

  return handleResponse<DashboardSummary>(response);
}
