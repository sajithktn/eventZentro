import { QueryFilter, Types } from "mongoose";
import {
  PaginatedApiResponse,
} from "../interfaces/pagination.interface";
import { IBooking } from "../interfaces/booking.interface";
import Booking from "../models/booking.model";
import Event from "../models/event.model";
import User from "../models/user.models";
import {
  buildPaginationMetadata,
  escapeRegExp,
  ParsedPaginationQuery,
} from "../utils/pagination";

type SortDirection = 1 | -1;
type BookingSort = Record<string, SortDirection>;

const defaultPaginationQuery: ParsedPaginationQuery = {
  page: 1,
  limit: 10,
  skip: 0,
};

const getBookingSort = (sort?: string): BookingSort => {
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

const getMatchingEventIds = async (
  searchRegex: RegExp,
  eventIds?: Types.ObjectId[]
) => {
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

const getMatchingUserIds = async (searchRegex: RegExp) => {
  const users = await User.find({
    $or: [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { email: searchRegex },
    ],
  }).select("_id");

  return users.map((user) => user._id);
};

const applyBookingStatusFilter = (
  filter: QueryFilter<IBooking>,
  status?: string
) => {
  if (!status || status.toLowerCase() === "all") {
    return;
  }

  filter.status = status.toLowerCase() as IBooking["status"];
};

const getEmptyPaginatedBookings = (
  query: ParsedPaginationQuery,
  message: string
): PaginatedApiResponse<IBooking> => ({
  success: true,
  message,
  data: [],
  pagination: buildPaginationMetadata(query.page, query.limit, 0),
});

const createBookingCode = () =>
  `EZ-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 7)
    .toUpperCase()}`;

export const createBookingService = async (
  eventId: string,
  userId: string,
  quantity: number
) => {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error("Ticket quantity must be at least 1.");
  }

  const event = await Event.findById(eventId);

  if (!event) {
    throw new Error("Event not found.");
  }

  if (event.status !== "published") {
    throw new Error("This event is not available for booking.");
  }

  if (event.availableTickets < quantity) {
    throw new Error("Not enough tickets available.");
  }

  event.availableTickets -= quantity;
  await event.save();

  const booking = await Booking.create({
    user: userId,
    event: event._id,
    quantity,
    totalAmount: quantity * event.ticketPrice,
    bookingCode: createBookingCode(),
  });

  const populatedBooking = await booking.populate([
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
  ]);

  return {
    booking: populatedBooking,
    event,
  };
};

export const getMyBookingsService = async (
  userId: string,
  query = defaultPaginationQuery
): Promise<PaginatedApiResponse<IBooking>> => {
  const filter: QueryFilter<IBooking> = { user: userId };

  applyBookingStatusFilter(filter, query.status);

  if (query.search) {
    const searchRegex = new RegExp(
      escapeRegExp(query.search),
      "i"
    );
    const eventIds = await getMatchingEventIds(searchRegex);
    const searchFilters: QueryFilter<IBooking>[] = [
      { bookingCode: searchRegex },
    ];

    if (eventIds.length > 0) {
      searchFilters.push({ event: { $in: eventIds } });
    }

    filter.$or = searchFilters;
  }

  const [bookings, totalItems] = await Promise.all([
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
    pagination: buildPaginationMetadata(
      query.page,
      query.limit,
      totalItems
    ),
  };
};

export const getOrganizerBookingsService = async (
  organizerId: string,
  includeAll: boolean,
  query = defaultPaginationQuery
): Promise<PaginatedApiResponse<IBooking>> => {
  const events = await Event.find(
    includeAll ? {} : { organizer: organizerId }
  ).select("_id");

  const eventIds = events.map((event) => event._id);

  if (eventIds.length === 0) {
    return getEmptyPaginatedBookings(
      query,
      "Bookings fetched successfully."
    );
  }

  const filter: QueryFilter<IBooking> = {
    event: { $in: eventIds },
  };

  applyBookingStatusFilter(filter, query.status);

  if (query.search) {
    const searchRegex = new RegExp(
      escapeRegExp(query.search),
      "i"
    );

    const [matchingEventIds, matchingUserIds] =
      await Promise.all([
        getMatchingEventIds(searchRegex, eventIds),
        getMatchingUserIds(searchRegex),
      ]);

    const searchFilters: QueryFilter<IBooking>[] = [
      { bookingCode: searchRegex },
    ];

    if (matchingEventIds.length > 0) {
      searchFilters.push({
        event: { $in: matchingEventIds },
      });
    }

    if (matchingUserIds.length > 0) {
      searchFilters.push({
        user: { $in: matchingUserIds },
      });
    }

    filter.$or = searchFilters;
  }

  const [bookings, totalItems] = await Promise.all([
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
    pagination: buildPaginationMetadata(
      query.page,
      query.limit,
      totalItems
    ),
  };
};
