"use client";

import type { FeaturedEventPaymentStatus, FeaturedEventRequestStatus } from "@/types/featuredEvent";

export const paginationTargetId = "admin-featured-events-results";

export const fieldClassName = "h-12 rounded-xl border-2 border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100";

export const statusOptions: Array<FeaturedEventRequestStatus | "all"> = [
    "all",
    "pending",
    "payment_pending",
    "paid",
    "approved",
    "rejected",
    "expired",
    "cancelled",
];

export const paymentOptions: Array<FeaturedEventPaymentStatus | "all"> = [
    "all",
    "unpaid",
    "pending",
    "paid",
    "failed",
    "refunded",
];

export const activeOptions = [
    "all",
    "active",
    "inactive",
    "expired",
] as const;

export type ActiveState = (typeof activeOptions)[number];

export const statusClasses: Record<FeaturedEventRequestStatus, string> = {
    pending: "bg-sky-50 text-sky-700",
    payment_pending: "bg-amber-50 text-amber-700",
    paid: "bg-blue-50 text-blue-700",
    approved: "bg-emerald-50 text-emerald-700",
    rejected: "bg-red-50 text-red-700",
    expired: "bg-slate-100 text-slate-600",
    cancelled: "bg-zinc-100 text-zinc-600",
};

export const paymentClasses: Record<FeaturedEventPaymentStatus, string> = {
    unpaid: "bg-amber-50 text-amber-700",
    pending: "bg-blue-50 text-blue-700",
    paid: "bg-emerald-50 text-emerald-700",
    failed: "bg-red-50 text-red-700",
    refunded: "bg-slate-100 text-slate-600",
};
