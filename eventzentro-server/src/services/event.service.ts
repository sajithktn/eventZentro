import { QueryFilter } from "mongoose";
import {
  PaginatedApiResponse,
} from "../interfaces/pagination.interface";
import { IEvent } from "../interfaces/event.interface";
import Event from "../models/event.model";
import {
  buildPaginationMetadata,
  escapeRegExp,
  ParsedPaginationQuery,
} from "../utils/pagination";
import { CreateEventInput } from "../validators/event.validators";

interface GetAllEventsServiceOptions {
  query: ParsedPaginationQuery;
  organizerId?: string;
  includeAllOrganizers?: boolean;
}

type SortDirection = 1 | -1;
type EventSort = Record<string, SortDirection>;

const defaultPaginationQuery: ParsedPaginationQuery = {
  page: 1,
  limit: 10,
  skip: 0,
};

const eventStatuses: IEvent["status"][] = [
  "draft",
  "published",
  "cancelled",
];

const getEventSort = (sort?: string): EventSort => {
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

const getDateBoundary = (
  value: string | undefined,
  endOfDay: boolean
) => {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  date.setHours(
    endOfDay ? 23 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 999 : 0
  );

  return date;
};

const buildEventFilter = (
  query: ParsedPaginationQuery,
  organizerId?: string,
  includeAllOrganizers = false
) => {
  const filter: QueryFilter<IEvent> = {};

  if (organizerId && !includeAllOrganizers) {
    filter.organizer = organizerId;
  }

  if (query.search) {
    const searchRegex = new RegExp(
      escapeRegExp(query.search),
      "i"
    );

    filter.$or = [
      { title: searchRegex },
      { description: searchRegex },
      { category: searchRegex },
      { venue: searchRegex },
    ];
  }

  if (
    query.category &&
    query.category.toLowerCase() !== "all"
  ) {
    filter.category = new RegExp(
      `^${escapeRegExp(query.category)}$`,
      "i"
    );
  }

  if (query.status && query.status.toLowerCase() !== "all") {
    const normalizedStatus = query.status.toLowerCase();

    if (
      eventStatuses.includes(
        normalizedStatus as IEvent["status"]
      )
    ) {
      filter.status = normalizedStatus as IEvent["status"];
    }
  }

  if (query.location) {
    filter.venue = new RegExp(
      escapeRegExp(query.location),
      "i"
    );
  }

  if (
    query.minPrice !== undefined ||
    query.maxPrice !== undefined
  ) {
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

export const createEventService = async (
  data: CreateEventInput,
  organizerId: string
) => {
  const event = await Event.create({
    title: data.title,
    description: data.description,
    category: data.category,
    venue: data.venue,

    eventDate: new Date(data.eventDate),

    startTime: data.startTime,
    endTime: data.endTime,

    ticketPrice: data.ticketPrice,
    totalTickets: data.totalTickets,
    availableTickets: data.totalTickets,

    bannerImage: data.bannerImage || "",

    organizer: organizerId,
    status: "published",
  });

  const populatedEvent = await Event.findById(event._id).populate(
    "organizer",
    "firstName lastName email profileImage"
  );

  return {
    message: "Event created successfully.",
    event: populatedEvent,
  };
};


export const getAllEventsService = async (
  options?: GetAllEventsServiceOptions
): Promise<PaginatedApiResponse<IEvent>> => {
  const query = options?.query || defaultPaginationQuery;
  const filter = buildEventFilter(
    query,
    options?.organizerId,
    options?.includeAllOrganizers
  );

  const [events, totalItems] = await Promise.all([
    Event.find(filter)
    .populate("organizer", "firstName lastName email profileImage")
    .sort(getEventSort(query.sort))
    .skip(query.skip)
    .limit(query.limit),
    Event.countDocuments(filter),
  ]);

  return {
    success: true,
    message: "Events fetched successfully.",
    data: events,
    pagination: buildPaginationMetadata(
      query.page,
      query.limit,
      totalItems
    ),
  };
};


export const getEventByIdService = async (eventId: string) => {
  const event = await Event.findById(eventId).populate(
    "organizer",
    "firstName lastName email profileImage"
  );

  if (!event) {
    throw new Error("Event not found.");
  }

  return event;
};

export const updateEventService = async (
  eventId: string,
  organizerId: string,
  role: string,
  data: CreateEventInput
) => {
  const event = await Event.findById(eventId);

  if (!event) {
    throw new Error("Event not found.");
  }

  if (
    role !== "admin" &&
    event.organizer.toString() !== organizerId
  ) {
    throw new Error("You can only edit your own events.");
  }

  const soldTickets = Math.max(
    event.totalTickets - event.availableTickets,
    0
  );

  if (data.totalTickets < soldTickets) {
    throw new Error(
      `Total tickets cannot be less than already sold tickets (${soldTickets}).`
    );
  }

  event.title = data.title;
  event.description = data.description;
  event.category = data.category;
  event.venue = data.venue;
  event.eventDate = new Date(data.eventDate);
  event.startTime = data.startTime;
  event.endTime = data.endTime;
  event.ticketPrice = data.ticketPrice;
  event.totalTickets = data.totalTickets;
  event.availableTickets = data.totalTickets - soldTickets;
  event.bannerImage = data.bannerImage || "";

  await event.save();

  const updatedEvent = await Event.findById(event._id).populate(
    "organizer",
    "firstName lastName email profileImage"
  );

  return {
    message: "Event updated successfully.",
    event: updatedEvent,
  };
};
