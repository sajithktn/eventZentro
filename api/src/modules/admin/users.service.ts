import { isValidObjectId, QueryFilter, Types } from "mongoose";
import Booking from "../booking/booking.model";
import User from "../user/user.model";
import { IUser, UserRole } from "../user/user.interface";

import { adminUserFields, buildPagination, defaultPaginationQuery, ensureUserCanBeManaged, ensureUserIsNotDeleted, escapeRegExp, getSafeUserById, getUserByIdOrThrow } from "./service.helpers";
import { AdminServiceError, AdminUsersQuery, BookingSummaryResult } from "./types";

export const createUsersFilter = (query: AdminUsersQuery, requiredRole?: UserRole): QueryFilter<IUser> => {
    const filter: QueryFilter<IUser> = {};
    if (query.status === "deleted") {
        filter.isDeleted = true;
    }
    else {
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
    }
    else if (query.role &&
        query.role !== "all" &&
        Object.values(UserRole).includes(query.role as UserRole)) {
        filter.role = query.role as UserRole;
    }
    if (query.search) {
        const searchRegex = new RegExp(escapeRegExp(query.search.trim()), "i");
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

export const getAdminUsersService = async (query: AdminUsersQuery = defaultPaginationQuery) => {
    const filter = createUsersFilter(query);
    const [users, totalItems] = await Promise.all([
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
        message: "Users fetched successfully.",
        users,
        pagination: buildPagination(query.page, query.limit, totalItems),
    };
};

export const getAdminOrganizersService = async (query: AdminUsersQuery = defaultPaginationQuery) => {
    const filter = createUsersFilter(query, UserRole.ORGANIZER);
    const [organizers, totalItems] = await Promise.all([
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
        message: "Organizers fetched successfully.",
        organizers,
        pagination: buildPagination(query.page, query.limit, totalItems),
    };
};

export const getAdminUserDetailsService = async (userId: string) => {
    if (!isValidObjectId(userId)) {
        throw new AdminServiceError("Invalid user ID.", 400);
    }
    const objectId = new Types.ObjectId(userId);
    const [user, bookings, bookingSummary,] = await Promise.all([
        User.findById(userId).select(adminUserFields),
        Booking.find({
            user: objectId,
        })
            .populate({
            path: "event",
            select: "title venue eventDate status ticketPrice bannerImage",
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
        throw new AdminServiceError("User not found.", 404);
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
            totalBookings: summary.totalBookings,
            confirmedBookings: summary.confirmedBookings,
            cancelledBookings: summary.cancelledBookings,
            totalSpent: summary.totalSpent,
        },
    };
};

export const blockAdminUserService = async (userId: string, adminId: string) => {
    const targetUser = await getUserByIdOrThrow(userId);
    ensureUserCanBeManaged(targetUser, adminId);
    ensureUserIsNotDeleted(targetUser);
    targetUser.isBlocked = true;
    await targetUser.save();
    return getSafeUserById(userId);
};

export const unblockAdminUserService = async (userId: string, adminId: string) => {
    const targetUser = await getUserByIdOrThrow(userId);
    ensureUserCanBeManaged(targetUser, adminId);
    ensureUserIsNotDeleted(targetUser);
    targetUser.isBlocked = false;
    await targetUser.save();
    return getSafeUserById(userId);
};

export const verifyAdminUserService = async (userId: string, adminId: string) => {
    const targetUser = await getUserByIdOrThrow(userId);
    ensureUserCanBeManaged(targetUser, adminId);
    ensureUserIsNotDeleted(targetUser);
    targetUser.isVerified = true;
    await targetUser.save();
    return getSafeUserById(userId);
};

export const changeAdminUserRoleService = async (userId: string, role: string, adminId: string) => {
    if (role !== UserRole.USER &&
        role !== UserRole.ORGANIZER) {
        throw new AdminServiceError("Role must be user or organizer.", 400);
    }
    const targetUser = await getUserByIdOrThrow(userId);
    ensureUserCanBeManaged(targetUser, adminId);
    ensureUserIsNotDeleted(targetUser);
    targetUser.role = role;
    await targetUser.save();
    return getSafeUserById(userId);
};

export const softDeleteAdminUserService = async (userId: string, adminId: string) => {
    const targetUser = await getUserByIdOrThrow(userId);
    ensureUserCanBeManaged(targetUser, adminId);
    if (targetUser.isDeleted) {
        throw new AdminServiceError("This user is already deleted.", 400);
    }
    targetUser.isDeleted = true;
    await targetUser.save();
    return getSafeUserById(userId);
};

export const restoreAdminUserService = async (userId: string, adminId: string) => {
    const targetUser = await getUserByIdOrThrow(userId);
    ensureUserCanBeManaged(targetUser, adminId);
    if (!targetUser.isDeleted) {
        throw new AdminServiceError("This user is not deleted.", 400);
    }
    targetUser.isDeleted = false;
    await targetUser.save();
    return getSafeUserById(userId);
};
