'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { CheckCircle2, ChevronDown, LoaderCircle, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { createReservation, fetchReservationAvailability, type AvailabilitySuggestion } from '@/lib/api';
import { ReservationDatePicker } from '@/components/reservation-date-picker';
import { ReservationTimePicker } from '@/components/reservation-time-picker';
import { ReservationPayload, reservationSchema } from '@/lib/schemas';
import { isMondayDate } from '@/lib/utils';

const inputStyles =
  'w-full rounded-2xl border border-borderSoft bg-[rgba(17,26,13,0.72)] px-4 py-3 text-sm text-ink outline-none transition duration-300 placeholder:text-mist/35 focus:border-champagne/60 focus:ring-2 focus:ring-champagne/15';

const zoneOptions = [
  { value: 'interior', label: 'Sala interior' },
  { value: 'terrace', label: 'Esplanada' }
] as const;

export function ReservationForm() {
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<AvailabilitySuggestion[]>([]);
  const [slots, setSlots] = useState<Array<{ time: string; tableIds: string[]; seats: number }>>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    reset
  } = useForm<ReservationPayload>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      guests: 2,
      zone: 'interior',
      consent: false,
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
          setServerError('À segunda-feira o restaurante está fechado. Escolhe outro dia.');
        }
        return;
      }

      try {
        setServerError(null);
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
        setServerError(error instanceof Error ? error.message : 'Não foi possível carregar horários disponíveis.');
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
  }, [date, guests, zone, selectedTime, setValue]);

  const onSubmit = async (values: ReservationPayload) => {
    try {
      setServerMessage(null);
      setServerError(null);
      setSuggestions([]);
      const response = await createReservation(values);
      setServerMessage(response.message);
      setSuggestions(response.suggestions ?? []);
      reset({
        fullName: '',
        phone: '',
        email: '',
        date: '',
        time: '',
        guests: 2,
        zone: 'interior',
        notes: '',
        consent: false
      });
      setSlots([]);
    } catch (error) {
      const nextError = error instanceof Error ? error : new Error('Não foi possível enviar a reserva.');
      setServerError(nextError.message);
      const details = (nextError as Error & { details?: { suggestions?: AvailabilitySuggestion[] } }).details;
      setSuggestions(details?.suggestions ?? []);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 border-t border-borderSoft pt-6 sm:pt-8">
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm text-mist/70">Nome completo</label>
          <input className={inputStyles} {...register('fullName')} />
          {errors.fullName ? <p className="mt-2 text-xs text-rose-300">{errors.fullName.message}</p> : null}
        </div>
        <div>
          <label className="mb-2 block text-sm text-mist/70">Telefone</label>
          <input className={inputStyles} {...register('phone')} />
          {errors.phone ? <p className="mt-2 text-xs text-rose-300">{errors.phone.message}</p> : null}
        </div>
        <div>
          <label className="mb-2 block text-sm text-mist/70">Email</label>
          <input className={inputStyles} {...register('email')} type="email" />
          {errors.email ? <p className="mt-2 text-xs text-rose-300">{errors.email.message}</p> : null}
        </div>
        <div>
          <label className="mb-2 block text-sm text-mist/70">Número de pessoas</label>
          <input
            className={inputStyles}
            {...register('guests', { valueAsNumber: true })}
            type="number"
            min={1}
            max={15}
            placeholder="2"
          />
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
                  setServerError(null);
                }}
              />
            )}
          />
          {errors.date ? <p className="mt-2 text-xs text-rose-300">{errors.date.message}</p> : null}
        </div>
        <div>
          <label className="mb-2 block text-sm text-mist/70">Zona pretendida</label>
          <div className="relative">
            <select
              className={`${inputStyles} pr-12`}
              {...register('zone')}
              onChange={(event) => {
                setValue('zone', event.target.value as ReservationPayload['zone'], { shouldValidate: true });
                setValue('time', '', { shouldValidate: true });
                setSuggestions([]);
                setServerError(null);
              }}
            >
              {zoneOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-champagne" />
          </div>
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
                options={slots.map((slot) => ({ time: slot.time }))}
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

      {!loadingSlots && hasAvailabilityRequest && slots.length === 0 && !serverError ? (
        <p className="text-sm text-rose-200">Não há disponibilidade exata nesta zona para esta data e número de pessoas.</p>
      ) : null}

      {suggestions.length > 0 ? (
        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center gap-2 text-sm text-champagne">
            <Sparkles className="h-4 w-4" />
            Alternativas automáticas próximas
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

      <div>
        <label className="mb-2 block text-sm text-mist/70">Observações</label>
        <textarea
          className={`${inputStyles} min-h-32 resize-none`}
          {...register('notes')}
          placeholder="Indica alergias, celebrações ou pedidos especiais."
        />
        {errors.notes ? <p className="mt-2 text-xs text-rose-300">{errors.notes.message}</p> : null}
      </div>

      <label className="flex items-start gap-3 border-t border-borderSoft pt-4 text-sm text-mist/72">
        <input type="checkbox" className="mt-1 h-4 w-4 rounded border-white/10 bg-transparent" {...register('consent')} />
        <span>Autorizo o tratamento dos meus dados para gestão da reserva e eventual contacto associado.</span>
      </label>
      {errors.consent ? <p className="text-xs text-rose-300">{errors.consent.message}</p> : null}

      {serverMessage ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 border border-[rgba(170,255,80,0.24)] bg-[rgba(126,196,34,0.14)] px-4 py-3 text-sm text-[#edf8d3]"
        >
          <CheckCircle2 className="h-5 w-5" />
          {serverMessage}
        </motion.div>
      ) : null}

      {serverError ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {serverError}
        </motion.div>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-champagne px-6 py-3 text-sm font-semibold text-canvas shadow-[0_12px_36px_rgba(161,220,39,0.22)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#e4f85b] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
        {isSubmitting ? 'A confirmar...' : 'Confirmar reserva imediata'}
      </button>
    </form>
  );
}
