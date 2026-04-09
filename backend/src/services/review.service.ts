import { Types } from 'mongoose';
import { ReviewModel } from '../models/review.model';

export async function createReview(data: { customerName: string; rating: number; comment: string }) {
  return ReviewModel.create(data);
}

export async function getReviews() {
  return ReviewModel.find().sort({ createdAt: -1 });
}

export async function getPublicReviews() {
  return ReviewModel.find().sort({ createdAt: -1 });
}

export async function deleteReview(id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  return ReviewModel.findByIdAndDelete(id);
}
