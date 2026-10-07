import Booking from "../booking/booking.model";
import Promotion from "../coupon/coupon.model";
import Event from "../event/event.model";
import { deleteImageFromCloudinary } from "../upload/cloudinary.service";
import { deactivateFeaturedRequestsForEvent } from "../featured-event/featured-event.service";

import { buildAdminEventFilter, getAdminEventSort, getPopulatedAdminEvent } from "./catalog.helpers";
import { buildPagination, defaultPaginationQuery, eventPopulate, eventStatuses, getObjectIdOrThrow, isEventStatus } from "./service.helpers";
import { AdminEventsQuery, AdminServiceError } from "./types";

export const getAdminEventsService = async (query: AdminEventsQuery = defaultPaginationQuery) => {
    const filter = buildAdminEventFilter(query);
    const [events, totalItems] = await Promise.all([
        Event.find(filter)
            .populate(eventPopulate)
            .sort(getAdminEventSort(query.sort))
            .skip(query.skip)
            .limit(query.limit),
        Event.countDocuments(filter),
    ]);
    return {
        success: true,
        message: "Admin events fetched successfully.",
        data: events,
        events,
        pagination: buildPagination(query.page, query.limit, totalItems),
    };
};

export const getAdminEventByIdService = async (eventId: string) => {
    getObjectIdOrThrow(eventId, "event ID");
    return getPopulatedAdminEvent(eventId);
};

export const updateAdminEventStatusService = async (eventId: string, status: string) => {
    getObjectIdOrThrow(eventId, "event ID");
    const normalizedStatus = status.toLowerCase();
    if (!isEventStatus(normalizedStatus)) {
        throw new AdminServiceError(`Event status must be one of ${eventStatuses.join(", ")}.`, 400);
    }
    const event = await Event.findById(eventId);
    if (!event) {
        throw new AdminServiceError("Event not found.", 404);
    }
    event.status =
        normalizedStatus;
    await event.save();
    if (event.status !== "published") {
        await deactivateFeaturedRequestsForEvent(event._id, event.status === "completed"
            ? "expired"
            : "cancelled");
    }
    return getPopulatedAdminEvent(event._id);
};

export const deleteAdminEventService = async (eventId: string) => {
    const eventObjectId = getObjectIdOrThrow(eventId, "event ID");
    const event = await Event.findById(eventObjectId);
    if (!event) {
        throw new AdminServiceError("Event not found.", 404);
    }
    const [bookingCount, activeBookingCount,] = await Promise.all([
        Booking.countDocuments({
            event: eventObjectId,
        }),
        Booking.countDocuments({
            event: eventObjectId,
            $or: [
                {
                    status: {
                        $in: [
                            "pending",
                            "confirmed",
                        ],
                    },
                },
                {
                    paymentStatus: {
                        $in: [
                            "pending",
                            "verifying",
                            "paid",
                        ],
                    },
                },
            ],
        }),
    ]);
    if (activeBookingCount > 0) {
        throw new AdminServiceError("This event has active bookings and cannot be permanently deleted. Cancel the event instead.", 409);
    }
    if (bookingCount > 0) {
        throw new AdminServiceError("This event has booking history and cannot be permanently deleted. Cancel the event instead.", 409);
    }
    await Promotion.updateMany({
        event: eventObjectId,
        isDeleted: false,
    }, {
        $set: {
            isDeleted: true,
            status: "inactive",
            isActive: false,
        },
    });
    await deactivateFeaturedRequestsForEvent(eventObjectId, "cancelled");
    const bannerImagePublicId = event.bannerImagePublicId || "";
    await event.deleteOne();
    if (bannerImagePublicId) {
        try {
            await deleteImageFromCloudinary(bannerImagePublicId);
        }
        catch (error) {
            console.error("Failed to delete event banner:", error);
        }
    }
    return {
        success: true,
        message: "Event deleted successfully.",
        eventId,
    };
};
