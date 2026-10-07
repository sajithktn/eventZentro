import crypto from "crypto";
import { QueryFilter, Types } from "mongoose";
import { PaginatedApiResponse } from "../../types/pagination.interface";
import { IBooking } from "./booking.interface";
import { IEvent } from "../event/event.interface";
import Booking from "./booking.model";
import Event from "../event/event.model";
import User from "../user/user.model";
import { buildPaginationMetadata, ParsedPaginationQuery } from "../../utils/pagination";
import { getActiveAdminCommissionPercentageService } from "../commission/commission.service";
import { completePublishedEventIfEnded } from "../event/event-lifecycle.service";
import { EVENT_ENDED_BOOKING_MESSAGE, hasEventEnded } from "../../utils/eventLifecycle";

import { BookingSort, PromotionQuote } from "./types";

export const defaultPaginationQuery: ParsedPaginationQuery = {
    page: 1,
    limit: 10,
    skip: 0,
};

export const getBookingSort = (sort?: string): BookingSort => {
    switch (sort) {
        case "oldest":
            return { createdAt: 1 };
        case "amount-high":
            return { totalAmount: -1 };
        case "amount-low":
            return { totalAmount: 1 };
        default:
            return { createdAt: -1 };
    }
};

export const getMatchingEventIds = async (searchRegex: RegExp, eventIds?: Types.ObjectId[]) => {
    const eventFilter: QueryFilter<{
        title: string;
        venue: string;
        category: string;
    }> = {
        $or: [
            { title: searchRegex },
            { venue: searchRegex },
            { category: searchRegex },
        ],
    };
    if (eventIds) {
        eventFilter._id = { $in: eventIds };
    }
    const events = await Event.find(eventFilter).select("_id");
    return events.map((event) => event._id);
};

export const getMatchingUserIds = async (searchRegex: RegExp) => {
    const users = await User.find({
        $or: [
            { firstName: searchRegex },
            { lastName: searchRegex },
            { email: searchRegex },
        ],
    }).select("_id");
    return users.map((user) => user._id);
};

export const applyBookingStatusFilter = (filter: QueryFilter<IBooking>, status?: string) => {
    if (!status || status.toLowerCase() === "all") {
        return;
    }
    filter.status =
        status.toLowerCase() as IBooking["status"];
};

export const getEmptyPaginatedBookings = (query: ParsedPaginationQuery, message: string): PaginatedApiResponse<IBooking> => ({
    success: true,
    message,
    data: [],
    pagination: buildPaginationMetadata(query.page, query.limit, 0),
});

export const createBookingCode = () => `EZ-${Date.now()
    .toString(36)
    .toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 7)
    .toUpperCase()}`;

export const roundMoney = (amount: number) => Math.round((amount + Number.EPSILON) * 100) / 100;

export const calculateCommission = async (amount: number) => {
    const adminCommissionRate = await getActiveAdminCommissionPercentageService();
    const amountPaid = roundMoney(amount);
    const adminCommissionAmount = roundMoney(amountPaid *
        (adminCommissionRate / 100));
    const organizerEarnings = roundMoney(amountPaid - adminCommissionAmount);
    return {
        amountPaid,
        adminCommissionRate,
        adminCommissionAmount,
        organizerEarnings,
        commissionCalculatedAt: new Date(),
    };
};

export const signaturesMatch = (expectedSignature: string, receivedSignature: string) => {
    const expectedBuffer = Buffer.from(expectedSignature, "hex");
    const receivedBuffer = Buffer.from(receivedSignature, "hex");
    if (expectedBuffer.length !==
        receivedBuffer.length) {
        return false;
    }
    return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
};

export const getBookingTicketCount = (booking: IBooking) => booking.ticketCount ||
    booking.quantity;

export const getAppliedPromotionId = (booking: IBooking) => booking.appliedPromotion?.promotionId ||
    undefined;

export const getBookableEventOrThrow = async (eventId: string | Types.ObjectId, ticketCount: number): Promise<IEvent> => {
    const event = await Event.findById(eventId);
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
    if (event.availableTickets < ticketCount) {
        throw new Error("Not enough tickets available.");
    }
    return event;
};

export const getPromotionSnapshotFromQuote = (quote: PromotionQuote) => {
    if (!quote.appliedPromotion) {
        return undefined;
    }
    return {
        promotionId: new Types.ObjectId(quote.appliedPromotion.id),
        name: quote.appliedPromotion.name,
        code: quote.appliedPromotion.code,
        promotionMode: quote.appliedPromotion.promotionMode,
        discountType: quote.appliedPromotion.discountType,
        discountValue: quote.appliedPromotion.discountValue,
        displayText: quote.appliedPromotion.displayText,
    };
};

export const applyQuoteToBooking = (booking: IBooking, quote: PromotionQuote, ticketCount: number) => {
    booking.quantity = ticketCount;
    booking.ticketCount = ticketCount;
    booking.originalAmount = quote.subtotal;
    booking.subtotalAmount = quote.subtotal;
    booking.discountAmount =
        quote.discountAmount;
    booking.finalAmount = quote.finalAmount;
    booking.totalAmount = quote.finalAmount;
    booking.appliedPromotion =
        getPromotionSnapshotFromQuote(quote);
    const appliedPromotionId = getAppliedPromotionId(booking);
    if (appliedPromotionId &&
        quote.appliedPromotion
            ?.promotionMode === "coupon" &&
        quote.appliedPromotion.code) {
        booking.coupon =
            new Types.ObjectId(appliedPromotionId);
        booking.couponCode =
            quote.appliedPromotion.code;
        return;
    }
    booking.coupon = undefined;
    booking.couponCode = undefined;
};

export const populateBookingById = async (bookingId: string | Types.ObjectId) => {
    const booking = await Booking.findById(bookingId).populate([
        {
            path: "event",
            populate: {
                path: "organizer",
                select: "firstName lastName email",
            },
        },
        {
            path: "user",
            select: "firstName lastName email",
        },
        {
            path: "promotionReservation",
        },
    ]);
    if (!booking) {
        throw new Error("Failed to retrieve created booking.");
    }
    return booking;
};
