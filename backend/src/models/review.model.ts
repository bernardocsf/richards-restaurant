import { InferSchemaType, Schema, model } from 'mongoose';

const reviewSchema = new Schema(
  {
    customerName: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

export type ReviewDocument = InferSchemaType<typeof reviewSchema>;
export const ReviewModel = model('Review', reviewSchema);
