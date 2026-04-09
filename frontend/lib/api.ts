import { AdminReservationPayload, ReservationPayload, ReviewPayload } from '@/lib/schemas';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api';

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Ocorreu um erro inesperado.');
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

  return handleResponse<{ message: string; reservation?: Record<string, any> }>(response);
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

  return handleResponse<{ message: string; reservation?: Record<string, any> }>(response);
}

export async function fetchReservationAvailability(date: string, guests: number) {
  const response = await fetch(`${API_BASE_URL}/reservations/availability?date=${encodeURIComponent(date)}&guests=${encodeURIComponent(guests)}`, {
    cache: 'no-store'
  });

  return handleResponse<{ date: string; guests: number; slots: Array<{ time: string }>; durationMinutes: number }>(response);
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

  return handleResponse<{ reviews: Array<Record<string, any>> }>(response);
}

export async function fetchAdminReservations(adminKey: string) {
  const response = await fetch(`${API_BASE_URL}/reservations`, {
    headers: {
      'x-admin-key': adminKey
    },
    cache: 'no-store'
  });

  return handleResponse<{ reservations: Array<Record<string, any>> }>(response);
}

export async function updateReservationStatus(id: string, status: string, adminKey: string) {
  const response = await fetch(`${API_BASE_URL}/reservations/${id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': adminKey
    },
    body: JSON.stringify({ status })
  });

  return handleResponse<{ message: string }>(response);
}
