import { z } from 'zod';

export const reservationSchema = z.object({
  fullName: z.string().min(2, 'Indica o teu nome.'),
  phone: z.string().min(6, 'Indica um telefone válido.'),
  email: z.string().email('Indica um email válido.'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Seleciona uma data válida.'),
  time: z.string().min(1, 'Seleciona uma hora disponível.'),
  guests: z.coerce.number().min(1, 'Mínimo 1 pessoa.').max(8, 'Máximo 8 pessoas por pedido.'),
  notes: z.string().max(500, 'Máximo 500 caracteres.').optional().or(z.literal('')),
  tablePreference: z.string().max(120, 'Máximo 120 caracteres.').optional().or(z.literal('')),
  consent: z.boolean().refine((value) => value, 'É necessário aceitar o tratamento de dados.')
});

export type ReservationPayload = z.infer<typeof reservationSchema>;

export const adminReservationSchema = z.object({
  fullName: z.string().min(2, 'Indica o nome do cliente.'),
  phone: z.string().min(6, 'Indica um telefone válido.'),
  email: z.string().email('Indica um email válido.').optional().or(z.literal('')),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Seleciona uma data válida.'),
  time: z.string().min(1, 'Seleciona uma hora disponível.'),
  guests: z.coerce.number().min(1, 'Mínimo 1 pessoa.').max(8, 'Máximo 8 pessoas por reserva.'),
  notes: z.string().max(500, 'Máximo 500 caracteres.').optional().or(z.literal('')),
  tablePreference: z.string().max(120, 'Máximo 120 caracteres.').optional().or(z.literal(''))
});

export type AdminReservationPayload = z.infer<typeof adminReservationSchema>;

export const reviewSchema = z.object({
  customerName: z.string().min(2, 'Indica o teu nome.'),
  rating: z.coerce.number().min(1, 'Seleciona uma classificação.').max(5, 'Máximo 5 estrelas.'),
  comment: z.string().min(10, 'Escreve um comentário com pelo menos 10 caracteres.').max(800, 'Máximo 800 caracteres.')
});

export type ReviewPayload = z.infer<typeof reviewSchema>;
