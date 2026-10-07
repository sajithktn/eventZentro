import { FeaturedEventPaymentStatus, FeaturedEventRequestStatus } from "./featured-event.interface";
import { ParsedPaginationQuery } from "../../utils/pagination";

export const FEATURED_EVENT_SETTING_ID = "000000000000000000000101";

export const DEFAULT_HOMEPAGE_LIMIT = 3;

export const PAYMENT_RESERVATION_EXPIRY_HOURS = 24;

export const finalRequestStatuses: FeaturedEventRequestStatus[] = [
    "rejected",
    "expired",
    "cancelled",
];

export const requestStatuses: FeaturedEventRequestStatus[] = [
    "pending",
    "payment_pending",
    "paid",
    "approved",
    "rejected",
    "expired",
    "cancelled",
];

export const paymentStatuses: FeaturedEventPaymentStatus[] = [
    "unpaid",
    "pending",
    "paid",
    "failed",
    "refunded",
];

export const defaultPaginationQuery: ParsedPaginationQuery = {
    page: 1,
    limit: 10,
    skip: 0,
};

export const requestPopulate = [
    {
        path: "event",
        select: "title description category city venue eventDate startTime endTime ticketPrice bannerImage status organizer isFeatured",
    },
    {
        path: "organizer",
        select: "firstName lastName email profileImage",
    },
    {
        path: "approvedBy",
        select: "firstName lastName email profileImage",
    },
];

export const publicEventPopulate = {
    path: "event",
    match: {
        status: "published",
    },
    select: "title description category city venue eventDate startTime endTime ticketPrice totalTickets availableTickets bannerImage status organizer",
    populate: {
        path: "organizer",
        select: "firstName lastName email profileImage",
    },
};
