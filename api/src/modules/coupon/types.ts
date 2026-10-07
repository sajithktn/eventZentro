import { Types } from "mongoose";
import { IPromotion, PromotionDiscountType, PromotionMode, PromotionStatus, PromotionVisibility } from "./coupon.interface";
import { ParsedPaginationQuery } from "../../utils/pagination";

export interface PromotionListOptions {
    organizerId: string;
    role: string;
    query: ParsedPaginationQuery;
    eventId?: string;
    status?: PromotionStatus | "exhausted";
    promotionMode?: PromotionMode;
    visibility?: PromotionVisibility;
    organizer?: string;
}

export interface PromotionQuoteOptions {
    userId?: string;
    eventId: string;
    ticketCount: number;
    couponCode?: string;
}

export interface PromotionCandidateResult {
    promotion: IPromotion;
    discountAmount: number;
    finalAmount: number;
    summary: PromotionSummary;
    reason: string;
}

export interface ReservePromotionInput {
    bookingId: string | Types.ObjectId;
    userId: string | Types.ObjectId;
    eventId: string | Types.ObjectId;
    promotionId: string | Types.ObjectId;
    ticketCount: number;
    subtotalAmount: number;
    discountAmount: number;
}

export type SortDirection = 1 | -1;

export type PromotionSort = Record<string, SortDirection>;

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

export interface PublicPromotionDetails extends PromotionSummary {
    description?: string;
    minimumBookingAmount?: number;
    maximumDiscountAmount?: number;
    validFrom: Date;
    validUntil: Date;
    totalUsageLimit?: number;
    perUserUsageLimit?: number;
    firstNTickets?: number;
    maxTicketsPerBooking?: number;
    terms: string[];
}

export interface PromotionQuoteResult {
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
