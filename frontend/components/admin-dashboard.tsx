'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  deleteReview,
  fetchAdminReservations,
  fetchDashboardSummary,
  fetchReviews,
  updateReservation,
  updateReservationStatus,
  type DashboardSummary,
  type ReservationRecord,
  type ReservationStatus,
  type ReservationZone
} from '@/lib/api';
import { ManualReservationForm } from '@/components/manual-reservation-form';
import { ReservationDatePicker } from '@/components/reservation-date-picker';
import { formatDate } from '@/lib/utils';
import { StarRating } from '@/components/star-rating';

type Review = {
  _id: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
};

const zoneLabels: Record<ReservationZone, string> = {
  interior: 'Sala interior',
  terrace: 'Esplanada'
};

const statusLabels: Record<ReservationStatus, string> = {
  confirmed_auto: 'Confirmada automaticamente',
  cancelled_by_customer: 'Cancelada pelo cliente',
  cancelled_by_restaurant: 'Cancelada pelo restaurante',
  completed: 'Concluída',
  no_show: 'No-show'
};

function todayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function currentClockTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function formatClock(value: string) {
  return value.slice(0, 5);
}

function formatOccupancyLabel(guests: number, capacity: number) {
  return `${guests} / ${capacity} lugares ocupados`;
}

type ServicePeriod = 'lunch' | 'dinner';

const serviceLabels: Record<ServicePeriod, string> = {
  lunch: 'Almoço',
  dinner: 'Jantar'
};

function getServicePeriod(time: string): ServicePeriod {
  return time < '18:00' ? 'lunch' : 'dinner';
}

function getReferenceTime(period: ServicePeriod) {
  return period === 'lunch' ? '13:00' : '20:00';
}

function getDashboardReferenceTime(date: string, period: ServicePeriod, liveClock: string) {
  if (date !== todayKey()) return getReferenceTime(period);
  return getServicePeriod(liveClock) === period ? liveClock : getReferenceTime(period);
}

const halfHourOptions = Array.from({ length: 48 }, (_value, index) => {
  const hours = String(Math.floor(index / 2)).padStart(2, '0');
  const minutes = index % 2 === 0 ? '00' : '30';
  return `${hours}:${minutes}`;
});

export function AdminDashboard() {
  const [adminKey, setAdminKey] = useState('');
  const [logged, setLogged] = useState(false);
  const [reservations, setReservations] = useState<ReservationRecord[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [selectedPeriod, setSelectedPeriod] = useState<ServicePeriod>('lunch');
  const [selectedZone, setSelectedZone] = useState<ReservationZone | 'all'>('all');
  const [liveClock, setLiveClock] = useState(currentClockTime());
  const selectedDateRef = useRef(selectedDate);
  const selectedZoneRef = useRef(selectedZone);

  const referenceTime = useMemo(
    () => getDashboardReferenceTime(selectedDate, selectedPeriod, liveClock),
    [liveClock, selectedDate, selectedPeriod]
  );

  const filteredReservations = useMemo(
    () =>
      reservations
        .filter((reservation) => getServicePeriod(reservation.time) === selectedPeriod)
        .sort((left, right) => left.startAt.localeCompare(right.startAt)),
    [reservations, selectedPeriod]
  );

  const reservationsByZone = useMemo(
    () => ({
      interior: filteredReservations
        .filter((reservation) => reservation.zone === 'interior')
        .sort((left, right) => left.startAt.localeCompare(right.startAt)),
      terrace: filteredReservations
        .filter((reservation) => reservation.zone === 'terrace')
        .sort((left, right) => left.startAt.localeCompare(right.startAt))
    }),
    [filteredReservations]
  );

  const loadData = async (key: string) => {
    setLoading(true);
    setError(null);

    try {
      const [reservationResponse, reviewResponse, dashboardResponse] = await Promise.all([
        fetchAdminReservations(key, {
          date: selectedDate,
          zone: selectedZone
        }),
        fetchReviews(),
        fetchDashboardSummary(key, selectedDate, selectedZone, referenceTime)
      ]);

      setReservations(reservationResponse.reservations);
      setReviews(reviewResponse.reviews as Review[]);
      setDashboard(dashboardResponse);
      setLogged(true);
      setMessage('Painel sincronizado com sucesso.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível autenticar ou carregar o painel.');
      setLogged(false);
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    if (!adminKey) return;
    await loadData(adminKey);
  };

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setLiveClock(currentClockTime());
    }, 60000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    setLiveClock(currentClockTime());
  }, [selectedDate]);

  useEffect(() => {
    selectedDateRef.current = selectedDate;
    selectedZoneRef.current = selectedZone;
  }, [selectedDate, selectedZone]);

  useEffect(() => {
    if (!logged || !adminKey) return;
    let active = true;

    const refreshDashboard = async () => {
      setError(null);

      try {
        const dashboardResponse = await fetchDashboardSummary(adminKey, selectedDateRef.current, selectedZoneRef.current, referenceTime);
        if (active) {
          setDashboard(dashboardResponse);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Não foi possível atualizar o estado operacional.');
        }
      }
    };

    void refreshDashboard();

    return () => {
      active = false;
    };
  }, [adminKey, logged, referenceTime]);

  const handleStatusUpdate = async (id: string, status: ReservationStatus) => {
    try {
      setError(null);
      setMessage(null);
      const response = await updateReservationStatus(id, status, adminKey);
      setMessage(response.message);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível atualizar a reserva.');
    }
  };

  const handleMoveReservation = async (reservation: ReservationRecord) => {
    try {
      setError(null);
      setMessage(null);
      const response = await updateReservation(
        reservation._id,
        {
          date: reservation.date.slice(0, 10),
          time: reservation.time,
          zone: reservation.zone
        },
        adminKey
      );
      setMessage(response.message);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível mover a reserva.');
    }
  };

  const handleDeleteReview = async (id: string) => {
    try {
      setError(null);
      setMessage(null);
      const response = await deleteReview(id, adminKey);
      setMessage(response.message);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível eliminar a review.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-borderSoft bg-white/[0.04] p-6 shadow-soft">
        <p className="text-sm uppercase tracking-[0.28em] text-champagne">Acesso Admin</p>
        <div className="mt-5 flex flex-col gap-3 md:flex-row">
          <input
            value={adminKey}
            onChange={(event) => setAdminKey(event.target.value)}
            placeholder="Introduz a ADMIN_ACCESS_KEY"
            className="w-full rounded-2xl border border-white/10 bg-[#151819] px-4 py-3 text-sm text-ink outline-none transition focus:border-champagne/60 focus:ring-2 focus:ring-champagne/15"
          />
          <button
            type="button"
            onClick={() => loadData(adminKey)}
            disabled={!adminKey || loading}
            className="rounded-full bg-champagne px-6 py-3 text-sm font-semibold text-canvas transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'A carregar...' : logged ? 'Atualizar painel' : 'Entrar'}
          </button>
        </div>
      </div>

      {message ? <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">{message}</div> : null}
      {error ? <div className="rounded-2xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</div> : null}

      {logged ? (
        <>
          <section className="rounded-[2rem] border border-borderSoft bg-white/[0.04] p-6 shadow-soft">
            <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-[1.1fr_1.2fr_1fr_auto]">
              <div>
                <label className="mb-2 block text-sm text-mist/70">Dia</label>
                <ReservationDatePicker value={selectedDate} onChange={setSelectedDate} />
              </div>
              <div>
                <label className="mb-2 block text-sm text-mist/70">Serviço</label>
                <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-[#151819] p-1">
                  {(['lunch', 'dinner'] as ServicePeriod[]).map((period) => (
                    <button
                      key={period}
                      type="button"
                      onClick={() => setSelectedPeriod(period)}
                      className={`rounded-[1rem] px-4 py-3 text-sm font-medium transition ${
                        selectedPeriod === period ? 'bg-champagne text-canvas' : 'text-mist/70 hover:text-ink'
                      }`}
                    >
                      {serviceLabels[period]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm text-mist/70">Zona</label>
                <div className="relative">
                  <select
                    value={selectedZone}
                    onChange={(event) => setSelectedZone(event.target.value as ReservationZone | 'all')}
                    className="w-full rounded-2xl border border-white/10 bg-[#151819] px-4 py-3 pr-12 text-sm text-ink outline-none"
                  >
                    <option value="all">Todas as zonas</option>
                    <option value="interior">Sala interior</option>
                    <option value="terrace">Esplanada</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-champagne" />
                </div>
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={refresh}
                  className="w-full rounded-full border border-white/10 px-6 py-3 text-sm font-semibold text-mist/80 transition hover:border-champagne/45 hover:text-champagne"
                >
                  Aplicar filtros
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-borderSoft bg-white/[0.04] p-6 shadow-soft">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="font-heading text-3xl text-ink">Reservas do dia</h2>
                <p className="mt-2 text-sm text-mist/65">
                  {serviceLabels[selectedPeriod]} • Interior: {reservationsByZone.interior.length} reservas • Esplanada: {reservationsByZone.terrace.length} reservas
                </p>
              </div>
                <div className="text-sm text-mist/65">
                Mapa às {dashboard?.referenceTime ? formatClock(dashboard.referenceTime) : formatClock(referenceTime)}
              </div>
            </div>
            <div className="mt-6 space-y-4">
              {filteredReservations.map((reservation) => (
                <article key={reservation._id} className="rounded-[1.5rem] border border-white/8 bg-[#151819] p-5">
                  <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="font-heading text-2xl text-ink">{reservation.fullName}</p>
                        <p className="mt-2 text-sm leading-7 text-mist/70">
                          {formatDate(reservation.date)} • {reservation.time} • {reservation.guests} pessoas • {zoneLabels[reservation.zone]}
                        </p>
                        <p className="text-sm text-mist/55">
                          {reservation.phone}
                          {reservation.email ? ` • ${reservation.email}` : ''}
                        </p>
                        <p className="mt-2 text-sm text-mist/65">
                          Origem: {reservation.source === 'phone' ? 'telefone' : 'website'}
                        </p>
                        {reservation.notes ? <p className="mt-2 text-sm text-mist/65">Notas: {reservation.notes}</p> : null}
                      </div>
                      <div className="flex flex-col items-start gap-3 lg:items-end">
                        <span className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs uppercase tracking-[0.22em] text-champagne">
                          {statusLabels[reservation.status]}
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {(Object.keys(statusLabels) as ReservationStatus[]).map((status) => (
                            <button
                              key={status}
                              type="button"
                              onClick={() => handleStatusUpdate(reservation._id, status)}
                              className="rounded-full border border-white/10 px-3 py-2 text-xs uppercase tracking-[0.18em] text-mist/75 transition hover:border-champagne/45 hover:text-champagne"
                            >
                              {statusLabels[status]}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
                      <ReservationDatePicker
                        value={reservation.date.slice(0, 10)}
                        onChange={(nextValue) =>
                          setReservations((current) =>
                            current.map((item) =>
                              item._id === reservation._id ? { ...item, date: nextValue } : item
                            )
                          )
                        }
                        className="bg-[#0f1212]"
                      />
                      <div className="relative">
                        <select
                          value={reservation.time}
                          onChange={(event) =>
                            setReservations((current) =>
                              current.map((item) =>
                                item._id === reservation._id ? { ...item, time: event.target.value } : item
                              )
                            )
                          }
                          className="w-full rounded-2xl border border-white/10 bg-[#0f1212] px-4 py-3 pr-12 text-sm text-ink outline-none"
                        >
                          {halfHourOptions.map((time) => (
                            <option key={time} value={time}>
                              {time}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-champagne" />
                      </div>
                      <div className="relative">
                        <select
                          value={reservation.zone}
                          onChange={(event) =>
                            setReservations((current) =>
                              current.map((item) =>
                                item._id === reservation._id ? { ...item, zone: event.target.value as ReservationZone } : item
                              )
                            )
                          }
                          className="w-full rounded-2xl border border-white/10 bg-[#0f1212] px-4 py-3 pr-12 text-sm text-ink outline-none"
                        >
                          <option value="interior">Sala interior</option>
                          <option value="terrace">Esplanada</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-champagne" />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleMoveReservation(reservation)}
                        className="rounded-full bg-champagne px-5 py-3 text-sm font-semibold text-canvas transition hover:-translate-y-0.5"
                      >
                        Mover
                      </button>
                    </div>
                  </div>
                </article>
              ))}

              {filteredReservations.length === 0 ? <p className="text-sm text-mist/65">Sem reservas para os filtros selecionados.</p> : null}
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.25fr_0.85fr]">
            <section className="rounded-[2rem] border border-borderSoft bg-white/[0.04] p-6 shadow-soft">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-champagne">Lotação operacional</p>
                  <h2 className="mt-2 font-heading text-3xl text-ink">Capacidade por zona</h2>
                </div>
                <div className="text-right text-sm text-mist/65">
                  <p>{dashboard?.report.day ?? 0} pessoas marcadas neste dia</p>
                  <p>Estado real no {serviceLabels[selectedPeriod].toLowerCase()} às {dashboard?.referenceTime ? formatClock(dashboard.referenceTime) : formatClock(referenceTime)}</p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {(['interior', 'terrace'] as ReservationZone[]).map((zone) => (
                  <article
                    key={zone}
                    className={`rounded-[1.5rem] border p-5 ${
                      dashboard?.blockedZones?.[zone]
                        ? 'border-rose-300/25 bg-rose-400/10'
                        : 'border-white/10 bg-[#151819]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="font-heading text-2xl text-ink">{zoneLabels[zone]}</h3>
                      <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs uppercase tracking-[0.18em] text-champagne">
                        {dashboard?.blockedZones?.[zone] ? 'Bloqueada' : 'Disponível'}
                      </span>
                    </div>
                    <p className="mt-4 text-sm text-mist/65">
                      {formatOccupancyLabel(
                        dashboard?.occupancyByZone?.[zone]?.guests ?? 0,
                        dashboard?.occupancyByZone?.[zone]?.capacity ?? 0
                      )}
                    </p>
                    <p className="mt-2 text-sm text-mist/65">
                      Capacidade online: {dashboard?.occupancyByZone?.[zone]?.onlineCapacity ?? 0} lugares
                    </p>
                    <p className="mt-2 text-sm text-mist/65">
                      Capacidade livre: {Math.max(
                        0,
                        (dashboard?.occupancyByZone?.[zone]?.capacity ?? 0) - (dashboard?.occupancyByZone?.[zone]?.guests ?? 0)
                      )}{' '}
                      lugares
                    </p>
                    <p className="mt-2 text-sm text-mist/65">
                      Ocupação: {dashboard?.occupancyByZone?.[zone]?.occupancyRate ?? 0}%
                    </p>
                  </article>
                ))}
              </div>
            </section>

            <ManualReservationForm
              adminKey={adminKey}
              onError={(nextError) => {
                setMessage(null);
                setError(nextError);
              }}
              onCreated={async (nextMessage) => {
                setError(null);
                setMessage(nextMessage);
                await refresh();
              }}
            />
          </section>

          <section className="rounded-[2rem] border border-borderSoft bg-white/[0.04] p-6 shadow-soft">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-champagne">Reviews</p>
                <h2 className="mt-2 font-heading text-3xl text-ink">Comentários publicados</h2>
              </div>
              <p className="text-sm text-mist/65">{reviews.length} reviews</p>
            </div>

            <div className="mt-6 space-y-4">
              {reviews.map((review) => (
                <article key={review._id} className="rounded-[1.5rem] border border-white/8 bg-[#151819] p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-heading text-2xl text-ink">{review.customerName}</p>
                      <p className="mt-2 text-sm text-mist/55">{formatDate(review.createdAt)}</p>
                      <div className="mt-3">
                        <StarRating rating={review.rating} />
                      </div>
                      <p className="mt-4 text-sm leading-7 text-mist/70">{review.comment}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteReview(review._id)}
                      className="rounded-full border border-rose-300/30 px-4 py-2 text-sm text-rose-200 transition hover:bg-rose-400/10"
                    >
                      Eliminar
                    </button>
                  </div>
                </article>
              ))}
              {reviews.length === 0 ? <p className="text-sm text-mist/65">Sem reviews.</p> : null}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
