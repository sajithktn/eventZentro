import { Types } from "mongoose";
import Promotion from "./coupon.model";

import { calculatePromotionDiscount, createPromotionSummary, createPublicPromotionDetails } from "./display";
import { pickBestPromotion } from "./eligibility";
import { ensureValidObjectId, getEffectivePromotionStatus, normalizeCouponCode, roundMoney } from "./helpers";
import { getPromotionQuoteService } from "./quote.service";
import { releaseExpiredPromotionReservations } from "./reservations.service";
import { PromotionCandidateResult, PromotionSummary } from "./types";

export const validateCouponForEvent = async (eventId: string, code: string, _amount?: number, userId?: string, ticketCount = 1) => {
    const result = await getPromotionQuoteService({
        eventId,
        couponCode: code,
        userId,
        ticketCount,
    });
    if (!result.appliedPromotion ||
        result.appliedPromotion.promotionMode !== "coupon") {
        throw new Error(result.couponError || "This coupon was not the best available offer.");
    }
    return {
        success: true as const,
        message: result.message,
        coupon: {
            id: result.appliedPromotion.id,
            code: result.appliedPromotion.code || normalizeCouponCode(code),
            discountType: result.appliedPromotion.discountType,
            discountValue: result.appliedPromotion.discountValue,
        },
        couponId: new Types.ObjectId(result.appliedPromotion.id),
        couponCode: result.appliedPromotion.code || normalizeCouponCode(code),
        originalAmount: result.subtotal,
        discountAmount: result.discountAmount,
        finalAmount: result.finalAmount,
    };
};

export const incrementCouponUsage = async (promotionId: string | Types.ObjectId) => {
    await Promotion.findByIdAndUpdate(promotionId, {
        $inc: {
            usedCount: 1,
        },
    });
};

export const getPublicPromotionsForEventService = async (eventId: string) => {
    ensureValidObjectId(eventId, "event ID");
    await releaseExpiredPromotionReservations();
    const now = new Date();
    const promotions = await Promotion.find({
        event: eventId,
        isDeleted: false,
        visibility: "public",
        status: "active",
        validFrom: {
            $lte: now,
        },
        validUntil: {
            $gte: now,
        },
        isActive: {
            $ne: false,
        },
    }).sort({
        promotionMode: 1,
        discountValue: -1,
        validUntil: 1,
    });
    return promotions
        .filter((promotion) => getEffectivePromotionStatus(promotion, now) === "active")
        .map(createPublicPromotionDetails);
};

export const getBestPromotionSummariesForEvents = async (events: Array<{
    _id: Types.ObjectId;
    ticketPrice: number;
}>) => {
    if (events.length === 0) {
        return new Map<string, PromotionSummary | null>();
    }
    const now = new Date();
    const eventIds = events.map((event) => event._id);
    const eventPriceMap = new Map(events.map((event) => [
        event._id.toString(),
        event.ticketPrice,
    ]));
    const promotions = await Promotion.find({
        event: {
            $in: eventIds,
        },
        isDeleted: false,
        visibility: "public",
        status: "active",
        validFrom: {
            $lte: now,
        },
        validUntil: {
            $gte: now,
        },
        isActive: {
            $ne: false,
        },
    });
    const grouped = new Map<string, PromotionCandidateResult[]>();
    promotions.forEach((promotion) => {
        if (getEffectivePromotionStatus(promotion, now) !== "active") {
            return;
        }
        const eventId = promotion.event.toString();
        const subtotal = eventPriceMap.get(eventId) || 0;
        const discountAmount = subtotal > 0
            ? calculatePromotionDiscount(promotion, subtotal)
            : 0;
        const candidate: PromotionCandidateResult = {
            promotion,
            discountAmount,
            finalAmount: roundMoney(subtotal - discountAmount),
            summary: createPromotionSummary(promotion),
            reason: "Best public promotion for this event.",
        };
        grouped.set(eventId, [
            ...(grouped.get(eventId) || []),
            candidate,
        ]);
    });
    const summaryMap = new Map<string, PromotionSummary | null>();
    events.forEach((event) => {
        const best = pickBestPromotion(grouped.get(event._id.toString()) || []);
        summaryMap.set(event._id.toString(), best ? best.summary : null);
    });
    return summaryMap;
};
