import { Types } from "mongoose";
import { IPromotion, PromotionStatus } from "./coupon.interface";
import { PaginatedApiResponse } from "../../types/pagination.interface";
import Promotion from "./coupon.model";
import { buildPaginationMetadata } from "../../utils/pagination";
import { CreateCouponInput, UpdateCouponInput } from "./coupon.validation";

import { buildPromotionFilter, defaultPaginationQuery, ensurePromotionName, ensureUniqueCouponCode, getDiscountedTicketsReserved, getDiscountedTicketsUsed, getEffectivePromotionStatus, getEventForPromotionOrThrow, getPopulatedPromotion, getPromotionForOrganizerOrThrow, getPromotionMode, getPromotionSort, getReservedUsageCount, isDuplicateKeyError, normalizeCouponCode, promotionPopulate, validatePromotionDateRange, validatePromotionDiscount } from "./helpers";
import { PromotionListOptions } from "./types";

export const getOrganizerCouponsService = async (options: PromotionListOptions): Promise<PaginatedApiResponse<IPromotion>> => {
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
    const filteredPromotions = options.status === "exhausted"
        ? promotions.filter((promotion) => getEffectivePromotionStatus(promotion) === "exhausted")
        : promotions;
    return {
        success: true,
        message: "Promotions fetched successfully.",
        data: filteredPromotions,
        pagination: buildPaginationMetadata(query.page, query.limit, totalItems),
    };
};

export const getCouponByIdService = async (promotionId: string, organizerId: string, role: string) => {
    const promotion = await getPromotionForOrganizerOrThrow(promotionId, organizerId, role);
    return getPopulatedPromotion(promotion._id);
};

export const createCouponService = async (organizerId: string, role: string, data: CreateCouponInput) => {
    const event = await getEventForPromotionOrThrow(data.eventId, organizerId, role);
    validatePromotionDiscount(data.discountType, data.discountValue);
    const validFrom = new Date(data.validFrom);
    const validUntil = new Date(data.validUntil);
    validatePromotionDateRange(validFrom, validUntil);
    const normalizedCode = data.promotionMode === "coupon" && data.code
        ? normalizeCouponCode(data.code)
        : undefined;
    await ensureUniqueCouponCode(event._id, normalizedCode);
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
            maximumDiscountAmount: data.discountType === "percentage"
                ? data.maximumDiscountAmount
                : undefined,
            totalUsageLimit: data.totalUsageLimit,
            perUserUsageLimit: data.perUserUsageLimit,
            firstNTickets: data.firstNTickets,
            maxTicketsPerBooking: data.maxTicketsPerBooking,
            validFrom,
            validUntil,
            status: data.isActive === false ? "inactive" : data.status,
            visibility: data.visibility,
            displayText: data.displayText,
            isDeleted: false,
            isActive: data.isActive ?? data.status !== "inactive",
            minimumAmount: data.minimumBookingAmount,
            maximumDiscount: data.discountType === "percentage"
                ? data.maximumDiscountAmount
                : undefined,
            usageLimit: data.totalUsageLimit,
        });
        return getPopulatedPromotion(promotion._id);
    }
    catch (error) {
        if (isDuplicateKeyError(error)) {
            throw new Error("A promotion with this coupon code already exists for this event.");
        }
        throw error;
    }
};

export const updateCouponService = async (promotionId: string, organizerId: string, role: string, data: UpdateCouponInput) => {
    const promotion = await getPromotionForOrganizerOrThrow(promotionId, organizerId, role);
    let shouldValidateCouponIdentity = false;
    if (data.eventId) {
        const event = await getEventForPromotionOrThrow(data.eventId, organizerId, role);
        promotion.event = event._id as Types.ObjectId;
        promotion.organizer = event.organizer;
        shouldValidateCouponIdentity = true;
    }
    if (data.name) {
        promotion.name = data.name;
    }
    else if (!promotion.name) {
        promotion.name =
            promotion.code || promotion.displayText || "Event offer";
    }
    if (data.description !== undefined) {
        promotion.description = data.description;
    }
    if (data.promotionMode) {
        promotion.promotionMode = data.promotionMode;
        shouldValidateCouponIdentity = true;
    }
    if (data.promotionMode === "automatic") {
        promotion.code = undefined;
    }
    if ((data.promotionMode === "coupon" ||
        getPromotionMode(promotion) === "coupon") &&
        data.code) {
        const normalizedCode = normalizeCouponCode(data.code);
        promotion.code = normalizedCode;
        shouldValidateCouponIdentity = true;
    }
    if (getPromotionMode(promotion) === "coupon" && !promotion.code) {
        throw new Error("Coupon code is required for coupon promotions.");
    }
    if (getPromotionMode(promotion) === "coupon" &&
        promotion.code &&
        shouldValidateCouponIdentity) {
        await ensureUniqueCouponCode(promotion.event, promotion.code, promotion._id);
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
        if (data.totalUsageLimit <
            promotion.usedCount + getReservedUsageCount(promotion)) {
            throw new Error("Total usage limit cannot be less than existing reserved and redeemed usage.");
        }
        promotion.totalUsageLimit = data.totalUsageLimit;
        promotion.usageLimit = data.totalUsageLimit;
    }
    if (typeof data.perUserUsageLimit === "number") {
        promotion.perUserUsageLimit = data.perUserUsageLimit;
    }
    if (typeof data.firstNTickets === "number") {
        if (data.firstNTickets <
            getDiscountedTicketsReserved(promotion) +
                getDiscountedTicketsUsed(promotion)) {
            throw new Error("First-N ticket limit cannot be less than already reserved or redeemed offer tickets.");
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
    validatePromotionDiscount(promotion.discountType, promotion.discountValue);
    validatePromotionDateRange(promotion.validFrom, promotion.validUntil);
    if (promotion.discountType === "percentage" &&
        typeof data.maximumDiscountAmount === "number") {
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
    }
    catch (error) {
        if (isDuplicateKeyError(error)) {
            throw new Error("A promotion with this coupon code already exists for this event.");
        }
        throw error;
    }
};

export const updateCouponStatusService = async (promotionId: string, organizerId: string, role: string, statusOrActive: PromotionStatus | boolean) => {
    const promotion = await getPromotionForOrganizerOrThrow(promotionId, organizerId, role);
    const status = typeof statusOrActive === "boolean"
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

export const deleteCouponService = async (promotionId: string, organizerId: string, role: string) => {
    const promotion = await getPromotionForOrganizerOrThrow(promotionId, organizerId, role);
    ensurePromotionName(promotion);
    promotion.isDeleted = true;
    promotion.status = "inactive";
    promotion.isActive = false;
    await promotion.save();
    return {
        message: "Promotion deleted successfully.",
        coupon: await getPopulatedPromotion(promotion._id).catch(() => null),
    };
};
