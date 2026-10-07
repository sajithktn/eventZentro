import api from "@/lib/axios";

export interface AdminCommissionSetting {
    _id: string;
    commissionPercentage: number;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface AdminCommissionResponse {
    success: boolean;
    message: string;
    commission: AdminCommissionSetting;
}

export interface UpdateAdminCommissionData {
    commissionPercentage: number;
    isActive: boolean;
}

export const getAdminCommission = async (): Promise<AdminCommissionResponse> => {
    const response = await api.get("/admin/commission");
    return response.data;
};

export const updateAdminCommission = async (data: UpdateAdminCommissionData): Promise<AdminCommissionResponse> => {
    const response = await api.patch("/admin/commission", data);
    return response.data;
};
