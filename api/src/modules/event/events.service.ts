import { PaginatedApiResponse } from "../../types/pagination.interface";
import Booking from "../booking/booking.model";
import Promotion from "../coupon/coupon.model";
import Event from "./event.model";
import { buildPaginationMetadata } from "../../utils/pagination";
import { CreateEventInput } from "./event.validation";
import { deleteImageFromCloudinary } from "../upload/cloudinary.service";
import { deactivateFeaturedRequestsForEvent } from "../featured-event/featured-event.service";
import { completePublishedEventIfEnded, markEndedEventsAsCompleted } from "./event-lifecycle.service";
import { getStartOfDay, hasEventEnded } from "../../utils/eventLifecycle";

import { addFilterCondition, buildEventFilter, defaultPaginationQuery, getActiveCategoryNameOrThrow, getCleanLocationString, getEventSort, getObjectIdOrThrow, getPopulatedEventById, getReferenceIdString, withBestPromotions } from "./helpers";
import { EventResponse, EventServiceError, GetAllEventsServiceOptions } from "./types";

export const createEventService = async (data: CreateEventInput, organizerId: string) => {
    const categoryName = await getActiveCategoryNameOrThrow(data.category);
    const eventDate = new Date(data.eventDate);
    const event = await Event.create({
        title: data.title,
        description: data.description,
        category: categoryName,
        city: data.city,
        venue: data.venue,
        eventDate,
        startTime: data.startTime,
        endTime: data.endTime,
        ticketPrice: data.ticketPrice,
        totalTickets: data.totalTickets,
        availableTickets: data.totalTickets,
        bannerImage: data.bannerImage || "",
        bannerImagePublicId: data.bannerImagePublicId || "",
        organizer: organizerId,
        status: hasEventEnded(eventDate, data.endTime)
            ? "completed"
            : "published",
    });
    const populatedEvent = await Event.findById(event._id).populate("organizer", "firstName lastName email profileImage");
    return {
        message: "Event created successfully.",
        event: populatedEvent,
    };
};

export const getAllEventsService = async (options?: GetAllEventsServiceOptions): Promise<PaginatedApiResponse<EventResponse>> => {
    await markEndedEventsAsCompleted();
    const query = options?.query || defaultPaginationQuery;
    const filter = buildEventFilter(query, options?.organizerId, options?.includeAllOrganizers);
    if (options?.onlyUpcoming) {
        const now = new Date();
        addFilterCondition(filter, {
            status: "published",
            eventDate: {
                $gte: getStartOfDay(now),
            },
        });
        const matchingEvents = await Event.find(filter)
            .populate("organizer", "firstName lastName email profileImage")
            .sort(getEventSort(query.sort));
        const upcomingEvents = matchingEvents.filter((event) => !hasEventEnded(event.eventDate, event.endTime, now));
        const events = upcomingEvents.slice(query.skip, query.skip + query.limit);
        const eventData = await withBestPromotions(events);
        return {
            success: true,
            message: "Events fetched successfully.",
            data: eventData,
            pagination: buildPaginationMetadata(query.page, query.limit, upcomingEvents.length),
        };
    }
    const [events, totalItems] = await Promise.all([
        Event.find(filter)
            .populate("organizer", "firstName lastName email profileImage")
            .sort(getEventSort(query.sort))
            .skip(query.skip)
            .limit(query.limit),
        Event.countDocuments(filter),
    ]);
    const eventData = await withBestPromotions(events);
    return {
        success: true,
        message: "Events fetched successfully.",
        data: eventData,
        pagination: buildPaginationMetadata(query.page, query.limit, totalItems),
    };
};

export const getEventLocationsService = async () => {
    const now = new Date();
    const events = await Event.find({
        status: "published",
        eventDate: {
            $gte: getStartOfDay(now),
        },
        $or: [
            {
                city: {
                    $exists: true,
                    $type: "string",
                    $ne: "",
                },
            },
            {
                venue: {
                    $exists: true,
                    $type: "string",
                    $ne: "",
                },
            },
        ],
    }).select("city venue eventDate endTime");
    const locationMap = new Map<string, string>();
    events.forEach((event) => {
        if (hasEventEnded(event.eventDate, event.endTime, now)) {
            return;
        }
        const location = getCleanLocationString(event.city) ||
            getCleanLocationString(event.venue);
        const locationKey = location.toLowerCase();
        if (!location || locationMap.has(locationKey)) {
            return;
        }
        locationMap.set(locationKey, location);
    });
    return [...locationMap.values()].sort((firstLocation, secondLocation) => firstLocation.localeCompare(secondLocation));
};

export const getEventByIdService = async (eventId: string) => {
    const eventObjectId = getObjectIdOrThrow(eventId, "event ID");
    const event = await getPopulatedEventById(eventObjectId);
    if (!event) {
        throw new EventServiceError("Event not found.", 404);
    }
    await completePublishedEventIfEnded(event);
    const [eventData] = await withBestPromotions([event]);
    return eventData;
};

export const getOrganizerEventByIdService = async (eventId: string, organizerId: string, role: string) => {
    const eventObjectId = getObjectIdOrThrow(eventId, "event ID");
    const event = await getPopulatedEventById(eventObjectId);
    if (!event) {
        throw new EventServiceError("Event not found.", 404);
    }
    if (role !== "admin" &&
        getReferenceIdString(event.organizer, "Organizer ID") !== organizerId) {
        throw new EventServiceError("You can only access your own events.", 403);
    }
    await completePublishedEventIfEnded(event);
    const [eventData] = await withBestPromotions([event]);
    return eventData;
};

export const updateEventService = async (eventId: string, organizerId: string, role: string, data: CreateEventInput) => {
    const eventObjectId = getObjectIdOrThrow(eventId, "event ID");
    const event = await Event.findById(eventObjectId);
    if (!event) {
        throw new EventServiceError("Event not found.", 404);
    }
    if (role !== "admin" &&
        getReferenceIdString(event.organizer, "Organizer ID") !== organizerId) {
        throw new EventServiceError("You can only edit your own events.", 403);
    }
    const soldTickets = Math.max(event.totalTickets - event.availableTickets, 0);
    if (data.totalTickets < soldTickets) {
        throw new EventServiceError(`Total tickets cannot be less than already sold tickets (${soldTickets}).`, 400);
    }
    let categoryName = event.category;
    const currentCategory = event.category.trim().toLowerCase();
    const selectedCategory = data.category.trim().toLowerCase();
    if (currentCategory !== selectedCategory) {
        categoryName =
            await getActiveCategoryNameOrThrow(data.category);
    }
    event.title = data.title;
    event.description = data.description;
    event.category = categoryName;
    event.city = data.city;
    event.venue = data.venue;
    event.eventDate = new Date(data.eventDate);
    event.startTime = data.startTime;
    event.endTime = data.endTime;
    event.ticketPrice = data.ticketPrice;
    event.totalTickets = data.totalTickets;
    event.availableTickets =
        data.totalTickets - soldTickets;
    if (event.status === "published" &&
        hasEventEnded(event.eventDate, event.endTime)) {
        event.status = "completed";
    }
    const previousBannerPublicId = event.bannerImagePublicId || "";
    const hasBannerImage = Object.prototype.hasOwnProperty.call(data, "bannerImage");
    const hasBannerImagePublicId = Object.prototype.hasOwnProperty.call(data, "bannerImagePublicId");
    const nextBannerImage = hasBannerImage
        ? data.bannerImage?.trim() || ""
        : event.bannerImage || "";
    const nextBannerImagePublicId = hasBannerImagePublicId
        ? data.bannerImagePublicId?.trim() || ""
        : event.bannerImagePublicId || "";
    if (hasBannerImage) {
        event.bannerImage = nextBannerImage;
    }
    if (hasBannerImagePublicId) {
        event.bannerImagePublicId =
            nextBannerImagePublicId;
    }
    await event.save();
    if (event.status === "completed") {
        await deactivateFeaturedRequestsForEvent(event._id, "expired");
    }
    const updatedEvent = await Event.findById(event._id).populate("organizer", "firstName lastName email profileImage");
    if (previousBannerPublicId &&
        hasBannerImage &&
        hasBannerImagePublicId &&
        previousBannerPublicId !==
            nextBannerImagePublicId) {
        try {
            await deleteImageFromCloudinary(previousBannerPublicId);
        }
        catch (error) {
            console.error("Failed to delete previous event banner:", error);
        }
    }
    return {
        message: "Event updated successfully.",
        event: updatedEvent,
    };
};

export const deleteEventService = async (eventId: string, organizerId: string, role: string) => {
    const eventObjectId = getObjectIdOrThrow(eventId, "event ID");
    const event = await Event.findById(eventObjectId);
    if (!event) {
        throw new EventServiceError("Event not found.", 404);
    }
    if (role !== "admin" &&
        getReferenceIdString(event.organizer, "Organizer ID") !== organizerId) {
        throw new EventServiceError("You can only delete your own events.", 403);
    }
    const bookingCount = await Booking.countDocuments({
        event: eventObjectId,
    });
    if (bookingCount > 0) {
        throw new EventServiceError("This event has booking history and cannot be deleted.", 409);
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
