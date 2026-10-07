import api from "@/lib/axios";

import { AdminBookingEvent } from "./bookings";
import { AdminEventOrganizer } from "./events";
import { AdminPagination } from "./users";

export type AdminPromotionMode = "coupon" | "automatic";

export type AdminPromotionDiscountType = "percentage" | "fixed";

export type AdminPromotionStatus = "active" | "inactive" | "expired";

export interface AdminPromotion {
    _id: string;
    name?: string;
    description?: string;
    organizer?: string | AdminEventOrganizer | null;
    event?: string | AdminBookingEvent | null;
    code?: string;
    promotionMode?: AdminPromotionMode;
    discountType: AdminPromotionDiscountType;
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
    status?: AdminPromotionStatus;
    visibility?: "public" | "hidden";
    displayText?: string;
    isDeleted?: boolean;
    isActive?: boolean;
    minimumAmount?: number;
    maximumDiscount?: number;
    usageLimit?: number;
    createdAt: string;
    updatedAt?: string;
}

export interface AdminPromotionsParams {
    page?: number;
    limit?: number;
    search?: string;
    status?: AdminPromotionStatus | "all";
    promotionMode?: AdminPromotionMode | "all";
    eventId?: string;
    organizer?: string;
    sort?: string;
}

export interface AdminPromotionsResponse {
    success: boolean;
    message: string;
    data: AdminPromotion[];
    promotions: AdminPromotion[];
    coupons: AdminPromotion[];
    pagination: AdminPagination;
}

export interface AdminPromotionResponse {
    success: boolean;
    message: string;
    promotion?: AdminPromotion | null;
    coupon?: AdminPromotion | null;
}

export interface AdminPromotionDeleteResponse {
    success: boolean;
    message: string;
    promotionId: string;
}

export const getAdminPromotions = async (params: AdminPromotionsParams = {}): Promise<AdminPromotionsResponse> => {
    const response = await api.get("/admin/promotions", {
        params,
    });
    return response.data;
};

export const updateAdminPromotionStatus = async (promotionId: string, status: AdminPromotionStatus): Promise<AdminPromotionResponse> => {
    const response = await api.patch(`/admin/promotions/${promotionId}/status`, {
        status,
    });
    return response.data;
};

export const deleteAdminPromotion = async (promotionId: string): Promise<AdminPromotionDeleteResponse> => {
    const response = await api.delete(`/admin/promotions/${promotionId}`);
    return response.data;
};
