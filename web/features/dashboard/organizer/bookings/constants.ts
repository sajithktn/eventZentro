"use client";

export const statusStyles: Record<string, string> = {
    confirmed: "bg-emerald-100 text-emerald-700",
    pending: "bg-amber-100 text-amber-700",
    cancelled: "bg-red-100 text-red-700",
};

export const paymentStatusStyles: Record<string, string> = {
    paid: "text-emerald-600",
    pending: "text-amber-600",
    verifying: "text-sky-600",
    unpaid: "text-slate-500",
    failed: "text-red-600",
    refunded: "text-purple-600",
};

export const statusOptions = [
    {
        label: "All",
        value: "all",
    },
    {
        label: "Confirmed",
        value: "confirmed",
    },
    {
        label: "Pending",
        value: "pending",
    },
    {
        label: "Cancelled",
        value: "cancelled",
    },
];

export const paginationTargetId = "organizer-bookings-results";
