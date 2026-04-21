import { z } from 'zod';

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida.');
const timeSchema = z.string().regex(/^([01]\d|2[0-3]):(00|30)$/, 'Escolhe um horário de 30 em 30 minutos.');
const zoneSchema = z.enum(['interior', 'terrace'], {
  errorMap: () => ({ message: 'Seleciona a zona pretendida.' })
});
const publicZoneSchema = z.enum(['interior', 'terrace', 'either'], {
  errorMap: () => ({ message: 'Seleciona a zona pretendida.' })
});
const optionalEmailSchema = z.string().email('Email inválido.').optional().or(z.literal(''));
const requiredEmailSchema = z.string().min(1, 'Indica um email.').email('Email inválido.');

export const reservationSchema = z.object({
  fullName: z.string().min(2, 'Nome demasiado curto.'),
  phone: z.string().min(6, 'Telefone inválido.'),
  email: requiredEmailSchema,
  date: dateSchema,
  time: timeSchema,
  guests: z.coerce.number().min(1, 'Mínimo 1 pessoa.').max(30, 'Máximo 30 pessoas por reserva.'),
  zone: publicZoneSchema,
  notes: z.string().max(500, 'Máximo 500 caracteres.').optional().or(z.literal('')),
  consent: z.boolean().refine((value) => value, 'É necessário consentimento.')
});

export const manualReservationSchema = z.object({
  fullName: z.string().min(2, 'Nome demasiado curto.'),
  phone: z.string().min(6, 'Telefone inválido.'),
  email: optionalEmailSchema,
  date: dateSchema,
  time: timeSchema,
  guests: z.coerce.number().min(1, 'Mínimo 1 pessoa.').max(30, 'Máximo 30 pessoas por reserva.'),
  zone: zoneSchema,
  notes: z.string().max(500, 'Máximo 500 caracteres.').optional().or(z.literal(''))
});

export const reservationStatusSchema = z.object({
  status: z.enum(['confirmed_auto', 'cancelled_by_customer', 'cancelled_by_restaurant', 'completed', 'no_show'])
});

export const reservationAvailabilitySchema = z.object({
  date: dateSchema,
  guests: z.coerce.number().min(1, 'Mínimo 1 pessoa.').max(30, 'Máximo 30 pessoas.'),
  zone: publicZoneSchema
});

export const reservationUpdateSchema = z.object({
  fullName: z.string().min(2, 'Nome demasiado curto.').optional(),
  phone: z.string().min(6, 'Telefone inválido.').optional(),
  email: optionalEmailSchema.optional(),
  date: dateSchema.optional(),
  time: timeSchema.optional(),
  guests: z.coerce.number().min(1, 'Mínimo 1 pessoa.').max(30, 'Máximo 30 pessoas por reserva.').optional(),
  zone: zoneSchema.optional(),
  notes: z.string().max(500, 'Máximo 500 caracteres.').optional(),
  status: z.enum(['confirmed_auto', 'cancelled_by_customer', 'cancelled_by_restaurant', 'completed', 'no_show']).optional()
});

export const reservationSettingsSchema = z
  .object({
    slotIntervalMinutes: z.coerce.number().min(5).max(60).optional(),
    reservationDurationMinutes: z.coerce.number().min(60).max(240).optional(),
    bufferMinutes: z.coerce.number().min(0).max(60).optional(),
    maxGuestsPerReservation: z.coerce.number().min(1).max(60).optional(),
    zoneCapacities: z
      .object({
        interior: z.object({
          total: z.coerce.number().min(0).max(200),
          online: z.coerce.number().min(0).max(200)
        }),
        terrace: z.object({
          total: z.coerce.number().min(0).max(200),
          online: z.coerce.number().min(0).max(200)
        })
      })
      .optional(),
    openingHours: z.record(
      z.array(
        z.object({
          start: timeSchema,
          end: timeSchema
        })
      )
    ).optional()
  })
  .superRefine((value, ctx) => {
    if (value.zoneCapacities?.interior && value.zoneCapacities.interior.online > value.zoneCapacities.interior.total) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A capacidade online do interior não pode exceder a capacidade total.',
        path: ['zoneCapacities', 'interior', 'online']
      });
    }

    if (value.zoneCapacities?.terrace && value.zoneCapacities.terrace.online > value.zoneCapacities.terrace.total) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A capacidade online da esplanada não pode exceder a capacidade total.',
        path: ['zoneCapacities', 'terrace', 'online']
      });
    }
  });

export const operationalBlockSchema = z
  .object({
    label: z.string().min(2, 'Identifica o bloqueio.'),
    reason: z.string().max(300, 'Máximo 300 caracteres.').optional().or(z.literal('')),
    date: dateSchema,
    startTime: timeSchema,
    endTime: timeSchema,
    zone: zoneSchema,
    blockType: z.literal('zone')
  });

export const operationalBlockToggleSchema = z.object({
  active: z.boolean()
});
