import { Request, Response } from 'express';
import {
  createReview as createReviewService,
  deleteReview as deleteReviewService,
  getReviews
} from '../services/review.service';
import { reviewSchema } from '../validators/review.validator';

function getParamId(value: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export async function createReview(req: Request, res: Response) {
  const parsed = reviewSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: parsed.error.issues[0]?.message ?? 'Dados de review inválidos.'
    });
  }

  await createReviewService(parsed.data);

  return res.status(201).json({
    message: 'Review publicada com sucesso no website.'
  });
}

export async function listReviews(_req: Request, res: Response) {
  const reviews = await getReviews();
  return res.json({ reviews });
}

export async function removeReview(req: Request, res: Response) {
  const review = await deleteReviewService(getParamId(req.params.id));

  if (!review) {
    return res.status(404).json({ message: 'Review não encontrada.' });
  }

  return res.json({ message: 'Review removida com sucesso.' });
}
