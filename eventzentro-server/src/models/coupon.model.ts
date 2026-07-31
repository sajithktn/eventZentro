import mongoose, { Schema } from "mongoose";

import { IPromotion } from "../interfaces/coupon.interface";

const couponSchema = new Schema<IPromotion>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 800,
    },

    organizer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    event: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    code: {
      type: String,
      trim: true,
      uppercase: true,
      minlength: 3,
      maxlength: 30,
      match: /^[A-Z0-9_-]+$/,
      required(this: IPromotion) {
        return this.promotionMode === "coupon";
      },
    },

    promotionMode: {
      type: String,
      enum: ["coupon", "automatic"],
      default: "coupon",
      required: true,
    },

    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },

    discountValue: {
      type: Number,
      required: true,
      min: 0.01,
    },

    minimumBookingAmount: {
      type: Number,
      min: 0,
    },

    maximumDiscountAmount: {
      type: Number,
      min: 0.01,
    },

    totalUsageLimit: {
      type: Number,
      min: 1,
    },

    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    reservedUsageCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    perUserUsageLimit: {
      type: Number,
      min: 1,
    },

    firstNTickets: {
      type: Number,
      min: 1,
    },

    discountedTicketsReserved: {
      type: Number,
      default: 0,
      min: 0,
    },

    discountedTicketsUsed: {
      type: Number,
      default: 0,
      min: 0,
    },

    maxTicketsPerBooking: {
      type: Number,
      min: 1,
    },

    validFrom: {
      type: Date,
      required: true,
    },

    validUntil: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["active", "inactive", "expired"],
      default: "active",
    },

    visibility: {
      type: String,
      enum: ["public", "hidden"],
      default: "public",
    },

    displayText: {
      type: String,
      trim: true,
      maxlength: 160,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    minimumAmount: {
      type: Number,
      min: 0,
    },

    maximumDiscount: {
      type: Number,
      min: 0.01,
    },

    usageLimit: {
      type: Number,
      min: 1,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

couponSchema.index(
  {
    code: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      promotionMode: "coupon",
      isDeleted: false,
      code: {
        $type: "string",
      },
    },
  }
);

couponSchema.index({
  organizer: 1,
  createdAt: -1,
});

couponSchema.index({
  event: 1,
  promotionMode: 1,
  status: 1,
  visibility: 1,
  validFrom: 1,
  validUntil: 1,
});

couponSchema.index({
  event: 1,
  status: 1,
  validFrom: 1,
  validUntil: 1,
});

couponSchema.index({
  organizer: 1,
  status: 1,
  promotionMode: 1,
});

couponSchema.index({
  isDeleted: 1,
  status: 1,
});

export default mongoose.model<IPromotion>("Coupon", couponSchema);
