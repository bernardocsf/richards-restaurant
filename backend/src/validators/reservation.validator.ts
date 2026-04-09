import { z } from 'zod';

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida.');
const timeSchema = z.string().regex(/^([01]\d|2[0-3]):(00|15|30|45)$/, 'Escolhe um horário de 15 em 15 minutos.');
const optionalEmailSchema = z.string().email('Email inválido.').optional().or(z.literal(''));

export const reservationSchema = z.object({
  fullName: z.string().min(2, 'Nome demasiado curto.'),
  phone: z.string().min(6, 'Telefone inválido.'),
  email: z.string().email('Email inválido.'),
  date: dateSchema,
  time: timeSchema,
  guests: z.coerce.number().min(1, 'Mínimo 1 pessoa.').max(8, 'Máximo 8 pessoas por reserva online.'),
  notes: z.string().max(500, 'Máximo 500 caracteres.').optional().or(z.literal('')),
  tablePreference: z.string().max(120, 'Máximo 120 caracteres.').optional().or(z.literal('')),
  consent: z.boolean().refine((value) => value, 'É necessário consentimento.')
});

export const manualReservationSchema = z.object({
  fullName: z.string().min(2, 'Nome demasiado curto.'),
  phone: z.string().min(6, 'Telefone inválido.'),
  email: optionalEmailSchema,
  date: dateSchema,
  time: timeSchema,
  guests: z.coerce.number().min(1, 'Mínimo 1 pessoa.').max(8, 'Máximo 8 pessoas por reserva.'),
  notes: z.string().max(500, 'Máximo 500 caracteres.').optional().or(z.literal('')),
  tablePreference: z.string().max(120, 'Máximo 120 caracteres.').optional().or(z.literal(''))
});

export const reservationStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed'])
});

export const reservationAvailabilitySchema = z.object({
  date: dateSchema,
  guests: z.coerce.number().min(1, 'Mínimo 1 pessoa.').max(8, 'Máximo 8 pessoas.')
});
