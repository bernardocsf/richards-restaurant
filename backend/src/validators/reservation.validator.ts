import { z } from 'zod';

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida.');
const timeSchema = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Escolhe um horário válido.');
const zoneSchema = z.enum(['interior', 'terrace'], {
  errorMap: () => ({ message: 'Seleciona a zona pretendida.' })
});
const optionalEmailSchema = z.string().email('Email inválido.').optional().or(z.literal(''));

export const reservationSchema = z.object({
  fullName: z.string().min(2, 'Nome demasiado curto.'),
  phone: z.string().min(6, 'Telefone inválido.'),
  email: z.string().email('Email inválido.'),
  date: dateSchema,
  time: timeSchema,
  guests: z.coerce.number().min(1, 'Mínimo 1 pessoa.').max(15, 'Máximo 15 pessoas por reserva.'),
  zone: zoneSchema,
  notes: z.string().max(500, 'Máximo 500 caracteres.').optional().or(z.literal('')),
  consent: z.boolean().refine((value) => value, 'É necessário consentimento.')
});

export const manualReservationSchema = z.object({
  fullName: z.string().min(2, 'Nome demasiado curto.'),
  phone: z.string().min(6, 'Telefone inválido.'),
  email: optionalEmailSchema,
  date: dateSchema,
  time: timeSchema,
  guests: z.coerce.number().min(1, 'Mínimo 1 pessoa.').max(15, 'Máximo 15 pessoas por reserva.'),
  zone: zoneSchema,
  notes: z.string().max(500, 'Máximo 500 caracteres.').optional().or(z.literal(''))
});

export const reservationStatusSchema = z.object({
  status: z.enum(['confirmed_auto', 'cancelled_by_customer', 'cancelled_by_restaurant', 'completed', 'no_show', 'pending_review'])
});

export const reservationAvailabilitySchema = z.object({
  date: dateSchema,
  guests: z.coerce.number().min(1, 'Mínimo 1 pessoa.').max(15, 'Máximo 15 pessoas.'),
  zone: zoneSchema
});

export const reservationUpdateSchema = z.object({
  fullName: z.string().min(2, 'Nome demasiado curto.').optional(),
  phone: z.string().min(6, 'Telefone inválido.').optional(),
  email: optionalEmailSchema.optional(),
  date: dateSchema.optional(),
  time: timeSchema.optional(),
  guests: z.coerce.number().min(1, 'Mínimo 1 pessoa.').max(15, 'Máximo 15 pessoas por reserva.').optional(),
  zone: zoneSchema.optional(),
  notes: z.string().max(500, 'Máximo 500 caracteres.').optional(),
  status: z.enum(['confirmed_auto', 'cancelled_by_customer', 'cancelled_by_restaurant', 'completed', 'no_show', 'pending_review']).optional()
});

export const reservationSettingsSchema = z.object({
  slotIntervalMinutes: z.coerce.number().min(5).max(60).optional(),
  reservationDurationMinutes: z.coerce.number().min(60).max(240).optional(),
  bufferMinutes: z.coerce.number().min(0).max(60).optional(),
  maxGuestsPerReservation: z.coerce.number().min(1).max(20).optional(),
  openingHours: z.record(
    z.array(
      z.object({
        start: timeSchema,
        end: timeSchema
      })
    )
  ).optional()
});

export const operationalBlockSchema = z
  .object({
    label: z.string().min(2, 'Identifica o bloqueio.'),
    reason: z.string().max(300, 'Máximo 300 caracteres.').optional().or(z.literal('')),
    date: dateSchema,
    startTime: timeSchema,
    endTime: timeSchema,
    zone: zoneSchema,
    blockType: z.enum(['table', 'zone']),
    tableIds: z.array(z.string().min(1)).optional()
  })
  .superRefine((value, ctx) => {
    if (value.blockType === 'table' && (!value.tableIds || value.tableIds.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Seleciona pelo menos uma mesa.',
        path: ['tableIds']
      });
    }
  });

export const operationalBlockToggleSchema = z.object({
  active: z.boolean()
});
