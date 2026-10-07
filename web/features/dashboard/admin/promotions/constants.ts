"use client";

import { type AdminPagination, type AdminPromotionMode, type AdminPromotionStatus } from "@/services/admin.service";
import { DEFAULT_PAGE_SIZE } from "@/utils/pagination";

export const modeFilters: Array<AdminPromotionMode | "all"> = ["all", "coupon", "automatic"];

export const statusFilters: Array<AdminPromotionStatus | "all"> = ["all", "active", "inactive", "expired"];

export const fieldClassName = "h-12 rounded-xl border-2 border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100";

export const initialPagination: AdminPagination = {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: DEFAULT_PAGE_SIZE,
    hasNextPage: false,
    hasPreviousPage: false,
};
