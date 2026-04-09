'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { CheckCircle2, LoaderCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { createReservation, fetchReservationAvailability } from '@/lib/api';
import { ReservationDatePicker } from '@/components/reservation-date-picker';
import { ReservationTimePicker } from '@/components/reservation-time-picker';
import { ReservationPayload, reservationSchema } from '@/lib/schemas';
import { isMondayDate } from '@/lib/utils';

const inputStyles =
  'w-full rounded-2xl border border-borderSoft bg-[rgba(17,26,13,0.72)] px-4 py-3 text-sm text-ink outline-none transition duration-300 placeholder:text-mist/35 focus:border-champagne/60 focus:ring-2 focus:ring-champagne/15';

export function ReservationForm() {
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [slots, setSlots] = useState<Array<{ time: string }>>([]);
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
      consent: false,
      notes: '',
      tablePreference: ''
    }
  });

  const date = watch('date');
  const guests = watch('guests');
  const selectedTime = watch('time');

  useEffect(() => {
    let active = true;

    async function loadAvailability() {
      if (!date || !guests) {
        if (active) {
          setSlots([]);
          setValue('time', '');
        }
        return;
      }

      if (isMondayDate(date)) {
        if (active) {
          setSlots([]);
          setValue('time', '');
          setServerError('À segunda-feira o restaurante está fechado. Escolhe outro dia.');
        }
        return;
      }

      try {
        setServerError(null);
        setLoadingSlots(true);
        const response = await fetchReservationAvailability(date, Number(guests));

        if (!active) return;

        setSlots(response.slots);

        if (!response.slots.some((slot) => slot.time === selectedTime)) {
          setValue('time', '');
        }
      } catch (error) {
        if (!active) return;

        setSlots([]);
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
  }, [date, guests, selectedTime, setValue]);

  const onSubmit = async (values: ReservationPayload) => {
    try {
      setServerMessage(null);
      setServerError(null);
      const response = await createReservation(values);
      setServerMessage(response.message);
      reset({
        fullName: '',
        phone: '',
        email: '',
        date: '',
        time: '',
        guests: 2,
        notes: '',
        tablePreference: '',
        consent: false
      });
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Não foi possível enviar a reserva.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 border-t border-borderSoft pt-6 sm:pt-8">
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
          <label className="mb-2 block text-sm text-mist/70">Email</label>
          <input className={inputStyles} {...register('email')} placeholder="nome@email.com" type="email" />
          {errors.email ? <p className="mt-2 text-xs text-rose-300">{errors.email.message}</p> : null}
        </div>
        <div>
          <label className="mb-2 block text-sm text-mist/70">Número de pessoas</label>
          <input className={inputStyles} {...register('guests')} type="number" min={1} max={8} placeholder="2" />
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
                  setServerError(null);
                }}
              />
            )}
          />
          {errors.date ? <p className="mt-2 text-xs text-rose-300">{errors.date.message}</p> : null}
        </div>
        <div>
          <label className="mb-2 block text-sm text-mist/70">Hora disponível</label>
          <Controller
            control={control}
            name="time"
            render={({ field }) => (
              <ReservationTimePicker
                value={field.value}
                options={slots}
                loading={loadingSlots}
                disabled={!date || !guests || loadingSlots || slots.length === 0}
                onBlur={field.onBlur}
                onChange={field.onChange}
              />
            )}
          />
          {errors.time ? <p className="mt-2 text-xs text-rose-300">{errors.time.message}</p> : null}
        </div>
      </div>

      {!loadingSlots && date && guests && slots.length === 0 ? (
        <p className="text-sm text-rose-200">Não há mesas disponíveis para essa data e número de pessoas.</p>
      ) : null}

      <div>
        <label className="mb-2 block text-sm text-mist/70">Preferência de sala/mesa (opcional)</label>
        <input className={inputStyles} {...register('tablePreference')} placeholder="Ex.: junto à janela, sala principal" />
        {errors.tablePreference ? <p className="mt-2 text-xs text-rose-300">{errors.tablePreference.message}</p> : null}
      </div>

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
        {isSubmitting ? 'A enviar...' : 'Confirmar pedido de reserva'}
      </button>
    </form>
  );
}
