"use client";

import { type AdminPromotion, type AdminPromotionStatus } from "@/services/admin.service";

export type PendingPromotionAction = {
    type: "status";
    promotion: AdminPromotion;
    status: AdminPromotionStatus;
} | {
    type: "delete";
    promotion: AdminPromotion;
};
