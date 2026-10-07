"use client";

import axios from "axios";

export const getAxiosMessage = (error: unknown, fallback: string) => {
    if (axios.isAxiosError(error)) {
        return error.response?.data?.message || fallback;
    }
    return error instanceof Error ? error.message : fallback;
};

export const eventEndedBookingMessage = "This event has already ended and is no longer available for booking.";
