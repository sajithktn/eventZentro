import crypto from "crypto";
import { isValidObjectId, QueryFilter, Types } from "mongoose";
import razorpay from "../../config/razorpay";
import { IFeaturedEventRequest, FeaturedEventPaymentStatus, FeaturedEventRequestStatus } from "./featured-event.interface";
import { IEvent } from "../event/event.interface";
import Event from "../event/event.model";
import FeaturedEventRequest from "./featured-event-request.model";
import { getEventEndDateTime, getStartOfDay, hasEventEnded } from "../../utils/eventLifecycle";

import { PAYMENT_RESERVATION_EXPIRY_HOURS, finalRequestStatuses, paymentStatuses, requestPopulate, requestStatuses } from "./constants";
import { syncFeaturedEventRequestStates } from "./lifecycle.service";
import { FeaturedEventServiceError, PopulatedFeaturedEventRequest } from "./types";

let featuredSlotMutationQueue: Promise<void> = Promise.resolve();

export const withFeaturedSlotMutationLock = async <T>(operation: () => Promise<T>) => {
    const previousQueue = featuredSlotMutationQueue;
    let releaseQueue: () => void = () => { };
    featuredSlotMutationQueue = new Promise<void>((resolve) => {
        releaseQueue = resolve;
    });
    await previousQueue;
    try {
        return await operation();
    }
    finally {
        releaseQueue();
    }
};

export const getObjectIdOrThrow = (value: string, label: string) => {
    if (!isValidObjectId(value)) {
        throw new FeaturedEventServiceError(`Invalid ${label}.`, 400);
    }
    return new Types.ObjectId(value);
};

export const getReferenceIdString = (value: string | Types.ObjectId | {
    _id?: string | Types.ObjectId | null;
} | null | undefined, label: string): string => {
    if (!value) {
        throw new FeaturedEventServiceError(`${label} is missing.`, 400);
    }
    if (typeof value === "string") {
        return value;
    }
    if (value instanceof Types.ObjectId) {
        return value.toString();
    }
    if (!value._id) {
        throw new FeaturedEventServiceError(`${label} is missing.`, 400);
    }
    return getReferenceIdString(value._id, label);
};

export const isRequestStatus = (status: string): status is FeaturedEventRequestStatus => requestStatuses.includes(status as FeaturedEventRequestStatus);

export const isPaymentStatus = (status: string): status is FeaturedEventPaymentStatus => paymentStatuses.includes(status as FeaturedEventPaymentStatus);

export const isFinalStatus = (status: FeaturedEventRequestStatus) => finalRequestStatuses.includes(status);

export const normalizeDateAtStart = (value: string | Date) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        throw new FeaturedEventServiceError("Invalid promotion date.", 400);
    }
    date.setHours(0, 0, 0, 0);
    return date;
};

export const normalizeDateAtEnd = (value: string | Date) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        throw new FeaturedEventServiceError("Invalid promotion date.", 400);
    }
    date.setHours(23, 59, 59, 999);
    return date;
};

export const isSameCalendarDate = (first: Date, second: Date) => first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate();

export const getEventEndOrThrow = (event: IEvent) => {
    const eventEndDate = getEventEndDateTime(event.eventDate, event.endTime);
    if (!eventEndDate) {
        throw new FeaturedEventServiceError("Event end time is invalid.", 400);
    }
    return eventEndDate;
};

export const normalizePromotionPeriod = (startValue: string | Date, endValue: string | Date, event: IEvent, options: {
    allowPastStart?: boolean;
    now?: Date;
} = {}) => {
    const now = options.now || new Date();
    const todayStart = getStartOfDay(now);
    const eventEndDate = getEventEndOrThrow(event);
    let startDate = normalizeDateAtStart(startValue);
    let endDate = normalizeDateAtEnd(endValue);
    if (options.allowPastStart && startDate < todayStart) {
        startDate = todayStart;
    }
    if (!options.allowPastStart && startDate < todayStart) {
        throw new FeaturedEventServiceError("Promotion start date cannot be in the past.", 400);
    }
    if (isSameCalendarDate(endDate, eventEndDate) &&
        endDate > eventEndDate) {
        endDate = eventEndDate;
    }
    if (endDate <= startDate) {
        throw new FeaturedEventServiceError("Promotion end date must be later than start date.", 400);
    }
    if (startDate > eventEndDate || endDate > eventEndDate) {
        throw new FeaturedEventServiceError("Promotion dates cannot extend beyond the event lifecycle.", 400);
    }
    if (endDate <= now) {
        throw new FeaturedEventServiceError("Promotion end date must be in the future.", 400);
    }
    return {
        startDate,
        endDate,
    };
};

export const toRazorpayPaise = (amount: number) => Math.round(amount * 100);

export const getPaymentReservationExpiry = (now = new Date()) => new Date(now.getTime() +
    PAYMENT_RESERVATION_EXPIRY_HOURS *
        60 *
        60 *
        1000);

export const signaturesMatch = (expectedSignature: string, receivedSignature: string) => {
    const expectedBuffer = Buffer.from(expectedSignature, "hex");
    const receivedBuffer = Buffer.from(receivedSignature, "hex");
    return (expectedBuffer.length === receivedBuffer.length &&
        crypto.timingSafeEqual(expectedBuffer, receivedBuffer));
};

export const getFeaturedRequestSort = (sort?: string): Record<string, 1 | -1> => {
    switch (sort) {
        case "oldest":
            return { createdAt: 1 };
        case "fee-high":
            return { promotionFee: -1 };
        case "fee-low":
            return { promotionFee: 1 };
        case "period":
            return { requestedStartDate: 1 };
        case "newest":
        default:
            return { createdAt: -1 };
    }
};

export const getEventOwnedByOrganizerOrThrow = async (eventId: string, organizerId: string) => {
    const eventObjectId = getObjectIdOrThrow(eventId, "event ID");
    const event = await Event.findById(eventObjectId);
    if (!event) {
        throw new FeaturedEventServiceError("Event not found.", 404);
    }
    if (getReferenceIdString(event.organizer, "Organizer ID") !== organizerId) {
        throw new FeaturedEventServiceError("You can only request featured promotion for your own events.", 403);
    }
    if (event.status !== "published") {
        throw new FeaturedEventServiceError("Only published events can be featured.", 400);
    }
    if (hasEventEnded(event.eventDate, event.endTime)) {
        throw new FeaturedEventServiceError("Past or completed events cannot be featured.", 400);
    }
    return event;
};

export const getFeaturedRequestEventOrThrow = async (request: IFeaturedEventRequest) => {
    const event = await Event.findById(request.event);
    if (!event) {
        throw new FeaturedEventServiceError("Linked event was not found.", 404);
    }
    if (event.status !== "published") {
        throw new FeaturedEventServiceError("Only published events can be featured.", 400);
    }
    if (hasEventEnded(event.eventDate, event.endTime)) {
        throw new FeaturedEventServiceError("Past or completed events cannot be featured.", 400);
    }
    return event;
};

export const ensureNoOpenFeaturedRequest = async (eventId: Types.ObjectId | string, now = new Date(), excludeRequestId?: string | Types.ObjectId) => {
    await syncFeaturedEventRequestStates(now);
    const filter: QueryFilter<IFeaturedEventRequest> = {
        event: eventId,
        status: {
            $in: [
                "pending",
                "payment_pending",
                "paid",
                "approved",
            ],
        },
    };
    if (excludeRequestId) {
        filter._id = {
            $ne: excludeRequestId,
        };
    }
    const existingRequests = await FeaturedEventRequest.find(filter).select("_id status isActive approvedEndDate");
    const hasOpenRequest = existingRequests.some((request) => {
        if (request.status === "approved" &&
            (!request.isActive ||
                (request.approvedEndDate &&
                    request.approvedEndDate < now))) {
            return false;
        }
        return true;
    });
    if (hasOpenRequest) {
        throw new FeaturedEventServiceError("This event already has an active or pending featured promotion request.", 409);
    }
};

export const getPopulatedFeaturedRequest = async (requestId: string | Types.ObjectId) => {
    const request = await FeaturedEventRequest.findById(requestId)
        .select("+razorpaySignature")
        .populate(requestPopulate);
    if (!request) {
        throw new FeaturedEventServiceError("Featured event request not found.", 404);
    }
    return request as PopulatedFeaturedEventRequest;
};

export const createPaymentOrderForRequest = async (request: IFeaturedEventRequest) => {
    const amount = toRazorpayPaise(request.promotionFee);
    const order = await razorpay.orders.create({
        amount,
        currency: request.currency,
        receipt: `featured_${request._id.toString()}`,
        notes: {
            requestId: request._id.toString(),
            eventId: request.event.toString(),
            organizerId: request.organizer.toString(),
        },
    });
    request.razorpayOrderId = order.id;
    request.paymentStatus = "pending";
    request.status = "payment_pending";
    await request.save();
    return order;
};
