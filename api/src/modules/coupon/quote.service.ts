import Promotion from "./coupon.model";
import Event from "../event/event.model";
import { completePublishedEventIfEnded } from "../event/event-lifecycle.service";
import { EVENT_ENDED_BOOKING_MESSAGE, hasEventEnded } from "../../utils/eventLifecycle";

import { evaluatePromotionCandidate, findAutomaticPromotionCandidates, getPromotionIneligibilityReason, pickBestPromotion } from "./eligibility";
import { ensureValidObjectId, normalizeCouponCode, roundMoney } from "./helpers";
import { releaseExpiredPromotionReservations } from "./reservations.service";
import { PromotionCandidateResult, PromotionQuoteOptions, PromotionQuoteResult } from "./types";

export const getPromotionQuoteService = async (options: PromotionQuoteOptions): Promise<PromotionQuoteResult> => {
    ensureValidObjectId(options.eventId, "event ID");
    if (!Number.isInteger(options.ticketCount) ||
        options.ticketCount < 1) {
        throw new Error("Ticket quantity must be at least 1.");
    }
    await releaseExpiredPromotionReservations();
    const event = await Event.findById(options.eventId);
    if (!event) {
        throw new Error("Event not found.");
    }
    if (
        event.status === "completed" ||
        hasEventEnded(event.eventDate, event.endTime) ||
        (await completePublishedEventIfEnded(event))
    ) {
        if (event.status === "published") {
            await completePublishedEventIfEnded(event);
        }
        throw new Error(EVENT_ENDED_BOOKING_MESSAGE);
    }
    if (event.status !== "published") {
        throw new Error("This event is not available for booking.");
    }
    if (event.availableTickets < options.ticketCount) {
        throw new Error("Not enough tickets available.");
    }
    const subtotal = roundMoney(event.ticketPrice * options.ticketCount);
    if (subtotal <= 0) {
        return {
            success: true,
            message: "No payment is required for this booking.",
            subtotal,
            discountAmount: 0,
            finalAmount: 0,
            appliedPromotion: null,
            reason: "Free events do not need promotions.",
            bestOfferApplied: false,
        };
    }
    const now = new Date();
    const automaticPromotions = await findAutomaticPromotionCandidates(event._id, now);
    const automaticResults = (await Promise.all(automaticPromotions.map((promotion) => evaluatePromotionCandidate(promotion, {
        subtotal,
        ticketCount: options.ticketCount,
        userId: options.userId,
        now,
    })))).filter((result): result is PromotionCandidateResult => Boolean(result));
    const bestAutomatic = pickBestPromotion(automaticResults);
    let couponResult: PromotionCandidateResult | null = null;
    let couponError: string | undefined;
    if (options.couponCode) {
        const normalizedCode = normalizeCouponCode(options.couponCode);
        const coupon = await Promotion.findOne({
            event: event._id,
            code: normalizedCode,
            promotionMode: "coupon",
            isDeleted: false,
        });
        if (!coupon) {
            couponError = "Invalid coupon code.";
        }
        else {
            const reason = await getPromotionIneligibilityReason(coupon, {
                subtotal,
                ticketCount: options.ticketCount,
                userId: options.userId,
                now,
            });
            if (reason) {
                couponError = reason;
            }
            else {
                couponResult = await evaluatePromotionCandidate(coupon, {
                    subtotal,
                    ticketCount: options.ticketCount,
                    userId: options.userId,
                    now,
                });
            }
        }
    }
    const applied = pickBestPromotion([bestAutomatic, couponResult].filter((result): result is PromotionCandidateResult => Boolean(result)));
    if (!applied) {
        if (couponError) {
            throw new Error(couponError);
        }
        return {
            success: true,
            message: "No eligible promotion is available.",
            subtotal,
            discountAmount: 0,
            finalAmount: subtotal,
            appliedPromotion: null,
            reason: "No active discount applies to this booking.",
            bestOfferApplied: false,
        };
    }
    const bestOfferApplied = bestAutomatic?.promotion._id.toString() ===
        applied.promotion._id.toString();
    const message = couponError
        ? "Automatic offer applied. The coupon could not be applied."
        : "Promotion applied successfully.";
    return {
        success: true,
        message,
        subtotal,
        discountAmount: applied.discountAmount,
        finalAmount: applied.finalAmount,
        appliedPromotion: applied.summary,
        reason: applied.reason,
        bestOfferApplied,
        ...(couponError ? { couponError } : {}),
    };
};
