import api from "@/lib/axios";

import { AdminPagination } from "./users";

export type AdminEventStatus = "draft" | "published" | "cancelled" | "completed";

export interface AdminEventOrganizer {
    _id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    profileImage?: string;
}

export interface AdminEvent {
    _id: string;
    title: string;
    description?: string;
    category: string;
    city?: string;
    venue: string;
    eventDate: string;
    startTime?: string;
    endTime?: string;
    ticketPrice: number;
    totalTickets: number;
    availableTickets: number;
    bannerImage?: string;
    organizer?: string | AdminEventOrganizer | null;
    status: AdminEventStatus;
    isFeatured?: boolean;
    createdAt: string;
    updatedAt?: string;
}

export interface AdminEventsParams {
    page?: number;
    limit?: number;
    search?: string;
    status?: AdminEventStatus | "all";
    category?: string;
    organizer?: string;
    sort?: string;
}

export interface AdminEventsResponse {
    success: boolean;
    message: string;
    data: AdminEvent[];
    events: AdminEvent[];
    pagination: AdminPagination;
}

export interface AdminEventResponse {
    success: boolean;
    message: string;
    event: AdminEvent;
}

export interface AdminEventDeleteResponse {
    success: boolean;
    message: string;
    eventId: string;
}

export const getAdminEvents = async (params: AdminEventsParams = {}): Promise<AdminEventsResponse> => {
    const response = await api.get("/admin/events", {
        params,
    });
    return response.data;
};

export const getAdminEventById = async (eventId: string): Promise<AdminEventResponse> => {
    const response = await api.get(`/admin/events/${eventId}`);
    return response.data;
};

export const updateAdminEventStatus = async (eventId: string, status: AdminEventStatus): Promise<AdminEventResponse> => {
    const response = await api.patch(`/admin/events/${eventId}/status`, {
        status,
    });
    return response.data;
};

export const deleteAdminEvent = async (eventId: string): Promise<AdminEventDeleteResponse> => {
    const response = await api.delete(`/admin/events/${eventId}`);
    return response.data;
};
