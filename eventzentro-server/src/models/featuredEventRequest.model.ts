import mongoose, { Schema } from "mongoose";

import {
  IFeaturedEventRequest,
} from "../interfaces/featuredEvent.interface";

const featuredEventRequestSchema =
  new Schema<IFeaturedEventRequest>(
    {
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

      promotionFee: {
        type: Number,
        required: true,
        min: 0,
      },

      currency: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
        default: "INR",
      },

      requestedStartDate: {
        type: Date,
        required: true,
      },

      requestedEndDate: {
        type: Date,
        required: true,
      },

      approvedStartDate: {
        type: Date,
      },

      approvedEndDate: {
        type: Date,
      },

      status: {
        type: String,
        enum: [
          "pending",
          "payment_pending",
          "paid",
          "approved",
          "rejected",
          "expired",
          "cancelled",
        ],
        default: "pending",
        required: true,
      },

      paymentStatus: {
        type: String,
        enum: [
          "unpaid",
          "pending",
          "paid",
          "failed",
          "refunded",
        ],
        default: "unpaid",
        required: true,
      },

      adminNote: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: "",
      },

      rejectionReason: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: "",
      },

      razorpayOrderId: {
        type: String,
        trim: true,
      },

      razorpayPaymentId: {
        type: String,
        trim: true,
      },

      razorpaySignature: {
        type: String,
        trim: true,
        select: false,
      },

      paidAt: {
        type: Date,
      },

      approvedAt: {
        type: Date,
      },

      approvedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },

      paymentReservationExpiresAt: {
        type: Date,
      },

      rejectedAt: {
        type: Date,
      },

      isActive: {
        type: Boolean,
        default: false,
        required: true,
      },
    },
    {
      timestamps: true,
    }
  );

featuredEventRequestSchema.index({
  organizer: 1,
  createdAt: -1,
});

featuredEventRequestSchema.index({
  event: 1,
  status: 1,
  isActive: 1,
});

featuredEventRequestSchema.index({
  status: 1,
  paymentStatus: 1,
  createdAt: -1,
});

featuredEventRequestSchema.index({
  status: 1,
  paymentReservationExpiresAt: 1,
});

featuredEventRequestSchema.index({
  approvedStartDate: 1,
  approvedEndDate: 1,
  isActive: 1,
});

featuredEventRequestSchema.index({
  razorpayOrderId: 1,
});

export default mongoose.model<IFeaturedEventRequest>(
  "FeaturedEventRequest",
  featuredEventRequestSchema
);
