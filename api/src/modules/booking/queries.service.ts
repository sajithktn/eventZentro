import { QueryFilter } from "mongoose";
import { PaginatedApiResponse } from "../../types/pagination.interface";
import { IBooking } from "./booking.interface";
import Booking from "./booking.model";
import Event from "../event/event.model";
import { buildPaginationMetadata, escapeRegExp } from "../../utils/pagination";

import { applyBookingStatusFilter, defaultPaginationQuery, getBookingSort, getEmptyPaginatedBookings, getMatchingEventIds, getMatchingUserIds } from "./helpers";

export const getMyBookingsService = async (userId: string, query = defaultPaginationQuery): Promise<PaginatedApiResponse<IBooking>> => {
    const filter: QueryFilter<IBooking> = {
        user: userId,
    };
    applyBookingStatusFilter(filter, query.status);
    if (query.search) {
        const searchRegex = new RegExp(escapeRegExp(query.search), "i");
        const eventIds = await getMatchingEventIds(searchRegex);
        const searchFilters: QueryFilter<IBooking>[] = [
            {
                bookingCode: searchRegex,
            },
        ];
        if (eventIds.length > 0) {
            searchFilters.push({
                event: {
                    $in: eventIds,
                },
            });
        }
        filter.$or =
            searchFilters;
    }
    const [bookings, totalItems,] = await Promise.all([
        Booking.find(filter)
            .populate({
            path: "event",
            populate: {
                path: "organizer",
                select: "firstName lastName email",
            },
        })
            .sort(getBookingSort(query.sort))
            .skip(query.skip)
            .limit(query.limit),
        Booking.countDocuments(filter),
    ]);
    return {
        success: true,
        message: "Bookings fetched successfully.",
        data: bookings,
        pagination: buildPaginationMetadata(query.page, query.limit, totalItems),
    };
};

export const getOrganizerBookingsService = async (organizerId: string, includeAll: boolean, query = defaultPaginationQuery): Promise<PaginatedApiResponse<IBooking>> => {
    const events = await Event.find(includeAll
        ? {}
        : {
            organizer: organizerId,
        }).select("_id");
    const eventIds = events.map((event) => event._id);
    if (eventIds.length === 0) {
        return getEmptyPaginatedBookings(query, "Bookings fetched successfully.");
    }
    const filter: QueryFilter<IBooking> = {
        event: {
            $in: eventIds,
        },
    };
    applyBookingStatusFilter(filter, query.status);
    if (query.search) {
        const searchRegex = new RegExp(escapeRegExp(query.search), "i");
        const [matchingEventIds, matchingUserIds,] = await Promise.all([
            getMatchingEventIds(searchRegex, eventIds),
            getMatchingUserIds(searchRegex),
        ]);
        const searchFilters: QueryFilter<IBooking>[] = [
            {
                bookingCode: searchRegex,
            },
        ];
        if (matchingEventIds.length >
            0) {
            searchFilters.push({
                event: {
                    $in: matchingEventIds,
                },
            });
        }
        if (matchingUserIds.length >
            0) {
            searchFilters.push({
                user: {
                    $in: matchingUserIds,
                },
            });
        }
        filter.$or =
            searchFilters;
    }
    const [bookings, totalItems,] = await Promise.all([
        Booking.find(filter)
            .populate("user", "firstName lastName email")
            .populate({
            path: "event",
            populate: {
                path: "organizer",
                select: "firstName lastName email",
            },
        })
            .sort(getBookingSort(query.sort))
            .skip(query.skip)
            .limit(query.limit),
        Booking.countDocuments(filter),
    ]);
    return {
        success: true,
        message: "Bookings fetched successfully.",
        data: bookings,
        pagination: buildPaginationMetadata(query.page, query.limit, totalItems),
    };
};
