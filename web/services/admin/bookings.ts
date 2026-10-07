import api from "@/lib/axios";

import { AdminEventOrganizer, AdminEventStatus } from "./events";
import { AdminPromotionDiscountType, AdminPromotionMode } from "./promotions";
import { AdminPagination } from "./users";

export type AdminBookingStatus = "pending" | "confirmed" | "cancelled";

export type AdminPaymentStatus = "unpaid" | "pending" | "verifying" | "paid" | "failed" | "refunded";

export interface AdminBookingUser {
    _id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    profileImage?: string;
}

export interface AdminBookingEvent {
    _id?: string;
    title?: string;
    category?: string;
    city?: string;
    venue?: string;
    eventDate?: string;
    ticketPrice?: number;
    totalTickets?: number;
    availableTickets?: number;
    status?: AdminEventStatus;
    bannerImage?: string;
    organizer?: string | AdminEventOrganizer | null;
}

export interface AdminPromotionSnapshot {
    promotionId?: string;
    name?: string;
    code?: string;
    promotionMode?: AdminPromotionMode;
    discountType?: AdminPromotionDiscountType;
    discountValue?: number;
    displayText?: string;
}

export interface AdminBooking {
    _id: string;
    bookingCode: string;
    user?: string | AdminBookingUser | null;
    event?: string | AdminBookingEvent | null;
    quantity: number;
    ticketCount?: number;
    totalAmount: number;
    originalAmount?: number;
    subtotalAmount?: number;
    discountAmount?: number;
    finalAmount?: number;
    amountPaid?: number;
    adminCommissionRate?: number;
    adminCommissionAmount?: number;
    organizerEarnings?: number;
    commissionCalculatedAt?: string;
    couponCode?: string;
    appliedPromotion?: AdminPromotionSnapshot;
    status: AdminBookingStatus;
    paymentStatus?: AdminPaymentStatus;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    createdAt: string;
    updatedAt?: string;
}

export interface AdminBookingsParams {
    page?: number;
    limit?: number;
    search?: string;
    status?: AdminBookingStatus | "all";
    paymentStatus?: AdminPaymentStatus | "all";
    eventId?: string;
    userId?: string;
    sort?: string;
}

export interface AdminBookingsResponse {
    success: boolean;
    message: string;
    data: AdminBooking[];
    bookings: AdminBooking[];
    pagination: AdminPagination;
}

export interface AdminBookingResponse {
    success: boolean;
    message: string;
    booking: AdminBooking;
}

export const getAdminBookings = async (params: AdminBookingsParams = {}): Promise<AdminBookingsResponse> => {
    const response = await api.get("/admin/bookings", {
        params,
    });
    return response.data;
};

export const getAdminBookingById = async (bookingId: string): Promise<AdminBookingResponse> => {
    const response = await api.get(`/admin/bookings/${bookingId}`);
    return response.data;
};

export const updateAdminBookingStatus = async (bookingId: string, status: AdminBookingStatus): Promise<AdminBookingResponse> => {
    const response = await api.patch(`/admin/bookings/${bookingId}/status`, {
        status,
    });
    return response.data;
};
