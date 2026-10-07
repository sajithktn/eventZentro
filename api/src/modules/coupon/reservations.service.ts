import { QueryFilter, Types } from "mongoose";
import { IPromotion } from "./coupon.interface";
import { IPromotionReservation } from "./promotion-reservation.interface";
import Promotion from "./coupon.model";
import PromotionReservation from "./promotion-reservation.model";

import { getPromotionIneligibilityReason } from "./eligibility";
import { getPromotionIdString, getTotalUsageLimit, isDuplicateKeyError, reservationWindowMinutes } from "./helpers";
import { ReservePromotionInput } from "./types";

export const buildPromotionReservationFilter = (promotion: IPromotion, ticketCount: number, now: Date): QueryFilter<IPromotion> => {
    const expressions: QueryFilter<IPromotion>[] = [];
    const usageLimit = getTotalUsageLimit(promotion);
    if (usageLimit) {
        expressions.push({
            $expr: {
                $lte: [
                    {
                        $add: [
                            {
                                $ifNull: ["$usedCount", 0],
                            },
                            {
                                $ifNull: ["$reservedUsageCount", 0],
                            },
                            1,
                        ],
                    },
                    {
                        $ifNull: ["$totalUsageLimit", "$usageLimit"],
                    },
                ],
            },
        });
    }
    if (promotion.firstNTickets) {
        expressions.push({
            $expr: {
                $lte: [
                    {
                        $add: [
                            {
                                $ifNull: ["$discountedTicketsReserved", 0],
                            },
                            {
                                $ifNull: ["$discountedTicketsUsed", 0],
                            },
                            ticketCount,
                        ],
                    },
                    "$firstNTickets",
                ],
            },
        });
    }
    return {
        _id: promotion._id,
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
        ...(expressions.length > 0
            ? {
                $and: expressions,
            }
            : {}),
    };
};

export const rollbackPromotionReservationCounters = async (promotionId: string | Types.ObjectId, ticketCount: number) => {
    await Promotion.findByIdAndUpdate(promotionId, {
        $inc: {
            discountedTicketsReserved: -ticketCount,
            reservedUsageCount: -1,
        },
    });
};

export const releaseReservationDocument = async (reservation: IPromotionReservation, status: "released" | "expired") => {
    const updatedReservation = await PromotionReservation.findOneAndUpdate({
        _id: reservation._id,
        status: "reserved",
    }, {
        $set: {
            status,
        },
    }, {
        new: true,
    });
    if (!updatedReservation) {
        return null;
    }
    await rollbackPromotionReservationCounters(updatedReservation.promotion, updatedReservation.ticketCount);
    return updatedReservation;
};

export const releasePromotionReservationByBooking = async (bookingId: string | Types.ObjectId, status: "released" | "expired" = "released") => {
    const reservation = await PromotionReservation.findOne({
        booking: bookingId,
        status: "reserved",
    });
    if (!reservation) {
        return null;
    }
    return releaseReservationDocument(reservation, status);
};

export const releaseExpiredPromotionReservations = async (now = new Date()) => {
    const expiredReservations = await PromotionReservation.find({
        status: "reserved",
        expiresAt: {
            $lte: now,
        },
    }).limit(100);
    await Promise.all(expiredReservations.map((reservation) => releaseReservationDocument(reservation, "expired")));
};

export const reservePromotionForBooking = async (input: ReservePromotionInput) => {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + reservationWindowMinutes * 60 * 1000);
    await releaseExpiredPromotionReservations(now);
    const bookingId = getPromotionIdString(input.bookingId);
    const promotionId = getPromotionIdString(input.promotionId);
    const existingReservation = await PromotionReservation.findOne({
        booking: bookingId,
    });
    if (existingReservation?.status === "reserved" &&
        existingReservation.expiresAt > now &&
        existingReservation.promotion.toString() === promotionId &&
        existingReservation.ticketCount === input.ticketCount &&
        existingReservation.discountAmount === input.discountAmount) {
        return existingReservation;
    }
    if (existingReservation?.status === "reserved") {
        await releaseReservationDocument(existingReservation, existingReservation.expiresAt <= now ? "expired" : "released");
    }
    if (existingReservation?.status === "redeemed") {
        return existingReservation;
    }
    const promotion = await Promotion.findById(promotionId);
    if (!promotion) {
        throw new Error("Promotion not found.");
    }
    const ineligibilityReason = await getPromotionIneligibilityReason(promotion, {
        subtotal: input.subtotalAmount,
        ticketCount: input.ticketCount,
        userId: input.userId.toString(),
        now,
    });
    if (ineligibilityReason) {
        throw new Error(ineligibilityReason);
    }
    const updatedPromotion = await Promotion.findOneAndUpdate(buildPromotionReservationFilter(promotion, input.ticketCount, now), {
        $inc: {
            discountedTicketsReserved: input.ticketCount,
            reservedUsageCount: 1,
        },
    }, {
        new: true,
    });
    if (!updatedPromotion) {
        throw new Error("Promotion is no longer available.");
    }
    try {
        const reusedReservation = await PromotionReservation.findOneAndUpdate({
            booking: bookingId,
            status: {
                $in: ["released", "expired"],
            },
        }, {
            $set: {
                promotion: input.promotionId,
                user: input.userId,
                event: input.eventId,
                ticketCount: input.ticketCount,
                discountAmount: input.discountAmount,
                status: "reserved",
                expiresAt,
            },
        }, {
            new: true,
        });
        if (reusedReservation) {
            return reusedReservation;
        }
        return await PromotionReservation.create({
            promotion: input.promotionId,
            booking: input.bookingId,
            user: input.userId,
            event: input.eventId,
            ticketCount: input.ticketCount,
            discountAmount: input.discountAmount,
            status: "reserved",
            expiresAt,
        });
    }
    catch (error) {
        await rollbackPromotionReservationCounters(input.promotionId, input.ticketCount);
        if (isDuplicateKeyError(error)) {
            const latestReservation = await PromotionReservation.findOne({
                booking: bookingId,
            });
            if (latestReservation?.status === "reserved" &&
                latestReservation.expiresAt > now) {
                return latestReservation;
            }
        }
        throw error;
    }
};

export const redeemPromotionReservation = async (reservationId: string | Types.ObjectId, bookingId: string | Types.ObjectId) => {
    const now = new Date();
    const reservation = await PromotionReservation.findOneAndUpdate({
        _id: reservationId,
        booking: bookingId,
        status: "reserved",
        expiresAt: {
            $gt: now,
        },
    }, {
        $set: {
            status: "redeemed",
        },
    }, {
        new: true,
    });
    if (!reservation) {
        const latestReservation = await PromotionReservation.findOne({
            _id: reservationId,
            booking: bookingId,
        });
        if (latestReservation?.status === "redeemed") {
            return latestReservation;
        }
        if (latestReservation?.status === "reserved" &&
            latestReservation.expiresAt <= now) {
            await releaseReservationDocument(latestReservation, "expired");
        }
        throw new Error("Promotion reservation is no longer valid.");
    }
    await Promotion.findOneAndUpdate({
        _id: reservation.promotion,
        discountedTicketsReserved: {
            $gte: reservation.ticketCount,
        },
        reservedUsageCount: {
            $gte: 1,
        },
    }, {
        $inc: {
            discountedTicketsReserved: -reservation.ticketCount,
            discountedTicketsUsed: reservation.ticketCount,
            reservedUsageCount: -1,
            usedCount: 1,
        },
    });
    return reservation;
};

export const restoreRedeemedPromotionReservation = async (reservationId: string | Types.ObjectId, bookingId: string | Types.ObjectId) => {
    const reservation = await PromotionReservation.findOneAndUpdate({
        _id: reservationId,
        booking: bookingId,
        status: "redeemed",
    }, {
        $set: {
            status: "reserved",
        },
    }, {
        new: true,
    });
    if (!reservation) {
        return null;
    }
    await Promotion.findByIdAndUpdate(reservation.promotion, {
        $inc: {
            discountedTicketsReserved: reservation.ticketCount,
            discountedTicketsUsed: -reservation.ticketCount,
            reservedUsageCount: 1,
            usedCount: -1,
        },
    });
    return reservation;
};
