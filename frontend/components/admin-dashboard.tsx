'use client';

import { useMemo, useState } from 'react';
import {
  createOperationalBlock,
  fetchAdminReservations,
  fetchBlocks,
  fetchDashboardSummary,
  fetchReservationSettings,
  fetchReviews,
  updateOperationalBlock,
  updateReservation,
  updateReservationSettings,
  updateReservationStatus,
  type DashboardSummary,
  type OperationalBlockRecord,
  type ReservationRecord,
  type ReservationSettings,
  type ReservationStatus,
  type ReservationZone
} from '@/lib/api';
import { ManualReservationForm } from '@/components/manual-reservation-form';
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
  no_show: 'No-show',
  pending_review: 'Pendente de revisão'
};

function todayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function AdminDashboard() {
  const [adminKey, setAdminKey] = useState('');
  const [logged, setLogged] = useState(false);
  const [reservations, setReservations] = useState<ReservationRecord[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [blocks, setBlocks] = useState<OperationalBlockRecord[]>([]);
  const [settings, setSettings] = useState<ReservationSettings | null>(null);
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [selectedZone, setSelectedZone] = useState<ReservationZone | 'all'>('all');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | 'all'>('all');
  const [openingHoursDraft, setOpeningHoursDraft] = useState('');
  const [blockForm, setBlockForm] = useState({
    label: '',
    reason: '',
    date: todayKey(),
    startTime: '19:00',
    endTime: '21:00',
    zone: 'interior' as ReservationZone,
    blockType: 'table' as 'table' | 'zone',
    tableIds: [] as string[]
  });

  const metrics = useMemo(
    () => ({
      reservations: reservations.length,
      pendingReview: reservations.filter((item) => item.status === 'pending_review').length,
      reviews: reviews.length,
      blocked: blocks.filter((item) => item.active).length
    }),
    [reservations, reviews, blocks]
  );

  const availableTablesForBlock = useMemo(() => {
    return dashboard?.tables.filter((table) => table.zone === blockForm.zone) ?? [];
  }, [dashboard, blockForm.zone]);

  const loadData = async (key: string) => {
    setLoading(true);
    setError(null);

    try {
      const [reservationResponse, reviewResponse, blockResponse, settingsResponse, dashboardResponse] = await Promise.all([
        fetchAdminReservations(key, {
          date: selectedDate,
          zone: selectedZone,
          search,
          status: statusFilter
        }),
        fetchReviews(),
        fetchBlocks(key, { date: selectedDate, zone: selectedZone }),
        fetchReservationSettings(key),
        fetchDashboardSummary(key, selectedDate, selectedZone)
      ]);

      setReservations(reservationResponse.reservations);
      setReviews(reviewResponse.reviews as Review[]);
      setBlocks(blockResponse.blocks);
      setSettings(settingsResponse.settings);
      setOpeningHoursDraft(JSON.stringify(settingsResponse.settings.openingHours, null, 2));
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

  const handleSettingsSave = async () => {
    if (!settings) return;

    try {
      setError(null);
      setMessage(null);
      let openingHours: ReservationSettings['openingHours'] | undefined;

      if (openingHoursDraft.trim()) {
        const parsed = JSON.parse(openingHoursDraft) as ReservationSettings['openingHours'];
        openingHours = parsed;
      }

      const response = await updateReservationSettings(
        {
          reservationDurationMinutes: settings.reservationDurationMinutes,
          bufferMinutes: settings.bufferMinutes,
          slotIntervalMinutes: settings.slotIntervalMinutes,
          maxGuestsPerReservation: settings.maxGuestsPerReservation,
          openingHours
        },
        adminKey
      );
      setSettings(response.settings);
      setOpeningHoursDraft(JSON.stringify(response.settings.openingHours, null, 2));
      setMessage(response.message);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível atualizar as configurações.');
    }
  };

  const handleCreateBlock = async () => {
    try {
      setError(null);
      setMessage(null);
      const response = await createOperationalBlock(blockForm, adminKey);
      setMessage(response.message);
      setBlockForm((current) => ({
        ...current,
        label: '',
        reason: '',
        tableIds: []
      }));
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar o bloqueio.');
    }
  };

  const toggleBlock = async (block: OperationalBlockRecord) => {
    try {
      setError(null);
      setMessage(null);
      const response = await updateOperationalBlock(block._id, !block.active, adminKey);
      setMessage(response.message);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível atualizar o bloqueio.');
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
          O painel agora mostra reservas automáticas, ocupação por zona, mapa de mesas, bloqueios operacionais e controlo da configuração do motor.
        </p>
      </div>

      {message ? <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">{message}</div> : null}
      {error ? <div className="rounded-2xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</div> : null}

      {logged ? (
        <>
          <section className="rounded-[2rem] border border-borderSoft bg-white/[0.04] p-6 shadow-soft">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <div>
                <label className="mb-2 block text-sm text-mist/70">Dia</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-[#151819] px-4 py-3 text-sm text-ink outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-mist/70">Zona</label>
                <select
                  value={selectedZone}
                  onChange={(event) => setSelectedZone(event.target.value as ReservationZone | 'all')}
                  className="w-full rounded-2xl border border-white/10 bg-[#151819] px-4 py-3 text-sm text-ink outline-none"
                >
                  <option value="all">Todas as zonas</option>
                  <option value="interior">Sala interior</option>
                  <option value="terrace">Esplanada</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm text-mist/70">Estado</label>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as ReservationStatus | 'all')}
                  className="w-full rounded-2xl border border-white/10 bg-[#151819] px-4 py-3 text-sm text-ink outline-none"
                >
                  <option value="all">Todos</option>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm text-mist/70">Pesquisa</label>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Nome, telefone ou referência"
                  className="w-full rounded-2xl border border-white/10 bg-[#151819] px-4 py-3 text-sm text-ink outline-none"
                />
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

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Reservas do dia', value: metrics.reservations },
              { label: 'Pendentes de revisão', value: metrics.pendingReview },
              { label: 'Bloqueios ativos', value: metrics.blocked },
              { label: 'Reviews', value: metrics.reviews }
            ].map((stat) => (
              <div key={stat.label} className="rounded-[1.75rem] border border-borderSoft bg-white/[0.04] p-5 shadow-soft">
                <p className="text-sm uppercase tracking-[0.2em] text-champagne">{stat.label}</p>
                <p className="mt-4 font-heading text-4xl text-ink">{stat.value}</p>
              </div>
            ))}
          </div>

          <section className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
            <div className="rounded-[2rem] border border-borderSoft bg-white/[0.04] p-6 shadow-soft">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-champagne">Mapa operacional</p>
                  <h2 className="mt-2 font-heading text-3xl text-ink">Mesas por zona</h2>
                </div>
                <div className="text-right text-sm text-mist/65">
                  <p>{dashboard?.report.day ?? 0} pessoas marcadas neste dia</p>
                  <p>Visualização imediata das mesas livres, ocupadas e bloqueadas</p>
                </div>
              </div>

              <div className="mt-6 space-y-6">
                {(['interior', 'terrace'] as ReservationZone[]).map((zone) => (
                  <div key={zone}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-heading text-2xl text-ink">{zoneLabels[zone]}</h3>
                      <p className="text-sm text-mist/65">
                        {dashboard?.occupancyByZone?.[zone]?.guests ?? 0} / {dashboard?.occupancyByZone?.[zone]?.capacity ?? 0} lugares
                      </p>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {dashboard?.tables
                        .filter((table) => table.zone === zone)
                        .map((table) => (
                          <div
                            key={table.id}
                            className={`rounded-[1.25rem] border px-4 py-4 ${
                              table.state === 'occupied'
                                ? 'border-amber-300/30 bg-amber-400/10'
                                : table.state === 'blocked'
                                  ? 'border-rose-300/30 bg-rose-400/10'
                                  : 'border-emerald-300/30 bg-emerald-400/10'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <p className="font-semibold text-ink">{table.id}</p>
                              <span className="text-xs uppercase tracking-[0.18em] text-mist/70">{table.seats} lugares</span>
                            </div>
                            <p className="mt-2 text-sm text-mist/70">
                              {table.state === 'free' ? 'Livre' : table.state === 'occupied' ? 'Ocupada' : 'Bloqueada'}
                            </p>
                            {table.reservationReference ? (
                              <p className="mt-2 text-xs text-mist/65">
                                {table.reservationReference}
                                {table.reservationName ? ` · ${table.reservationName}` : ''}
                              </p>
                            ) : null}
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <section className="rounded-[2rem] border border-borderSoft bg-white/[0.04] p-6 shadow-soft">
                <p className="text-sm uppercase tracking-[0.2em] text-champagne">Regras do motor</p>
                <h2 className="mt-2 font-heading text-3xl text-ink">Configuração</h2>

                {settings ? (
                  <div className="mt-6 space-y-4">
                    <div>
                      <label className="mb-2 block text-sm text-mist/70">Duração média da reserva</label>
                      <input
                        type="number"
                        min={60}
                        max={240}
                        value={settings.reservationDurationMinutes}
                        onChange={(event) =>
                          setSettings((current) =>
                            current
                              ? { ...current, reservationDurationMinutes: Number(event.target.value) }
                              : current
                          )
                        }
                        className="w-full rounded-2xl border border-white/10 bg-[#151819] px-4 py-3 text-sm text-ink outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm text-mist/70">Buffer entre reservas</label>
                      <input
                        type="number"
                        min={0}
                        max={60}
                        value={settings.bufferMinutes}
                        onChange={(event) =>
                          setSettings((current) => (current ? { ...current, bufferMinutes: Number(event.target.value) } : current))
                        }
                        className="w-full rounded-2xl border border-white/10 bg-[#151819] px-4 py-3 text-sm text-ink outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm text-mist/70">Intervalo das reservas</label>
                      <input
                        type="number"
                        min={5}
                        max={60}
                        value={settings.slotIntervalMinutes}
                        onChange={(event) =>
                          setSettings((current) =>
                            current ? { ...current, slotIntervalMinutes: Number(event.target.value) } : current
                          )
                        }
                        className="w-full rounded-2xl border border-white/10 bg-[#151819] px-4 py-3 text-sm text-ink outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm text-mist/70">Máximo por reserva</label>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={settings.maxGuestsPerReservation}
                        onChange={(event) =>
                          setSettings((current) =>
                            current ? { ...current, maxGuestsPerReservation: Number(event.target.value) } : current
                          )
                        }
                        className="w-full rounded-2xl border border-white/10 bg-[#151819] px-4 py-3 text-sm text-ink outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm text-mist/70">Horários de funcionamento por dia</label>
                      <textarea
                        value={openingHoursDraft}
                        onChange={(event) => setOpeningHoursDraft(event.target.value)}
                        className="min-h-40 w-full rounded-2xl border border-white/10 bg-[#151819] px-4 py-3 font-mono text-xs text-ink outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSettingsSave}
                      className="w-full rounded-full bg-champagne px-6 py-3 text-sm font-semibold text-canvas transition hover:-translate-y-0.5"
                    >
                      Guardar regras
                    </button>
                  </div>
                ) : null}
              </section>

              <section className="rounded-[2rem] border border-borderSoft bg-white/[0.04] p-6 shadow-soft">
                <p className="text-sm uppercase tracking-[0.2em] text-champagne">Bloqueios</p>
                <h2 className="mt-2 font-heading text-3xl text-ink">Operação da sala</h2>
                <div className="mt-6 space-y-4">
                  <input
                    value={blockForm.label}
                    onChange={(event) => setBlockForm((current) => ({ ...current, label: event.target.value }))}
                    placeholder="Ex.: Mesa avariada"
                    className="w-full rounded-2xl border border-white/10 bg-[#151819] px-4 py-3 text-sm text-ink outline-none"
                  />
                  <input
                    type="date"
                    value={blockForm.date}
                    onChange={(event) => setBlockForm((current) => ({ ...current, date: event.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-[#151819] px-4 py-3 text-sm text-ink outline-none"
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input
                      type="time"
                      step={900}
                      value={blockForm.startTime}
                      onChange={(event) => setBlockForm((current) => ({ ...current, startTime: event.target.value }))}
                      className="w-full rounded-2xl border border-white/10 bg-[#151819] px-4 py-3 text-sm text-ink outline-none"
                    />
                    <input
                      type="time"
                      step={900}
                      value={blockForm.endTime}
                      onChange={(event) => setBlockForm((current) => ({ ...current, endTime: event.target.value }))}
                      className="w-full rounded-2xl border border-white/10 bg-[#151819] px-4 py-3 text-sm text-ink outline-none"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <select
                      value={blockForm.zone}
                      onChange={(event) =>
                        setBlockForm((current) => ({
                          ...current,
                          zone: event.target.value as ReservationZone,
                          tableIds: []
                        }))
                      }
                      className="w-full rounded-2xl border border-white/10 bg-[#151819] px-4 py-3 text-sm text-ink outline-none"
                    >
                      <option value="interior">Sala interior</option>
                      <option value="terrace">Esplanada</option>
                    </select>
                    <select
                      value={blockForm.blockType}
                      onChange={(event) =>
                        setBlockForm((current) => ({
                          ...current,
                          blockType: event.target.value as 'table' | 'zone',
                          tableIds: []
                        }))
                      }
                      className="w-full rounded-2xl border border-white/10 bg-[#151819] px-4 py-3 text-sm text-ink outline-none"
                    >
                      <option value="table">Bloquear mesas</option>
                      <option value="zone">Bloquear zona inteira</option>
                    </select>
                  </div>
                  {blockForm.blockType === 'table' ? (
                    <div className="flex flex-wrap gap-2">
                      {availableTablesForBlock.map((table) => {
                        const selected = blockForm.tableIds.includes(table.id);
                        return (
                          <button
                            key={table.id}
                            type="button"
                            onClick={() =>
                              setBlockForm((current) => ({
                                ...current,
                                tableIds: selected
                                  ? current.tableIds.filter((tableId) => tableId !== table.id)
                                  : [...current.tableIds, table.id]
                              }))
                            }
                            className={`rounded-full border px-3 py-2 text-sm transition ${
                              selected ? 'border-champagne/60 text-champagne' : 'border-white/10 text-mist/75'
                            }`}
                          >
                            {table.id}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                  <textarea
                    value={blockForm.reason}
                    onChange={(event) => setBlockForm((current) => ({ ...current, reason: event.target.value }))}
                    placeholder="Motivo do bloqueio"
                    className="min-h-24 w-full rounded-2xl border border-white/10 bg-[#151819] px-4 py-3 text-sm text-ink outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCreateBlock}
                    className="w-full rounded-full border border-white/10 px-6 py-3 text-sm font-semibold text-mist/80 transition hover:border-champagne/45 hover:text-champagne"
                  >
                    Criar bloqueio
                  </button>
                </div>
              </section>
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

          <section className="rounded-[2rem] border border-borderSoft bg-white/[0.04] p-6 shadow-soft">
            <h2 className="font-heading text-3xl text-ink">Reservas do dia</h2>
            <div className="mt-6 space-y-4">
              {reservations.map((reservation) => (
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
                          {reservation.email ? ` • ${reservation.email}` : ' • sem email'}
                        </p>
                        <p className="mt-2 text-sm text-mist/65">
                          Ref.: {reservation.referenceCode} • Origem: {reservation.source === 'phone' ? 'telefone' : 'website'}
                        </p>
                        <p className="mt-2 text-sm text-mist/65">Mesas: {reservation.tableIds.join(', ') || 'por atribuir'}</p>
                        {reservation.notes ? <p className="mt-2 text-sm text-mist/65">Notas: {reservation.notes}</p> : null}
                      </div>
                      <div className="flex flex-col items-start gap-3 lg:items-end">
                        <span className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs uppercase tracking-[0.22em] text-champagne">
                          {statusLabels[reservation.status]}
                        </span>
                        <p className="text-xs text-mist/55">
                          Email: {reservation.emailNotificationStatus ?? 'n/d'} • WhatsApp: {reservation.whatsappNotificationStatus ?? 'n/d'}
                        </p>
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
                      <input
                        type="date"
                        value={reservation.date.slice(0, 10)}
                        onChange={(event) =>
                          setReservations((current) =>
                            current.map((item) =>
                              item._id === reservation._id ? { ...item, date: event.target.value } : item
                            )
                          )
                        }
                        className="rounded-2xl border border-white/10 bg-[#0f1212] px-4 py-3 text-sm text-ink outline-none"
                      />
                      <input
                        type="time"
                        step={900}
                        value={reservation.time}
                        onChange={(event) =>
                          setReservations((current) =>
                            current.map((item) =>
                              item._id === reservation._id ? { ...item, time: event.target.value } : item
                            )
                          )
                        }
                        className="rounded-2xl border border-white/10 bg-[#0f1212] px-4 py-3 text-sm text-ink outline-none"
                      />
                      <select
                        value={reservation.zone}
                        onChange={(event) =>
                          setReservations((current) =>
                            current.map((item) =>
                              item._id === reservation._id ? { ...item, zone: event.target.value as ReservationZone } : item
                            )
                          )
                        }
                        className="rounded-2xl border border-white/10 bg-[#0f1212] px-4 py-3 text-sm text-ink outline-none"
                      >
                        <option value="interior">Sala interior</option>
                        <option value="terrace">Esplanada</option>
                      </select>
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

              {reservations.length === 0 ? <p className="text-sm text-mist/65">Sem reservas para os filtros selecionados.</p> : null}
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
            <section className="rounded-[2rem] border border-borderSoft bg-white/[0.04] p-6 shadow-soft">
              <h2 className="font-heading text-3xl text-ink">Bloqueios ativos e históricos</h2>
              <div className="mt-6 space-y-4">
                {blocks.map((block) => (
                  <article key={block._id} className="rounded-[1.5rem] border border-white/8 bg-[#151819] p-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-heading text-2xl text-ink">{block.label}</p>
                        <p className="mt-2 text-sm text-mist/70">
                          {formatDate(block.date)} • {block.blockType === 'zone' ? 'Zona inteira' : (block.tableIds ?? []).join(', ')} • {zoneLabels[block.zone]}
                        </p>
                        <p className="mt-1 text-sm text-mist/55">
                          {block.startAt.slice(11, 16)} - {block.endAt.slice(11, 16)}
                        </p>
                        {block.reason ? <p className="mt-2 text-sm text-mist/65">{block.reason}</p> : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleBlock(block)}
                        className="rounded-full border border-white/10 px-4 py-2 text-sm text-mist/80 transition hover:border-champagne/45 hover:text-champagne"
                      >
                        {block.active ? 'Desativar' : 'Reativar'}
                      </button>
                    </div>
                  </article>
                ))}
                {blocks.length === 0 ? <p className="text-sm text-mist/65">Sem bloqueios para o período selecionado.</p> : null}
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
          </section>
        </>
      ) : null}
    </div>
  );
}
