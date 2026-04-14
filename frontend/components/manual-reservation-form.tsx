'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { LoaderCircle, PhoneCall, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { createManualReservation, fetchReservationAvailability, type AvailabilitySuggestion } from '@/lib/api';
import { ReservationDatePicker } from '@/components/reservation-date-picker';
import { ReservationTimePicker } from '@/components/reservation-time-picker';
import { AdminReservationPayload, adminReservationSchema } from '@/lib/schemas';
import { isMondayDate } from '@/lib/utils';

const inputStyles =
  'w-full rounded-2xl border border-white/10 bg-[#151819] px-4 py-3 text-sm text-ink outline-none transition duration-300 placeholder:text-mist/35 focus:border-champagne/60 focus:ring-2 focus:ring-champagne/15';

const zoneOptions = [
  { value: 'interior', label: 'Sala interior' },
  { value: 'terrace', label: 'Esplanada' }
] as const;

type Props = {
  adminKey: string;
  onCreated: (message: string) => Promise<void> | void;
  onError: (message: string) => void;
};

export function ManualReservationForm({ adminKey, onCreated, onError }: Props) {
  const [slots, setSlots] = useState<Array<{ time: string }>>([]);
  const [suggestions, setSuggestions] = useState<AvailabilitySuggestion[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    reset
  } = useForm<AdminReservationPayload>({
    resolver: zodResolver(adminReservationSchema),
    defaultValues: {
      email: '',
      guests: 2,
      zone: 'interior',
      notes: ''
    }
  });

  const date = watch('date');
  const guests = watch('guests');
  const zone = watch('zone');
  const selectedTime = watch('time');
  const hasAvailabilityRequest = Boolean(date && typeof guests === 'number' && Number.isFinite(guests) && zone);

  useEffect(() => {
    let active = true;

    async function loadAvailability() {
      if (!date || !guests || !zone) {
        if (active) {
          setSlots([]);
          setSuggestions([]);
          setValue('time', '');
        }
        return;
      }

      if (isMondayDate(date)) {
        if (active) {
          setSlots([]);
          setSuggestions([]);
          setValue('time', '');
          setAvailabilityError('À segunda-feira o restaurante está fechado. Escolhe outro dia.');
        }
        return;
      }

      try {
        setAvailabilityError(null);
        setLoadingSlots(true);
        const response = await fetchReservationAvailability(date, Number(guests), zone);

        if (!active) return;

        setSlots(response.slots);
        setSuggestions(response.suggestions);

        if (!response.slots.some((slot) => slot.time === selectedTime)) {
          setValue('time', '');
        }
      } catch (error) {
        if (!active) return;

        setSlots([]);
        setSuggestions([]);
        setValue('time', '');
        setAvailabilityError(error instanceof Error ? error.message : 'Não foi possível carregar horários disponíveis.');
      } finally {
        if (active) {
          setLoadingSlots(false);
        }
      }
    }

    loadAvailability();

    return () => {
      active = false;
    };
  }, [date, guests, zone, selectedTime, setValue, onError]);

  const onSubmit = async (values: AdminReservationPayload) => {
    try {
      const response = await createManualReservation(values, adminKey);
      reset({
        fullName: '',
        phone: '',
        email: '',
        date: '',
        time: '',
        guests: 2,
        zone: 'interior',
        notes: ''
      });
      setSlots([]);
      setSuggestions([]);
      await onCreated(response.message);
    } catch (error) {
      const nextError = error instanceof Error ? error : new Error('Não foi possível registar a reserva.');
      onError(nextError.message);
      const details = (nextError as Error & { details?: { suggestions?: AvailabilitySuggestion[] } }).details;
      setSuggestions(details?.suggestions ?? []);
    }
  };

  return (
    <section className="rounded-[2rem] border border-borderSoft bg-white/[0.04] p-6 shadow-soft">
      <div className="flex items-center gap-3">
        <PhoneCall className="h-5 w-5 text-champagne" />
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-champagne">Reservas por telefone</p>
          <h2 className="mt-2 font-heading text-3xl text-ink">Registar marcação manual</h2>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm text-mist/70">Nome completo</label>
            <input className={inputStyles} {...register('fullName')} placeholder="Ex.: Joana Silva" />
            {errors.fullName ? <p className="mt-2 text-xs text-rose-300">{errors.fullName.message}</p> : null}
          </div>
          <div>
            <label className="mb-2 block text-sm text-mist/70">Telefone</label>
            <input className={inputStyles} {...register('phone')} placeholder="910 000 000" />
            {errors.phone ? <p className="mt-2 text-xs text-rose-300">{errors.phone.message}</p> : null}
          </div>
          <div>
            <label className="mb-2 block text-sm text-mist/70">Email (opcional)</label>
            <input className={inputStyles} {...register('email')} placeholder="nome@email.com" type="email" />
            {errors.email ? <p className="mt-2 text-xs text-rose-300">{errors.email.message}</p> : null}
          </div>
          <div>
            <label className="mb-2 block text-sm text-mist/70">Número de pessoas</label>
            <input className={inputStyles} {...register('guests', { valueAsNumber: true })} type="number" min={1} max={15} />
            {errors.guests ? <p className="mt-2 text-xs text-rose-300">{errors.guests.message}</p> : null}
          </div>
          <div>
            <label className="mb-2 block text-sm text-mist/70">Data</label>
            <Controller
              control={control}
              name="date"
              render={({ field }) => (
                <ReservationDatePicker
                  value={field.value}
                  onBlur={field.onBlur}
                  onChange={(nextValue) => {
                    field.onChange(nextValue);
                    setValue('time', '', { shouldValidate: true });
                    setSlots([]);
                    setSuggestions([]);
                    setAvailabilityError(null);
                  }}
                />
              )}
            />
            {errors.date ? <p className="mt-2 text-xs text-rose-300">{errors.date.message}</p> : null}
          </div>
          <div>
            <label className="mb-2 block text-sm text-mist/70">Zona pretendida</label>
            <select
              className={inputStyles}
              {...register('zone')}
              onChange={(event) => {
                setValue('zone', event.target.value as AdminReservationPayload['zone'], { shouldValidate: true });
                setValue('time', '', { shouldValidate: true });
                setSuggestions([]);
                setAvailabilityError(null);
              }}
            >
              {zoneOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.zone ? <p className="mt-2 text-xs text-rose-300">{errors.zone.message}</p> : null}
          </div>
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm text-mist/70">Hora disponível</label>
            <Controller
              control={control}
              name="time"
              render={({ field }) => (
                <ReservationTimePicker
                  value={field.value}
                  options={slots}
                  loading={loadingSlots}
                  disabled={!date || !guests || !zone || loadingSlots || slots.length === 0}
                  onBlur={field.onBlur}
                  onChange={field.onChange}
                />
              )}
            />
            {errors.time ? <p className="mt-2 text-xs text-rose-300">{errors.time.message}</p> : null}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm text-mist/70">Observações</label>
          <textarea className={`${inputStyles} min-h-28 resize-none`} {...register('notes')} placeholder="Pedidos especiais ou notas da chamada." />
          {errors.notes ? <p className="mt-2 text-xs text-rose-300">{errors.notes.message}</p> : null}
        </div>

        <p className="text-sm leading-7 text-mist/65">
          O sistema confirma imediatamente quando encontra lotação disponível, combinação válida de mesas adjacentes e serviço aberto nesse período.
        </p>

        {suggestions.length > 0 ? (
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center gap-2 text-sm text-champagne">
              <Sparkles className="h-4 w-4" />
              Alternativas automáticas
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={`${suggestion.date}-${suggestion.time}-${suggestion.zone}`}
                  type="button"
                  onClick={() => {
                    setValue('zone', suggestion.zone, { shouldValidate: true });
                    setValue('time', suggestion.time, { shouldValidate: true });
                  }}
                  className="rounded-full border border-white/10 px-4 py-2 text-sm text-mist/80 transition hover:border-champagne/45 hover:text-champagne"
                >
                  {suggestion.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {availabilityError ? <p className="text-sm text-rose-200">{availabilityError}</p> : null}
        {!loadingSlots && hasAvailabilityRequest && slots.length === 0 && !availabilityError ? (
          <p className="text-sm text-rose-200">Não há disponibilidade exata para esta combinação de data, zona e pessoas.</p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-champagne px-6 py-3 text-sm font-semibold text-canvas transition duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
          {isSubmitting ? 'A guardar...' : 'Guardar reserva telefónica'}
        </button>
      </form>
    </section>
  );
}
