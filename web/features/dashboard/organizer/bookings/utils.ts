"use client";

import type { User } from "@/types/auth";
import type { Booking } from "@/types/booking";

export const getBookingUser = (booking: Booking): User | null => {
    if (!booking.user ||
        typeof booking.user === "string") {
        return null;
    }
    return booking.user;
};

export const getAmountPaid = (booking: Booking) => {
    return Number(booking.amountPaid ??
        booking.finalAmount ??
        booking.totalAmount ??
        0);
};

export const getAdminCommissionAmount = (booking: Booking) => {
    return Number(booking.adminCommissionAmount ?? 0);
};

export const getOrganizerEarnings = (booking: Booking) => {
    if (typeof booking.organizerEarnings ===
        "number") {
        return booking.organizerEarnings;
    }
    return Math.max(getAmountPaid(booking) -
        getAdminCommissionAmount(booking), 0);
};

export const getAdminCommissionRate = (booking: Booking) => {
    if (typeof booking.adminCommissionRate ===
        "number") {
        return booking.adminCommissionRate;
    }
    const amountPaid = getAmountPaid(booking);
    const commission = getAdminCommissionAmount(booking);
    if (amountPaid <= 0 || commission <= 0) {
        return 0;
    }
    return Number(((commission / amountPaid) *
        100).toFixed(2));
};
