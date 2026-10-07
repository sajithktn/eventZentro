import { isValidObjectId, QueryFilter, Types } from "mongoose";
import { IEvent } from "./event.interface";
import Category from "../category/category.model";
import Event from "./event.model";
import { getBestPromotionSummariesForEvents } from "../coupon/coupon.service";
import { escapeRegExp, ParsedPaginationQuery } from "../../utils/pagination";

import { EventResponse, EventServiceError, EventSort } from "./types";

export const defaultPaginationQuery: ParsedPaginationQuery = {
    page: 1,
    limit: 10,
    skip: 0,
};

export const eventStatuses: IEvent["status"][] = [
    "draft",
    "published",
    "cancelled",
    "completed",
];

export const getEventSort = (sort?: string): EventSort => {
    switch (sort) {
        case "oldest":
            return { createdAt: 1 };
        case "soonest":
        case "date-asc":
            return { eventDate: 1 };
        case "date-desc":
            return { eventDate: -1 };
        case "price-low":
            return { ticketPrice: 1 };
        case "price-high":
            return { ticketPrice: -1 };
        case "newest":
        default:
            return { createdAt: -1 };
    }
};

export const getDateBoundary = (value: string | undefined, endOfDay: boolean) => {
    if (!value) {
        return undefined;
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return undefined;
    }
    date.setHours(endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
    return date;
};

export const addFilterCondition = (filter: QueryFilter<IEvent>, condition: QueryFilter<IEvent>) => {
    filter.$and = [
        ...(filter.$and || []),
        condition,
    ];
};

export const getCleanLocationString = (value: unknown) => typeof value === "string" ? value.trim() : "";

export const getActiveCategoryNameOrThrow = async (categoryName: string) => {
    const cleanedCategoryName = categoryName.trim();
    if (!cleanedCategoryName) {
        throw new EventServiceError("Event category is required.", 400);
    }
    const category = await Category.findOne({
        name: {
            $regex: `^${escapeRegExp(cleanedCategoryName)}$`,
            $options: "i",
        },
        isActive: true,
    }).select("name");
    if (!category) {
        throw new EventServiceError("Selected category is invalid or inactive.", 400);
    }
    return category.name;
};

export type ReferenceId = string | Types.ObjectId | {
    _id?: string | Types.ObjectId | null;
};

export const getReferenceIdString = (value: ReferenceId | null | undefined, label: string): string => {
    if (!value) {
        throw new Error(`${label} is missing.`);
    }
    if (typeof value === "string") {
        if (!isValidObjectId(value)) {
            throw new Error(`Invalid ${label}.`);
        }
        return value;
    }
    if (value instanceof Types.ObjectId) {
        return value.toString();
    }
    if (!value._id) {
        throw new Error(`${label} is missing.`);
    }
    return getReferenceIdString(value._id, label);
};

export const getObjectIdOrThrow = (value: string, label: string) => {
    if (!isValidObjectId(value)) {
        throw new EventServiceError(`Invalid ${label}.`, 400);
    }
    return new Types.ObjectId(value);
};

export const getPopulatedEventById = async (eventId: string | Types.ObjectId) => Event.findById(eventId).populate("organizer", "firstName lastName email profileImage");

export const withBestPromotions = async (events: IEvent[]) => {
    const bestPromotions = await getBestPromotionSummariesForEvents(events.map((event) => ({
        _id: event._id,
        ticketPrice: event.ticketPrice,
    })));
    return events.map((event) => {
        const object = event.toObject() as EventResponse;
        object.bestPromotion =
            bestPromotions.get(event._id.toString()) || null;
        return object;
    });
};

export const buildEventFilter = (query: ParsedPaginationQuery, organizerId?: string, includeAllOrganizers = false) => {
    const filter: QueryFilter<IEvent> = {};
    if (organizerId && !includeAllOrganizers) {
        filter.organizer = organizerId;
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
    if (query.category &&
        query.category.toLowerCase() !== "all") {
        filter.category = new RegExp(`^${escapeRegExp(query.category)}$`, "i");
    }
    if (query.status &&
        query.status.toLowerCase() !== "all") {
        const normalizedStatus = query.status.toLowerCase();
        if (eventStatuses.includes(normalizedStatus as IEvent["status"])) {
            filter.status =
                normalizedStatus as IEvent["status"];
        }
    }
    if (query.location &&
        query.location.toLowerCase() !== "all") {
        const escapedLocation = escapeRegExp(query.location.trim());
        const primaryCity = escapeRegExp(query.location.split(",")[0].trim());
        addFilterCondition(filter, {
            $or: [
                {
                    city: new RegExp(primaryCity, "i"),
                },
                {
                    city: new RegExp(`^${escapedLocation}$`, "i"),
                },
                {
                    venue: new RegExp(escapedLocation, "i"),
                },
                {
                    venue: new RegExp(primaryCity, "i"),
                },
            ],
        });
    }
    if (query.minPrice !== undefined ||
        query.maxPrice !== undefined) {
        const ticketPriceFilter: {
            $gte?: number;
            $lte?: number;
        } = {};
        if (query.minPrice !== undefined) {
            ticketPriceFilter.$gte = query.minPrice;
        }
        if (query.maxPrice !== undefined) {
            ticketPriceFilter.$lte = query.maxPrice;
        }
        filter.ticketPrice = ticketPriceFilter;
    }
    const dateFrom = getDateBoundary(query.dateFrom, false);
    const dateTo = getDateBoundary(query.dateTo, true);
    if (dateFrom || dateTo) {
        const eventDateFilter: {
            $gte?: Date;
            $lte?: Date;
        } = {};
        if (dateFrom) {
            eventDateFilter.$gte = dateFrom;
        }
        if (dateTo) {
            eventDateFilter.$lte = dateTo;
        }
        filter.eventDate = eventDateFilter;
    }
    return filter;
};
