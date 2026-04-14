import { z } from 'zod';

const zoneSchema = z.enum(['interior', 'terrace'], {
  errorMap: () => ({ message: 'Seleciona a zona pretendida.' })
});

export const reservationSchema = z.object({
  fullName: z.string().min(2, 'Indica o teu nome.'),
  phone: z.string().min(6, 'Indica um telefone válido.'),
  email: z.string().email('Indica um email válido.'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Seleciona uma data válida.'),
  time: z.string().min(1, 'Seleciona uma hora disponível.'),
  guests: z.coerce.number().min(1, 'Mínimo 1 pessoa.').max(15, 'Máximo 15 pessoas por pedido.'),
  zone: zoneSchema,
  notes: z.string().max(500, 'Máximo 500 caracteres.').optional().or(z.literal('')),
  consent: z.boolean().refine((value) => value, 'É necessário aceitar o tratamento de dados.')
});

export type ReservationPayload = z.infer<typeof reservationSchema>;

export const adminReservationSchema = z.object({
  fullName: z.string().min(2, 'Indica o nome do cliente.'),
  phone: z.string().min(6, 'Indica um telefone válido.'),
  email: z.string().email('Indica um email válido.').optional().or(z.literal('')),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Seleciona uma data válida.'),
  time: z.string().min(1, 'Seleciona uma hora disponível.'),
  guests: z.coerce.number().min(1, 'Mínimo 1 pessoa.').max(15, 'Máximo 15 pessoas por reserva.'),
  zone: zoneSchema,
  notes: z.string().max(500, 'Máximo 500 caracteres.').optional().or(z.literal(''))
});

export type AdminReservationPayload = z.infer<typeof adminReservationSchema>;

export const adminReservationUpdateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Seleciona uma data válida.'),
  time: z.string().min(1, 'Seleciona uma hora disponível.'),
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
  blockType: z.enum(['table', 'zone']),
  tableIds: z.array(z.string()).optional()
});

export type OperationalBlockPayload = z.infer<typeof operationalBlockSchema>;

export const reviewSchema = z.object({
  customerName: z.string().min(2, 'Indica o teu nome.'),
  rating: z.coerce.number().min(1, 'Seleciona uma classificação.').max(5, 'Máximo 5 estrelas.'),
  comment: z.string().min(10, 'Escreve um comentário com pelo menos 10 caracteres.').max(800, 'Máximo 800 caracteres.')
});

export type ReviewPayload = z.infer<typeof reviewSchema>;
