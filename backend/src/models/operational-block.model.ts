import { InferSchemaType, Schema, model } from 'mongoose';
import { BlockType, ReservationZone } from '../config/reservation-policy';

const operationalBlockSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    reason: { type: String, default: '' },
    date: { type: Date, required: true },
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    zone: {
      type: String,
      enum: ['interior', 'terrace'] satisfies ReservationZone[],
      required: true
    },
    blockType: {
      type: String,
      enum: ['table', 'zone'] satisfies BlockType[],
      required: true
    },
    tableIds: {
      type: [String],
      default: []
    },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

operationalBlockSchema.index({ date: 1, startAt: 1, endAt: 1, zone: 1, active: 1 });

export type OperationalBlockDocument = InferSchemaType<typeof operationalBlockSchema>;
export const OperationalBlockModel = model('OperationalBlock', operationalBlockSchema);
