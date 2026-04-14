import { InferSchemaType, Schema, model } from 'mongoose';

const serviceWindowSchema = new Schema(
  {
    start: { type: String, required: true, trim: true },
    end: { type: String, required: true, trim: true }
  },
  { _id: false }
);

const restaurantSettingsSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: 'default' },
    slotIntervalMinutes: { type: Number, required: true, default: 15 },
    reservationDurationMinutes: { type: Number, required: true, default: 120 },
    bufferMinutes: { type: Number, required: true, default: 15 },
    maxGuestsPerReservation: { type: Number, required: true, default: 15 },
    openingHours: {
      type: Map,
      of: [serviceWindowSchema],
      default: {}
    }
  },
  { timestamps: true }
);

export type RestaurantSettingsDocument = InferSchemaType<typeof restaurantSettingsSchema>;
export const RestaurantSettingsModel = model('RestaurantSettings', restaurantSettingsSchema);
