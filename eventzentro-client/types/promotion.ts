import type { Event } from "@/types/event";
import type { PaginatedApiResponse } from "@/types/pagination";

export type PromotionMode = "coupon" | "automatic";
export type PromotionDiscountType = "percentage" | "fixed";
export type PromotionStatus = "active" | "inactive" | "expired";
export type PromotionEffectiveStatus =
  | PromotionStatus
  | "exhausted";
export type PromotionVisibility = "public" | "hidden";

export interface PromotionOrganizerSummary {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  profileImage?: string;
}

export interface PromotionSummary {
  id: string;
  name: string;
  code?: string;
  promotionMode: PromotionMode;
  discountType: PromotionDiscountType;
  discountValue: number;
  displayText: string;
  remainingOfferTickets?: number;
}

export interface Promotion {
  _id: string;
  name?: string;
  description?: string;
  organizer: string | PromotionOrganizerSummary;
  event:
    | string
    | Pick<
        Event,
        | "_id"
        | "title"
        | "eventDate"
        | "ticketPrice"
        | "totalTickets"
        | "availableTickets"
        | "status"
        | "venue"
        | "bannerImage"
      >;
  code?: string;
  promotionMode?: PromotionMode;
  discountType: PromotionDiscountType;
  discountValue: number;
  minimumBookingAmount?: number;
  maximumDiscountAmount?: number;
  totalUsageLimit?: number;
  usedCount: number;
  reservedUsageCount?: number;
  perUserUsageLimit?: number;
  firstNTickets?: number;
  discountedTicketsReserved?: number;
  discountedTicketsUsed?: number;
  maxTicketsPerBooking?: number;
  validFrom: string;
  validUntil: string;
  status?: PromotionStatus;
  visibility?: PromotionVisibility;
  displayText?: string;
  isDeleted?: boolean;
  isActive?: boolean;
  minimumAmount?: number;
  maximumDiscount?: number;
  usageLimit?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PromotionFormData {
  name: string;
  description?: string;
  eventId: string;
  promotionMode: PromotionMode;
  code?: string;
  discountType: PromotionDiscountType;
  discountValue: number;
  minimumBookingAmount?: number;
  maximumDiscountAmount?: number;
  totalUsageLimit?: number;
  perUserUsageLimit?: number;
  firstNTickets?: number;
  maxTicketsPerBooking?: number;
  validFrom: string;
  validUntil: string;
  status: PromotionStatus;
  visibility: PromotionVisibility;
  displayText?: string;
}

export interface PromotionResponse {
  success: boolean;
  message: string;
  promotion?: Promotion | null;
  coupon?: Promotion | null;
}

export interface PromotionsResponse
  extends PaginatedApiResponse<Promotion> {
  promotions?: Promotion[];
  coupons?: Promotion[];
  count?: number;
}

export interface PromotionQuoteResponse {
  success: true;
  message: string;
  subtotal: number;
  discountAmount: number;
  finalAmount: number;
  appliedPromotion: PromotionSummary | null;
  reason: string;
  bestOfferApplied: boolean;
  couponError?: string;
}

export interface EventPromotionsResponse {
  success: boolean;
  message: string;
  count: number;
  promotions: Array<
    PromotionSummary & {
      description?: string;
      minimumBookingAmount?: number;
      maximumDiscountAmount?: number;
      validFrom: string;
      validUntil: string;
      totalUsageLimit?: number;
      perUserUsageLimit?: number;
      firstNTickets?: number;
      maxTicketsPerBooking?: number;
      terms: string[];
    }
  >;
}

export interface GetPromotionsParams {
  page?: number;
  limit?: number;
  search?: string;
  eventId?: string;
  event?: string;
  status?: PromotionStatus | "exhausted";
  promotionMode?: PromotionMode;
  visibility?: PromotionVisibility;
  organizer?: "me" | "all" | string;
  sort?: string;
}
