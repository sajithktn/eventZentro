"use client";

import type { Event } from "@/types/event";

export interface Category {
    _id: string;
    name: string;
}

export interface EditEventFormProps {
    event: Event;
}
