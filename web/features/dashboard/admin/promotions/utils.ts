"use client";

import axios from "axios";
import { type AdminPromotion, type AdminPromotionStatus } from "@/services/admin.service";
import { formatCurrency } from "@/utils/event";

export const getPromotionName = (promotion: AdminPromotion) => promotion.name ||
    promotion.displayText ||
    promotion.code ||
    "Event offer";

export const getEventName = (promotion: AdminPromotion) => {
    if (!promotion.event) {
        return "Deleted event";
    }
    if (typeof promotion.event === "string") {
        return "Deleted event";
    }
    return promotion.event.title || "Deleted event";
};

export const getOrganizerName = (promotion: AdminPromotion) => {
    if (!promotion.organizer) {
        return "Unknown organizer";
    }
    if (typeof promotion.organizer === "string") {
        return "Unknown organizer";
    }
    return ([
        promotion.organizer.firstName,
        promotion.organizer.lastName,
    ]
        .filter(Boolean)
        .join(" ") ||
        promotion.organizer.email ||
        "Unknown organizer");
};

export const getPromotionStatus = (promotion: AdminPromotion): AdminPromotionStatus => promotion.status ||
    (promotion.isActive === false
        ? "inactive"
        : "active");

export const getDiscountLabel = (promotion: AdminPromotion) => promotion.discountType === "percentage"
    ? `${promotion.discountValue}% off`
    : `${formatCurrency(promotion.discountValue)} off`;

export const getUsageLimit = (promotion: AdminPromotion) => promotion.totalUsageLimit ??
    promotion.usageLimit;

export const getMaximumDiscount = (promotion: AdminPromotion) => promotion.maximumDiscountAmount ??
    promotion.maximumDiscount;

export const getMinimumAmount = (promotion: AdminPromotion) => promotion.minimumBookingAmount ??
    promotion.minimumAmount;

export const getErrorMessage = (error: unknown, fallback: string) => {
    if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message;
        return typeof message === "string"
            ? message
            : fallback;
    }
    if (error instanceof Error) {
        return error.message;
    }
    return fallback;
};
