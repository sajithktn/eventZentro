import { Types } from "mongoose";
import Booking from "./booking.model";
import Event from "../event/event.model";
import razorpay from "../../config/razorpay";
import { getPromotionQuoteService, releasePromotionReservationByBooking, reservePromotionForBooking, restoreRedeemedPromotionReservation, redeemPromotionReservation, toRazorpayPaise } from "../coupon/coupon.service";

import { applyQuoteToBooking, calculateCommission, createBookingCode, getAppliedPromotionId, getBookableEventOrThrow, getBookingTicketCount, populateBookingById } from "./helpers";

export const createBookingService = async (eventId: string, userId: string, quantity: number, couponCode?: string) => {
    if (!Number.isInteger(quantity) ||
        quantity < 1) {
        throw new Error("Ticket quantity must be at least 1.");
    }
    const event = await getBookableEventOrThrow(eventId, quantity);
    const quote = await getPromotionQuoteService({
        eventId,
        userId,
        ticketCount: quantity,
        couponCode,
    });
    const isFreeBooking = quote.finalAmount === 0;
    const booking = new Booking({
        user: new Types.ObjectId(userId),
        event: new Types.ObjectId(event._id.toString()),
        quantity,
        ticketCount: quantity,
        status: isFreeBooking
            ? "confirmed"
            : "pending",
        paymentStatus: isFreeBooking
            ? "paid"
            : "unpaid",
        amountPaid: 0,
        bookingCode: createBookingCode(),
    });
    applyQuoteToBooking(booking, quote, quantity);
    if (isFreeBooking) {
        Object.assign(booking, await calculateCommission(quote.finalAmount));
        booking.paidAt = new Date();
    }
    let ticketsClaimed = false;
    let redeemedReservation = false;
    try {
        const appliedPromotionId = getAppliedPromotionId(booking);
        if (isFreeBooking &&
            appliedPromotionId) {
            await getBookableEventOrThrow(event._id, quantity);
            const reservation = await reservePromotionForBooking({
                bookingId: booking._id,
                userId: booking.user,
                eventId: booking.event,
                promotionId: appliedPromotionId,
                ticketCount: quantity,
                subtotalAmount: quote.subtotal,
                discountAmount: quote.discountAmount,
            });
            booking.promotionReservation =
                reservation._id;
        }
        if (isFreeBooking) {
            await getBookableEventOrThrow(event._id, quantity);
            const updatedEvent = await Event.findOneAndUpdate({
                _id: event._id,
                status: "published",
                availableTickets: {
                    $gte: quantity,
                },
            }, {
                $inc: {
                    availableTickets: -quantity,
                },
            }, {
                new: true,
            });
            if (!updatedEvent) {
                await getBookableEventOrThrow(event._id, quantity);
                throw new Error("Not enough tickets available.");
            }
            ticketsClaimed = true;
            event.availableTickets =
                updatedEvent.availableTickets;
        }
        if (isFreeBooking &&
            booking.promotionReservation) {
            await redeemPromotionReservation(booking.promotionReservation, booking._id);
            redeemedReservation = true;
        }
        await booking.save();
    }
    catch (error) {
        if (ticketsClaimed) {
            await Event.findByIdAndUpdate(event._id, {
                $inc: {
                    availableTickets: quantity,
                },
            });
        }
        if (redeemedReservation &&
            booking.promotionReservation) {
            await restoreRedeemedPromotionReservation(booking.promotionReservation, booking._id);
        }
        if (booking.promotionReservation) {
            await releasePromotionReservationByBooking(booking._id);
        }
        throw error;
    }
    return {
        booking: await populateBookingById(booking._id),
        event,
    };
};

export const createPaymentBooking = async (bookingId: string, userId: string) => {
    const booking = await Booking.findOne({
        _id: bookingId,
        user: userId,
    });
    if (!booking) {
        throw new Error("Booking not found.");
    }
    if (booking.status ===
        "cancelled") {
        throw new Error("Payment cannot be made for a cancelled booking.");
    }
    if (booking.paymentStatus ===
        "paid") {
        throw new Error("Booking payment is already completed.");
    }
    if (booking.paymentStatus ===
        "verifying") {
        throw new Error("Payment verification is already in progress.");
    }
    const ticketCount = getBookingTicketCount(booking);
    const event = await getBookableEventOrThrow(booking.event, ticketCount);
    const quote = await getPromotionQuoteService({
        eventId: event._id.toString(),
        userId,
        ticketCount,
        couponCode: booking.couponCode,
    });
    applyQuoteToBooking(booking, quote, ticketCount);
    let appliedPromotionId = getAppliedPromotionId(booking);
    if (!appliedPromotionId) {
        await releasePromotionReservationByBooking(booking._id);
        booking.promotionReservation =
            undefined;
    }
    if (quote.finalAmount <= 0) {
        let ticketsClaimed = false;
        let redeemedReservation = false;
        try {
            appliedPromotionId =
                getAppliedPromotionId(booking);
            if (appliedPromotionId) {
                const reservation = await reservePromotionForBooking({
                    bookingId: booking._id,
                    userId: booking.user,
                    eventId: booking.event,
                    promotionId: appliedPromotionId,
                    ticketCount,
                    subtotalAmount: quote.subtotal,
                    discountAmount: quote.discountAmount,
                });
                booking.promotionReservation =
                    reservation._id;
            }
            const updatedEvent = await Event.findOneAndUpdate({
                _id: event._id,
                status: "published",
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
                await getBookableEventOrThrow(event._id, ticketCount);
                throw new Error("Not enough tickets available.");
            }
            ticketsClaimed = true;
            if (booking.promotionReservation) {
                await redeemPromotionReservation(booking.promotionReservation, booking._id);
                redeemedReservation =
                    true;
            }
            Object.assign(booking, await calculateCommission(quote.finalAmount));
            booking.status =
                "confirmed";
            booking.paymentStatus =
                "paid";
            booking.paidAt =
                new Date();
            await booking.save();
            return {
                bookingId: booking._id,
                order: null,
                amountToPay: 0,
                key: process.env
                    .RAZORPAY_KEY_ID,
                freeBooking: true,
            };
        }
        catch (error) {
            if (ticketsClaimed) {
                await Event.findByIdAndUpdate(event._id, {
                    $inc: {
                        availableTickets: ticketCount,
                    },
                });
            }
            if (redeemedReservation &&
                booking.promotionReservation) {
                await restoreRedeemedPromotionReservation(booking.promotionReservation, booking._id);
            }
            if (booking.promotionReservation) {
                await releasePromotionReservationByBooking(booking._id);
            }
            throw error;
        }
    }
    if (booking.razorpayOrderId &&
        booking.paymentStatus ===
            "pending") {
        appliedPromotionId =
            getAppliedPromotionId(booking);
        if (appliedPromotionId) {
            await getBookableEventOrThrow(event._id, ticketCount);
            const reservation = await reservePromotionForBooking({
                bookingId: booking._id,
                userId: booking.user,
                eventId: booking.event,
                promotionId: appliedPromotionId,
                ticketCount,
                subtotalAmount: quote.subtotal,
                discountAmount: quote.discountAmount,
            });
            booking.promotionReservation =
                reservation._id;
            await booking.save();
        }
        const existingOrder = await razorpay.orders.fetch(booking.razorpayOrderId);
        if (existingOrder.status ===
            "paid") {
            throw new Error("Payment is completed and awaiting verification.");
        }
        if (Number(existingOrder.amount) ===
            toRazorpayPaise(quote.finalAmount)) {
            await booking.save();
            return {
                bookingId: booking._id,
                order: existingOrder,
                amountToPay: quote.finalAmount,
                key: process.env
                    .RAZORPAY_KEY_ID,
            };
        }
    }
    let reservationId: Types.ObjectId | undefined;
    appliedPromotionId =
        getAppliedPromotionId(booking);
    if (appliedPromotionId) {
        await getBookableEventOrThrow(event._id, ticketCount);
        const reservation = await reservePromotionForBooking({
            bookingId: booking._id,
            userId: booking.user,
            eventId: booking.event,
            promotionId: appliedPromotionId,
            ticketCount,
            subtotalAmount: quote.subtotal,
            discountAmount: quote.discountAmount,
        });
        reservationId =
            reservation._id;
        booking.promotionReservation =
            reservation._id;
    }
    const amountToPay = quote.finalAmount;
    try {
        await getBookableEventOrThrow(event._id, ticketCount);
        const order = await razorpay.orders.create({
            amount: toRazorpayPaise(amountToPay),
            currency: "INR",
            receipt: `booking_${bookingId}`,
            notes: {
                bookingId,
                eventId: event._id.toString(),
                userId,
            },
        });
        booking.razorpayOrderId =
            order.id;
        booking.paymentStatus =
            "pending";
        await booking.save();
        return {
            bookingId: booking._id,
            order,
            amountToPay,
            key: process.env
                .RAZORPAY_KEY_ID,
        };
    }
    catch (error) {
        if (reservationId) {
            await releasePromotionReservationByBooking(booking._id);
        }
        throw error;
    }
};

export const cancelPendingBookingService = async (bookingId: string, userId: string) => {
    const booking = await Booking.findOne({
        _id: bookingId,
        user: userId,
    });
    if (!booking) {
        throw new Error("Booking not found.");
    }
    if (booking.paymentStatus ===
        "paid") {
        throw new Error("Paid bookings cannot be cancelled from this flow.");
    }
    if (booking.status ===
        "cancelled") {
        return {
            success: true,
            bookingId: booking._id,
            message: "Booking is already cancelled.",
        };
    }
    await releasePromotionReservationByBooking(booking._id);
    booking.status =
        "cancelled";
    booking.paymentStatus =
        "failed";
    await booking.save();
    return {
        success: true,
        bookingId: booking._id,
        message: "Booking cancelled successfully.",
    };
};
