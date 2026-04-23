import { getWorkerReviews, serializeForJson, toObjectId, withMongoDb } from '../config/database';

type ReviewInput = {
  customerName: string;
  rating: number;
  comment: string;
};

function normalizeReview(input: ReviewInput) {
  return {
    customerName: input.customerName.trim(),
    rating: input.rating,
    comment: input.comment.trim()
  };
}

export async function listWorkerReviews(mongoUri: string) {
  return getWorkerReviews(mongoUri);
}

export async function createWorkerReview(mongoUri: string, input: ReviewInput) {
  return withMongoDb(mongoUri, async (db) => {
    const now = new Date();
    const review = {
      ...normalizeReview(input),
      createdAt: now,
      updatedAt: now
    };

    const result = await db.collection('reviews').insertOne(review);
    return serializeForJson({
      _id: result.insertedId,
      ...review
    });
  });
}

export async function deleteWorkerReview(mongoUri: string, id: string) {
  const objectId = toObjectId(id);
  if (!objectId) return null;

  return withMongoDb(mongoUri, async (db) => {
    const review = await db.collection('reviews').findOneAndDelete({ _id: objectId });
    return review ? serializeForJson(review) : null;
  });
}
