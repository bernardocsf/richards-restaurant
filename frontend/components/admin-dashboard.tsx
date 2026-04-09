'use client';

import { useMemo, useState } from 'react';
import {
  fetchReviews,
  fetchAdminReservations,
  updateReservationStatus
} from '@/lib/api';
import { ManualReservationForm } from '@/components/manual-reservation-form';
import { formatDate } from '@/lib/utils';
import { StarRating } from '@/components/star-rating';

type Reservation = {
  _id: string;
  fullName: string;
  phone: string;
  email?: string;
  date: string;
  time: string;
  guests: number;
  notes?: string;
  tablePreference?: string;
  source: 'website' | 'phone';
  assignedTableId?: string;
  assignedTableType?: 'two_top' | 'four_top' | 'round_eight';
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
};

type Review = {
  _id: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export function AdminDashboard() {
  const [adminKey, setAdminKey] = useState('');
  const [logged, setLogged] = useState(false);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const metrics = useMemo(
    () => ({
      reservations: reservations.length,
      pendingReservations: reservations.filter((item) => item.status === 'pending').length,
      reviews: reviews.length
    }),
    [reservations, reviews]
  );

  const loadData = async (key: string) => {
    setLoading(true);
    setError(null);
    try {
      const [reservationResponse, reviewResponse] = await Promise.all([
        fetchAdminReservations(key),
        fetchReviews()
      ]);
      setReservations(reservationResponse.reservations as Reservation[]);
      setReviews(reviewResponse.reviews as Review[]);
      setLogged(true);
      setMessage('Painel sincronizado com sucesso.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível autenticar ou carregar o painel.');
      setLogged(false);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: Reservation['status']) => {
    try {
      setError(null);
      setMessage(null);
      const response = await updateReservationStatus(id, status, adminKey);
      setMessage(response.message);
      await loadData(adminKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível atualizar a reserva.');
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
        <p className="mt-3 text-sm leading-7 text-mist/65">
          Esta implementação usa uma chave de administração via header para acelerar o setup. Em produção, recomenda-se autenticação dedicada com sessão segura.
        </p>
      </div>

      {message ? <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">{message}</div> : null}
      {error ? <div className="rounded-2xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</div> : null}

      {logged ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[
              { label: 'Reservas', value: metrics.reservations },
              { label: 'Reservas pendentes', value: metrics.pendingReservations },
              { label: 'Reviews', value: metrics.reviews }
            ].map((stat) => (
              <div key={stat.label} className="rounded-[1.75rem] border border-borderSoft bg-white/[0.04] p-5 shadow-soft">
                <p className="text-sm uppercase tracking-[0.2em] text-champagne">{stat.label}</p>
                <p className="mt-4 font-heading text-4xl text-ink">{stat.value}</p>
              </div>
            ))}
          </div>

          <ManualReservationForm
            adminKey={adminKey}
            onError={(nextError) => {
              setMessage(null);
              setError(nextError);
            }}
            onCreated={async (nextMessage) => {
              setError(null);
              setMessage(nextMessage);
              await loadData(adminKey);
            }}
          />

          <section className="rounded-[2rem] border border-borderSoft bg-white/[0.04] p-6 shadow-soft">
            <h2 className="font-heading text-3xl text-ink">Reservas</h2>
            <div className="mt-6 space-y-4">
              {reservations.map((reservation) => (
                <article key={reservation._id} className="rounded-[1.5rem] border border-white/8 bg-[#151819] p-5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="font-heading text-2xl text-ink">{reservation.fullName}</p>
                      <p className="mt-2 text-sm leading-7 text-mist/70">
                        {formatDate(reservation.date)} • {reservation.time} • {reservation.guests} pessoas
                      </p>
                      <p className="text-sm text-mist/55">
                        {reservation.phone}
                        {reservation.email ? ` • ${reservation.email}` : ' • sem email'}
                      </p>
                      <p className="mt-2 text-sm text-mist/65">
                        Origem: {reservation.source === 'phone' ? 'telefone' : 'website'}
                        {reservation.assignedTableId ? ` • Mesa: ${reservation.assignedTableId}` : ''}
                      </p>
                      {reservation.tablePreference ? (
                        <p className="mt-2 text-sm text-mist/65">Preferência: {reservation.tablePreference}</p>
                      ) : null}
                      {reservation.notes ? <p className="mt-2 text-sm text-mist/65">Notas: {reservation.notes}</p> : null}
                    </div>
                    <div className="flex flex-col items-start gap-3 lg:items-end">
                      <span className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs uppercase tracking-[0.22em] text-champagne">
                        {reservation.status}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {(['pending', 'confirmed', 'completed', 'cancelled'] as const).map((status) => (
                          <button
                            key={status}
                            type="button"
                            onClick={() => handleStatusUpdate(reservation._id, status)}
                            className="rounded-full border border-white/10 px-3 py-2 text-xs uppercase tracking-[0.18em] text-mist/75 transition hover:border-champagne/45 hover:text-champagne"
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-borderSoft bg-white/[0.04] p-6 shadow-soft">
            <h2 className="font-heading text-3xl text-ink">Reviews</h2>
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
                  </div>
                </article>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
