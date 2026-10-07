"use client";

import { type AdminUser } from "@/services/admin.service";

export type ManageAction = "block" | "unblock" | "verify" | "delete" | "restore" | "role";

export interface PendingAction {
    type: ManageAction;
    user: AdminUser;
    nextRole?: "user" | "organizer";
}
