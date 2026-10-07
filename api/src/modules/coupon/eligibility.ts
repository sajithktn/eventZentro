import { Types } from "mongoose";
import { IPromotion } from "./coupon.interface";
import Booking from "../booking/booking.model";
import Promotion from "./coupon.model";
import PromotionReservation from "./promotion-reservation.model";

import { calculatePromotionDiscount, createPromotionSummary } from "./display";
import { getEffectivePromotionStatus, getMinimumBookingAmount, getPromotionMode, getRemainingOfferTickets, getReservedUsageCount, getTotalUsageLimit, roundMoney } from "./helpers";
import { PromotionCandidateResult } from "./types";

export const getUserPromotionUsageCount = async (userId: string | undefined, promotionId: Types.ObjectId, now: Date) => {
    if (!userId) {
        return 0;
    }
    const [confirmedBookings, activeReservations] = await Promise.all([
        Booking.countDocuments({
            user: userId,
            status: "confirmed",
            $or: [
                {
                    "appliedPromotion.promotionId": promotionId,
                },
                {
                    coupon: promotionId,
                },
            ],
        }),
        PromotionReservation.countDocuments({
            user: userId,
            promotion: promotionId,
            status: "reserved",
            expiresAt: {
                $gt: now,
            },
        }),
    ]);
    return confirmedBookings + activeReservations;
};

export const getPromotionIneligibilityReason = async (promotion: IPromotion, options: {
    subtotal: number;
    ticketCount: number;
    userId?: string;
    now: Date;
}) => {
    const status = getEffectivePromotionStatus(promotion, options.now);
    if (status !== "active") {
        return `This promotion is ${status}.`;
    }
    if (options.now < promotion.validFrom) {
        return "This promotion is not valid yet.";
    }
    if (options.now > promotion.validUntil) {
        return "This promotion has expired.";
    }
    const minimumBookingAmount = getMinimumBookingAmount(promotion);
    if (minimumBookingAmount > 0 &&
        options.subtotal < minimumBookingAmount) {
        return `Minimum booking amount for this promotion is Rs. ${minimumBookingAmount}.`;
    }
    const usageLimit = getTotalUsageLimit(promotion);
    if (usageLimit &&
        promotion.usedCount + getReservedUsageCount(promotion) >=
            usageLimit) {
        return "This promotion usage limit has been reached.";
    }
    if (promotion.maxTicketsPerBooking &&
        options.ticketCount > promotion.maxTicketsPerBooking) {
        return `This promotion allows at most ${promotion.maxTicketsPerBooking} tickets per booking.`;
    }
    const remainingOfferTickets = getRemainingOfferTickets(promotion);
    if (remainingOfferTickets !== undefined &&
        options.ticketCount > remainingOfferTickets) {
        return "Not enough offer tickets are available.";
    }
    if (promotion.perUserUsageLimit && options.userId) {
        const usageCount = await getUserPromotionUsageCount(options.userId, promotion._id, options.now);
        if (usageCount >= promotion.perUserUsageLimit) {
            return "You have already used this promotion.";
        }
    }
    return null;
};

export const evaluatePromotionCandidate = async (promotion: IPromotion, options: {
    subtotal: number;
    ticketCount: number;
    userId?: string;
    now: Date;
}): Promise<PromotionCandidateResult | null> => {
    const reason = await getPromotionIneligibilityReason(promotion, options);
    if (reason) {
        return null;
    }
    const discountAmount = calculatePromotionDiscount(promotion, options.subtotal);
    return {
        promotion,
        discountAmount,
        finalAmount: roundMoney(options.subtotal - discountAmount),
        summary: createPromotionSummary(promotion),
        reason: getPromotionMode(promotion) === "coupon"
            ? "Coupon gives the best discount for this booking."
            : "Automatic offer gives the best discount for this booking.",
    };
};

export const pickBestPromotion = (candidates: PromotionCandidateResult[]) => {
    if (candidates.length === 0) {
        return null;
    }
    return [...candidates].sort((first, second) => {
        if (second.discountAmount !== first.discountAmount) {
            return second.discountAmount - first.discountAmount;
        }
        if (getPromotionMode(first.promotion) === "automatic" &&
            getPromotionMode(second.promotion) === "coupon") {
            return -1;
        }
        if (getPromotionMode(first.promotion) === "coupon" &&
            getPromotionMode(second.promotion) === "automatic") {
            return 1;
        }
        return (first.promotion.validUntil.getTime() -
            second.promotion.validUntil.getTime());
    })[0];
};

export const findAutomaticPromotionCandidates = async (eventId: string | Types.ObjectId, now: Date) => {
    return Promotion.find({
        event: eventId,
        promotionMode: "automatic",
        visibility: "public",
        isDeleted: false,
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
        discountValue: -1,
        validUntil: 1,
    });
};
