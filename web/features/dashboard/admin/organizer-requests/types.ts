"use client";

import { type AdminOrganizerApplication } from "@/services/admin.service";

export type PendingRequestAction = {
    type: "approve";
    application: AdminOrganizerApplication;
} | {
    type: "reject";
    application: AdminOrganizerApplication;
};
