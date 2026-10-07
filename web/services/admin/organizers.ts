import api from "@/lib/axios";

import { AdminPagination, AdminUser } from "./users";

export type AdminOrganizerStatus = "all" | "active" | "blocked" | "deleted";

export interface AdminOrganizer extends AdminUser {
    role: "organizer";
}

export type AdminOrganizersPagination = AdminPagination;

export interface AdminOrganizersResponse {
    success: boolean;
    message: string;
    organizers: AdminOrganizer[];
    pagination: AdminOrganizersPagination;
}

export interface AdminOrganizersParams {
    search?: string;
    status?: AdminOrganizerStatus;
    page?: number;
    limit?: number;
}

export const getAdminOrganizers = async (params: AdminOrganizersParams = {}): Promise<AdminOrganizersResponse> => {
    const response = await api.get("/admin/organizers", {
        params,
    });
    return response.data;
};
