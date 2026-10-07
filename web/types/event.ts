import type { PaginatedApiResponse } from "@/types/pagination";
import type { PromotionSummary } from "@/types/promotion";
import type { Booking } from "@/types/booking";

export interface EventOrganizer {
  _id?: string;
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface Event {
  _id: string;
  title: string;
  description: string;
  category: string;
  city: string;
  venue: string;
  eventDate: string;
  startTime: string;
  endTime?: string;
  ticketPrice: number;
  totalTickets?: number;
  availableTickets?: number;
  bannerImage?: string;
  bannerImagePublicId?: string;
  status?: "draft" | "published" | "cancelled" | "completed";
  organizer?: string | EventOrganizer;
  isFeatured?: boolean;
  bestPromotion?: PromotionSummary | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface EventsResponse
  extends PaginatedApiResponse<Event> {
  success: boolean;
  count?: number;
  events?: Event[];
}

export interface EventLocationsResponse {
  success: boolean;
  message: string;
  count: number;
  locations: string[];
}

export interface EventResponse {
  success: boolean;
  message?: string;
  event: Event;
}

export interface EventMutationResponse
  extends EventResponse {
  message: string;
}

export interface EventDeleteResponse {
  success: boolean;
  message: string;
  eventId: string;
}

export interface OrganizerDashboardStatistics {
  totalEvents: number;
  publishedEvents: number;
  draftEvents: number;
  cancelledEvents: number;
  completedEvents: number;
  totalTicketsSold: number;
  totalBookings: number;
  totalRevenue: number;
  totalGrossRevenue: number;
  totalAdminCommission: number;
  totalOrganizerEarnings: number;
}

export interface OrganizerDashboardResponse {
  success: boolean;
  message: string;
  statistics: OrganizerDashboardStatistics;
  recentEvents: Event[];
  recentBookings?: Booking[];
}
