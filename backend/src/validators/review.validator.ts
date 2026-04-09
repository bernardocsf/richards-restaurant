import { z } from 'zod';

export const reviewSchema = z.object({
  customerName: z.string().min(2, 'Nome demasiado curto.'),
  rating: z.coerce.number().min(1, 'A classificação mínima é 1.').max(5, 'A classificação máxima é 5.'),
  comment: z.string().min(10, 'Comentário demasiado curto.').max(800, 'Comentário demasiado longo.')
});
