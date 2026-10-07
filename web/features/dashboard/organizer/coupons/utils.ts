"use client";

import type { Promotion, PromotionStatus } from "@/types/promotion";
import { formatCurrency } from "@/utils/event";

export const getPromotionEvent = (promotion: Promotion) => typeof promotion.event === "string" ? null : promotion.event;

export const getPromotionName = (promotion: Promotion) => promotion.name ||
    promotion.displayText ||
    promotion.code ||
    "Event offer";

export const getPromotionCodeLabel = (promotion: Promotion) => (promotion.promotionMode || "coupon") === "coupon"
    ? promotion.code || "Coupon"
    : "Automatic";

export const getDiscountLabel = (promotion: Promotion) => promotion.discountType === "percentage"
    ? `${promotion.discountValue}% off`
    : `${formatCurrency(promotion.discountValue)} off`;

export const getUsageLimit = (promotion: Promotion) => promotion.totalUsageLimit ?? promotion.usageLimit;

export const getReservedTickets = (promotion: Promotion) => promotion.discountedTicketsReserved || 0;

export const getUsedTickets = (promotion: Promotion) => promotion.discountedTicketsUsed || 0;

export const getStatus = (promotion: Promotion): PromotionStatus => {
    if (promotion.status) {
        return promotion.status;
    }
    return promotion.isActive === false ? "inactive" : "active";
};
