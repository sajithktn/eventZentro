import { QueryFilter, Types } from "mongoose";
import Booking from "../booking/booking.model";
import Promotion from "../coupon/coupon.model";
import Event from "../event/event.model";
import User from "../user/user.model";
import { IBooking } from "../booking/booking.interface";
import { IPromotion } from "../coupon/coupon.interface";
import { IEvent } from "../event/event.interface";

import { bookingPopulate, bookingStatuses, escapeRegExp, eventPopulate, eventStatuses, getObjectIdOrThrow, isBookingStatus, isEventStatus, isPaymentStatus, isPromotionMode, isPromotionStatus, paymentStatuses, promotionModes, promotionPopulate, promotionStatuses } from "./service.helpers";
import { AdminBookingsQuery, AdminEventsQuery, AdminPromotionsQuery, AdminServiceError } from "./types";

export const getAdminEventSort = (sort?: string): Record<string, 1 | -1> => {
    switch (sort) {
        case "oldest":
            return { createdAt: 1 };
        case "date-asc":
        case "soonest":
            return { eventDate: 1 };
        case "date-desc":
            return { eventDate: -1 };
        case "title":
            return { title: 1 };
        case "newest":
        default:
            return { createdAt: -1 };
    }
};

export const getAdminBookingSort = (sort?: string): Record<string, 1 | -1> => {
    switch (sort) {
        case "oldest":
            return { createdAt: 1 };
        case "amount-high":
            return { totalAmount: -1 };
        case "amount-low":
            return { totalAmount: 1 };
        case "newest":
        default:
            return { createdAt: -1 };
    }
};

export const getAdminPromotionSort = (sort?: string): Record<string, 1 | -1> => {
    switch (sort) {
        case "oldest":
            return { createdAt: 1 };
        case "valid-until":
            return { validUntil: 1 };
        case "name":
            return { name: 1 };
        case "newest":
        default:
            return { createdAt: -1 };
    }
};

export const getMatchingAdminEventIds = async (searchRegex: RegExp) => {
    const events = await Event.find({
        $or: [
            { title: searchRegex },
            { venue: searchRegex },
            { city: searchRegex },
            { category: searchRegex },
        ],
    }).select("_id");
    return events.map((event) => event._id);
};

export const getMatchingAdminUserIds = async (searchRegex: RegExp) => {
    const users = await User.find({
        $or: [
            { firstName: searchRegex },
            { lastName: searchRegex },
            { email: searchRegex },
        ],
    }).select("_id");
    return users.map((user) => user._id);
};

export const getPopulatedAdminEvent = async (eventId: string | Types.ObjectId) => {
    const event = await Event.findById(eventId).populate(eventPopulate);
    if (!event) {
        throw new AdminServiceError("Event not found.", 404);
    }
    return event;
};

export const getPopulatedAdminBooking = async (bookingId: string | Types.ObjectId) => {
    const booking = await Booking.findById(bookingId)
        .select("-razorpaySignature")
        .populate(bookingPopulate);
    if (!booking) {
        throw new AdminServiceError("Booking not found.", 404);
    }
    return booking;
};

export const getPopulatedAdminPromotion = async (promotionId: string | Types.ObjectId) => {
    const promotion = await Promotion.findById(promotionId).populate(promotionPopulate);
    if (!promotion || promotion.isDeleted) {
        throw new AdminServiceError("Promotion not found.", 404);
    }
    return promotion;
};

export const buildAdminEventFilter = (query: AdminEventsQuery): QueryFilter<IEvent> => {
    const filter: QueryFilter<IEvent> = {};
    if (query.status &&
        query.status.toLowerCase() !== "all") {
        const status = query.status.toLowerCase();
        if (!isEventStatus(status)) {
            throw new AdminServiceError(`Event status must be one of ${eventStatuses.join(", ")}.`, 400);
        }
        filter.status = status;
    }
    if (query.category &&
        query.category.toLowerCase() !== "all") {
        filter.category = new RegExp(`^${escapeRegExp(query.category)}$`, "i");
    }
    if (query.organizer &&
        query.organizer !== "all" &&
        query.organizer !== "me") {
        filter.organizer = getObjectIdOrThrow(query.organizer, "organizer ID");
    }
    if (query.search) {
        const searchRegex = new RegExp(escapeRegExp(query.search), "i");
        filter.$or = [
            { title: searchRegex },
            { description: searchRegex },
            { category: searchRegex },
            { city: searchRegex },
            { venue: searchRegex },
        ];
    }
    return filter;
};

export const buildAdminPromotionFilter = async (query: AdminPromotionsQuery): Promise<QueryFilter<IPromotion>> => {
    const filter: QueryFilter<IPromotion> = {
        isDeleted: false,
    };
    if (query.status &&
        query.status.toLowerCase() !== "all") {
        const status = query.status.toLowerCase();
        if (!isPromotionStatus(status)) {
            throw new AdminServiceError(`Promotion status must be one of ${promotionStatuses.join(", ")}.`, 400);
        }
        filter.status = status;
    }
    if (query.promotionMode &&
        query.promotionMode.toLowerCase() !== "all") {
        const promotionMode = query.promotionMode.toLowerCase();
        if (!isPromotionMode(promotionMode)) {
            throw new AdminServiceError(`Promotion mode must be one of ${promotionModes.join(", ")}.`, 400);
        }
        filter.promotionMode = promotionMode;
    }
    if (query.eventId) {
        filter.event = getObjectIdOrThrow(query.eventId, "event ID");
    }
    if (query.organizer &&
        query.organizer !== "all" &&
        query.organizer !== "me") {
        filter.organizer = getObjectIdOrThrow(query.organizer, "organizer ID");
    }
    if (query.search) {
        const searchRegex = new RegExp(escapeRegExp(query.search), "i");
        const eventIds = await getMatchingAdminEventIds(searchRegex);
        const searchFilters: QueryFilter<IPromotion>[] = [
            { name: searchRegex },
            { code: searchRegex },
            { displayText: searchRegex },
        ];
        if (eventIds.length > 0) {
            searchFilters.push({
                event: {
                    $in: eventIds,
                },
            });
        }
        filter.$or = searchFilters;
    }
    return filter;
};

export const buildAdminBookingFilter = async (query: AdminBookingsQuery): Promise<QueryFilter<IBooking>> => {
    const filter: QueryFilter<IBooking> = {};
    if (query.status &&
        query.status.toLowerCase() !== "all") {
        const status = query.status.toLowerCase();
        if (!isBookingStatus(status)) {
            throw new AdminServiceError(`Booking status must be one of ${bookingStatuses.join(", ")}.`, 400);
        }
        filter.status = status;
    }
    if (query.paymentStatus &&
        query.paymentStatus.toLowerCase() !== "all") {
        const paymentStatus = query.paymentStatus.toLowerCase();
        if (!isPaymentStatus(paymentStatus)) {
            throw new AdminServiceError(`Payment status must be one of ${paymentStatuses.join(", ")}.`, 400);
        }
        filter.paymentStatus = paymentStatus;
    }
    if (query.eventId) {
        filter.event = getObjectIdOrThrow(query.eventId, "event ID");
    }
    if (query.userId) {
        filter.user = getObjectIdOrThrow(query.userId, "user ID");
    }
    if (query.search) {
        const searchRegex = new RegExp(escapeRegExp(query.search), "i");
        const [eventIds, userIds] = await Promise.all([
            getMatchingAdminEventIds(searchRegex),
            getMatchingAdminUserIds(searchRegex),
        ]);
        const searchFilters: QueryFilter<IBooking>[] = [
            { bookingCode: searchRegex },
            { couponCode: searchRegex },
            { razorpayOrderId: searchRegex },
            { razorpayPaymentId: searchRegex },
        ];
        if (eventIds.length > 0) {
            searchFilters.push({
                event: {
                    $in: eventIds,
                },
            });
        }
        if (userIds.length > 0) {
            searchFilters.push({
                user: {
                    $in: userIds,
                },
            });
        }
        filter.$or = searchFilters;
    }
    return filter;
};
