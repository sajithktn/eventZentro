import type { User } from "@/types/auth";
import type { Event } from "@/types/event";
import type { PaginatedApiResponse } from "@/types/pagination";
import type { PromotionSummary } from "@/types/promotion";

export interface Booking {
  _id: string;
  user?: string | User;
  event?: string | Event;
  quantity: number;
  ticketCount?: number;
  totalAmount: number;
  coupon?: string;
  couponCode?: string;
  originalAmount?: number;
  subtotalAmount?: number;
  discountAmount?: number;
  finalAmount?: number;
  appliedPromotion?: PromotionSummary & {
    promotionId?: string;
  };
  promotionReservation?: string;
  status: "pending" | "confirmed" | "cancelled";
  paymentStatus?:
    | "unpaid"
    | "pending"
    | "verifying"
    | "paid"
    | "failed"
    | "refunded";
  amountPaid?: number;
  adminCommissionRate?: number;
  adminCommissionAmount?: number;
  organizerEarnings?: number;
  commissionCalculatedAt?: string;
  bookingCode: string;
  createdAt: string;
  updatedAt?: string;
}

export interface BookingsResponse
  extends PaginatedApiResponse<Booking> {
  success: boolean;
  count?: number;
  bookings?: Booking[];
}

export interface BookingResponse {
  success: boolean;
  message: string;
  booking: Booking;
  event?: Event;
}