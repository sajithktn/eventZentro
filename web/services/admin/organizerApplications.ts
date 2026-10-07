import api from "@/lib/axios";

import { AdminPagination, AdminUser, AdminUserRole } from "./users";

export type AdminOrganizerApplicationStatus = "pending" | "approved" | "rejected";

export interface AdminOrganizerApplicationUser {
    _id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    profileImage?: string;
    role?: AdminUserRole;
    isBlocked?: boolean;
    isDeleted?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface AdminOrganizerApplication {
    _id: string;
    user?: string | AdminOrganizerApplicationUser | null;
    organizerName: string;
    category: string;
    description: string;
    phone: string;
    location: string;
    website?: string;
    instagram?: string;
    linkedin?: string;
    profileImage?: string;
    status: AdminOrganizerApplicationStatus;
    rejectionReason?: string;
    reviewedBy?: string | AdminOrganizerApplicationUser | null;
    reviewedAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface AdminOrganizerApplicationsParams {
    search?: string;
    status?: AdminOrganizerApplicationStatus | "all";
    page?: number;
    limit?: number;
}

export interface AdminOrganizerApplicationsResponse {
    success: boolean;
    message: string;
    data: AdminOrganizerApplication[];
    applications: AdminOrganizerApplication[];
    pagination: AdminPagination;
}

export interface AdminOrganizerApplicationResponse {
    success: boolean;
    message: string;
    application: AdminOrganizerApplication;
    user?: AdminUser;
}

export const getAdminOrganizerApplications = async (params: AdminOrganizerApplicationsParams = {}): Promise<AdminOrganizerApplicationsResponse> => {
    const response = await api.get("/organizer-applications/admin", {
        params,
    });
    return response.data;
};

export const getAdminOrganizerApplicationById = async (applicationId: string): Promise<AdminOrganizerApplicationResponse> => {
    const response = await api.get(`/organizer-applications/admin/${applicationId}`);
    return response.data;
};

export const approveAdminOrganizerApplication = async (applicationId: string): Promise<AdminOrganizerApplicationResponse> => {
    const response = await api.patch(`/organizer-applications/admin/${applicationId}/approve`);
    return response.data;
};

export const rejectAdminOrganizerApplication = async (applicationId: string, rejectionReason?: string): Promise<AdminOrganizerApplicationResponse> => {
    const response = await api.patch(`/organizer-applications/admin/${applicationId}/reject`, {
        rejectionReason,
    });
    return response.data;
};
