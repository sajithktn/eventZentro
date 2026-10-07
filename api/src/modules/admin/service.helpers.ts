import { isValidObjectId, Types } from "mongoose";
import User from "../user/user.model";
import { IBooking } from "../booking/booking.interface";
import { IPromotion } from "../coupon/coupon.interface";
import { IEvent } from "../event/event.interface";
import { IUser, UserRole } from "../user/user.interface";
import { getActiveAdminCommissionPercentageService } from "../commission/commission.service";

import { AdminServiceError, AdminUsersQuery } from "./types";

export const defaultPaginationQuery: AdminUsersQuery = {
    page: 1,
    limit: 10,
    skip: 0,
};

export const adminUserFields = [
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

export const escapeRegExp = (value: string) => {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

export const normalizeCategoryName = (value: string) => {
    return value.trim().replace(/\s+/g, " ");
};

export const createCategorySlug = (value: string) => {
    return value
        .toLowerCase()
        .trim()
        .replace(/&/g, "and")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
};

export const buildPagination = (page: number, limit: number, totalItems: number) => {
    const totalPages = Math.max(Math.ceil(totalItems / limit), 1);
    return {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
    };
};

export const eventStatuses: IEvent["status"][] = [
    "draft",
    "published",
    "cancelled",
    "completed",
];

export const bookingStatuses: IBooking["status"][] = [
    "pending",
    "confirmed",
    "cancelled",
];

export const paymentStatuses: IBooking["paymentStatus"][] = [
    "unpaid",
    "pending",
    "verifying",
    "paid",
    "failed",
    "refunded",
];

export const promotionStatuses: IPromotion["status"][] = [
    "active",
    "inactive",
    "expired",
];

export const promotionModes: IPromotion["promotionMode"][] = [
    "coupon",
    "automatic",
];

export const isEventStatus = (status: string): status is IEvent["status"] => status === "draft" ||
    status === "published" ||
    status === "cancelled" ||
    status === "completed";

export const isBookingStatus = (status: string): status is IBooking["status"] => status === "pending" ||
    status === "confirmed" ||
    status === "cancelled";

export const isPaymentStatus = (status: string): status is IBooking["paymentStatus"] => status === "unpaid" ||
    status === "pending" ||
    status === "verifying" ||
    status === "paid" ||
    status === "failed" ||
    status === "refunded";

export const isPromotionStatus = (status: string): status is IPromotion["status"] => status === "active" ||
    status === "inactive" ||
    status === "expired";

export const isPromotionMode = (mode: string): mode is IPromotion["promotionMode"] => mode === "coupon" || mode === "automatic";

export const getObjectIdOrThrow = (value: string, label: string) => {
    if (!isValidObjectId(value)) {
        throw new AdminServiceError(`Invalid ${label}.`, 400);
    }
    return new Types.ObjectId(value);
};

export const getBookingTicketCount = (booking: IBooking) => booking.ticketCount || booking.quantity;

export const roundMoney = (amount: number) => Math.round((amount + Number.EPSILON) * 100) / 100;

export const calculateCommissionSnapshot = async (amount: number) => {
    const amountPaid = roundMoney(amount);
    const adminCommissionRate = await getActiveAdminCommissionPercentageService();
    const adminCommissionAmount = roundMoney(amountPaid *
        (adminCommissionRate / 100));
    return {
        amountPaid,
        adminCommissionRate,
        adminCommissionAmount,
        organizerEarnings: roundMoney(amountPaid - adminCommissionAmount),
        commissionCalculatedAt: new Date(),
    };
};

export const eventPopulate = {
    path: "organizer",
    select: "firstName lastName email profileImage",
};

export const bookingPopulate = [
    {
        path: "user",
        select: "firstName lastName email profileImage",
    },
    {
        path: "event",
        select: "title category city venue eventDate ticketPrice totalTickets availableTickets status bannerImage organizer",
        populate: {
            path: "organizer",
            select: "firstName lastName email",
        },
    },
];

export const promotionPopulate = [
    {
        path: "event",
        select: "title city venue eventDate ticketPrice totalTickets availableTickets status bannerImage",
    },
    {
        path: "organizer",
        select: "firstName lastName email profileImage",
    },
];

export const getUserByIdOrThrow = async (userId: string) => {
    if (!isValidObjectId(userId)) {
        throw new AdminServiceError("Invalid user ID.", 400);
    }
    const user = await User.findById(userId);
    if (!user) {
        throw new AdminServiceError("User not found.", 404);
    }
    return user;
};

export const getSafeUserById = async (userId: string) => {
    const user = await User.findById(userId).select(adminUserFields);
    if (!user) {
        throw new AdminServiceError("User not found.", 404);
    }
    return user;
};

export const ensureUserCanBeManaged = (targetUser: IUser, adminId: string) => {
    if (targetUser._id.toString() === adminId) {
        throw new AdminServiceError("You cannot perform this action on your own admin account.", 403);
    }
    if (targetUser.role === UserRole.ADMIN) {
        throw new AdminServiceError("Admin accounts cannot be modified from user management.", 403);
    }
};

export const ensureUserIsNotDeleted = (user: IUser) => {
    if (user.isDeleted) {
        throw new AdminServiceError("Restore this user before performing this action.", 400);
    }
};
