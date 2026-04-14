import { InferSchemaType, Schema, model } from 'mongoose';
import { ReservationSource, ReservationStatus, ReservationZone } from '../config/reservation-policy';

const reservationSchema = new Schema(
  {
    referenceCode: { type: String, required: true, unique: true, trim: true },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, default: '', trim: true, lowercase: true },
    date: { type: Date, required: true },
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    time: { type: String, required: true, trim: true },
    guests: { type: Number, required: true, min: 1, max: 15 },
    zone: {
      type: String,
      enum: ['interior', 'terrace'] satisfies ReservationZone[],
      required: true
    },
    notes: { type: String, default: '' },
    consentAccepted: { type: Boolean, default: false },
    source: {
      type: String,
      enum: ['website', 'phone', 'walk_in'] satisfies ReservationSource[],
      default: 'website'
    },
    tableIds: {
      type: [String],
      default: []
    },
    tableCombinationLabel: { type: String, default: '' },
    status: {
      type: String,
      enum: [
        'confirmed_auto',
        'cancelled_by_customer',
        'cancelled_by_restaurant',
        'completed',
        'no_show'
      ] satisfies ReservationStatus[],
      default: 'confirmed_auto'
    },
    emailNotificationStatus: {
      type: String,
      enum: ['pending', 'sent', 'skipped', 'failed'],
      default: 'pending'
    },
    whatsappNotificationStatus: {
      type: String,
      enum: ['pending', 'sent', 'skipped', 'failed'],
      default: 'pending'
    }
  },
  { timestamps: true }
);

reservationSchema.index({ date: 1, startAt: 1, endAt: 1, zone: 1 });
reservationSchema.index({ referenceCode: 1 }, { unique: true });
reservationSchema.index({ fullName: 1, phone: 1, email: 1 });

export type ReservationDocument = InferSchemaType<typeof reservationSchema>;
export const ReservationModel = model('Reservation', reservationSchema);
