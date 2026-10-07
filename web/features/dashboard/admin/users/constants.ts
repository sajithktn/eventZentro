"use client";

import { type AdminPagination } from "@/services/admin.service";

export const emptyPagination: AdminPagination = {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPreviousPage: false,
};
