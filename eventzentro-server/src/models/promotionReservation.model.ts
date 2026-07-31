import mongoose, { Schema } from "mongoose";

import {
  IPromotionReservation,
} from "../interfaces/promotionReservation.interface";

const promotionReservationSchema =
  new Schema<IPromotionReservation>(
    {
      promotion: {
        type: Schema.Types.ObjectId,
        ref: "Coupon",
        required: true,
      },

      booking: {
        type: Schema.Types.ObjectId,
        ref: "Booking",
        required: true,
      },

      user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      event: {
        type: Schema.Types.ObjectId,
        ref: "Event",
        required: true,
      },

      ticketCount: {
        type: Number,
        required: true,
        min: 1,
      },

      discountAmount: {
        type: Number,
        required: true,
        min: 0,
      },

      status: {
        type: String,
        enum: ["reserved", "redeemed", "released", "expired"],
        default: "reserved",
        required: true,
      },

      expiresAt: {
        type: Date,
        required: true,
      },
    },
    {
      timestamps: true,
    }
  );

promotionReservationSchema.index(
  {
    booking: 1,
  },
  {
    unique: true,
  }
);

promotionReservationSchema.index({
  promotion: 1,
  status: 1,
});

promotionReservationSchema.index({
  user: 1,
  promotion: 1,
  status: 1,
});

promotionReservationSchema.index({
  status: 1,
  expiresAt: 1,
});

export default mongoose.model<IPromotionReservation>(
  "PromotionReservation",
  promotionReservationSchema
);
