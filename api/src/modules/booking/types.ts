import { getPromotionQuoteService } from "../coupon/coupon.service";

export type SortDirection = 1 | -1;

export type BookingSort = Record<string, SortDirection>;

export interface VerifyPaymentData {
    bookingId: string;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}

export type PromotionQuote = Awaited<ReturnType<typeof getPromotionQuoteService>>;
