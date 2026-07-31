import { Document, Types } from "mongoose";

export type PromotionMode = "coupon" | "automatic";
export type PromotionDiscountType = "percentage" | "fixed";
export type PromotionStatus = "active" | "inactive" | "expired";
export type PromotionVisibility = "public" | "hidden";
export type PromotionEffectiveStatus =
  | PromotionStatus
  | "exhausted";

export interface IPromotionSnapshot {
  promotionId: Types.ObjectId;
  name: string;
  code?: string;
  promotionMode: PromotionMode;
  discountType: PromotionDiscountType;
  discountValue: number;
  displayText?: string;
}

export interface IPromotion extends Document {
  _id: Types.ObjectId;

  name: string;
  description?: string;

  organizer: Types.ObjectId;
  event: Types.ObjectId;

  code?: string;
  promotionMode: PromotionMode;

  discountType: PromotionDiscountType;
  discountValue: number;

  minimumBookingAmount?: number;
  maximumDiscountAmount?: number;

  totalUsageLimit?: number;
  usedCount: number;
  reservedUsageCount: number;
  perUserUsageLimit?: number;

  firstNTickets?: number;
  discountedTicketsReserved: number;
  discountedTicketsUsed: number;
  maxTicketsPerBooking?: number;

  status: PromotionStatus;
  visibility: PromotionVisibility;
  displayText?: string;
  isDeleted: boolean;

  /*
   * Legacy coupon fields are kept readable so existing documents and
   * bookings created by the first coupon implementation continue to work.
   */
  minimumAmount?: number;
  maximumDiscount?: number;
  usageLimit?: number;
  isActive?: boolean;

  validFrom: Date;
  validUntil: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type ICoupon = IPromotion;
