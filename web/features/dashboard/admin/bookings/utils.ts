"use client";

import axios from "axios";
import { type AdminBooking } from "@/services/admin.service";

export const isPopulatedUser = (user: AdminBooking["user"]) => Boolean(user && typeof user !== "string");

export const isPopulatedEvent = (event: AdminBooking["event"]) => Boolean(event && typeof event !== "string");

export const getCustomerName = (booking: AdminBooking) => {
    if (!isPopulatedUser(booking.user)) {
        return "Deleted user";
    }
    const user = booking.user;
    if (!user || typeof user === "string") {
        return "Deleted user";
    }
    return ([user.firstName, user.lastName]
        .filter(Boolean)
        .join(" ") ||
        user.email ||
        "Deleted user");
};

export const getCustomerEmail = (booking: AdminBooking) => {
    if (!isPopulatedUser(booking.user)) {
        return "";
    }
    const user = booking.user;
    return user && typeof user !== "string"
        ? user.email || ""
        : "";
};

export const getEventTitle = (booking: AdminBooking) => {
    if (!isPopulatedEvent(booking.event)) {
        return "Deleted event";
    }
    const event = booking.event;
    return event && typeof event !== "string"
        ? event.title || "Deleted event"
        : "Deleted event";
};

export const getEventVenue = (booking: AdminBooking) => {
    if (!isPopulatedEvent(booking.event)) {
        return "";
    }
    const event = booking.event;
    return event && typeof event !== "string"
        ? event.venue || event.city || ""
        : "";
};

export const getTicketCount = (booking: AdminBooking) => booking.ticketCount || booking.quantity;

export const getOriginalAmount = (booking: AdminBooking) => booking.originalAmount ??
    booking.subtotalAmount ??
    booking.totalAmount;

export const getFinalAmount = (booking: AdminBooking) => booking.finalAmount ?? booking.totalAmount;

export const getErrorMessage = (error: unknown, fallback: string) => {
    if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message;
        return typeof message === "string"
            ? message
            : fallback;
    }
    if (error instanceof Error) {
        return error.message;
    }
    return fallback;
};
