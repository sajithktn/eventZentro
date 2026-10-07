"use client";

import { type AdminBooking, type AdminBookingStatus } from "@/services/admin.service";

export interface PendingBookingAction {
    booking: AdminBooking;
    status: AdminBookingStatus;
}
