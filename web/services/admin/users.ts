import api from "@/lib/axios";

export interface AdminUserAddress {
    country?: string;
    state?: string;
    city?: string;
    zipCode?: string;
}

export type AdminUserRole = "user" | "organizer" | "admin";

export type AdminAuthProvider = "local" | "google" | "github";

export type AdminUserStatus = "all" | "active" | "blocked" | "deleted";

export interface AdminUser {
    _id: string;
    firstName: string;
    lastName?: string;
    email: string;
    profileImage?: string;
    bio?: string;
    role: AdminUserRole;
    provider?: AdminAuthProvider;
    isVerified: boolean;
    isBlocked: boolean;
    isDeleted: boolean;
    address?: AdminUserAddress;
    lastLogin?: string;
    createdAt: string;
    updatedAt: string;
}

export interface AdminPagination {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export interface AdminUsersResponse {
    success: boolean;
    message: string;
    users: AdminUser[];
    pagination: AdminPagination;
}

export interface AdminUsersParams {
    search?: string;
    role?: AdminUserRole | "all";
    status?: AdminUserStatus;
    page?: number;
    limit?: number;
}

export interface AdminUserBookingEvent {
    _id: string;
    title: string;
    venue: string;
    eventDate: string;
    status: "draft" | "published" | "cancelled" | "completed";
    ticketPrice: number;
    bannerImage?: string;
}

export interface AdminUserBooking {
    _id: string;
    bookingCode: string;
    quantity: number;
    totalAmount: number;
    status: "confirmed" | "cancelled";
    event?: AdminUserBookingEvent | null;
    createdAt: string;
    updatedAt: string;
}

export interface AdminUserBookingSummary {
    totalBookings: number;
    confirmedBookings: number;
    cancelledBookings: number;
    totalSpent: number;
}

export interface AdminUserDetailsResponse {
    success: boolean;
    message: string;
    user: AdminUser;
    bookings: AdminUserBooking[];
    summary: AdminUserBookingSummary;
}

export interface AdminUserMutationResponse {
    success: boolean;
    message: string;
    user: AdminUser;
}

export const getAdminUsers = async (params: AdminUsersParams = {}): Promise<AdminUsersResponse> => {
    const response = await api.get("/admin/users", {
        params,
    });
    return response.data;
};

export const getAdminUserDetails = async (userId: string): Promise<AdminUserDetailsResponse> => {
    const response = await api.get(`/admin/users/${userId}`);
    return response.data;
};

export const blockAdminUser = async (userId: string): Promise<AdminUserMutationResponse> => {
    const response = await api.patch(`/admin/users/${userId}/block`);
    return response.data;
};

export const unblockAdminUser = async (userId: string): Promise<AdminUserMutationResponse> => {
    const response = await api.patch(`/admin/users/${userId}/unblock`);
    return response.data;
};

export const verifyAdminUser = async (userId: string): Promise<AdminUserMutationResponse> => {
    const response = await api.patch(`/admin/users/${userId}/verify`);
    return response.data;
};

export const updateAdminUserRole = async (userId: string, role: "user" | "organizer"): Promise<AdminUserMutationResponse> => {
    const response = await api.patch(`/admin/users/${userId}/role`, {
        role,
    });
    return response.data;
};

export const deleteAdminUser = async (userId: string): Promise<AdminUserMutationResponse> => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
};

export const restoreAdminUser = async (userId: string): Promise<AdminUserMutationResponse> => {
    const response = await api.patch(`/admin/users/${userId}/restore`);
    return response.data;
};
