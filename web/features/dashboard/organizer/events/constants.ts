"use client";

import type { OrganizerDashboardStatistics } from "@/types/event";

export const statusStyles: Record<string, string> = {
    draft: "bg-amber-100 text-amber-700",
    published: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-red-100 text-red-700",
    completed: "bg-slate-100 text-slate-600",
};

export const statusOptions = [
    { label: "All", value: "all" },
    { label: "Published", value: "published" },
    { label: "Draft", value: "draft" },
    { label: "Cancelled", value: "cancelled" },
    { label: "Completed", value: "completed" },
];

export const paginationTargetId = "organizer-events-results";

export const emptyStatistics: OrganizerDashboardStatistics = {
    totalEvents: 0,
    publishedEvents: 0,
    draftEvents: 0,
    cancelledEvents: 0,
    completedEvents: 0,
    totalTicketsSold: 0,
    totalBookings: 0,
    totalRevenue: 0,
    totalGrossRevenue: 0,
    totalAdminCommission: 0,
    totalOrganizerEarnings: 0,
};
