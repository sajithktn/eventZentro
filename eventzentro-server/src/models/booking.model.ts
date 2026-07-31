import mongoose, { Schema } from "mongoose";
import { IBooking } from "../interfaces/booking.interface";

const bookingSchema = new Schema<IBooking>(
  {
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

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    ticketCount: {
      type: Number,
      min: 1,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    coupon: {
      type: Schema.Types.ObjectId,
      ref: "Coupon",
    },

    couponCode: {
      type: String,
      trim: true,
      uppercase: true,
    },

    originalAmount: {
      type: Number,
      min: 0,
    },

    subtotalAmount: {
      type: Number,
      min: 0,
    },

    discountAmount: {
      type: Number,
      min: 0,
    },

    finalAmount: {
      type: Number,
      min: 0,
    },

    appliedPromotion: {
      promotionId: {
        type: Schema.Types.ObjectId,
        ref: "Coupon",
      },

      name: {
        type: String,
        trim: true,
      },

      code: {
        type: String,
        trim: true,
        uppercase: true,
      },

      promotionMode: {
        type: String,
        enum: ["coupon", "automatic"],
      },

      discountType: {
        type: String,
        enum: ["percentage", "fixed"],
      },

      discountValue: {
        type: Number,
        min: 0,
      },

      displayText: {
        type: String,
        trim: true,
      },
    },

    promotionReservation: {
      type: Schema.Types.ObjectId,
      ref: "PromotionReservation",
    },

    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending",
    },

    paymentStatus: {
      type: String,
      enum: [
        "unpaid",
        "pending",
        "verifying",
        "paid",
        "failed",
        "refunded",
      ],
      default: "unpaid",
    },

    amountPaid: {
      type: Number,
      default: 0,
      min: 0,
    },

    adminCommissionRate: {
  type: Number,
  default: 0,
  min: 0,
  max: 100,
},

adminCommissionAmount: {
  type: Number,
  default: 0,
  min: 0,
},

organizerEarnings: {
  type: Number,
  default: 0,
  min: 0,
},

    commissionCalculatedAt: {
      type: Date,
    },

    razorpayOrderId: {
      type: String,
    },

    razorpayPaymentId: {
      type: String,
    },

    razorpaySignature: {
      type: String,
    },

    paidAt: {
      type: Date,
    },

    bookingCode: {
      type: String,
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

bookingSchema.index({
  user: 1,
  "appliedPromotion.promotionId": 1,
  status: 1,
  paymentStatus: 1,
});

bookingSchema.index({
  promotionReservation: 1,
});

export default mongoose.model<IBooking>(
  "Booking",
  bookingSchema
);