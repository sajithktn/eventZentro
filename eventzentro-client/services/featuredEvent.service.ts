import api from "@/lib/axios";
import type {
  AdminFeaturedEventRequestsParams,
  CreateFeaturedEventPaymentOrderResponse,
  CreateFeaturedEventRequestData,
  CreateFeaturedEventRequestResponse,
  FeaturedEventRequestResponse,
  FeaturedEventRequestsResponse,
  FeaturedEventSettingsResponse,
  FeaturedEventsResponse,
  OrganizerFeaturedEventRequestsParams,
  UpdateFeaturedEventSettingsData,
  VerifyFeaturedEventPaymentData,
} from "@/types/featuredEvent";
import type { EventsResponse } from "@/types/event";

export const getPublicFeaturedEvents =
  async (): Promise<FeaturedEventsResponse> => {
    const response = await api.get(
      "/events/featured"
    );

    return response.data;
  };

export const getFeaturedEventSettings =
  async (): Promise<FeaturedEventSettingsResponse> => {
    const response = await api.get(
      "/featured-events/settings"
    );

    return response.data;
  };

export const getAdminFeaturedEventSettings =
  async (): Promise<FeaturedEventSettingsResponse> => {
    const response = await api.get(
      "/featured-events/admin/settings"
    );

    return response.data;
  };

export const updateAdminFeaturedEventSettings =
  async (
    data: UpdateFeaturedEventSettingsData
  ): Promise<FeaturedEventSettingsResponse> => {
    const response = await api.patch(
      "/featured-events/admin/settings",
      data
    );

    return response.data;
  };

export const getEligibleFeaturedEvents =
  async (): Promise<EventsResponse> => {
    const response = await api.get(
      "/featured-events/organizer/events"
    );

    return response.data;
  };

export const getOrganizerFeaturedEventRequests =
  async (
    params: OrganizerFeaturedEventRequestsParams = {}
  ): Promise<FeaturedEventRequestsResponse> => {
    const response = await api.get(
      "/featured-events/organizer",
      {
        params,
      }
    );

    return response.data;
  };

export const createFeaturedEventRequest =
  async (
    data: CreateFeaturedEventRequestData
  ): Promise<CreateFeaturedEventRequestResponse> => {
    const response = await api.post(
      "/featured-events/organizer",
      data
    );

    return response.data;
  };

export const createFeaturedEventPaymentOrder =
  async (
    requestId: string
  ): Promise<CreateFeaturedEventPaymentOrderResponse> => {
    const response = await api.post(
      `/featured-events/organizer/${requestId}/payment/create-order`
    );

    return response.data;
  };

export const verifyFeaturedEventPayment =
  async (
    data: VerifyFeaturedEventPaymentData
  ): Promise<FeaturedEventRequestResponse> => {
    const response = await api.post(
      "/featured-events/organizer/payment/verify",
      data
    );

    return response.data;
  };

export const cancelFeaturedEventRequest =
  async (
    requestId: string
  ): Promise<FeaturedEventRequestResponse> => {
    const response = await api.patch(
      `/featured-events/organizer/${requestId}/cancel`
    );

    return response.data;
  };

export const getAdminFeaturedEventRequests =
  async (
    params: AdminFeaturedEventRequestsParams = {}
  ): Promise<FeaturedEventRequestsResponse> => {
    const response = await api.get(
      "/featured-events/admin",
      {
        params,
      }
    );

    return response.data;
  };

export const approveFeaturedEventRequest =
  async (
    requestId: string,
    data: {
      approvedStartDate?: string;
      approvedEndDate?: string;
      adminNote?: string;
    } = {}
  ): Promise<FeaturedEventRequestResponse> => {
    const response = await api.patch(
      `/featured-events/admin/${requestId}/approve`,
      data
    );

    return response.data;
  };

export const rejectFeaturedEventRequest =
  async (
    requestId: string,
    rejectionReason: string
  ): Promise<FeaturedEventRequestResponse> => {
    const response = await api.patch(
      `/featured-events/admin/${requestId}/reject`,
      {
        rejectionReason,
      }
    );

    return response.data;
  };

export const updateAdminFeaturedEventRequest =
  async (
    requestId: string,
    data: {
      isActive?: boolean;
      approvedStartDate?: string;
      approvedEndDate?: string;
      adminNote?: string;
    }
  ): Promise<FeaturedEventRequestResponse> => {
    const response = await api.patch(
      `/featured-events/admin/${requestId}`,
      data
    );

    return response.data;
  };
