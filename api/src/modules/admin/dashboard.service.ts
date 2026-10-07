import Booking from "../booking/booking.model";
import FeaturedEventRequest from "../featured-event/featured-event-request.model";
import Event from "../event/event.model";
import User from "../user/user.model";
import { UserRole } from "../user/user.interface";

import { roundMoney } from "./service.helpers";
import { FeaturedEventRevenueResult, RevenueResult } from "./types";

export const getAdminDashboardService = async () => {
    const [totalUsers, totalOrganizers, totalEvents, totalBookings, revenueResult, featuredEventRevenueResult,] = await Promise.all([
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
                        $sum: {
                            $ifNull: [
                                "$amountPaid",
                                0,
                            ],
                        },
                    },
                    totalAdminCommission: {
                        $sum: {
                            $ifNull: [
                                "$adminCommissionAmount",
                                0,
                            ],
                        },
                    },
                    totalOrganizerEarnings: {
                        $sum: {
                            $cond: [
                                {
                                    $gt: [
                                        {
                                            $ifNull: [
                                                "$organizerEarnings",
                                                0,
                                            ],
                                        },
                                        0,
                                    ],
                                },
                                "$organizerEarnings",
                                {
                                    $max: [
                                        {
                                            $subtract: [
                                                {
                                                    $ifNull: [
                                                        "$amountPaid",
                                                        0,
                                                    ],
                                                },
                                                {
                                                    $ifNull: [
                                                        "$adminCommissionAmount",
                                                        0,
                                                    ],
                                                },
                                            ],
                                        },
                                        0,
                                    ],
                                },
                            ],
                        },
                    },
                },
            },
        ]),
        FeaturedEventRequest.aggregate<FeaturedEventRevenueResult>([
            {
                $match: {
                    paymentStatus: "paid",
                    status: {
                        $in: ["approved", "paid"],
                    },
                    promotionFee: {
                        $gt: 0,
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    totalFeaturedEventRevenue: {
                        $sum: {
                            $ifNull: [
                                "$promotionFee",
                                0,
                            ],
                        },
                    },
                },
            },
        ]),
    ]);
    const totalAdminCommission = roundMoney(revenueResult[0]?.totalAdminCommission || 0);
    const featuredEventRevenue = roundMoney(featuredEventRevenueResult[0]
        ?.totalFeaturedEventRevenue || 0);
    return {
        totalUsers,
        totalOrganizers,
        totalEvents,
        totalBookings,
        totalRevenue: roundMoney(revenueResult[0]?.totalRevenue || 0),
        totalAdminCommission,
        totalOrganizerEarnings: roundMoney(revenueResult[0]?.totalOrganizerEarnings ||
            0),
        featuredEventRevenue,
        totalPlatformEarnings: roundMoney(totalAdminCommission + featuredEventRevenue),
    };
};
