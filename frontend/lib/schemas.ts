import { z } from 'zod';

const zoneSchema = z.enum(['interior', 'terrace'], {
  errorMap: () => ({ message: 'Seleciona a zona pretendida.' })
});
const publicZoneSchema = z.enum(['interior', 'terrace', 'either'], {
  errorMap: () => ({ message: 'Seleciona a zona pretendida.' })
});
const halfHourTimeSchema = z.string().regex(/^([01]\d|2[0-3]):(00|30)$/, 'Seleciona uma hora de 30 em 30 minutos.');

export const reservationSchema = z.object({
  fullName: z.string().min(2, 'Indica o teu nome.'),
  phone: z.string().min(6, 'Indica um telefone válido.'),
  email: z.string().min(1, 'Indica o teu email.').email('Indica um email válido.'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Seleciona uma data válida.'),
  time: halfHourTimeSchema,
  guests: z.coerce.number().min(1, 'Mínimo 1 pessoa.').max(30, 'Máximo 30 pessoas por pedido.'),
  zone: publicZoneSchema,
  notes: z.string().max(500, 'Máximo 500 caracteres.').optional().or(z.literal('')),
  consent: z.boolean().refine((value) => value, 'É necessário aceitar o tratamento de dados.')
});

export type ReservationPayload = z.infer<typeof reservationSchema>;

export const adminReservationSchema = z.object({
  fullName: z.string().min(2, 'Indica o nome do cliente.'),
  phone: z.string().min(6, 'Indica um telefone válido.'),
  email: z.string().email('Indica um email válido.').optional().or(z.literal('')),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Seleciona uma data válida.'),
  time: halfHourTimeSchema,
  guests: z.coerce.number().min(1, 'Mínimo 1 pessoa.').max(30, 'Máximo 30 pessoas por reserva.'),
  zone: zoneSchema,
  notes: z.string().max(500, 'Máximo 500 caracteres.').optional().or(z.literal(''))
});

export type AdminReservationPayload = z.infer<typeof adminReservationSchema>;

export const adminReservationUpdateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Seleciona uma data válida.'),
  time: halfHourTimeSchema,
  zone: zoneSchema
});

export type AdminReservationUpdatePayload = z.infer<typeof adminReservationUpdateSchema>;

export const operationalBlockSchema = z.object({
  label: z.string().min(2, 'Indica um nome para o bloqueio.'),
  reason: z.string().max(300, 'Máximo 300 caracteres.').optional().or(z.literal('')),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Seleciona uma data válida.'),
  startTime: z.string().min(1, 'Seleciona a hora de início.'),
  endTime: z.string().min(1, 'Seleciona a hora de fim.'),
  zone: zoneSchema,
  blockType: z.literal('zone')
});

export type OperationalBlockPayload = z.infer<typeof operationalBlockSchema>;

export const zoneCapacitySchema = z.object({
  total: z.coerce.number().min(0, 'Indica uma capacidade válida.').max(200, 'Capacidade demasiado alta.'),
  online: z.coerce.number().min(0, 'Indica uma capacidade online válida.').max(200, 'Capacidade demasiado alta.')
});

export const reviewSchema = z.object({
  customerName: z.string().min(2, 'Indica o teu nome.'),
  rating: z.coerce.number().min(1, 'Seleciona uma classificação.').max(5, 'Máximo 5 estrelas.'),
  comment: z.string().min(10, 'Escreve um comentário com pelo menos 10 caracteres.').max(800, 'Máximo 800 caracteres.')
});

export type ReviewPayload = z.infer<typeof reviewSchema>;
