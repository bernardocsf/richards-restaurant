import mongoose from 'mongoose';
import { Db, Document, MongoClient, ObjectId } from 'mongodb';

export async function connectDatabase(mongoUri: string) {
  mongoose.set('strictQuery', true);
  await mongoose.connect(mongoUri);
  console.log('✅ MongoDB Atlas connected');
}

export async function withMongoDb<T>(mongoUri: string, handler: (db: Db) => Promise<T>) {
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    return await handler(client.db());
  } finally {
    await client.close();
  }
}

export function toObjectId(id: string) {
  return ObjectId.isValid(id) ? new ObjectId(id) : null;
}

export function serializeForJson<T>(value: T): T {
  if (value instanceof Date) {
    return value.toISOString() as T;
  }

  if (value instanceof ObjectId) {
    return value.toHexString() as T;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => serializeForJson(entry)) as T;
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, serializeForJson(entry)])
    ) as T;
  }

  return value;
}

export async function getWorkerReviews(mongoUri: string) {
  return withMongoDb(mongoUri, async (db) => {
    const reviews = await db.collection('reviews').find({}).sort({ createdAt: -1 }).toArray();
    return serializeForJson(reviews);
  });
}

export function collection<TSchema extends Document = Document>(db: Db, name: string) {
  return db.collection<TSchema>(name);
}
