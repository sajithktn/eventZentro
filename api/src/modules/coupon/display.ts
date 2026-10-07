import { IPromotion, IPromotionSnapshot } from "./coupon.interface";

import { getMaximumDiscountAmount, getMinimumBookingAmount, getPromotionMode, getPromotionName, getRemainingOfferTickets, getTotalUsageLimit, roundMoney } from "./helpers";
import { PromotionSummary, PublicPromotionDetails } from "./types";

export const calculatePromotionDiscount = (promotion: Pick<IPromotion, "discountType" | "discountValue" | "maximumDiscountAmount" | "maximumDiscount">, subtotal: number) => {
    const rawDiscount = promotion.discountType === "percentage"
        ? (subtotal * promotion.discountValue) / 100
        : promotion.discountValue;
    const maximumDiscount = promotion.maximumDiscountAmount ??
        promotion.maximumDiscount;
    const limitedDiscount = promotion.discountType === "percentage" &&
        maximumDiscount
        ? Math.min(rawDiscount, maximumDiscount)
        : rawDiscount;
    return roundMoney(Math.min(limitedDiscount, subtotal));
};

export const getPromotionDisplayText = (promotion: Pick<IPromotion, "displayText" | "discountType" | "discountValue" | "maximumDiscountAmount" | "maximumDiscount" | "firstNTickets">) => {
    if (promotion.displayText) {
        return promotion.displayText;
    }
    const discountText = promotion.discountType === "percentage"
        ? `${promotion.discountValue}% off`
        : `Rs. ${promotion.discountValue} off`;
    const maximumDiscount = promotion.maximumDiscountAmount ??
        promotion.maximumDiscount;
    const cappedText = promotion.discountType === "percentage" &&
        maximumDiscount
        ? `${discountText} up to Rs. ${maximumDiscount}`
        : discountText;
    if (promotion.firstNTickets) {
        return `${cappedText} · First ${promotion.firstNTickets} tickets`;
    }
    return cappedText;
};

export const createPromotionSummary = (promotion: IPromotion): PromotionSummary => {
    const remainingOfferTickets = getRemainingOfferTickets(promotion);
    return {
        id: promotion._id.toString(),
        name: getPromotionName(promotion),
        code: getPromotionMode(promotion) === "coupon"
            ? promotion.code
            : undefined,
        promotionMode: getPromotionMode(promotion),
        discountType: promotion.discountType,
        discountValue: promotion.discountValue,
        displayText: getPromotionDisplayText(promotion),
        ...(remainingOfferTickets !== undefined
            ? {
                remainingOfferTickets,
            }
            : {}),
    };
};

export const createPromotionSnapshot = (promotion: IPromotion): IPromotionSnapshot => ({
    promotionId: promotion._id,
    name: getPromotionName(promotion),
    code: getPromotionMode(promotion) === "coupon"
        ? promotion.code
        : undefined,
    promotionMode: getPromotionMode(promotion),
    discountType: promotion.discountType,
    discountValue: promotion.discountValue,
    displayText: getPromotionDisplayText(promotion),
});

export const buildPromotionTerms = (promotion: IPromotion) => {
    const terms: string[] = [];
    const minimumBookingAmount = getMinimumBookingAmount(promotion);
    const maximumDiscountAmount = getMaximumDiscountAmount(promotion);
    if (minimumBookingAmount > 0) {
        terms.push(`Minimum booking value Rs. ${minimumBookingAmount}.`);
    }
    if (maximumDiscountAmount) {
        terms.push(`Maximum discount Rs. ${maximumDiscountAmount}.`);
    }
    if (promotion.maxTicketsPerBooking) {
        terms.push(`Maximum ${promotion.maxTicketsPerBooking} discounted tickets per booking.`);
    }
    if (promotion.perUserUsageLimit) {
        terms.push(`Limited to ${promotion.perUserUsageLimit} use per user.`);
    }
    if (promotion.firstNTickets) {
        terms.push(`Applies while the first ${promotion.firstNTickets} offer tickets remain.`);
    }
    terms.push("Offer cannot be combined with another promotion.");
    return terms;
};

export const createPublicPromotionDetails = (promotion: IPromotion): PublicPromotionDetails => ({
    ...createPromotionSummary(promotion),
    description: promotion.description,
    minimumBookingAmount: getMinimumBookingAmount(promotion) || undefined,
    maximumDiscountAmount: getMaximumDiscountAmount(promotion),
    validFrom: promotion.validFrom,
    validUntil: promotion.validUntil,
    totalUsageLimit: getTotalUsageLimit(promotion),
    perUserUsageLimit: promotion.perUserUsageLimit,
    firstNTickets: promotion.firstNTickets,
    maxTicketsPerBooking: promotion.maxTicketsPerBooking,
    terms: buildPromotionTerms(promotion),
});
