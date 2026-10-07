import api from "@/lib/axios";

export interface AdminCategory {
    _id: string;
    name: string;
    slug?: string;
    isActive: boolean;
    eventCount?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface AdminCategoriesResponse {
    success: boolean;
    message: string;
    categories: AdminCategory[];
    data?: AdminCategory[];
}

export interface AdminCategoryResponse {
    success: boolean;
    message: string;
    category: AdminCategory;
}

export interface AdminCategoryDeleteResponse {
    success: boolean;
    message: string;
    categoryId?: string;
}

export const getAdminCategories = async (): Promise<AdminCategoriesResponse> => {
    const response = await api.get("/admin/categories");
    return response.data;
};

export const createAdminCategory = async (name: string): Promise<AdminCategoryResponse> => {
    const response = await api.post("/admin/categories", { name });
    return response.data;
};

export const updateAdminCategory = async (categoryId: string, name: string): Promise<AdminCategoryResponse> => {
    const response = await api.patch(`/admin/categories/${categoryId}`, { name });
    return response.data;
};

export const updateAdminCategoryStatus = async (categoryId: string, isActive: boolean): Promise<AdminCategoryResponse> => {
    const response = await api.patch(`/admin/categories/${categoryId}/status`, { isActive });
    return response.data;
};

export const deleteAdminCategory = async (categoryId: string): Promise<AdminCategoryDeleteResponse> => {
    const response = await api.delete(`/admin/categories/${categoryId}`);
    return response.data;
};
