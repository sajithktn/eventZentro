import {
  isValidObjectId,
  QueryFilter,
  Types,
} from "mongoose";
import {
  PaginatedApiResponse,
} from "../interfaces/pagination.interface";
import { IBooking } from "../interfaces/booking.interface";
import { IEvent } from "../interfaces/event.interface";
import Booking from "../models/booking.model";
import Category from "../models/category.model";
import Promotion from "../models/coupon.model";
import Event from "../models/event.model";
import {
  getBestPromotionSummariesForEvents,
} from "./coupon.service";
import {
  buildPaginationMetadata,
  escapeRegExp,
  ParsedPaginationQuery,
} from "../utils/pagination";
import { CreateEventInput } from "../validators/event.validators";
import {
  deleteImageFromCloudinary,
} from "./cloudinary.service";
import {
  deactivateFeaturedRequestsForEvent,
} from "./featuredEvent.service";
import {
  completePublishedEventIfEnded,
} from "./eventLifecycle.service";
import {
  getStartOfDay,
  hasEventEnded,
} from "../utils/eventLifecycle";


interface GetAllEventsServiceOptions {
  query: ParsedPaginationQuery;
  organizerId?: string;
  includeAllOrganizers?: boolean;
  onlyUpcoming?: boolean;
}

type EventResponse = IEvent & {
  bestPromotion?: IEvent["bestPromotion"];
};

export class EventServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "EventServiceError";
    this.statusCode = statusCode;
  }
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
  "completed",
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

const addFilterCondition = (
  filter: QueryFilter<IEvent>,
  condition: QueryFilter<IEvent>
) => {
  filter.$and = [
    ...(filter.$and || []),
    condition,
  ];
};

const getCleanLocationString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const getActiveCategoryNameOrThrow = async (
  categoryName: string
) => {
  const cleanedCategoryName = categoryName.trim();

  if (!cleanedCategoryName) {
    throw new EventServiceError(
      "Event category is required.",
      400
    );
  }

  const category = await Category.findOne({
    name: {
      $regex: `^${escapeRegExp(cleanedCategoryName)}$`,
      $options: "i",
    },
    isActive: true,
  }).select("name");

  if (!category) {
    throw new EventServiceError(
      "Selected category is invalid or inactive.",
      400
    );
  }

  return category.name;
};

type ReferenceId =
  | string
  | Types.ObjectId
  | {
      _id?: string | Types.ObjectId | null;
    };

const getReferenceIdString = (
  value: ReferenceId | null | undefined,
  label: string
) => {
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

const getObjectIdOrThrow = (
  value: string,
  label: string
) => {
  if (!isValidObjectId(value)) {
    throw new EventServiceError(`Invalid ${label}.`, 400);
  }

  return new Types.ObjectId(value);
};

const getPopulatedEventById = async (
  eventId: string | Types.ObjectId
) =>
  Event.findById(eventId).populate(
    "organizer",
    "firstName lastName email profileImage"
  );

const withBestPromotions = async (
  events: IEvent[]
) => {
  const bestPromotions =
    await getBestPromotionSummariesForEvents(
      events.map((event) => ({
        _id: event._id,
        ticketPrice: event.ticketPrice,
      }))
    );

  return events.map((event) => {
    const object = event.toObject() as EventResponse;

    object.bestPromotion =
      bestPromotions.get(event._id.toString()) || null;

    return object;
  });
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
      { city: searchRegex },
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

  if (
    query.status &&
    query.status.toLowerCase() !== "all"
  ) {
    const normalizedStatus = query.status.toLowerCase();

    if (
      eventStatuses.includes(
        normalizedStatus as IEvent["status"]
      )
    ) {
      filter.status =
        normalizedStatus as IEvent["status"];
    }
  }

  if (
    query.location &&
    query.location.toLowerCase() !== "all"
  ) {
    const escapedLocation = escapeRegExp(
      query.location
    );

    addFilterCondition(filter, {
      $or: [
        {
          city: new RegExp(
            `^${escapedLocation}$`,
            "i"
          ),
        },
        {
          venue: new RegExp(
            escapedLocation,
            "i"
          ),
        },
      ],
    });
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

  const dateFrom = getDateBoundary(
    query.dateFrom,
    false
  );

  const dateTo = getDateBoundary(
    query.dateTo,
    true
  );

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
  const categoryName =
    await getActiveCategoryNameOrThrow(data.category);
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
    bannerImagePublicId:
      data.bannerImagePublicId || "",

    organizer: organizerId,
    status: hasEventEnded(eventDate, data.endTime)
      ? "completed"
      : "published",
  });

  const populatedEvent = await Event.findById(
    event._id
  ).populate(
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
): Promise<PaginatedApiResponse<EventResponse>> => {
  const query =
    options?.query || defaultPaginationQuery;

  const filter = buildEventFilter(
    query,
    options?.organizerId,
    options?.includeAllOrganizers
  );

  if (options?.onlyUpcoming) {
    const now = new Date();

    addFilterCondition(filter, {
      status: "published",
      eventDate: {
        $gte: getStartOfDay(now),
      },
    });

    const matchingEvents = await Event.find(filter)
      .populate(
        "organizer",
        "firstName lastName email profileImage"
      )
      .sort(getEventSort(query.sort));

    const upcomingEvents = matchingEvents.filter(
      (event) =>
        !hasEventEnded(
          event.eventDate,
          event.endTime,
          now
        )
    );

    const events = upcomingEvents.slice(
      query.skip,
      query.skip + query.limit
    );

    const eventData = await withBestPromotions(events);

    return {
      success: true,
      message: "Events fetched successfully.",
      data: eventData,
      pagination: buildPaginationMetadata(
        query.page,
        query.limit,
        upcomingEvents.length
      ),
    };
  }

  const [events, totalItems] = await Promise.all([
    Event.find(filter)
      .populate(
        "organizer",
        "firstName lastName email profileImage"
      )
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
    pagination: buildPaginationMetadata(
      query.page,
      query.limit,
      totalItems
    ),
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
    if (
      hasEventEnded(
        event.eventDate,
        event.endTime,
        now
      )
    ) {
      return;
    }

    const location =
      getCleanLocationString(event.city) ||
      getCleanLocationString(event.venue);

    const locationKey = location.toLowerCase();

    if (!location || locationMap.has(locationKey)) {
      return;
    }

    locationMap.set(locationKey, location);
  });

  return [...locationMap.values()].sort(
    (firstLocation, secondLocation) =>
      firstLocation.localeCompare(secondLocation)
  );
};

export const getEventByIdService = async (
  eventId: string
) => {
  const eventObjectId = getObjectIdOrThrow(
    eventId,
    "event ID"
  );

  const event =
    await getPopulatedEventById(eventObjectId);

  if (!event) {
    throw new EventServiceError(
      "Event not found.",
      404
    );
  }

  await completePublishedEventIfEnded(event);

  const [eventData] =
    await withBestPromotions([event]);

  return eventData;
};

export const getOrganizerEventByIdService = async (
  eventId: string,
  organizerId: string,
  role: string
) => {
  const eventObjectId = getObjectIdOrThrow(
    eventId,
    "event ID"
  );

  const event =
    await getPopulatedEventById(eventObjectId);

  if (!event) {
    throw new EventServiceError(
      "Event not found.",
      404
    );
  }

  if (
    role !== "admin" &&
    getReferenceIdString(
      event.organizer,
      "Organizer ID"
    ) !== organizerId
  ) {
    throw new EventServiceError(
      "You can only access your own events.",
      403
    );
  }

  await completePublishedEventIfEnded(event);

  const [eventData] =
    await withBestPromotions([event]);

  return eventData;
};

export const getOrganizerDashboardService = async (
  organizerId: string
) => {
  const organizerObjectId = getObjectIdOrThrow(
    organizerId,
    "organizer ID"
  );

  const eventFilter: QueryFilter<IEvent> = {
    organizer: organizerObjectId,
  };

  const [statusCounts, ownedEvents, recentEvents] =
    await Promise.all([
      Event.aggregate<{
        _id: IEvent["status"];
        count: number;
      }>([
        {
          $match: {
            organizer: organizerObjectId,
          },
        },
        {
          $group: {
            _id: "$status",
            count: {
              $sum: 1,
            },
          },
        },
      ]),

      Event.find(eventFilter).select("_id"),

      Event.find(eventFilter)
        .populate(
          "organizer",
          "firstName lastName email profileImage"
        )
        .sort({
          createdAt: -1,
        })
        .limit(4),
    ]);

  const eventIds = ownedEvents.map(
    (event) => event._id
  );

  const bookingMatch: QueryFilter<IBooking> | null =
    eventIds.length > 0
      ? {
          event: {
            $in: eventIds,
          },
          status: "confirmed" as IBooking["status"],
          paymentStatus:
            "paid" as IBooking["paymentStatus"],
        }
      : null;

  const [bookingStats, recentBookings] =
    bookingMatch
      ? await Promise.all([
          Booking.aggregate<{
            _id: null;
            totalBookings: number;
            totalTicketsSold: number;
            totalGrossRevenue: number;
            totalAdminCommission: number;
            totalOrganizerEarnings: number;
          }>([
            {
              $match: bookingMatch,
            },
            {
              $group: {
                _id: null,

                totalBookings: {
                  $sum: 1,
                },

                totalTicketsSold: {
                  $sum: {
                    $ifNull: [
                      "$ticketCount",
                      "$quantity",
                    ],
                  },
                },

                totalGrossRevenue: {
                  $sum: {
                    $cond: [
                      {
                        $gt: [
                          {
                            $ifNull: [
                              "$amountPaid",
                              0,
                            ],
                          },
                          0,
                        ],
                      },
                      "$amountPaid",
                      {
                        $ifNull: [
                          "$finalAmount",
                          "$totalAmount",
                        ],
                      },
                    ],
                  },
                },

                totalAdminCommission: {
                  $sum: {
                    $ifNull: [
                      "$adminCommissionAmount",
                      {
                        $ifNull: [
                          "$adminCommission",
                          0,
                        ],
                      },
                    ],
                  },
                },

                totalOrganizerEarnings: {
                  $sum: {
                    $ifNull: [
                      "$organizerEarnings",
                      {
                        $subtract: [
                          {
                            $cond: [
                              {
                                $gt: [
                                  {
                                    $ifNull: [
                                      "$amountPaid",
                                      0,
                                    ],
                                  },
                                  0,
                                ],
                              },
                              "$amountPaid",
                              {
                                $ifNull: [
                                  "$finalAmount",
                                  "$totalAmount",
                                ],
                              },
                            ],
                          },
                          {
                            $ifNull: [
                              "$adminCommissionAmount",
                              {
                                $ifNull: [
                                  "$adminCommission",
                                  0,
                                ],
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                },
              },
            },
          ]),

          Booking.find(bookingMatch)
            .populate(
              "user",
              "firstName lastName email"
            )
            .populate({
              path: "event",
              populate: {
                path: "organizer",
                select:
                  "firstName lastName email",
              },
            })
            .sort({
              createdAt: -1,
            })
            .limit(5),
        ])
      : [[], []];

  const statusMap = statusCounts.reduce<
    Record<IEvent["status"], number>
  >(
    (counts, item) => ({
      ...counts,
      [item._id]: item.count,
    }),
    {
      draft: 0,
      published: 0,
      cancelled: 0,
      completed: 0,
    }
  );

  const stats = bookingStats[0] || {
    totalBookings: 0,
    totalTicketsSold: 0,
    totalGrossRevenue: 0,
    totalAdminCommission: 0,
    totalOrganizerEarnings: 0,
  };

  return {
    success: true,
    message:
      "Organizer dashboard fetched successfully.",
    statistics: {
      totalEvents: ownedEvents.length,
      publishedEvents: statusMap.published,
      draftEvents: statusMap.draft,
      cancelledEvents: statusMap.cancelled,
      completedEvents: statusMap.completed,
      totalTicketsSold: stats.totalTicketsSold,
      totalBookings: stats.totalBookings,
      totalRevenue: stats.totalGrossRevenue,
      totalGrossRevenue: stats.totalGrossRevenue,
      totalAdminCommission:
        stats.totalAdminCommission,
      totalOrganizerEarnings:
        stats.totalOrganizerEarnings,
    },
    recentEvents: await withBestPromotions(
      recentEvents
    ),
    recentBookings,
  };
};

export const updateEventService = async (
  eventId: string,
  organizerId: string,
  role: string,
  data: CreateEventInput
) => {
  const eventObjectId = getObjectIdOrThrow(
    eventId,
    "event ID"
  );

  const event = await Event.findById(eventObjectId);

  if (!event) {
    throw new EventServiceError(
      "Event not found.",
      404
    );
  }

  if (
    role !== "admin" &&
    getReferenceIdString(
      event.organizer,
      "Organizer ID"
    ) !== organizerId
  ) {
    throw new EventServiceError(
      "You can only edit your own events.",
      403
    );
  }

  const soldTickets = Math.max(
    event.totalTickets - event.availableTickets,
    0
  );

  if (data.totalTickets < soldTickets) {
    throw new EventServiceError(
      `Total tickets cannot be less than already sold tickets (${soldTickets}).`,
      400
    );
  }

  let categoryName = event.category;

  const currentCategory =
    event.category.trim().toLowerCase();

  const selectedCategory =
    data.category.trim().toLowerCase();

  if (currentCategory !== selectedCategory) {
    categoryName =
      await getActiveCategoryNameOrThrow(
        data.category
      );
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

  if (
    event.status === "published" &&
    hasEventEnded(
      event.eventDate,
      event.endTime
    )
  ) {
    event.status = "completed";
  }

  const previousBannerPublicId =
    event.bannerImagePublicId || "";

  const hasBannerImage =
    Object.prototype.hasOwnProperty.call(
      data,
      "bannerImage"
    );

  const hasBannerImagePublicId =
    Object.prototype.hasOwnProperty.call(
      data,
      "bannerImagePublicId"
    );

  const nextBannerImage = hasBannerImage
    ? data.bannerImage?.trim() || ""
    : event.bannerImage || "";

  const nextBannerImagePublicId =
    hasBannerImagePublicId
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
    await deactivateFeaturedRequestsForEvent(
      event._id,
      "expired"
    );
  }

  const updatedEvent = await Event.findById(
    event._id
  ).populate(
    "organizer",
    "firstName lastName email profileImage"
  );

  if (
    previousBannerPublicId &&
    hasBannerImage &&
    hasBannerImagePublicId &&
    previousBannerPublicId !==
      nextBannerImagePublicId
  ) {
    try {
      await deleteImageFromCloudinary(
        previousBannerPublicId
      );
    } catch (error) {
      console.error(
        "Failed to delete previous event banner:",
        error
      );
    }
  }

  return {
    message: "Event updated successfully.",
    event: updatedEvent,
  };
};

export const deleteEventService = async (
  eventId: string,
  organizerId: string,
  role: string
) => {
  const eventObjectId = getObjectIdOrThrow(
    eventId,
    "event ID"
  );

  const event = await Event.findById(eventObjectId);

  if (!event) {
    throw new EventServiceError(
      "Event not found.",
      404
    );
  }

  if (
    role !== "admin" &&
    getReferenceIdString(
      event.organizer,
      "Organizer ID"
    ) !== organizerId
  ) {
    throw new EventServiceError(
      "You can only delete your own events.",
      403
    );
  }

  const bookingCount =
    await Booking.countDocuments({
      event: eventObjectId,
    });

  if (bookingCount > 0) {
    throw new EventServiceError(
      "This event has booking history and cannot be deleted.",
      409
    );
  }

  await Promotion.updateMany(
    {
      event: eventObjectId,
      isDeleted: false,
    },
    {
      $set: {
        isDeleted: true,
        status: "inactive",
        isActive: false,
      },
    }
  );

  await deactivateFeaturedRequestsForEvent(
    eventObjectId,
    "cancelled"
  );

  const bannerImagePublicId =
    event.bannerImagePublicId || "";

  await event.deleteOne();

  if (bannerImagePublicId) {
    try {
      await deleteImageFromCloudinary(
        bannerImagePublicId
      );
    } catch (error) {
      console.error(
        "Failed to delete event banner:",
        error
      );
    }
  }

  return {
    success: true,
    message: "Event deleted successfully.",
    eventId,
  };
};
