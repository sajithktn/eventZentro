import { Document, Types } from "mongoose";

export type FeaturedEventRequestStatus =
  | "pending"
  | "payment_pending"
  | "paid"
  | "approved"
  | "rejected"
  | "expired"
  | "cancelled";

export type FeaturedEventPaymentStatus =
  | "unpaid"
  | "pending"
  | "paid"
  | "failed"
  | "refunded";

export interface IFeaturedEventRequest extends Document {
  _id: Types.ObjectId;
  organizer: Types.ObjectId;
  event: Types.ObjectId;
  promotionFee: number;
  currency: string;
  requestedStartDate: Date;
  requestedEndDate: Date;
  approvedStartDate?: Date;
  approvedEndDate?: Date;
  status: FeaturedEventRequestStatus;
  paymentStatus: FeaturedEventPaymentStatus;
  adminNote?: string;
  rejectionReason?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  paidAt?: Date;
  approvedAt?: Date;
  approvedBy?: Types.ObjectId;
  paymentReservationExpiresAt?: Date;
  rejectedAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFeaturedEventSetting extends Document {
  _id: Types.ObjectId;
  promotionFee: number;
  isPromotionEnabled: boolean;
  maximumFeaturedEventsOnHomepage: number;
  defaultPromotionDurationDays?: number;
  requirePaymentBeforeApproval: boolean;
  createdAt: Date;
  updatedAt: Date;
}
