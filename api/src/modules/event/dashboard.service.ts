import { QueryFilter } from "mongoose";
import { IBooking } from "../booking/booking.interface";
import { IEvent } from "./event.interface";
import Booking from "../booking/booking.model";
import Event from "./event.model";
import { markEndedEventsAsCompleted } from "./event-lifecycle.service";

import { getObjectIdOrThrow, withBestPromotions } from "./helpers";

export const getOrganizerDashboardService = async (organizerId: string) => {
    await markEndedEventsAsCompleted();
    const organizerObjectId = getObjectIdOrThrow(organizerId, "organizer ID");
    const eventFilter: QueryFilter<IEvent> = {
        organizer: organizerObjectId,
    };
    const [statusCounts, ownedEvents, recentEvents] = await Promise.all([
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
            .populate("organizer", "firstName lastName email profileImage")
            .sort({
            createdAt: -1,
        })
            .limit(4),
    ]);
    const eventIds = ownedEvents.map((event) => event._id);
    const bookingMatch: QueryFilter<IBooking> | null = eventIds.length > 0
        ? {
            event: {
                $in: eventIds,
            },
            status: "confirmed" as IBooking["status"],
            paymentStatus: "paid" as IBooking["paymentStatus"],
        }
        : null;
    const [bookingStats, recentBookings] = bookingMatch
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
                .populate("user", "firstName lastName email")
                .populate({
                path: "event",
                populate: {
                    path: "organizer",
                    select: "firstName lastName email",
                },
            })
                .sort({
                createdAt: -1,
            })
                .limit(5),
        ])
        : [[], []];
    const statusMap = statusCounts.reduce<Record<IEvent["status"], number>>((counts, item) => ({
        ...counts,
        [item._id]: item.count,
    }), {
        draft: 0,
        published: 0,
        cancelled: 0,
        completed: 0,
    });
    const stats = bookingStats[0] || {
        totalBookings: 0,
        totalTicketsSold: 0,
        totalGrossRevenue: 0,
        totalAdminCommission: 0,
        totalOrganizerEarnings: 0,
    };
    return {
        success: true,
        message: "Organizer dashboard fetched successfully.",
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
            totalAdminCommission: stats.totalAdminCommission,
            totalOrganizerEarnings: stats.totalOrganizerEarnings,
        },
        recentEvents: await withBestPromotions(recentEvents),
        recentBookings,
    };
};
