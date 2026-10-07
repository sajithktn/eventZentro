import crypto from "crypto";
import { IBooking } from "./booking.interface";
import Booking from "./booking.model";
import Event from "../event/event.model";
import razorpay from "../../config/razorpay";
import { restoreRedeemedPromotionReservation, redeemPromotionReservation, toRazorpayPaise } from "../coupon/coupon.service";

import { calculateCommission, getAppliedPromotionId, getBookableEventOrThrow, getBookingTicketCount, signaturesMatch } from "./helpers";
import { VerifyPaymentData } from "./types";

export const verifyPaymentRazorpay = async (userId: string, data: VerifyPaymentData) => {
    const { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature, } = data;
    const booking = await Booking.findOne({
        _id: bookingId,
        user: userId,
    });
    if (!booking) {
        throw new Error("Booking not found.");
    }
    if (booking.paymentStatus ===
        "paid") {
        return {
            success: true,
            bookingId: booking._id,
            message: "Payment is already verified.",
        };
    }
    if (booking.paymentStatus ===
        "verifying") {
        return {
            success: true,
            bookingId: booking._id,
            message: "Payment verification is already in progress.",
        };
    }
    if (booking.status ===
        "cancelled") {
        throw new Error("Payment cannot be verified for a cancelled booking.");
    }
    if (booking.totalAmount <= 0) {
        throw new Error("Payment verification is not required for this booking.");
    }
    if (!booking.razorpayOrderId) {
        throw new Error("Razorpay order was not created for this booking.");
    }
    const storedRazorpayOrderId = booking.razorpayOrderId;
    if (storedRazorpayOrderId !==
        razorpay_order_id) {
        throw new Error("Razorpay order ID mismatch.");
    }
    const requestedTicketCount = getBookingTicketCount(booking);
    await getBookableEventOrThrow(booking.event, requestedTicketCount);
    const keySecret = process.env
        .RAZORPAY_KEY_SECRET;
    if (!keySecret) {
        throw new Error("Razorpay key secret is not configured.");
    }
    const expectedSignature = crypto
        .createHmac("sha256", keySecret)
        .update(`${storedRazorpayOrderId}|${razorpay_payment_id}`)
        .digest("hex");
    if (!signaturesMatch(expectedSignature, razorpay_signature)) {
        throw new Error("Invalid payment signature.");
    }
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    const expectedAmount = toRazorpayPaise(booking.finalAmount ??
        booking.totalAmount);
    if (payment.order_id !==
        storedRazorpayOrderId) {
        throw new Error("Payment does not belong to this booking order.");
    }
    if (Number(payment.amount) !==
        expectedAmount) {
        throw new Error("Payment amount does not match the booking amount.");
    }
    if (payment.currency !==
        "INR") {
        throw new Error("Invalid payment currency.");
    }
    if (payment.status !==
        "captured") {
        throw new Error("Payment has not been captured.");
    }
    const lockedBooking = await Booking.findOneAndUpdate({
        _id: bookingId,
        user: userId,
        paymentStatus: "pending",
        razorpayOrderId: storedRazorpayOrderId,
    }, {
        $set: {
            paymentStatus: "verifying",
        },
    }, {
        new: true,
    });
    if (!lockedBooking) {
        const latestBooking = await Booking.findOne({
            _id: bookingId,
            user: userId,
        });
        if (latestBooking
            ?.paymentStatus ===
            "paid") {
            return {
                success: true,
                bookingId,
                message: "Payment is already verified.",
            };
        }
        if (latestBooking
            ?.paymentStatus ===
            "verifying") {
            return {
                success: true,
                bookingId,
                message: "Payment verification is already in progress.",
            };
        }
        throw new Error("Payment verification could not be started.");
    }
    const ticketCount = getBookingTicketCount(lockedBooking);
    await getBookableEventOrThrow(lockedBooking.event, ticketCount);
    const revenue = await calculateCommission(lockedBooking.finalAmount ??
        lockedBooking.totalAmount);
    let ticketsClaimed = false;
    let ticketsRestored = false;
    let promotionRedeemed = false;
    const restoreTickets = async () => {
        if (!ticketsClaimed ||
            ticketsRestored) {
            return;
        }
        await Event.findByIdAndUpdate(lockedBooking.event, {
            $inc: {
                availableTickets: ticketCount,
            },
        });
        ticketsRestored = true;
    };
    let confirmedBooking: IBooking | null = null;
    try {
        const appliedPromotionId = getAppliedPromotionId(lockedBooking);
        if (appliedPromotionId) {
            if (!lockedBooking
                .promotionReservation) {
                throw new Error("Promotion reservation was not found for this booking.");
            }
            await redeemPromotionReservation(lockedBooking
                .promotionReservation, lockedBooking._id);
            promotionRedeemed = true;
        }
        const updatedEvent = await Event.findOneAndUpdate({
            _id: lockedBooking.event,
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
            await getBookableEventOrThrow(lockedBooking.event, ticketCount);
            throw new Error("Not enough tickets are available.");
        }
        ticketsClaimed = true;
        confirmedBooking =
            await Booking.findOneAndUpdate({
                _id: bookingId,
                user: userId,
                paymentStatus: "verifying",
                razorpayOrderId: storedRazorpayOrderId,
            }, {
                $set: {
                    razorpayOrderId: razorpay_order_id,
                    razorpayPaymentId: razorpay_payment_id,
                    razorpaySignature: razorpay_signature,
                    paymentStatus: "paid",
                    status: "confirmed",
                    amountPaid: revenue.amountPaid,
                    adminCommissionRate: revenue
                        .adminCommissionRate,
                    adminCommissionAmount: revenue
                        .adminCommissionAmount,
                    organizerEarnings: revenue
                        .organizerEarnings,
                    commissionCalculatedAt: revenue
                        .commissionCalculatedAt,
                    paidAt: new Date(),
                },
            }, {
                new: true,
            });
        if (!confirmedBooking) {
            await restoreTickets();
            if (promotionRedeemed &&
                lockedBooking
                    .promotionReservation) {
                await restoreRedeemedPromotionReservation(lockedBooking
                    .promotionReservation, lockedBooking._id);
            }
            const latestBooking = await Booking.findOne({
                _id: bookingId,
                user: userId,
            });
            if (latestBooking
                ?.paymentStatus ===
                "paid") {
                return {
                    success: true,
                    bookingId,
                    message: "Payment is already verified.",
                };
            }
            throw new Error("Payment verification could not be completed.");
        }
    }
    catch (error) {
        await restoreTickets();
        if (promotionRedeemed &&
            lockedBooking
                .promotionReservation) {
            await restoreRedeemedPromotionReservation(lockedBooking
                .promotionReservation, lockedBooking._id);
        }
        await Booking.findOneAndUpdate({
            _id: bookingId,
            user: userId,
            paymentStatus: "verifying",
        }, {
            $set: {
                paymentStatus: "pending",
            },
        });
        throw error;
    }
    return {
        success: true,
        bookingId,
        message: "Payment verified and booking confirmed successfully.",
    };
};
