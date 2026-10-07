"use client";

import type { FeaturedEventPaymentStatus, FeaturedEventRequestStatus } from "@/types/featuredEvent";

export const paginationTargetId = "organizer-featured-events-results";

export const fieldClassName = "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition hover:border-orange-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-100";

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
