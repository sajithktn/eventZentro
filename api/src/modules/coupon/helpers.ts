import { isValidObjectId, QueryFilter, Types } from "mongoose";
import { IPromotion, PromotionDiscountType, PromotionEffectiveStatus, PromotionMode, PromotionStatus } from "./coupon.interface";
import Promotion from "./coupon.model";
import Event from "../event/event.model";
import { escapeRegExp, ParsedPaginationQuery } from "../../utils/pagination";

import { PromotionListOptions, PromotionSort } from "./types";

export const defaultPaginationQuery: ParsedPaginationQuery = {
    page: 1,
    limit: 10,
    skip: 0,
};

export const promotionPopulate = [
    {
        path: "event",
        select: "title eventDate ticketPrice totalTickets availableTickets status venue bannerImage",
    },
    {
        path: "organizer",
        select: "firstName lastName email profileImage",
    },
];

export const reservationWindowMinutes = 15;

export const normalizeCouponCode = (code: string) => {
    return code.trim().toUpperCase();
};

export const roundMoney = (value: number) => {
    return Math.round((value + Number.EPSILON) * 100) / 100;
};

export const toRazorpayPaise = (amount: number) => {
    return Math.round(roundMoney(amount) * 100);
};

export const isDuplicateKeyError = (error: unknown) => {
    return (typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as {
            code?: number;
        }).code === 11000);
};

export const getPromotionSort = (sort?: string): PromotionSort => {
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

export const ensureValidObjectId = (value: string, label: string) => {
    if (!isValidObjectId(value)) {
        throw new Error(`Invalid ${label}.`);
    }
};

export const getPromotionIdString = (value: string | Types.ObjectId) => value.toString();

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

export const getPromotionMode = (promotion: IPromotion): PromotionMode => promotion.promotionMode || "coupon";

export const getMinimumBookingAmount = (promotion: IPromotion) => promotion.minimumBookingAmount ??
    promotion.minimumAmount ??
    0;

export const getMaximumDiscountAmount = (promotion: IPromotion) => promotion.maximumDiscountAmount ??
    promotion.maximumDiscount;

export const getTotalUsageLimit = (promotion: IPromotion) => promotion.totalUsageLimit ?? promotion.usageLimit;

export const getManualStatus = (promotion: IPromotion): PromotionStatus => {
    if (promotion.status) {
        return promotion.status;
    }
    return promotion.isActive === false ? "inactive" : "active";
};

export const getPromotionName = (promotion: IPromotion) => promotion.name ||
    promotion.displayText ||
    promotion.code ||
    "Event offer";

export const ensurePromotionName = (promotion: IPromotion) => {
    if (!promotion.name) {
        promotion.name = getPromotionName(promotion);
    }
};

export const getReservedUsageCount = (promotion: IPromotion) => promotion.reservedUsageCount || 0;

export const getDiscountedTicketsReserved = (promotion: IPromotion) => promotion.discountedTicketsReserved || 0;

export const getDiscountedTicketsUsed = (promotion: IPromotion) => promotion.discountedTicketsUsed || 0;

export const getRemainingOfferTickets = (promotion: IPromotion) => {
    if (!promotion.firstNTickets) {
        return undefined;
    }
    return Math.max(promotion.firstNTickets -
        getDiscountedTicketsReserved(promotion) -
        getDiscountedTicketsUsed(promotion), 0);
};

export const getEffectivePromotionStatus = (promotion: IPromotion, now = new Date()): PromotionEffectiveStatus => {
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
    if (usageLimit &&
        promotion.usedCount + getReservedUsageCount(promotion) >=
            usageLimit) {
        return "exhausted";
    }
    const remainingTickets = getRemainingOfferTickets(promotion);
    if (remainingTickets !== undefined && remainingTickets <= 0) {
        return "exhausted";
    }
    return "active";
};

export const validatePromotionDateRange = (validFrom: Date, validUntil: Date) => {
    if (validUntil <= validFrom) {
        throw new Error("Valid until must be later than valid from.");
    }
};

export const validatePromotionDiscount = (discountType: PromotionDiscountType, discountValue: number) => {
    if (discountValue <= 0) {
        throw new Error("Discount value must be greater than 0.");
    }
    if (discountType === "percentage" && discountValue > 100) {
        throw new Error("Percentage discount cannot exceed 100.");
    }
};

export const getEventForPromotionOrThrow = async (eventId: string, organizerId: string, role: string) => {
    ensureValidObjectId(eventId, "event ID");
    const event = await Event.findById(eventId);
    if (!event) {
        throw new Error("Event not found.");
    }
    if (role !== "admin" &&
        getReferenceIdString(event.organizer, "Organizer ID") !==
            organizerId) {
        throw new Error("You can only manage promotions for your own events.");
    }
    return event;
};

export const ensurePromotionAccess = (promotion: IPromotion, organizerId: string, role: string) => {
    if (role !== "admin" &&
        getReferenceIdString(promotion.organizer, "Organizer ID") !==
            organizerId) {
        throw new Error("You can only manage your own promotions.");
    }
};

export const getPromotionForOrganizerOrThrow = async (promotionId: string, organizerId: string, role: string) => {
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

export const getPopulatedPromotion = async (promotionId: string | Types.ObjectId) => {
    const promotion = await Promotion.findById(promotionId).populate(promotionPopulate);
    if (!promotion || promotion.isDeleted) {
        throw new Error("Promotion not found.");
    }
    return promotion;
};

export const ensureUniqueCouponCode = async (eventId: string | Types.ObjectId, code: string | undefined, promotionId?: string | Types.ObjectId) => {
    if (!code) {
        return;
    }
    const normalizedCode = normalizeCouponCode(code);
    if (!normalizedCode) {
        return;
    }
    const duplicate = await Promotion.findOne({
        event: eventId,
        code: normalizedCode,
        promotionMode: "coupon",
        isDeleted: {
            $ne: true,
        },
        ...(promotionId
            ? {
                _id: {
                    $ne: promotionId,
                },
            }
            : {}),
    }).select("_id");
    if (duplicate) {
        throw new Error("A promotion with this coupon code already exists for this event.");
    }
};

export const buildPromotionFilter = (options: PromotionListOptions) => {
    const filter: QueryFilter<IPromotion> = {
        isDeleted: false,
    };
    if (options.role !== "admin") {
        filter.organizer = options.organizerId;
    }
    else if (options.organizer &&
        options.organizer !== "all" &&
        options.organizer !== "me") {
        ensureValidObjectId(options.organizer, "organizer ID");
        filter.organizer = options.organizer;
    }
    if (options.eventId) {
        ensureValidObjectId(options.eventId, "event ID");
        filter.event = options.eventId;
    }
    if (options.status &&
        options.status !== "exhausted") {
        filter.status = options.status;
    }
    if (options.promotionMode) {
        filter.promotionMode = options.promotionMode;
    }
    if (options.visibility) {
        filter.visibility = options.visibility;
    }
    if (options.query.search) {
        const searchRegex = new RegExp(escapeRegExp(options.query.search), "i");
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
