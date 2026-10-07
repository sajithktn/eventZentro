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

export const getEventName = (request: FeaturedEventRequest) => getRequestEvent(request)?.title || "Event";

export const getEventId = (request: FeaturedEventRequest) => {
    const event = getRequestEvent(request);
    return event?._id;
};

export const formatDateInput = (date: Date) => date.toISOString().slice(0, 10);
