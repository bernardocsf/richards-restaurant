import { InferSchemaType, Schema, model } from 'mongoose';
import { TableType } from '../config/reservation-policy';

const reservationSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, default: '', trim: true, lowercase: true },
    date: { type: Date, required: true },
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    time: { type: String, required: true, trim: true },
    guests: { type: Number, required: true, min: 1, max: 8 },
    notes: { type: String, default: '' },
    tablePreference: { type: String, default: '' },
    source: {
      type: String,
      enum: ['website', 'phone'],
      default: 'website'
    },
    assignedTableId: { type: String, required: true, trim: true },
    assignedTableType: {
      type: String,
      enum: ['two_top', 'four_top', 'round_eight'] satisfies TableType[],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'confirmed'
    }
  },
  { timestamps: true }
);

export type ReservationDocument = InferSchemaType<typeof reservationSchema>;
export const ReservationModel = model('Reservation', reservationSchema);
