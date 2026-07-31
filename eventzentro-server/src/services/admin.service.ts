import {
  isValidObjectId,
  QueryFilter,
  Types,
} from "mongoose";

import Booking from "../models/booking.model";
import Promotion from "../models/coupon.model";
import Event from "../models/event.model";
import User from "../models/user.models";
import { IBooking } from "../interfaces/booking.interface";
import { IPromotion } from "../interfaces/coupon.interface";
import { IEvent } from "../interfaces/event.interface";
import {
  IUser,
  UserRole,
} from "../interfaces/user.interface";
import {
  ParsedPaginationQuery,
} from "../utils/pagination";
import {
  redeemPromotionReservation,
  releasePromotionReservationByBooking,
  restoreRedeemedPromotionReservation,
} from "./coupon.service";
import Category from "../models/category.model";

interface RevenueResult {
  _id: null;
  totalRevenue: number;
  totalAdminCommission: number;
  totalOrganizerEarnings: number;
}

interface BookingSummaryResult {
  _id: null;
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  totalSpent: number;
}

interface AdminUsersQuery
  extends ParsedPaginationQuery {
  role?: string;
}

interface AdminEventsQuery
  extends ParsedPaginationQuery {
  organizer?: string;
}

interface AdminBookingsQuery
  extends ParsedPaginationQuery {
  eventId?: string;
  userId?: string;
  paymentStatus?: string;
}

interface AdminPromotionsQuery
  extends ParsedPaginationQuery {
  eventId?: string;
  organizer?: string;
  promotionMode?: string;
}

const defaultPaginationQuery: AdminUsersQuery = {
  page: 1,
  limit: 10,
  skip: 0,
};

const adminUserFields = [
  "firstName",
  "lastName",
  "email",
  "profileImage",
  "bio",
  "role",
  "provider",
  "isVerified",
  "isBlocked",
  "isDeleted",
  "address",
  "lastLogin",
  "createdAt",
  "updatedAt",
].join(" ");

export class AdminServiceError extends Error {
  statusCode: number;

  constructor(
    message: string,
    statusCode = 400
  ) {
    super(message);
    this.name = "AdminServiceError";
    this.statusCode = statusCode;
  }
}

const escapeRegExp = (value: string) => {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
};

const normalizeCategoryName = (value: string) => {
  return value.trim().replace(/\s+/g, " ");
};

const createCategorySlug = (value: string) => {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const buildPagination = (
  page: number,
  limit: number,
  totalItems: number
) => {
  const totalPages = Math.max(
    Math.ceil(totalItems / limit),
    1
  );

  return {
    currentPage: page,
    totalPages,
    totalItems,
    itemsPerPage: limit,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
};

const eventStatuses: IEvent["status"][] = [
  "draft",
  "published",
  "cancelled",
];

const bookingStatuses: IBooking["status"][] = [
  "pending",
  "confirmed",
  "cancelled",
];

const paymentStatuses: IBooking["paymentStatus"][] = [
  "unpaid",
  "pending",
  "verifying",
  "paid",
  "failed",
  "refunded",
];

const promotionStatuses: IPromotion["status"][] = [
  "active",
  "inactive",
  "expired",
];

const promotionModes: IPromotion["promotionMode"][] = [
  "coupon",
  "automatic",
];

const isEventStatus = (
  status: string
): status is IEvent["status"] =>
  status === "draft" ||
  status === "published" ||
  status === "cancelled";

const isBookingStatus = (
  status: string
): status is IBooking["status"] =>
  status === "pending" ||
  status === "confirmed" ||
  status === "cancelled";

const isPaymentStatus = (
  status: string
): status is IBooking["paymentStatus"] =>
  status === "unpaid" ||
  status === "pending" ||
  status === "verifying" ||
  status === "paid" ||
  status === "failed" ||
  status === "refunded";

const isPromotionStatus = (
  status: string
): status is IPromotion["status"] =>
  status === "active" ||
  status === "inactive" ||
  status === "expired";

const isPromotionMode = (
  mode: string
): mode is IPromotion["promotionMode"] =>
  mode === "coupon" || mode === "automatic";

const getObjectIdOrThrow = (
  value: string,
  label: string
) => {
  if (!isValidObjectId(value)) {
    throw new AdminServiceError(
      `Invalid ${label}.`,
      400
    );
  }

  return new Types.ObjectId(value);
};

const getBookingTicketCount = (
  booking: IBooking
) => booking.ticketCount || booking.quantity;

const eventPopulate = {
  path: "organizer",
  select:
    "firstName lastName email profileImage",
};

const bookingPopulate = [
  {
    path: "user",
    select: "firstName lastName email profileImage",
  },
  {
    path: "event",
    select:
      "title category city venue eventDate ticketPrice totalTickets availableTickets status bannerImage organizer",
    populate: {
      path: "organizer",
      select: "firstName lastName email",
    },
  },
];

const promotionPopulate = [
  {
    path: "event",
    select:
      "title city venue eventDate ticketPrice totalTickets availableTickets status bannerImage",
  },
  {
    path: "organizer",
    select: "firstName lastName email profileImage",
  },
];

const getUserByIdOrThrow = async (
  userId: string
) => {
  if (!isValidObjectId(userId)) {
    throw new AdminServiceError(
      "Invalid user ID.",
      400
    );
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new AdminServiceError(
      "User not found.",
      404
    );
  }

  return user;
};

const getSafeUserById = async (
  userId: string
) => {
  const user = await User.findById(userId).select(
    adminUserFields
  );

  if (!user) {
    throw new AdminServiceError(
      "User not found.",
      404
    );
  }

  return user;
};

const ensureUserCanBeManaged = (
  targetUser: IUser,
  adminId: string
) => {
  if (
    targetUser._id.toString() === adminId
  ) {
    throw new AdminServiceError(
      "You cannot perform this action on your own admin account.",
      403
    );
  }

  if (targetUser.role === UserRole.ADMIN) {
    throw new AdminServiceError(
      "Admin accounts cannot be modified from user management.",
      403
    );
  }
};

const ensureUserIsNotDeleted = (
  user: IUser
) => {
  if (user.isDeleted) {
    throw new AdminServiceError(
      "Restore this user before performing this action.",
      400
    );
  }
};

const createUsersFilter = (
  query: AdminUsersQuery,
  requiredRole?: UserRole
): QueryFilter<IUser> => {
  const filter: QueryFilter<IUser> = {};

  if (query.status === "deleted") {
    filter.isDeleted = true;
  } else {
    filter.isDeleted = false;

    if (query.status === "active") {
      filter.isBlocked = false;
    }

    if (query.status === "blocked") {
      filter.isBlocked = true;
    }
  }

  if (requiredRole) {
    filter.role = requiredRole;
  } else if (
    query.role &&
    query.role !== "all" &&
    Object.values(UserRole).includes(
      query.role as UserRole
    )
  ) {
    filter.role = query.role as UserRole;
  }

  if (query.search) {
    const searchRegex = new RegExp(
      escapeRegExp(query.search.trim()),
      "i"
    );

    filter.$or = [
      {
        firstName: searchRegex,
      },
      {
        lastName: searchRegex,
      },
      {
        email: searchRegex,
      },
    ];
  }

  return filter;
};

export const getAdminDashboardService =
  async () => {
    const [
      totalUsers,
      totalOrganizers,
      totalEvents,
      totalBookings,
      revenueResult,
    ] = await Promise.all([
      User.countDocuments({
        isDeleted: false,
      }),

      User.countDocuments({
        role: UserRole.ORGANIZER,
        isDeleted: false,
      }),

      Event.countDocuments(),

      Booking.countDocuments(),

      Booking.aggregate<RevenueResult>([
        {
          $match: {
            status: "confirmed",
            paymentStatus: "paid",
          },
        },
        {
          $group: {
            _id: null,

            totalRevenue: {
              $sum: "$totalAmount",
            },

            totalAdminCommission: {
              $sum: "$adminCommissionAmount",
            },

            totalOrganizerEarnings: {
              $sum: "$organizerEarnings",
            },
          },
        },
      ]),
    ]);

    return {
      totalUsers,
      totalOrganizers,
      totalEvents,
      totalBookings,

      totalRevenue:
        revenueResult[0]?.totalRevenue || 0,

      totalAdminCommission:
        revenueResult[0]?.totalAdminCommission || 0,

      totalOrganizerEarnings:
        revenueResult[0]?.totalOrganizerEarnings || 0,
    };
  };

export const getAdminUsersService = async (
  query: AdminUsersQuery =
    defaultPaginationQuery
) => {
  const filter = createUsersFilter(query);

  const [users, totalItems] =
    await Promise.all([
      User.find(filter)
        .select(adminUserFields)
        .sort({
          createdAt: -1,
        })
        .skip(query.skip)
        .limit(query.limit),

      User.countDocuments(filter),
    ]);

  return {
    success: true,
    message:
      "Users fetched successfully.",
    users,
    pagination: buildPagination(
      query.page,
      query.limit,
      totalItems
    ),
  };
};

export const getAdminOrganizersService =
  async (
    query: AdminUsersQuery =
      defaultPaginationQuery
  ) => {
    const filter = createUsersFilter(
      query,
      UserRole.ORGANIZER
    );

    const [organizers, totalItems] =
      await Promise.all([
        User.find(filter)
          .select(adminUserFields)
          .sort({
            createdAt: -1,
          })
          .skip(query.skip)
          .limit(query.limit),

        User.countDocuments(filter),
      ]);

    return {
      success: true,
      message:
        "Organizers fetched successfully.",
      organizers,
      pagination: buildPagination(
        query.page,
        query.limit,
        totalItems
      ),
    };
  };

export const getAdminUserDetailsService =
  async (userId: string) => {
    if (!isValidObjectId(userId)) {
      throw new AdminServiceError(
        "Invalid user ID.",
        400
      );
    }

    const objectId = new Types.ObjectId(
      userId
    );

    const [
      user,
      bookings,
      bookingSummary,
    ] = await Promise.all([
      User.findById(userId).select(
        adminUserFields
      ),

      Booking.find({
        user: objectId,
      })
        .populate({
          path: "event",
          select:
            "title venue eventDate status ticketPrice bannerImage",
        })
        .sort({
          createdAt: -1,
        })
        .limit(20),

      Booking.aggregate<BookingSummaryResult>([
        {
          $match: {
            user: objectId,
          },
        },
        {
          $group: {
            _id: null,

            totalBookings: {
              $sum: 1,
            },

            confirmedBookings: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$status",
                      "confirmed",
                    ],
                  },
                  1,
                  0,
                ],
              },
            },

            cancelledBookings: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$status",
                      "cancelled",
                    ],
                  },
                  1,
                  0,
                ],
              },
            },

            totalSpent: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$status",
                      "confirmed",
                    ],
                  },
                  "$totalAmount",
                  0,
                ],
              },
            },
          },
        },
      ]),
    ]);

    if (!user) {
      throw new AdminServiceError(
        "User not found.",
        404
      );
    }

    const summary = bookingSummary[0] || {
      totalBookings: 0,
      confirmedBookings: 0,
      cancelledBookings: 0,
      totalSpent: 0,
    };

    return {
      user,
      bookings,
      summary: {
        totalBookings:
          summary.totalBookings,
        confirmedBookings:
          summary.confirmedBookings,
        cancelledBookings:
          summary.cancelledBookings,
        totalSpent: summary.totalSpent,
      },
    };
  };

export const blockAdminUserService =
  async (
    userId: string,
    adminId: string
  ) => {
    const targetUser =
      await getUserByIdOrThrow(userId);

    ensureUserCanBeManaged(
      targetUser,
      adminId
    );

    ensureUserIsNotDeleted(targetUser);

    targetUser.isBlocked = true;

    await targetUser.save();

    return getSafeUserById(userId);
  };

export const unblockAdminUserService =
  async (
    userId: string,
    adminId: string
  ) => {
    const targetUser =
      await getUserByIdOrThrow(userId);

    ensureUserCanBeManaged(
      targetUser,
      adminId
    );

    ensureUserIsNotDeleted(targetUser);

    targetUser.isBlocked = false;

    await targetUser.save();

    return getSafeUserById(userId);
  };

export const verifyAdminUserService =
  async (
    userId: string,
    adminId: string
  ) => {
    const targetUser =
      await getUserByIdOrThrow(userId);

    ensureUserCanBeManaged(
      targetUser,
      adminId
    );

    ensureUserIsNotDeleted(targetUser);

    targetUser.isVerified = true;

    await targetUser.save();

    return getSafeUserById(userId);
  };

export const changeAdminUserRoleService =
  async (
    userId: string,
    role: string,
    adminId: string
  ) => {
    if (
      role !== UserRole.USER &&
      role !== UserRole.ORGANIZER
    ) {
      throw new AdminServiceError(
        "Role must be user or organizer.",
        400
      );
    }

    const targetUser =
      await getUserByIdOrThrow(userId);

    ensureUserCanBeManaged(
      targetUser,
      adminId
    );

    ensureUserIsNotDeleted(targetUser);

    targetUser.role = role;

    await targetUser.save();

    return getSafeUserById(userId);
  };

export const softDeleteAdminUserService =
  async (
    userId: string,
    adminId: string
  ) => {
    const targetUser =
      await getUserByIdOrThrow(userId);

    ensureUserCanBeManaged(
      targetUser,
      adminId
    );

    if (targetUser.isDeleted) {
      throw new AdminServiceError(
        "This user is already deleted.",
        400
      );
    }

    targetUser.isDeleted = true;

    await targetUser.save();

    return getSafeUserById(userId);
  };

export const restoreAdminUserService =
  async (
    userId: string,
    adminId: string
  ) => {
    const targetUser =
      await getUserByIdOrThrow(userId);

    ensureUserCanBeManaged(
      targetUser,
      adminId
    );

    if (!targetUser.isDeleted) {
      throw new AdminServiceError(
        "This user is not deleted.",
        400
      );
    }

    targetUser.isDeleted = false;

    await targetUser.save();

    return getSafeUserById(userId);
  };

const getAdminEventSort = (
  sort?: string
): Record<string, 1 | -1> => {
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

const getAdminBookingSort = (
  sort?: string
): Record<string, 1 | -1> => {
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

const getAdminPromotionSort = (
  sort?: string
): Record<string, 1 | -1> => {
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

const getMatchingAdminEventIds = async (
  searchRegex: RegExp
) => {
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

const getMatchingAdminUserIds = async (
  searchRegex: RegExp
) => {
  const users = await User.find({
    $or: [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { email: searchRegex },
    ],
  }).select("_id");

  return users.map((user) => user._id);
};

const getPopulatedAdminEvent = async (
  eventId: string | Types.ObjectId
) => {
  const event = await Event.findById(eventId).populate(
    eventPopulate
  );

  if (!event) {
    throw new AdminServiceError(
      "Event not found.",
      404
    );
  }

  return event;
};

const getPopulatedAdminBooking = async (
  bookingId: string | Types.ObjectId
) => {
  const booking = await Booking.findById(bookingId)
    .select("-razorpaySignature")
    .populate(bookingPopulate);

  if (!booking) {
    throw new AdminServiceError(
      "Booking not found.",
      404
    );
  }

  return booking;
};

const getPopulatedAdminPromotion = async (
  promotionId: string | Types.ObjectId
) => {
  const promotion = await Promotion.findById(
    promotionId
  ).populate(promotionPopulate);

  if (!promotion || promotion.isDeleted) {
    throw new AdminServiceError(
      "Promotion not found.",
      404
    );
  }

  return promotion;
};

const buildAdminEventFilter = (
  query: AdminEventsQuery
): QueryFilter<IEvent> => {
  const filter: QueryFilter<IEvent> = {};

  if (
    query.status &&
    query.status.toLowerCase() !== "all"
  ) {
    const status = query.status.toLowerCase();

    if (!isEventStatus(status)) {
      throw new AdminServiceError(
        `Event status must be one of ${eventStatuses.join(", ")}.`,
        400
      );
    }

    filter.status = status;
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
    query.organizer &&
    query.organizer !== "all" &&
    query.organizer !== "me"
  ) {
    filter.organizer = getObjectIdOrThrow(
      query.organizer,
      "organizer ID"
    );
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

  return filter;
};

const buildAdminPromotionFilter = async (
  query: AdminPromotionsQuery
): Promise<QueryFilter<IPromotion>> => {
  const filter: QueryFilter<IPromotion> = {
    isDeleted: false,
  };

  if (
    query.status &&
    query.status.toLowerCase() !== "all"
  ) {
    const status = query.status.toLowerCase();

    if (!isPromotionStatus(status)) {
      throw new AdminServiceError(
        `Promotion status must be one of ${promotionStatuses.join(", ")}.`,
        400
      );
    }

    filter.status = status;
  }

  if (
    query.promotionMode &&
    query.promotionMode.toLowerCase() !== "all"
  ) {
    const promotionMode =
      query.promotionMode.toLowerCase();

    if (!isPromotionMode(promotionMode)) {
      throw new AdminServiceError(
        `Promotion mode must be one of ${promotionModes.join(", ")}.`,
        400
      );
    }

    filter.promotionMode = promotionMode;
  }

  if (query.eventId) {
    filter.event = getObjectIdOrThrow(
      query.eventId,
      "event ID"
    );
  }

  if (
    query.organizer &&
    query.organizer !== "all" &&
    query.organizer !== "me"
  ) {
    filter.organizer = getObjectIdOrThrow(
      query.organizer,
      "organizer ID"
    );
  }

  if (query.search) {
    const searchRegex = new RegExp(
      escapeRegExp(query.search),
      "i"
    );

    const eventIds =
      await getMatchingAdminEventIds(searchRegex);

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

const buildAdminBookingFilter = async (
  query: AdminBookingsQuery
): Promise<QueryFilter<IBooking>> => {
  const filter: QueryFilter<IBooking> = {};

  if (
    query.status &&
    query.status.toLowerCase() !== "all"
  ) {
    const status = query.status.toLowerCase();

    if (!isBookingStatus(status)) {
      throw new AdminServiceError(
        `Booking status must be one of ${bookingStatuses.join(", ")}.`,
        400
      );
    }

    filter.status = status;
  }

  if (
    query.paymentStatus &&
    query.paymentStatus.toLowerCase() !== "all"
  ) {
    const paymentStatus =
      query.paymentStatus.toLowerCase();

    if (!isPaymentStatus(paymentStatus)) {
      throw new AdminServiceError(
        `Payment status must be one of ${paymentStatuses.join(", ")}.`,
        400
      );
    }

    filter.paymentStatus = paymentStatus;
  }

  if (query.eventId) {
    filter.event = getObjectIdOrThrow(
      query.eventId,
      "event ID"
    );
  }

  if (query.userId) {
    filter.user = getObjectIdOrThrow(
      query.userId,
      "user ID"
    );
  }

  if (query.search) {
    const searchRegex = new RegExp(
      escapeRegExp(query.search),
      "i"
    );

    const [eventIds, userIds] =
      await Promise.all([
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

export const getAdminEventsService = async (
  query: AdminEventsQuery =
    defaultPaginationQuery
) => {
  const filter = buildAdminEventFilter(query);

  const [events, totalItems] =
    await Promise.all([
      Event.find(filter)
        .populate(eventPopulate)
        .sort(getAdminEventSort(query.sort))
        .skip(query.skip)
        .limit(query.limit),

      Event.countDocuments(filter),
    ]);

  return {
    success: true,
    message:
      "Admin events fetched successfully.",
    data: events,
    events,
    pagination: buildPagination(
      query.page,
      query.limit,
      totalItems
    ),
  };
};

export const getAdminEventByIdService =
  async (eventId: string) => {
    getObjectIdOrThrow(
      eventId,
      "event ID"
    );

    return getPopulatedAdminEvent(
      eventId
    );
  };

export const updateAdminEventStatusService =
  async (
    eventId: string,
    status: string
  ) => {
    getObjectIdOrThrow(
      eventId,
      "event ID"
    );

    const normalizedStatus =
      status.toLowerCase();

    if (
      !isEventStatus(
        normalizedStatus
      )
    ) {
      throw new AdminServiceError(
        `Event status must be one of ${eventStatuses.join(", ")}.`,
        400
      );
    }

    const event =
      await Event.findById(
        eventId
      );

    if (!event) {
      throw new AdminServiceError(
        "Event not found.",
        404
      );
    }

    event.status =
      normalizedStatus;

    await event.save();

    return getPopulatedAdminEvent(
      event._id
    );
  };

export const deleteAdminEventService =
  async (eventId: string) => {
    const eventObjectId =
      getObjectIdOrThrow(
        eventId,
        "event ID"
      );

    const event =
      await Event.findById(
        eventObjectId
      );

    if (!event) {
      throw new AdminServiceError(
        "Event not found.",
        404
      );
    }

    const [
      bookingCount,
      activeBookingCount,
    ] = await Promise.all([
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

    if (
      activeBookingCount > 0
    ) {
      throw new AdminServiceError(
        "This event has active bookings and cannot be permanently deleted. Cancel the event instead.",
        409
      );
    }

    if (bookingCount > 0) {
      throw new AdminServiceError(
        "This event has booking history and cannot be permanently deleted. Cancel the event instead.",
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

    await event.deleteOne();

    return {
      success: true,
      message:
        "Event deleted successfully.",
      eventId,
    };
  };

export const getAdminBookingsService =
  async (
    query: AdminBookingsQuery =
      defaultPaginationQuery
  ) => {
    const filter =
      await buildAdminBookingFilter(
        query
      );

    const [
      bookings,
      totalItems,
    ] = await Promise.all([
      Booking.find(filter)
        .select(
          "-razorpaySignature"
        )
        .populate(
          bookingPopulate
        )
        .sort(
          getAdminBookingSort(
            query.sort
          )
        )
        .skip(query.skip)
        .limit(query.limit),

      Booking.countDocuments(
        filter
      ),
    ]);

    return {
      success: true,
      message:
        "Admin bookings fetched successfully.",
      data: bookings,
      bookings,
      pagination:
        buildPagination(
          query.page,
          query.limit,
          totalItems
        ),
    };
  };

export const getAdminBookingByIdService =
  async (bookingId: string) => {
    getObjectIdOrThrow(
      bookingId,
      "booking ID"
    );

    return getPopulatedAdminBooking(
      bookingId
    );
  };

const cancelAdminBooking = async (
  booking: IBooking
) => {
  if (
    booking.status ===
    "cancelled"
  ) {
    return {
      booking:
        await getPopulatedAdminBooking(
          booking._id
        ),
      message:
        "Booking is already cancelled.",
    };
  }

  const previousStatus =
    booking.status;

  const ticketCount =
    getBookingTicketCount(
      booking
    );

  if (
    previousStatus ===
    "confirmed"
  ) {
    const event =
      await Event.findById(
        booking.event
      );

    if (!event) {
      throw new AdminServiceError(
        "Related event was not found.",
        404
      );
    }

    await Event.findByIdAndUpdate(
      event._id,
      {
        $inc: {
          availableTickets:
            ticketCount,
        },
      }
    );

    if (
      booking.promotionReservation
    ) {
      await restoreRedeemedPromotionReservation(
        booking.promotionReservation,
        booking._id
      );
    }
  } else {
    await releasePromotionReservationByBooking(
      booking._id
    );
  }

  booking.status =
    "cancelled";

  if (
    booking.paymentStatus !==
      "paid" &&
    booking.paymentStatus !==
      "refunded"
  ) {
    booking.paymentStatus =
      "failed";
  }

  await booking.save();

  return {
    booking:
      await getPopulatedAdminBooking(
        booking._id
      ),
    message:
      "Booking cancelled successfully.",
  };
};

const confirmAdminBooking = async (
  booking: IBooking
) => {
  if (
    booking.status ===
    "confirmed"
  ) {
    return {
      booking:
        await getPopulatedAdminBooking(
          booking._id
        ),
      message:
        "Booking is already confirmed.",
    };
  }

  if (
    booking.status ===
    "cancelled"
  ) {
    throw new AdminServiceError(
      "Cancelled bookings cannot be confirmed.",
      409
    );
  }

  if (
    booking.paymentStatus !==
    "paid"
  ) {
    throw new AdminServiceError(
      "Only paid bookings can be confirmed.",
      409
    );
  }

  const event =
    await Event.findById(
      booking.event
    );

  if (!event) {
    throw new AdminServiceError(
      "Related event was not found.",
      404
    );
  }

  if (
    event.status ===
    "cancelled"
  ) {
    throw new AdminServiceError(
      "Bookings cannot be confirmed for a cancelled event.",
      409
    );
  }

  const ticketCount =
    getBookingTicketCount(
      booking
    );

  let ticketsClaimed = false;
  let promotionRedeemed = false;

  try {
    const updatedEvent =
      await Event.findOneAndUpdate(
        {
          _id: event._id,
          availableTickets: {
            $gte:
              ticketCount,
          },
        },
        {
          $inc: {
            availableTickets:
              -ticketCount,
          },
        },
        {
          new: true,
        }
      );

    if (!updatedEvent) {
      throw new AdminServiceError(
        "Not enough tickets are available.",
        409
      );
    }

    ticketsClaimed = true;

    if (
      booking.promotionReservation
    ) {
      await redeemPromotionReservation(
        booking.promotionReservation,
        booking._id
      );

      promotionRedeemed = true;
    }

    booking.status =
      "confirmed";

    booking.amountPaid =
      booking.finalAmount ??
      booking.totalAmount;

    booking.paidAt =
      booking.paidAt ||
      new Date();

    await booking.save();
  } catch (error) {
    if (ticketsClaimed) {
      await Event.findByIdAndUpdate(
        event._id,
        {
          $inc: {
            availableTickets:
              ticketCount,
          },
        }
      );
    }

    if (
      promotionRedeemed &&
      booking.promotionReservation
    ) {
      await restoreRedeemedPromotionReservation(
        booking.promotionReservation,
        booking._id
      );
    }

    throw error;
  }

  return {
    booking:
      await getPopulatedAdminBooking(
        booking._id
      ),
    message:
      "Booking confirmed successfully.",
  };
};

export const updateAdminBookingStatusService =
  async (
    bookingId: string,
    status: string
  ) => {
    getObjectIdOrThrow(
      bookingId,
      "booking ID"
    );

    const normalizedStatus =
      status.toLowerCase();

    if (
      !isBookingStatus(
        normalizedStatus
      )
    ) {
      throw new AdminServiceError(
        `Booking status must be one of ${bookingStatuses.join(", ")}.`,
        400
      );
    }

    const booking =
      await Booking.findById(
        bookingId
      );

    if (!booking) {
      throw new AdminServiceError(
        "Booking not found.",
        404
      );
    }

    if (
      normalizedStatus ===
      "cancelled"
    ) {
      return cancelAdminBooking(
        booking
      );
    }

    if (
      normalizedStatus ===
      "confirmed"
    ) {
      return confirmAdminBooking(
        booking
      );
    }

    if (
      booking.status !==
      "pending"
    ) {
      throw new AdminServiceError(
        "Only pending bookings can remain pending.",
        409
      );
    }

    return {
      booking:
        await getPopulatedAdminBooking(
          booking._id
        ),
      message:
        "Booking status is already pending.",
    };
  };

export const getAdminPromotionsService =
  async (
    query: AdminPromotionsQuery =
      defaultPaginationQuery
  ) => {
    const filter =
      await buildAdminPromotionFilter(
        query
      );

    const [
      promotions,
      totalItems,
    ] = await Promise.all([
      Promotion.find(filter)
        .populate(
          promotionPopulate
        )
        .sort(
          getAdminPromotionSort(
            query.sort
          )
        )
        .skip(query.skip)
        .limit(query.limit),

      Promotion.countDocuments(
        filter
      ),
    ]);

    return {
      success: true,
      message:
        "Admin promotions fetched successfully.",
      data: promotions,
      promotions,
      coupons: promotions,
      pagination:
        buildPagination(
          query.page,
          query.limit,
          totalItems
        ),
    };
  };

export const updateAdminPromotionStatusService =
  async (
    promotionId: string,
    status: string
  ) => {
    const promotionObjectId =
      getObjectIdOrThrow(
        promotionId,
        "promotion ID"
      );

    const normalizedStatus =
      status.toLowerCase();

    if (
      !isPromotionStatus(
        normalizedStatus
      )
    ) {
      throw new AdminServiceError(
        `Promotion status must be one of ${promotionStatuses.join(", ")}.`,
        400
      );
    }

    const promotion =
      await Promotion.findOne({
        _id:
          promotionObjectId,
        isDeleted: false,
      });

    if (!promotion) {
      throw new AdminServiceError(
        "Promotion not found.",
        404
      );
    }

    promotion.status =
      normalizedStatus;

    promotion.isActive =
      normalizedStatus ===
      "active";

    await promotion.save();

    return getPopulatedAdminPromotion(
      promotion._id
    );
  };

export const deleteAdminPromotionService =
  async (
    promotionId: string
  ) => {
    const promotionObjectId =
      getObjectIdOrThrow(
        promotionId,
        "promotion ID"
      );

    const promotion =
      await Promotion.findOne({
        _id:
          promotionObjectId,
        isDeleted: false,
      });

    if (!promotion) {
      throw new AdminServiceError(
        "Promotion not found.",
        404
      );
    }

    const bookingUsageCount =
      await Booking.countDocuments(
        {
          $or: [
            {
              coupon:
                promotionObjectId,
            },
            {
              "appliedPromotion.promotionId":
                promotionObjectId,
            },
          ],
        }
      );

    const hasRedeemedUsage =
      promotion.usedCount > 0 ||
      promotion
        .discountedTicketsUsed >
        0 ||
      bookingUsageCount > 0;

    if (hasRedeemedUsage) {
      throw new AdminServiceError(
        "This promotion has already been used and cannot be permanently deleted. Deactivate it instead.",
        409
      );
    }

    if (
      promotion
        .reservedUsageCount >
        0 ||
      promotion
        .discountedTicketsReserved >
        0
    ) {
      throw new AdminServiceError(
        "This promotion has active reservations and cannot be permanently deleted. Deactivate it instead.",
        409
      );
    }

    await Promotion.deleteOne({
      _id:
        promotionObjectId,
    });

    return {
      success: true,
      message:
        "Promotion deleted successfully.",
      promotionId,
    };
  };

  export const getAdminCategoriesService = async () => {
  const categories = await Category.find().sort({
    name: 1,
  });

  const categoriesWithEventCount =
    await Promise.all(
      categories.map(async (category) => {
        const eventsCount =
          await Event.countDocuments({
            category: new RegExp(
              `^${escapeRegExp(category.name)}$`,
              "i"
            ),
          });

        return {
          ...category.toObject(),
          eventsCount,
        };
      })
    );

  return {
    success: true,
    message: "Categories fetched successfully.",
    categories: categoriesWithEventCount,
  };
};

export const createAdminCategoryService = async (
  name: string
) => {
  const normalizedName =
    normalizeCategoryName(name);

  const slug =
    createCategorySlug(normalizedName);

  if (!slug) {
    throw new AdminServiceError(
      "Category name must contain letters or numbers.",
      400
    );
  }

  const existingCategory =
    await Category.findOne({
      $or: [
        {
          name: new RegExp(
            `^${escapeRegExp(normalizedName)}$`,
            "i"
          ),
        },
        {
          slug,
        },
      ],
    });

  if (existingCategory) {
    throw new AdminServiceError(
      "A category with this name already exists.",
      409
    );
  }

  const category = await Category.create({
    name: normalizedName,
    slug,
    isActive: true,
  });

  return category;
};

export const updateAdminCategoryService = async (
  categoryId: string,
  name: string
) => {
  const categoryObjectId =
    getObjectIdOrThrow(
      categoryId,
      "category ID"
    );

  const category =
    await Category.findById(
      categoryObjectId
    );

  if (!category) {
    throw new AdminServiceError(
      "Category not found.",
      404
    );
  }

  const normalizedName =
    normalizeCategoryName(name);

  const slug =
    createCategorySlug(normalizedName);

  if (!slug) {
    throw new AdminServiceError(
      "Category name must contain letters or numbers.",
      400
    );
  }

  const duplicateCategory =
    await Category.findOne({
      _id: {
        $ne: categoryObjectId,
      },

      $or: [
        {
          name: new RegExp(
            `^${escapeRegExp(normalizedName)}$`,
            "i"
          ),
        },
        {
          slug,
        },
      ],
    });

  if (duplicateCategory) {
    throw new AdminServiceError(
      "A category with this name already exists.",
      409
    );
  }

  const previousName = category.name;

  category.name = normalizedName;
  category.slug = slug;

  await category.save();

  if (
    previousName.toLowerCase() !==
    normalizedName.toLowerCase()
  ) {
    await Event.updateMany(
      {
        category: new RegExp(
          `^${escapeRegExp(previousName)}$`,
          "i"
        ),
      },
      {
        $set: {
          category: normalizedName,
        },
      }
    );
  }

  const eventsCount =
    await Event.countDocuments({
      category: new RegExp(
        `^${escapeRegExp(normalizedName)}$`,
        "i"
      ),
    });

  return {
    ...category.toObject(),
    eventsCount,
  };
};

export const updateAdminCategoryStatusService =
  async (
    categoryId: string,
    isActive: boolean
  ) => {
    const categoryObjectId =
      getObjectIdOrThrow(
        categoryId,
        "category ID"
      );

    const category =
      await Category.findByIdAndUpdate(
        categoryObjectId,
        {
          $set: {
            isActive,
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );

    if (!category) {
      throw new AdminServiceError(
        "Category not found.",
        404
      );
    }

    const eventsCount =
      await Event.countDocuments({
        category: new RegExp(
          `^${escapeRegExp(category.name)}$`,
          "i"
        ),
      });

    return {
      ...category.toObject(),
      eventsCount,
    };
  };

export const deleteAdminCategoryService =
  async (categoryId: string) => {
    const categoryObjectId =
      getObjectIdOrThrow(
        categoryId,
        "category ID"
      );

    const category =
      await Category.findById(
        categoryObjectId
      );

    if (!category) {
      throw new AdminServiceError(
        "Category not found.",
        404
      );
    }

    const eventsCount =
      await Event.countDocuments({
        category: new RegExp(
          `^${escapeRegExp(category.name)}$`,
          "i"
        ),
      });

    if (eventsCount > 0) {
      throw new AdminServiceError(
        `Cannot delete this category because ${eventsCount} event${
          eventsCount === 1 ? " is" : "s are"
        } using it. Disable it instead.`,
        409
      );
    }

    await category.deleteOne();

    return {
      success: true,
      message: "Category deleted successfully.",
      categoryId,
    };
  };