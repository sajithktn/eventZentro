"use client";

import axios from "axios";
import { type AdminEvent } from "@/services/admin.service";

export const getOrganizerName = (event: AdminEvent) => {
    if (!event.organizer) {
        return "Unknown organizer";
    }
    if (typeof event.organizer === "string") {
        return "Unknown organizer";
    }
    return ([
        event.organizer.firstName,
        event.organizer.lastName,
    ]
        .filter(Boolean)
        .join(" ") ||
        event.organizer.email ||
        "Unknown organizer");
};

export const getTicketsSold = (event: AdminEvent) => Math.max(event.totalTickets - event.availableTickets, 0);

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
