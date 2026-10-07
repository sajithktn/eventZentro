import api from "@/lib/axios";
import type { CreateEventSchema } from "@/lib/validations/event";
import type {
  Event,
  EventDeleteResponse,
  EventLocationsResponse,
  EventMutationResponse,
  EventResponse,
  EventsResponse,
  OrganizerDashboardResponse,
} from "@/types/event";
import type { PaginationQueryParams } from "@/types/pagination";

export interface GetEventsParams
  extends PaginationQueryParams {
  location?: string;
  minPrice?: string | number;
  maxPrice?: string | number;
  dateFrom?: string;
  dateTo?: string;
  organizer?: "me";
}

export interface EventImageUploadResponse {
  success: boolean;
  message: string;
  image: {
    url: string;
    publicId: string;
  };
}

export const getAllEvents = async (
  params: GetEventsParams = {}
): Promise<EventsResponse> => {
  const response = await api.get("/events", {
    params,
  });

  return response.data;
};

export const getEventLocations =
  async (): Promise<EventLocationsResponse> => {
    const response = await api.get(
      "/events/locations"
    );

    return response.data;
  };

export const getEventById = async (
  id: string
): Promise<Event> => {
  const response = await api.get(
    `/events/${id}`
  );

  return response.data.event;
};

export const getOrganizerEvents = async (
  params: GetEventsParams = {}
): Promise<EventsResponse> => {
  const response = await api.get(
    "/events/organizer/my",
    {
      params,
    }
  );

  return response.data;
};

export const getOrganizerEventById = async (
  id: string
): Promise<Event> => {
  const response = await api.get<EventResponse>(
    `/events/organizer/${id}`
  );

  return response.data.event;
};

export const getOrganizerDashboard =
  async (): Promise<OrganizerDashboardResponse> => {
    const response = await api.get(
      "/events/organizer/dashboard"
    );

    return response.data;
  };

export const uploadEventImage = async (
  file: File
): Promise<EventImageUploadResponse> => {
  const formData = new FormData();

  formData.append("image", file);

  const response =
    await api.post<EventImageUploadResponse>(
      "/uploads/event-image",
      formData
    );

  return response.data;
};

const buildEventPayload = (
  data: CreateEventSchema
) => ({
  ...data,
  city: data.city.trim(),
  venue: data.venue.trim(),
  ticketPrice: Number(data.ticketPrice),
  totalTickets: Number(data.totalTickets),
  bannerImage:
    data.bannerImage?.trim() || undefined,
  bannerImagePublicId:
    data.bannerImagePublicId?.trim() ||
    undefined,
});

export const createEvent = async (
  data: CreateEventSchema
): Promise<EventMutationResponse> => {
  const payload = buildEventPayload(data);

  const response = await api.post(
    "/events",
    payload
  );

  return response.data;
};

export const updateEvent = async (
  id: string,
  data: CreateEventSchema
): Promise<EventMutationResponse> => {
  const payload = buildEventPayload(data);

  const response = await api.put(
    `/events/${id}`,
    payload
  );

  return response.data;
};

export const deleteEvent = async (
  id: string
): Promise<EventDeleteResponse> => {
  const response = await api.delete(
    `/events/${id}`
  );

  return response.data;
};