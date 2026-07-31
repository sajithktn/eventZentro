import {
  isValidObjectId,
  QueryFilter,
  Types,
} from "mongoose";

import {
  IPromotion,
  IPromotionSnapshot,
  PromotionDiscountType,
  PromotionEffectiveStatus,
  PromotionMode,
  PromotionStatus,
  PromotionVisibility,
} from "../interfaces/coupon.interface";
import {
  IPromotionReservation,
} from "../interfaces/promotionReservation.interface";
import {
  PaginatedApiResponse,
} from "../interfaces/pagination.interface";
import Booking from "../models/booking.model";
import Promotion from "../models/coupon.model";
import Event from "../models/event.model";
import PromotionReservation from "../models/promotionReservation.model";
import {
  buildPaginationMetadata,
  escapeRegExp,
  ParsedPaginationQuery,
} from "../utils/pagination";
import {
  CreateCouponInput,
  UpdateCouponInput,
} from "../validators/coupon.validators";

interface PromotionListOptions {
  organizerId: string;
  role: string;
  query: ParsedPaginationQuery;
  eventId?: string;
  status?: PromotionStatus | "exhausted";
  promotionMode?: PromotionMode;
  visibility?: PromotionVisibility;
  organizer?: string;
}

interface PromotionQuoteOptions {
  userId?: string;
  eventId: string;
  ticketCount: number;
  couponCode?: string;
}

interface PromotionCandidateResult {
  promotion: IPromotion;
  discountAmount: number;
  finalAmount: number;
  summary: PromotionSummary;
  reason: string;
}

interface ReservePromotionInput {
  bookingId: string | Types.ObjectId;
  userId: string | Types.ObjectId;
  eventId: string | Types.ObjectId;
  promotionId: string | Types.ObjectId;
  ticketCount: number;
  subtotalAmount: number;
  discountAmount: number;
}

type SortDirection = 1 | -1;
type PromotionSort = Record<string, SortDirection>;

export interface PromotionSummary {
  id: string;
  name: string;
  code?: string;
  promotionMode: PromotionMode;
  discountType: PromotionDiscountType;
  discountValue: number;
  displayText: string;
  remainingOfferTickets?: number;
}

export interface PublicPromotionDetails extends PromotionSummary {
  description?: string;
  minimumBookingAmount?: number;
  maximumDiscountAmount?: number;
  validFrom: Date;
  validUntil: Date;
  totalUsageLimit?: number;
  perUserUsageLimit?: number;
  firstNTickets?: number;
  maxTicketsPerBooking?: number;
  terms: string[];
}

export interface PromotionQuoteResult {
  success: true;
  message: string;
  subtotal: number;
  discountAmount: number;
  finalAmount: number;
  appliedPromotion: PromotionSummary | null;
  reason: string;
  bestOfferApplied: boolean;
  couponError?: string;
}

const defaultPaginationQuery: ParsedPaginationQuery = {
  page: 1,
  limit: 10,
  skip: 0,
};

const promotionPopulate = [
  {
    path: "event",
    select:
      "title eventDate ticketPrice totalTickets availableTickets status venue bannerImage",
  },
  {
    path: "organizer",
    select: "firstName lastName email profileImage",
  },
];

const reservationWindowMinutes = 15;

export const normalizeCouponCode = (code: string) => {
  return code.trim().toUpperCase();
};

export const roundMoney = (value: number) => {
  return Math.round((value + Number.EPSILON) * 100) / 100;
};

export const toRazorpayPaise = (amount: number) => {
  return Math.round(roundMoney(amount) * 100);
};

const isDuplicateKeyError = (error: unknown) => {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: number }).code === 11000
  );
};

const getPromotionSort = (sort?: string): PromotionSort => {
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

const ensureValidObjectId = (
  value: string,
  label: string
) => {
  if (!isValidObjectId(value)) {
    throw new Error(`Invalid ${label}.`);
  }
};

const getPromotionIdString = (
  value: string | Types.ObjectId
) => value.toString();

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

const getPromotionMode = (promotion: IPromotion): PromotionMode =>
  promotion.promotionMode || "coupon";

const getMinimumBookingAmount = (promotion: IPromotion) =>
  promotion.minimumBookingAmount ??
  promotion.minimumAmount ??
  0;

const getMaximumDiscountAmount = (promotion: IPromotion) =>
  promotion.maximumDiscountAmount ??
  promotion.maximumDiscount;

const getTotalUsageLimit = (promotion: IPromotion) =>
  promotion.totalUsageLimit ?? promotion.usageLimit;

const getManualStatus = (promotion: IPromotion): PromotionStatus => {
  if (promotion.status) {
    return promotion.status;
  }

  return promotion.isActive === false ? "inactive" : "active";
};

const getPromotionName = (promotion: IPromotion) =>
  promotion.name ||
  promotion.displayText ||
  promotion.code ||
  "Event offer";

const ensurePromotionName = (promotion: IPromotion) => {
  if (!promotion.name) {
    promotion.name = getPromotionName(promotion);
  }
};

const getReservedUsageCount = (promotion: IPromotion) =>
  promotion.reservedUsageCount || 0;

const getDiscountedTicketsReserved = (promotion: IPromotion) =>
  promotion.discountedTicketsReserved || 0;

const getDiscountedTicketsUsed = (promotion: IPromotion) =>
  promotion.discountedTicketsUsed || 0;

export const getRemainingOfferTickets = (promotion: IPromotion) => {
  if (!promotion.firstNTickets) {
    return undefined;
  }

  return Math.max(
    promotion.firstNTickets -
      getDiscountedTicketsReserved(promotion) -
      getDiscountedTicketsUsed(promotion),
    0
  );
};

export const getEffectivePromotionStatus = (
  promotion: IPromotion,
  now = new Date()
): PromotionEffectiveStatus => {
  if (promotion.isDeleted) {
    return "inactive";
  }

  const manualStatus = getManualStatus(promotion);

  if (manualStatus === "inactive" || promotion.isActive === false) {
    return "inactive";
  }

  if (manualStatus === "expired" || now > promotion.validUntil) {
    return "expired";
  }

  const usageLimit = getTotalUsageLimit(promotion);

  if (
    usageLimit &&
    promotion.usedCount + getReservedUsageCount(promotion) >=
      usageLimit
  ) {
    return "exhausted";
  }

  const remainingTickets = getRemainingOfferTickets(promotion);

  if (remainingTickets !== undefined && remainingTickets <= 0) {
    return "exhausted";
  }

  return "active";
};

const validatePromotionDateRange = (
  validFrom: Date,
  validUntil: Date
) => {
  if (validUntil <= validFrom) {
    throw new Error(
      "Valid until must be later than valid from."
    );
  }
};

const validatePromotionDiscount = (
  discountType: PromotionDiscountType,
  discountValue: number
) => {
  if (discountValue <= 0) {
    throw new Error(
      "Discount value must be greater than 0."
    );
  }

  if (discountType === "percentage" && discountValue > 100) {
    throw new Error(
      "Percentage discount cannot exceed 100."
    );
  }
};

const getEventForPromotionOrThrow = async (
  eventId: string,
  organizerId: string,
  role: string
) => {
  ensureValidObjectId(eventId, "event ID");

  const event = await Event.findById(eventId);

  if (!event) {
    throw new Error("Event not found.");
  }

  if (
    role !== "admin" &&
    getReferenceIdString(event.organizer, "Organizer ID") !==
      organizerId
  ) {
    throw new Error(
      "You can only manage promotions for your own events."
    );
  }

  return event;
};

const ensurePromotionAccess = (
  promotion: IPromotion,
  organizerId: string,
  role: string
) => {
  if (
    role !== "admin" &&
    getReferenceIdString(promotion.organizer, "Organizer ID") !==
      organizerId
  ) {
    throw new Error(
      "You can only manage your own promotions."
    );
  }
};

const getPromotionForOrganizerOrThrow = async (
  promotionId: string,
  organizerId: string,
  role: string
) => {
  ensureValidObjectId(promotionId, "promotion ID");

  const promotion = await Promotion.findOne({
    _id: promotionId,
    isDeleted: false,
  });

  if (!promotion) {
    throw new Error("Promotion not found.");
  }

  ensurePromotionAccess(promotion, organizerId, role);

  return promotion;
};

const getPopulatedPromotion = async (
  promotionId: string | Types.ObjectId
) => {
  const promotion = await Promotion.findById(
    promotionId
  ).populate(promotionPopulate);

  if (!promotion || promotion.isDeleted) {
    throw new Error("Promotion not found.");
  }

  return promotion;
};

const ensureUniqueCouponCode = async (
  code: string | undefined,
  promotionId?: string | Types.ObjectId
) => {
  if (!code) {
    return;
  }

  const duplicate = await Promotion.findOne({
    code,
    promotionMode: "coupon",
    isDeleted: false,
    ...(promotionId
      ? {
          _id: {
            $ne: promotionId,
          },
        }
      : {}),
  }).select("_id");

  if (duplicate) {
    throw new Error("A promotion with this coupon code already exists.");
  }
};

const buildPromotionFilter = (
  options: PromotionListOptions
) => {
  const filter: QueryFilter<IPromotion> = {
    isDeleted: false,
  };

  if (options.role !== "admin") {
    filter.organizer = options.organizerId;
  } else if (
    options.organizer &&
    options.organizer !== "all" &&
    options.organizer !== "me"
  ) {
    ensureValidObjectId(options.organizer, "organizer ID");
    filter.organizer = options.organizer;
  }

  if (options.eventId) {
    ensureValidObjectId(options.eventId, "event ID");
    filter.event = options.eventId;
  }

  if (
    options.status &&
    options.status !== "exhausted"
  ) {
    filter.status = options.status;
  }

  if (options.promotionMode) {
    filter.promotionMode = options.promotionMode;
  }

  if (options.visibility) {
    filter.visibility = options.visibility;
  }

  if (options.query.search) {
    const searchRegex = new RegExp(
      escapeRegExp(options.query.search),
      "i"
    );

    filter.$or = [
      {
        name: searchRegex,
      },
      {
        code: searchRegex,
      },
      {
        displayText: searchRegex,
      },
    ];
  }

  return filter;
};

export const calculatePromotionDiscount = (
  promotion: Pick<
    IPromotion,
    | "discountType"
    | "discountValue"
    | "maximumDiscountAmount"
    | "maximumDiscount"
  >,
  subtotal: number
) => {
  const rawDiscount =
    promotion.discountType === "percentage"
      ? (subtotal * promotion.discountValue) / 100
      : promotion.discountValue;

  const maximumDiscount =
    promotion.maximumDiscountAmount ??
    promotion.maximumDiscount;

  const limitedDiscount =
    promotion.discountType === "percentage" &&
    maximumDiscount
      ? Math.min(rawDiscount, maximumDiscount)
      : rawDiscount;

  return roundMoney(Math.min(limitedDiscount, subtotal));
};

export const getPromotionDisplayText = (
  promotion: Pick<
    IPromotion,
    | "displayText"
    | "discountType"
    | "discountValue"
    | "maximumDiscountAmount"
    | "maximumDiscount"
    | "firstNTickets"
  >
) => {
  if (promotion.displayText) {
    return promotion.displayText;
  }

  const discountText =
    promotion.discountType === "percentage"
      ? `${promotion.discountValue}% off`
      : `Rs. ${promotion.discountValue} off`;

  const maximumDiscount =
    promotion.maximumDiscountAmount ??
    promotion.maximumDiscount;

  const cappedText =
    promotion.discountType === "percentage" &&
    maximumDiscount
      ? `${discountText} up to Rs. ${maximumDiscount}`
      : discountText;

  if (promotion.firstNTickets) {
    return `${cappedText} · First ${promotion.firstNTickets} tickets`;
  }

  return cappedText;
};

const createPromotionSummary = (
  promotion: IPromotion
): PromotionSummary => {
  const remainingOfferTickets =
    getRemainingOfferTickets(promotion);

  return {
    id: promotion._id.toString(),
    name: getPromotionName(promotion),
    code:
      getPromotionMode(promotion) === "coupon"
        ? promotion.code
        : undefined,
    promotionMode: getPromotionMode(promotion),
    discountType: promotion.discountType,
    discountValue: promotion.discountValue,
    displayText: getPromotionDisplayText(promotion),
    ...(remainingOfferTickets !== undefined
      ? {
          remainingOfferTickets,
        }
      : {}),
  };
};

export const createPromotionSnapshot = (
  promotion: IPromotion
): IPromotionSnapshot => ({
  promotionId: promotion._id,
  name: getPromotionName(promotion),
  code:
    getPromotionMode(promotion) === "coupon"
      ? promotion.code
      : undefined,
  promotionMode: getPromotionMode(promotion),
  discountType: promotion.discountType,
  discountValue: promotion.discountValue,
  displayText: getPromotionDisplayText(promotion),
});

const buildPromotionTerms = (
  promotion: IPromotion
) => {
  const terms: string[] = [];
  const minimumBookingAmount =
    getMinimumBookingAmount(promotion);
  const maximumDiscountAmount =
    getMaximumDiscountAmount(promotion);

  if (minimumBookingAmount > 0) {
    terms.push(
      `Minimum booking value Rs. ${minimumBookingAmount}.`
    );
  }

  if (maximumDiscountAmount) {
    terms.push(
      `Maximum discount Rs. ${maximumDiscountAmount}.`
    );
  }

  if (promotion.maxTicketsPerBooking) {
    terms.push(
      `Maximum ${promotion.maxTicketsPerBooking} discounted tickets per booking.`
    );
  }

  if (promotion.perUserUsageLimit) {
    terms.push(
      `Limited to ${promotion.perUserUsageLimit} use per user.`
    );
  }

  if (promotion.firstNTickets) {
    terms.push(
      `Applies while the first ${promotion.firstNTickets} offer tickets remain.`
    );
  }

  terms.push("Offer cannot be combined with another promotion.");

  return terms;
};

const createPublicPromotionDetails = (
  promotion: IPromotion
): PublicPromotionDetails => ({
  ...createPromotionSummary(promotion),
  description: promotion.description,
  minimumBookingAmount:
    getMinimumBookingAmount(promotion) || undefined,
  maximumDiscountAmount: getMaximumDiscountAmount(promotion),
  validFrom: promotion.validFrom,
  validUntil: promotion.validUntil,
  totalUsageLimit: getTotalUsageLimit(promotion),
  perUserUsageLimit: promotion.perUserUsageLimit,
  firstNTickets: promotion.firstNTickets,
  maxTicketsPerBooking: promotion.maxTicketsPerBooking,
  terms: buildPromotionTerms(promotion),
});

const getUserPromotionUsageCount = async (
  userId: string | undefined,
  promotionId: Types.ObjectId,
  now: Date
) => {
  if (!userId) {
    return 0;
  }

  const [confirmedBookings, activeReservations] =
    await Promise.all([
      Booking.countDocuments({
        user: userId,
        status: "confirmed",
        $or: [
          {
            "appliedPromotion.promotionId": promotionId,
          },
          {
            coupon: promotionId,
          },
        ],
      }),
      PromotionReservation.countDocuments({
        user: userId,
        promotion: promotionId,
        status: "reserved",
        expiresAt: {
          $gt: now,
        },
      }),
    ]);

  return confirmedBookings + activeReservations;
};

const getPromotionIneligibilityReason = async (
  promotion: IPromotion,
  options: {
    subtotal: number;
    ticketCount: number;
    userId?: string;
    now: Date;
  }
) => {
  const status = getEffectivePromotionStatus(
    promotion,
    options.now
  );

  if (status !== "active") {
    return `This promotion is ${status}.`;
  }

  if (options.now < promotion.validFrom) {
    return "This promotion is not valid yet.";
  }

  if (options.now > promotion.validUntil) {
    return "This promotion has expired.";
  }

  const minimumBookingAmount =
    getMinimumBookingAmount(promotion);

  if (
    minimumBookingAmount > 0 &&
    options.subtotal < minimumBookingAmount
  ) {
    return `Minimum booking amount for this promotion is Rs. ${minimumBookingAmount}.`;
  }

  const usageLimit = getTotalUsageLimit(promotion);

  if (
    usageLimit &&
    promotion.usedCount + getReservedUsageCount(promotion) >=
      usageLimit
  ) {
    return "This promotion usage limit has been reached.";
  }

  if (
    promotion.maxTicketsPerBooking &&
    options.ticketCount > promotion.maxTicketsPerBooking
  ) {
    return `This promotion allows at most ${promotion.maxTicketsPerBooking} tickets per booking.`;
  }

  const remainingOfferTickets =
    getRemainingOfferTickets(promotion);

  if (
    remainingOfferTickets !== undefined &&
    options.ticketCount > remainingOfferTickets
  ) {
    return "Not enough offer tickets are available.";
  }

  if (promotion.perUserUsageLimit && options.userId) {
    const usageCount =
      await getUserPromotionUsageCount(
        options.userId,
        promotion._id,
        options.now
      );

    if (usageCount >= promotion.perUserUsageLimit) {
      return "You have already used this promotion.";
    }
  }

  return null;
};

const evaluatePromotionCandidate = async (
  promotion: IPromotion,
  options: {
    subtotal: number;
    ticketCount: number;
    userId?: string;
    now: Date;
  }
): Promise<PromotionCandidateResult | null> => {
  const reason = await getPromotionIneligibilityReason(
    promotion,
    options
  );

  if (reason) {
    return null;
  }

  const discountAmount = calculatePromotionDiscount(
    promotion,
    options.subtotal
  );

  return {
    promotion,
    discountAmount,
    finalAmount: roundMoney(options.subtotal - discountAmount),
    summary: createPromotionSummary(promotion),
    reason:
      getPromotionMode(promotion) === "coupon"
        ? "Coupon gives the best discount for this booking."
        : "Automatic offer gives the best discount for this booking.",
  };
};

const pickBestPromotion = (
  candidates: PromotionCandidateResult[]
) => {
  if (candidates.length === 0) {
    return null;
  }

  return [...candidates].sort((first, second) => {
    if (second.discountAmount !== first.discountAmount) {
      return second.discountAmount - first.discountAmount;
    }

    if (
      getPromotionMode(first.promotion) === "automatic" &&
      getPromotionMode(second.promotion) === "coupon"
    ) {
      return -1;
    }

    if (
      getPromotionMode(first.promotion) === "coupon" &&
      getPromotionMode(second.promotion) === "automatic"
    ) {
      return 1;
    }

    return (
      first.promotion.validUntil.getTime() -
      second.promotion.validUntil.getTime()
    );
  })[0];
};

const findAutomaticPromotionCandidates = async (
  eventId: string | Types.ObjectId,
  now: Date
) => {
  return Promotion.find({
    event: eventId,
    promotionMode: "automatic",
    visibility: "public",
    isDeleted: false,
    status: "active",
    validFrom: {
      $lte: now,
    },
    validUntil: {
      $gte: now,
    },
    isActive: {
      $ne: false,
    },
  }).sort({
    discountValue: -1,
    validUntil: 1,
  });
};

export const getPromotionQuoteService = async (
  options: PromotionQuoteOptions
): Promise<PromotionQuoteResult> => {
  ensureValidObjectId(options.eventId, "event ID");

  if (
    !Number.isInteger(options.ticketCount) ||
    options.ticketCount < 1
  ) {
    throw new Error("Ticket quantity must be at least 1.");
  }

  await releaseExpiredPromotionReservations();

  const event = await Event.findById(options.eventId);

  if (!event) {
    throw new Error("Event not found.");
  }

  if (event.status !== "published") {
    throw new Error("This event is not available for booking.");
  }

  if (event.availableTickets < options.ticketCount) {
    throw new Error("Not enough tickets available.");
  }

  const subtotal = roundMoney(
    event.ticketPrice * options.ticketCount
  );

  if (subtotal <= 0) {
    return {
      success: true,
      message: "No payment is required for this booking.",
      subtotal,
      discountAmount: 0,
      finalAmount: 0,
      appliedPromotion: null,
      reason: "Free events do not need promotions.",
      bestOfferApplied: false,
    };
  }

  const now = new Date();
  const automaticPromotions =
    await findAutomaticPromotionCandidates(
      event._id,
      now
    );

  const automaticResults = (
    await Promise.all(
      automaticPromotions.map((promotion) =>
        evaluatePromotionCandidate(promotion, {
          subtotal,
          ticketCount: options.ticketCount,
          userId: options.userId,
          now,
        })
      )
    )
  ).filter(
    (
      result
    ): result is PromotionCandidateResult => Boolean(result)
  );

  const bestAutomatic = pickBestPromotion(automaticResults);
  let couponResult: PromotionCandidateResult | null = null;
  let couponError: string | undefined;

  if (options.couponCode) {
    const normalizedCode = normalizeCouponCode(
      options.couponCode
    );

    const coupon = await Promotion.findOne({
      event: event._id,
      code: normalizedCode,
      promotionMode: "coupon",
      isDeleted: false,
    });

    if (!coupon) {
      couponError = "Invalid coupon code.";
    } else {
      const reason = await getPromotionIneligibilityReason(
        coupon,
        {
          subtotal,
          ticketCount: options.ticketCount,
          userId: options.userId,
          now,
        }
      );

      if (reason) {
        couponError = reason;
      } else {
        couponResult = await evaluatePromotionCandidate(
          coupon,
          {
            subtotal,
            ticketCount: options.ticketCount,
            userId: options.userId,
            now,
          }
        );
      }
    }
  }

  const applied = pickBestPromotion(
    [bestAutomatic, couponResult].filter(
      (
        result
      ): result is PromotionCandidateResult => Boolean(result)
    )
  );

  if (!applied) {
    if (couponError) {
      throw new Error(couponError);
    }

    return {
      success: true,
      message: "No eligible promotion is available.",
      subtotal,
      discountAmount: 0,
      finalAmount: subtotal,
      appliedPromotion: null,
      reason: "No active discount applies to this booking.",
      bestOfferApplied: false,
    };
  }

  const bestOfferApplied =
    bestAutomatic?.promotion._id.toString() ===
    applied.promotion._id.toString();

  const message = couponError
    ? "Automatic offer applied. The coupon could not be applied."
    : "Promotion applied successfully.";

  return {
    success: true,
    message,
    subtotal,
    discountAmount: applied.discountAmount,
    finalAmount: applied.finalAmount,
    appliedPromotion: applied.summary,
    reason: applied.reason,
    bestOfferApplied,
    ...(couponError ? { couponError } : {}),
  };
};

export const getOrganizerCouponsService = async (
  options: PromotionListOptions
): Promise<PaginatedApiResponse<IPromotion>> => {
  const query = options.query || defaultPaginationQuery;
  const filter = buildPromotionFilter({
    ...options,
    query,
  });

  const [promotions, totalItems] = await Promise.all([
    Promotion.find(filter)
      .populate(promotionPopulate)
      .sort(getPromotionSort(query.sort))
      .skip(query.skip)
      .limit(query.limit),
    Promotion.countDocuments(filter),
  ]);

  const filteredPromotions =
    options.status === "exhausted"
      ? promotions.filter(
          (promotion) =>
            getEffectivePromotionStatus(promotion) === "exhausted"
        )
      : promotions;

  return {
    success: true,
    message: "Promotions fetched successfully.",
    data: filteredPromotions,
    pagination: buildPaginationMetadata(
      query.page,
      query.limit,
      totalItems
    ),
  };
};

export const getCouponByIdService = async (
  promotionId: string,
  organizerId: string,
  role: string
) => {
  const promotion =
    await getPromotionForOrganizerOrThrow(
      promotionId,
      organizerId,
      role
    );

  return getPopulatedPromotion(promotion._id);
};

export const createCouponService = async (
  organizerId: string,
  role: string,
  data: CreateCouponInput
) => {
  const event = await getEventForPromotionOrThrow(
    data.eventId,
    organizerId,
    role
  );

  validatePromotionDiscount(
    data.discountType,
    data.discountValue
  );

  const validFrom = new Date(data.validFrom);
  const validUntil = new Date(data.validUntil);

  validatePromotionDateRange(validFrom, validUntil);

  const normalizedCode =
    data.promotionMode === "coupon" && data.code
      ? normalizeCouponCode(data.code)
      : undefined;

  await ensureUniqueCouponCode(normalizedCode);

  try {
    const promotion = await Promotion.create({
      organizer: event.organizer,
      event: event._id,
      name: data.name,
      description: data.description,
      code: normalizedCode,
      promotionMode: data.promotionMode,
      discountType: data.discountType,
      discountValue: data.discountValue,
      minimumBookingAmount: data.minimumBookingAmount,
      maximumDiscountAmount:
        data.discountType === "percentage"
          ? data.maximumDiscountAmount
          : undefined,
      totalUsageLimit: data.totalUsageLimit,
      perUserUsageLimit: data.perUserUsageLimit,
      firstNTickets: data.firstNTickets,
      maxTicketsPerBooking: data.maxTicketsPerBooking,
      validFrom,
      validUntil,
      status:
        data.isActive === false ? "inactive" : data.status,
      visibility: data.visibility,
      displayText: data.displayText,
      isDeleted: false,
      isActive:
        data.isActive ?? data.status !== "inactive",
      minimumAmount: data.minimumBookingAmount,
      maximumDiscount:
        data.discountType === "percentage"
          ? data.maximumDiscountAmount
          : undefined,
      usageLimit: data.totalUsageLimit,
    });

    return getPopulatedPromotion(promotion._id);
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new Error(
        "A promotion with this coupon code already exists."
      );
    }

    throw error;
  }
};

export const updateCouponService = async (
  promotionId: string,
  organizerId: string,
  role: string,
  data: UpdateCouponInput
) => {
  const promotion =
    await getPromotionForOrganizerOrThrow(
      promotionId,
      organizerId,
      role
    );

  if (data.eventId) {
    const event = await getEventForPromotionOrThrow(
      data.eventId,
      organizerId,
      role
    );

    promotion.event = event._id as Types.ObjectId;
    promotion.organizer = event.organizer;
  }

  if (data.name) {
    promotion.name = data.name;
  } else if (!promotion.name) {
    promotion.name =
      promotion.code || promotion.displayText || "Event offer";
  }

  if (data.description !== undefined) {
    promotion.description = data.description;
  }

  if (data.promotionMode) {
    promotion.promotionMode = data.promotionMode;
  }

  if (data.promotionMode === "automatic") {
    promotion.code = undefined;
  }

  if (
    (data.promotionMode === "coupon" ||
      getPromotionMode(promotion) === "coupon") &&
    data.code
  ) {
    const normalizedCode = normalizeCouponCode(data.code);
    await ensureUniqueCouponCode(normalizedCode, promotion._id);
    promotion.code = normalizedCode;
  }

  if (getPromotionMode(promotion) === "coupon" && !promotion.code) {
    throw new Error("Coupon code is required for coupon promotions.");
  }

  if (data.discountType) {
    promotion.discountType = data.discountType;
  }

  if (typeof data.discountValue === "number") {
    promotion.discountValue = data.discountValue;
  }

  if (typeof data.minimumBookingAmount === "number") {
    promotion.minimumBookingAmount = data.minimumBookingAmount;
    promotion.minimumAmount = data.minimumBookingAmount;
  }

  if (typeof data.totalUsageLimit === "number") {
    if (
      data.totalUsageLimit <
      promotion.usedCount + getReservedUsageCount(promotion)
    ) {
      throw new Error(
        "Total usage limit cannot be less than existing reserved and redeemed usage."
      );
    }

    promotion.totalUsageLimit = data.totalUsageLimit;
    promotion.usageLimit = data.totalUsageLimit;
  }

  if (typeof data.perUserUsageLimit === "number") {
    promotion.perUserUsageLimit = data.perUserUsageLimit;
  }

  if (typeof data.firstNTickets === "number") {
    if (
      data.firstNTickets <
      getDiscountedTicketsReserved(promotion) +
        getDiscountedTicketsUsed(promotion)
    ) {
      throw new Error(
        "First-N ticket limit cannot be less than already reserved or redeemed offer tickets."
      );
    }

    promotion.firstNTickets = data.firstNTickets;
  }

  if (typeof data.maxTicketsPerBooking === "number") {
    promotion.maxTicketsPerBooking =
      data.maxTicketsPerBooking;
  }

  if (data.validFrom) {
    promotion.validFrom = new Date(data.validFrom);
  }

  if (data.validUntil) {
    promotion.validUntil = new Date(data.validUntil);
  }

  if (data.status) {
    promotion.status = data.status;
    promotion.isActive = data.status !== "inactive";
  }

  if (typeof data.isActive === "boolean") {
    promotion.status = data.isActive ? "active" : "inactive";
    promotion.isActive = data.isActive;
  }

  if (data.visibility) {
    promotion.visibility = data.visibility;
  }

  if (data.displayText !== undefined) {
    promotion.displayText = data.displayText;
  }

  validatePromotionDiscount(
    promotion.discountType,
    promotion.discountValue
  );
  validatePromotionDateRange(
    promotion.validFrom,
    promotion.validUntil
  );

  if (
    promotion.discountType === "percentage" &&
    typeof data.maximumDiscountAmount === "number"
  ) {
    promotion.maximumDiscountAmount = data.maximumDiscountAmount;
    promotion.maximumDiscount = data.maximumDiscountAmount;
  }

  if (promotion.discountType === "fixed") {
    promotion.maximumDiscountAmount = undefined;
    promotion.maximumDiscount = undefined;
  }

  try {
    await promotion.save();

    return getPopulatedPromotion(promotion._id);
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new Error(
        "A promotion with this coupon code already exists."
      );
    }

    throw error;
  }
};

export const updateCouponStatusService = async (
  promotionId: string,
  organizerId: string,
  role: string,
  statusOrActive: PromotionStatus | boolean
) => {
  const promotion =
    await getPromotionForOrganizerOrThrow(
      promotionId,
      organizerId,
      role
    );

  const status =
    typeof statusOrActive === "boolean"
      ? statusOrActive
        ? "active"
        : "inactive"
      : statusOrActive;

  ensurePromotionName(promotion);
  promotion.status = status;
  promotion.isActive = status !== "inactive";

  await promotion.save();

  return getPopulatedPromotion(promotion._id);
};

export const deleteCouponService = async (
  promotionId: string,
  organizerId: string,
  role: string
) => {
  const promotion =
    await getPromotionForOrganizerOrThrow(
      promotionId,
      organizerId,
      role
    );

  ensurePromotionName(promotion);
  promotion.isDeleted = true;
  promotion.status = "inactive";
  promotion.isActive = false;

  await promotion.save();

  return {
    message: "Promotion deleted successfully.",
    coupon: await getPopulatedPromotion(promotion._id).catch(
      () => null
    ),
  };
};

export const validateCouponForEvent = async (
  eventId: string,
  code: string,
  _amount?: number,
  userId?: string,
  ticketCount = 1
) => {
  const result = await getPromotionQuoteService({
    eventId,
    couponCode: code,
    userId,
    ticketCount,
  });

  if (
    !result.appliedPromotion ||
    result.appliedPromotion.promotionMode !== "coupon"
  ) {
    throw new Error(
      result.couponError || "This coupon was not the best available offer."
    );
  }

  return {
    success: true as const,
    message: result.message,
    coupon: {
      id: result.appliedPromotion.id,
      code: result.appliedPromotion.code || normalizeCouponCode(code),
      discountType: result.appliedPromotion.discountType,
      discountValue: result.appliedPromotion.discountValue,
    },
    couponId: new Types.ObjectId(result.appliedPromotion.id),
    couponCode: result.appliedPromotion.code || normalizeCouponCode(code),
    originalAmount: result.subtotal,
    discountAmount: result.discountAmount,
    finalAmount: result.finalAmount,
  };
};

export const incrementCouponUsage = async (
  promotionId: string | Types.ObjectId
) => {
  await Promotion.findByIdAndUpdate(promotionId, {
    $inc: {
      usedCount: 1,
    },
  });
};

export const getPublicPromotionsForEventService = async (
  eventId: string
) => {
  ensureValidObjectId(eventId, "event ID");

  await releaseExpiredPromotionReservations();

  const now = new Date();
  const promotions = await Promotion.find({
    event: eventId,
    isDeleted: false,
    visibility: "public",
    status: "active",
    validFrom: {
      $lte: now,
    },
    validUntil: {
      $gte: now,
    },
    isActive: {
      $ne: false,
    },
  }).sort({
    promotionMode: 1,
    discountValue: -1,
    validUntil: 1,
  });

  return promotions
    .filter(
      (promotion) =>
        getEffectivePromotionStatus(promotion, now) === "active"
    )
    .map(createPublicPromotionDetails);
};

export const getBestPromotionSummariesForEvents = async (
  events: Array<{
    _id: Types.ObjectId;
    ticketPrice: number;
  }>
) => {
  if (events.length === 0) {
    return new Map<string, PromotionSummary | null>();
  }

  const now = new Date();
  const eventIds = events.map((event) => event._id);
  const eventPriceMap = new Map(
    events.map((event) => [
      event._id.toString(),
      event.ticketPrice,
    ])
  );

  const promotions = await Promotion.find({
    event: {
      $in: eventIds,
    },
    isDeleted: false,
    visibility: "public",
    status: "active",
    validFrom: {
      $lte: now,
    },
    validUntil: {
      $gte: now,
    },
    isActive: {
      $ne: false,
    },
  });

  const grouped = new Map<string, PromotionCandidateResult[]>();

  promotions.forEach((promotion) => {
    if (getEffectivePromotionStatus(promotion, now) !== "active") {
      return;
    }

    const eventId = promotion.event.toString();
    const subtotal = eventPriceMap.get(eventId) || 0;
    const discountAmount =
      subtotal > 0
        ? calculatePromotionDiscount(promotion, subtotal)
        : 0;

    const candidate: PromotionCandidateResult = {
      promotion,
      discountAmount,
      finalAmount: roundMoney(subtotal - discountAmount),
      summary: createPromotionSummary(promotion),
      reason: "Best public promotion for this event.",
    };

    grouped.set(eventId, [
      ...(grouped.get(eventId) || []),
      candidate,
    ]);
  });

  const summaryMap = new Map<string, PromotionSummary | null>();

  events.forEach((event) => {
    const best = pickBestPromotion(
      grouped.get(event._id.toString()) || []
    );

    summaryMap.set(
      event._id.toString(),
      best ? best.summary : null
    );
  });

  return summaryMap;
};

const buildPromotionReservationFilter = (
  promotion: IPromotion,
  ticketCount: number,
  now: Date
): QueryFilter<IPromotion> => {
  const expressions: QueryFilter<IPromotion>[] = [];
  const usageLimit = getTotalUsageLimit(promotion);

  if (usageLimit) {
    expressions.push({
      $expr: {
        $lte: [
          {
            $add: [
              {
                $ifNull: ["$usedCount", 0],
              },
              {
                $ifNull: ["$reservedUsageCount", 0],
              },
              1,
            ],
          },
          {
            $ifNull: ["$totalUsageLimit", "$usageLimit"],
          },
        ],
      },
    });
  }

  if (promotion.firstNTickets) {
    expressions.push({
      $expr: {
        $lte: [
          {
            $add: [
              {
                $ifNull: ["$discountedTicketsReserved", 0],
              },
              {
                $ifNull: ["$discountedTicketsUsed", 0],
              },
              ticketCount,
            ],
          },
          "$firstNTickets",
        ],
      },
    });
  }

  return {
    _id: promotion._id,
    isDeleted: false,
    status: "active",
    validFrom: {
      $lte: now,
    },
    validUntil: {
      $gte: now,
    },
    isActive: {
      $ne: false,
    },
    ...(expressions.length > 0
      ? {
          $and: expressions,
        }
      : {}),
  };
};

const rollbackPromotionReservationCounters = async (
  promotionId: string | Types.ObjectId,
  ticketCount: number
) => {
  await Promotion.findByIdAndUpdate(promotionId, {
    $inc: {
      discountedTicketsReserved: -ticketCount,
      reservedUsageCount: -1,
    },
  });
};

const releaseReservationDocument = async (
  reservation: IPromotionReservation,
  status: "released" | "expired"
) => {
  const updatedReservation =
    await PromotionReservation.findOneAndUpdate(
      {
        _id: reservation._id,
        status: "reserved",
      },
      {
        $set: {
          status,
        },
      },
      {
        new: true,
      }
    );

  if (!updatedReservation) {
    return null;
  }

  await rollbackPromotionReservationCounters(
    updatedReservation.promotion,
    updatedReservation.ticketCount
  );

  return updatedReservation;
};

export const releasePromotionReservationByBooking = async (
  bookingId: string | Types.ObjectId,
  status: "released" | "expired" = "released"
) => {
  const reservation = await PromotionReservation.findOne({
    booking: bookingId,
    status: "reserved",
  });

  if (!reservation) {
    return null;
  }

  return releaseReservationDocument(reservation, status);
};

export const releaseExpiredPromotionReservations = async (
  now = new Date()
) => {
  const expiredReservations =
    await PromotionReservation.find({
      status: "reserved",
      expiresAt: {
        $lte: now,
      },
    }).limit(100);

  await Promise.all(
    expiredReservations.map((reservation) =>
      releaseReservationDocument(reservation, "expired")
    )
  );
};

export const reservePromotionForBooking = async (
  input: ReservePromotionInput
) => {
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + reservationWindowMinutes * 60 * 1000
  );

  await releaseExpiredPromotionReservations(now);

  const bookingId = getPromotionIdString(input.bookingId);
  const promotionId = getPromotionIdString(input.promotionId);

  const existingReservation =
    await PromotionReservation.findOne({
      booking: bookingId,
    });

  if (
    existingReservation?.status === "reserved" &&
    existingReservation.expiresAt > now &&
    existingReservation.promotion.toString() === promotionId &&
    existingReservation.ticketCount === input.ticketCount &&
    existingReservation.discountAmount === input.discountAmount
  ) {
    return existingReservation;
  }

  if (existingReservation?.status === "reserved") {
    await releaseReservationDocument(
      existingReservation,
      existingReservation.expiresAt <= now ? "expired" : "released"
    );
  }

  if (existingReservation?.status === "redeemed") {
    return existingReservation;
  }

  const promotion = await Promotion.findById(promotionId);

  if (!promotion) {
    throw new Error("Promotion not found.");
  }

  const ineligibilityReason =
    await getPromotionIneligibilityReason(promotion, {
      subtotal: input.subtotalAmount,
      ticketCount: input.ticketCount,
      userId: input.userId.toString(),
      now,
    });

  if (ineligibilityReason) {
    throw new Error(ineligibilityReason);
  }

  const updatedPromotion =
    await Promotion.findOneAndUpdate(
      buildPromotionReservationFilter(
        promotion,
        input.ticketCount,
        now
      ),
      {
        $inc: {
          discountedTicketsReserved: input.ticketCount,
          reservedUsageCount: 1,
        },
      },
      {
        new: true,
      }
    );

  if (!updatedPromotion) {
    throw new Error("Promotion is no longer available.");
  }

  try {
    const reusedReservation =
      await PromotionReservation.findOneAndUpdate(
        {
          booking: bookingId,
          status: {
            $in: ["released", "expired"],
          },
        },
        {
          $set: {
            promotion: input.promotionId,
            user: input.userId,
            event: input.eventId,
            ticketCount: input.ticketCount,
            discountAmount: input.discountAmount,
            status: "reserved",
            expiresAt,
          },
        },
        {
          new: true,
        }
      );

    if (reusedReservation) {
      return reusedReservation;
    }

    return await PromotionReservation.create({
      promotion: input.promotionId,
      booking: input.bookingId,
      user: input.userId,
      event: input.eventId,
      ticketCount: input.ticketCount,
      discountAmount: input.discountAmount,
      status: "reserved",
      expiresAt,
    });
  } catch (error) {
    await rollbackPromotionReservationCounters(
      input.promotionId,
      input.ticketCount
    );

    if (isDuplicateKeyError(error)) {
      const latestReservation =
        await PromotionReservation.findOne({
          booking: bookingId,
        });

      if (
        latestReservation?.status === "reserved" &&
        latestReservation.expiresAt > now
      ) {
        return latestReservation;
      }
    }

    throw error;
  }
};

export const redeemPromotionReservation = async (
  reservationId: string | Types.ObjectId,
  bookingId: string | Types.ObjectId
) => {
  const now = new Date();

  const reservation =
    await PromotionReservation.findOneAndUpdate(
      {
        _id: reservationId,
        booking: bookingId,
        status: "reserved",
        expiresAt: {
          $gt: now,
        },
      },
      {
        $set: {
          status: "redeemed",
        },
      },
      {
        new: true,
      }
    );

  if (!reservation) {
    const latestReservation =
      await PromotionReservation.findOne({
        _id: reservationId,
        booking: bookingId,
      });

    if (latestReservation?.status === "redeemed") {
      return latestReservation;
    }

    if (
      latestReservation?.status === "reserved" &&
      latestReservation.expiresAt <= now
    ) {
      await releaseReservationDocument(
        latestReservation,
        "expired"
      );
    }

    throw new Error(
      "Promotion reservation is no longer valid."
    );
  }

  await Promotion.findOneAndUpdate(
    {
      _id: reservation.promotion,
      discountedTicketsReserved: {
        $gte: reservation.ticketCount,
      },
      reservedUsageCount: {
        $gte: 1,
      },
    },
    {
      $inc: {
        discountedTicketsReserved: -reservation.ticketCount,
        discountedTicketsUsed: reservation.ticketCount,
        reservedUsageCount: -1,
        usedCount: 1,
      },
    }
  );

  return reservation;
};

export const restoreRedeemedPromotionReservation = async (
  reservationId: string | Types.ObjectId,
  bookingId: string | Types.ObjectId
) => {
  const reservation =
    await PromotionReservation.findOneAndUpdate(
      {
        _id: reservationId,
        booking: bookingId,
        status: "redeemed",
      },
      {
        $set: {
          status: "reserved",
        },
      },
      {
        new: true,
      }
    );

  if (!reservation) {
    return null;
  }

  await Promotion.findByIdAndUpdate(reservation.promotion, {
    $inc: {
      discountedTicketsReserved: reservation.ticketCount,
      discountedTicketsUsed: -reservation.ticketCount,
      reservedUsageCount: 1,
      usedCount: -1,
    },
  });

  return reservation;
};
