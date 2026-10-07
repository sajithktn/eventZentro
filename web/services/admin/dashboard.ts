import api from "@/lib/axios";

export interface AdminDashboardStatistics {
    totalUsers: number;
    totalOrganizers: number;
    totalEvents: number;
    totalBookings: number;
    totalRevenue: number;
    totalAdminCommission: number;
    totalOrganizerEarnings: number;
    featuredEventRevenue: number;
    totalPlatformEarnings: number;
}

export interface AdminDashboardUser {
    id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: string;
}

export interface AdminDashboardResponse {
    success: boolean;
    message: string;
    admin?: AdminDashboardUser;
    statistics: AdminDashboardStatistics;
}

export const getAdminDashboard = async (): Promise<AdminDashboardResponse> => {
    const response = await api.get("/admin/dashboard");
    return response.data;
};
