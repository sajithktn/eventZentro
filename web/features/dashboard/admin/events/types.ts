"use client";

import { type AdminEvent, type AdminEventStatus } from "@/services/admin.service";

export type PendingEventAction = {
    type: "status";
    event: AdminEvent;
    status: AdminEventStatus;
} | {
    type: "delete";
    event: AdminEvent;
};
