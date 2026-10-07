"use client";

import axios from "axios";
import type { FeaturedEventRequest } from "@/types/featuredEvent";

export const getErrorMessage = (error: unknown, fallback: string) => {
    if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message;
        return typeof message === "string"
            ? message
            : fallback;
    }
    return error instanceof Error
        ? error.message
        : fallback;
};

export const getRequestEvent = (request: FeaturedEventRequest) => request.event && typeof request.event !== "string"
    ? request.event
    : null;

export const getOrganizerName = (request: FeaturedEventRequest) => {
    if (!request.organizer ||
        typeof request.organizer === "string") {
        return "Unknown organizer";
    }
    return ([
        request.organizer.firstName,
        request.organizer.lastName,
    ]
        .filter(Boolean)
        .join(" ") ||
        request.organizer.email ||
        "Unknown organizer");
};

export const formatDateInput = (value?: string) => {
    if (!value) {
        return "";
    }
    return new Date(value).toISOString().slice(0, 10);
};
