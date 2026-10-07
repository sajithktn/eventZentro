import Booking from "../booking/booking.model";
import Event from "../event/event.model";
import { IBooking } from "../booking/booking.interface";
import { redeemPromotionReservation, releasePromotionReservationByBooking, restoreRedeemedPromotionReservation } from "../coupon/coupon.service";
import { completePublishedEventIfEnded } from "../event/event-lifecycle.service";
import { EVENT_ENDED_BOOKING_MESSAGE, hasEventEnded } from "../../utils/eventLifecycle";

import { buildAdminBookingFilter, getAdminBookingSort, getPopulatedAdminBooking } from "./catalog.helpers";
import { bookingPopulate, bookingStatuses, buildPagination, calculateCommissionSnapshot, defaultPaginationQuery, getBookingTicketCount, getObjectIdOrThrow, isBookingStatus } from "./service.helpers";
import { AdminBookingsQuery, AdminServiceError } from "./types";

export const getAdminBookingsService = async (query: AdminBookingsQuery = defaultPaginationQuery) => {
    const filter = await buildAdminBookingFilter(query);
    const [bookings, totalItems,] = await Promise.all([
        Booking.find(filter)
            .select("-razorpaySignature")
            .populate(bookingPopulate)
            .sort(getAdminBookingSort(query.sort))
            .skip(query.skip)
            .limit(query.limit),
        Booking.countDocuments(filter),
    ]);
    return {
        success: true,
        message: "Admin bookings fetched successfully.",
        data: bookings,
        bookings,
        pagination: buildPagination(query.page, query.limit, totalItems),
    };
};

export const getAdminBookingByIdService = async (bookingId: string) => {
    getObjectIdOrThrow(bookingId, "booking ID");
    return getPopulatedAdminBooking(bookingId);
};

export const cancelAdminBooking = async (booking: IBooking) => {
    if (booking.status ===
        "cancelled") {
        return {
            booking: await getPopulatedAdminBooking(booking._id),
            message: "Booking is already cancelled.",
        };
    }
    const previousStatus = booking.status;
    const ticketCount = getBookingTicketCount(booking);
    if (previousStatus ===
        "confirmed") {
        const event = await Event.findById(booking.event);
        if (!event) {
            throw new AdminServiceError("Related event was not found.", 404);
        }
        await Event.findByIdAndUpdate(event._id, {
            $inc: {
                availableTickets: ticketCount,
            },
        });
        if (booking.promotionReservation) {
            await restoreRedeemedPromotionReservation(booking.promotionReservation, booking._id);
        }
    }
    else {
        await releasePromotionReservationByBooking(booking._id);
    }
    booking.status =
        "cancelled";
    if (booking.paymentStatus !==
        "paid" &&
        booking.paymentStatus !==
            "refunded") {
        booking.paymentStatus =
            "failed";
    }
    await booking.save();
    return {
        booking: await getPopulatedAdminBooking(booking._id),
        message: "Booking cancelled successfully.",
    };
};

export const confirmAdminBooking = async (booking: IBooking) => {
    if (booking.status ===
        "confirmed") {
        return {
            booking: await getPopulatedAdminBooking(booking._id),
            message: "Booking is already confirmed.",
        };
    }
    if (booking.status ===
        "cancelled") {
        throw new AdminServiceError("Cancelled bookings cannot be confirmed.", 409);
    }
    if (booking.paymentStatus !==
        "paid") {
        throw new AdminServiceError("Only paid bookings can be confirmed.", 409);
    }
    const event = await Event.findById(booking.event);
    if (!event) {
        throw new AdminServiceError("Related event was not found.", 404);
    }
    if (event.status ===
        "cancelled") {
        throw new AdminServiceError("Bookings cannot be confirmed for a cancelled event.", 409);
    }
    if (
        event.status === "completed" ||
        hasEventEnded(event.eventDate, event.endTime) ||
        (await completePublishedEventIfEnded(event))
    ) {
        if (event.status === "published") {
            await completePublishedEventIfEnded(event);
        }
        throw new AdminServiceError(EVENT_ENDED_BOOKING_MESSAGE, 409);
    }
    if (event.status !==
        "published") {
        throw new AdminServiceError("This event is not available for booking.", 409);
    }
    const ticketCount = getBookingTicketCount(booking);
    let ticketsClaimed = false;
    let promotionRedeemed = false;
    try {
        const updatedEvent = await Event.findOneAndUpdate({
            _id: event._id,
            availableTickets: {
                $gte: ticketCount,
            },
        }, {
            $inc: {
                availableTickets: -ticketCount,
            },
        }, {
            new: true,
        });
        if (!updatedEvent) {
            throw new AdminServiceError("Not enough tickets are available.", 409);
        }
        ticketsClaimed = true;
        if (booking.promotionReservation) {
            await redeemPromotionReservation(booking.promotionReservation, booking._id);
            promotionRedeemed = true;
        }
        booking.status =
            "confirmed";
        if (!booking.commissionCalculatedAt) {
            Object.assign(booking, await calculateCommissionSnapshot(booking.finalAmount ??
                booking.totalAmount));
        }
        else {
            booking.amountPaid =
                booking.amountPaid ||
                    booking.finalAmount ||
                    booking.totalAmount;
        }
        booking.paidAt =
            booking.paidAt ||
                new Date();
        await booking.save();
    }
    catch (error) {
        if (ticketsClaimed) {
            await Event.findByIdAndUpdate(event._id, {
                $inc: {
                    availableTickets: ticketCount,
                },
            });
        }
        if (promotionRedeemed &&
            booking.promotionReservation) {
            await restoreRedeemedPromotionReservation(booking.promotionReservation, booking._id);
        }
        throw error;
    }
    return {
        booking: await getPopulatedAdminBooking(booking._id),
        message: "Booking confirmed successfully.",
    };
};

export const updateAdminBookingStatusService = async (bookingId: string, status: string) => {
    getObjectIdOrThrow(bookingId, "booking ID");
    const normalizedStatus = status.toLowerCase();
    if (!isBookingStatus(normalizedStatus)) {
        throw new AdminServiceError(`Booking status must be one of ${bookingStatuses.join(", ")}.`, 400);
    }
    const booking = await Booking.findById(bookingId);
    if (!booking) {
        throw new AdminServiceError("Booking not found.", 404);
    }
    if (normalizedStatus ===
        "cancelled") {
        return cancelAdminBooking(booking);
    }
    if (normalizedStatus ===
        "confirmed") {
        return confirmAdminBooking(booking);
    }
    if (booking.status !==
        "pending") {
        throw new AdminServiceError("Only pending bookings can remain pending.", 409);
    }
    return {
        booking: await getPopulatedAdminBooking(booking._id),
        message: "Booking status is already pending.",
    };
};
