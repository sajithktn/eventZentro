import type { Event, EventOrganizer } from "@/types/event";
import type { PaginationMetadata } from "@/types/pagination";

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

export interface FeaturedEventSettings {
  _id: string;
  promotionFee: number;
  isPromotionEnabled: boolean;
  maximumFeaturedEventsOnHomepage: number;
  defaultPromotionDurationDays?: number;
  requirePaymentBeforeApproval: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface FeaturedEventUser
  extends EventOrganizer {
  profileImage?: string;
}

export interface FeaturedEventRequest {
  _id: string;
  organizer?: string | FeaturedEventUser | null;
  event?: string | Event | null;
  promotionFee: number;
  currency: string;
  requestedStartDate: string;
  requestedEndDate: string;
  approvedStartDate?: string;
  approvedEndDate?: string;
  status: FeaturedEventRequestStatus;
  paymentStatus: FeaturedEventPaymentStatus;
  adminNote?: string;
  rejectionReason?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  paidAt?: string;
  approvedAt?: string;
  approvedBy?: string | FeaturedEventUser | null;
  paymentReservationExpiresAt?: string;
  rejectedAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt?: string | null;
  status?: string;
}

export interface FeaturedEventSettingsResponse {
  success: boolean;
  message: string;
  settings: FeaturedEventSettings;
}

export interface FeaturedEventsResponse {
  success: boolean;
  message: string;
  count: number;
  data: Event[];
  events: Event[];
  limit?: number;
}

export interface FeaturedEventRequestsResponse {
  success: boolean;
  message: string;
  data: FeaturedEventRequest[];
  requests: FeaturedEventRequest[];
  pagination: PaginationMetadata;
}

export interface FeaturedEventRequestResponse {
  success: boolean;
  message: string;
  request: FeaturedEventRequest;
}

export interface CreateFeaturedEventRequestData {
  eventId: string;
  requestedStartDate: string;
  requestedEndDate: string;
}

export interface CreateFeaturedEventRequestResponse
  extends FeaturedEventRequestResponse {
  order: RazorpayOrder | null;
  key?: string;
  paymentRequired: boolean;
}

export interface CreateFeaturedEventPaymentOrderResponse
  extends FeaturedEventRequestResponse {
  order: RazorpayOrder | null;
  amountToPay: number;
  key?: string;
  freePromotion?: boolean;
}

export interface VerifyFeaturedEventPaymentData {
  requestId: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface UpdateFeaturedEventSettingsData {
  promotionFee: number;
  isPromotionEnabled: boolean;
  maximumFeaturedEventsOnHomepage: number;
  defaultPromotionDurationDays?: number;
  requirePaymentBeforeApproval: boolean;
}

export interface AdminFeaturedEventRequestsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: FeaturedEventRequestStatus | "all";
  paymentStatus?: FeaturedEventPaymentStatus | "all";
  activeState?: "all" | "active" | "inactive" | "expired";
  sort?: string;
}

export type OrganizerFeaturedEventRequestsParams =
  Pick<
    AdminFeaturedEventRequestsParams,
    "page" | "limit" | "search" | "status" | "sort"
  >;
