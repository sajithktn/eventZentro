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

export interface AdminUserAddress {
  country?: string;
  state?: string;
  city?: string;
  zipCode?: string;
}

export type AdminUserRole =
  | "user"
  | "organizer"
  | "admin";

export type AdminAuthProvider =
  | "local"
  | "google"
  | "github";

export type AdminUserStatus =
  | "all"
  | "active"
  | "blocked"
  | "deleted";

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

export type AdminOrganizerStatus =
  | "all"
  | "active"
  | "blocked"
  | "deleted";

export interface AdminOrganizer
  extends AdminUser {
  role: "organizer";
}

export type AdminOrganizersPagination =
  AdminPagination;

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

export type AdminOrganizerApplicationStatus =
  | "pending"
  | "approved"
  | "rejected";

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
  reviewedBy?:
    | string
    | AdminOrganizerApplicationUser
    | null;
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

export interface AdminUserBookingEvent {
  _id: string;
  title: string;
  venue: string;
  eventDate: string;
  status:
    | "draft"
    | "published"
    | "cancelled"
    | "completed";
  ticketPrice: number;
  bannerImage?: string;
}

export interface AdminUserBooking {
  _id: string;
  bookingCode: string;
  quantity: number;
  totalAmount: number;
  status:
    | "confirmed"
    | "cancelled";
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

export type AdminEventStatus =
  | "draft"
  | "published"
  | "cancelled"
  | "completed";

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

export type AdminBookingStatus =
  | "pending"
  | "confirmed"
  | "cancelled";

export type AdminPaymentStatus =
  | "unpaid"
  | "pending"
  | "verifying"
  | "paid"
  | "failed"
  | "refunded";

export interface AdminBookingUser {
  _id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  profileImage?: string;
}

export interface AdminBookingEvent {
  _id?: string;
  title?: string;
  category?: string;
  city?: string;
  venue?: string;
  eventDate?: string;
  ticketPrice?: number;
  totalTickets?: number;
  availableTickets?: number;
  status?: AdminEventStatus;
  bannerImage?: string;
  organizer?: string | AdminEventOrganizer | null;
}

export interface AdminPromotionSnapshot {
  promotionId?: string;
  name?: string;
  code?: string;
  promotionMode?: AdminPromotionMode;
  discountType?: AdminPromotionDiscountType;
  discountValue?: number;
  displayText?: string;
}

export interface AdminBooking {
  _id: string;
  bookingCode: string;
  user?: string | AdminBookingUser | null;
  event?: string | AdminBookingEvent | null;
  quantity: number;
  ticketCount?: number;
  totalAmount: number;
  originalAmount?: number;
  subtotalAmount?: number;
  discountAmount?: number;
  finalAmount?: number;
  amountPaid?: number;
  adminCommissionRate?: number;
  adminCommissionAmount?: number;
  organizerEarnings?: number;
  commissionCalculatedAt?: string;
  couponCode?: string;
  appliedPromotion?: AdminPromotionSnapshot;
  status: AdminBookingStatus;
  paymentStatus?: AdminPaymentStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AdminBookingsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: AdminBookingStatus | "all";
  paymentStatus?: AdminPaymentStatus | "all";
  eventId?: string;
  userId?: string;
  sort?: string;
}

export interface AdminBookingsResponse {
  success: boolean;
  message: string;
  data: AdminBooking[];
  bookings: AdminBooking[];
  pagination: AdminPagination;
}

export interface AdminBookingResponse {
  success: boolean;
  message: string;
  booking: AdminBooking;
}

export type AdminPromotionMode =
  | "coupon"
  | "automatic";

export type AdminPromotionDiscountType =
  | "percentage"
  | "fixed";

export type AdminPromotionStatus =
  | "active"
  | "inactive"
  | "expired";

export interface AdminPromotion {
  _id: string;
  name?: string;
  description?: string;
  organizer?: string | AdminEventOrganizer | null;
  event?: string | AdminBookingEvent | null;
  code?: string;
  promotionMode?: AdminPromotionMode;
  discountType: AdminPromotionDiscountType;
  discountValue: number;
  minimumBookingAmount?: number;
  maximumDiscountAmount?: number;
  totalUsageLimit?: number;
  usedCount: number;
  reservedUsageCount?: number;
  perUserUsageLimit?: number;
  firstNTickets?: number;
  discountedTicketsReserved?: number;
  discountedTicketsUsed?: number;
  maxTicketsPerBooking?: number;
  validFrom: string;
  validUntil: string;
  status?: AdminPromotionStatus;
  visibility?: "public" | "hidden";
  displayText?: string;
  isDeleted?: boolean;
  isActive?: boolean;
  minimumAmount?: number;
  maximumDiscount?: number;
  usageLimit?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface AdminPromotionsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: AdminPromotionStatus | "all";
  promotionMode?: AdminPromotionMode | "all";
  eventId?: string;
  organizer?: string;
  sort?: string;
}

export interface AdminPromotionsResponse {
  success: boolean;
  message: string;
  data: AdminPromotion[];
  promotions: AdminPromotion[];
  coupons: AdminPromotion[];
  pagination: AdminPagination;
}

export interface AdminPromotionResponse {
  success: boolean;
  message: string;
  promotion?: AdminPromotion | null;
  coupon?: AdminPromotion | null;
}

export interface AdminPromotionDeleteResponse {
  success: boolean;
  message: string;
  promotionId: string;
}

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

export const getAdminDashboard =
  async (): Promise<AdminDashboardResponse> => {
    const response = await api.get(
      "/admin/dashboard"
    );

    return response.data;
  };

  export const getAdminCommission =
  async (): Promise<AdminCommissionResponse> => {
    const response = await api.get(
      "/admin/commission"
    );

    return response.data;
  };

export const updateAdminCommission =
  async (
    data: UpdateAdminCommissionData
  ): Promise<AdminCommissionResponse> => {
    const response = await api.patch(
      "/admin/commission",
      data
    );

    return response.data;
  };

export const getAdminUsers = async (
  params: AdminUsersParams = {}
): Promise<AdminUsersResponse> => {
  const response = await api.get(
    "/admin/users",
    {
      params,
    }
  );

  return response.data;
};

export const getAdminOrganizers = async (
  params: AdminOrganizersParams = {}
): Promise<AdminOrganizersResponse> => {
  const response = await api.get(
    "/admin/organizers",
    {
      params,
    }
  );

  return response.data;
};

export const getAdminOrganizerApplications = async (
  params: AdminOrganizerApplicationsParams = {}
): Promise<AdminOrganizerApplicationsResponse> => {
  const response = await api.get(
    "/organizer-applications/admin",
    {
      params,
    }
  );

  return response.data;
};

export const getAdminOrganizerApplicationById =
  async (
    applicationId: string
  ): Promise<AdminOrganizerApplicationResponse> => {
    const response = await api.get(
      `/organizer-applications/admin/${applicationId}`
    );

    return response.data;
  };

export const approveAdminOrganizerApplication =
  async (
    applicationId: string
  ): Promise<AdminOrganizerApplicationResponse> => {
    const response = await api.patch(
      `/organizer-applications/admin/${applicationId}/approve`
    );

    return response.data;
  };

export const rejectAdminOrganizerApplication =
  async (
    applicationId: string,
    rejectionReason?: string
  ): Promise<AdminOrganizerApplicationResponse> => {
    const response = await api.patch(
      `/organizer-applications/admin/${applicationId}/reject`,
      {
        rejectionReason,
      }
    );

    return response.data;
  };

export const getAdminUserDetails =
  async (
    userId: string
  ): Promise<AdminUserDetailsResponse> => {
    const response = await api.get(
      `/admin/users/${userId}`
    );

    return response.data;
  };

export const blockAdminUser = async (
  userId: string
): Promise<AdminUserMutationResponse> => {
  const response = await api.patch(
    `/admin/users/${userId}/block`
  );

  return response.data;
};

export const unblockAdminUser = async (
  userId: string
): Promise<AdminUserMutationResponse> => {
  const response = await api.patch(
    `/admin/users/${userId}/unblock`
  );

  return response.data;
};

export const verifyAdminUser = async (
  userId: string
): Promise<AdminUserMutationResponse> => {
  const response = await api.patch(
    `/admin/users/${userId}/verify`
  );

  return response.data;
};

export const updateAdminUserRole =
  async (
    userId: string,
    role: "user" | "organizer"
  ): Promise<AdminUserMutationResponse> => {
    const response = await api.patch(
      `/admin/users/${userId}/role`,
      {
        role,
      }
    );

    return response.data;
  };

export const deleteAdminUser = async (
  userId: string
): Promise<AdminUserMutationResponse> => {
  const response = await api.delete(
    `/admin/users/${userId}`
  );

  return response.data;
};

export const restoreAdminUser = async (
  userId: string
): Promise<AdminUserMutationResponse> => {
  const response = await api.patch(
    `/admin/users/${userId}/restore`
  );

  return response.data;
};

export const getAdminEvents = async (
  params: AdminEventsParams = {}
): Promise<AdminEventsResponse> => {
  const response = await api.get(
    "/admin/events",
    {
      params,
    }
  );

  return response.data;
};

export const getAdminEventById = async (
  eventId: string
): Promise<AdminEventResponse> => {
  const response = await api.get(
    `/admin/events/${eventId}`
  );

  return response.data;
};

export const updateAdminEventStatus =
  async (
    eventId: string,
    status: AdminEventStatus
  ): Promise<AdminEventResponse> => {
    const response = await api.patch(
      `/admin/events/${eventId}/status`,
      {
        status,
      }
    );

    return response.data;
  };

export const deleteAdminEvent = async (
  eventId: string
): Promise<AdminEventDeleteResponse> => {
  const response = await api.delete(
    `/admin/events/${eventId}`
  );

  return response.data;
};

export const getAdminBookings = async (
  params: AdminBookingsParams = {}
): Promise<AdminBookingsResponse> => {
  const response = await api.get(
    "/admin/bookings",
    {
      params,
    }
  );

  return response.data;
};

export const getAdminBookingById = async (
  bookingId: string
): Promise<AdminBookingResponse> => {
  const response = await api.get(
    `/admin/bookings/${bookingId}`
  );

  return response.data;
};

export const updateAdminBookingStatus =
  async (
    bookingId: string,
    status: AdminBookingStatus
  ): Promise<AdminBookingResponse> => {
    const response = await api.patch(
      `/admin/bookings/${bookingId}/status`,
      {
        status,
      }
    );

    return response.data;
  };

export const getAdminPromotions = async (
  params: AdminPromotionsParams = {}
): Promise<AdminPromotionsResponse> => {
  const response = await api.get(
    "/admin/promotions",
    {
      params,
    }
  );

  return response.data;
};

export const updateAdminPromotionStatus =
  async (
    promotionId: string,
    status: AdminPromotionStatus
  ): Promise<AdminPromotionResponse> => {
    const response = await api.patch(
      `/admin/promotions/${promotionId}/status`,
      {
        status,
      }
    );

    return response.data;
  };

export const deleteAdminPromotion = async (
  promotionId: string
): Promise<AdminPromotionDeleteResponse> => {
  const response = await api.delete(
    `/admin/promotions/${promotionId}`
  );

  return response.data;
};


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

export const getAdminCategories =
  async (): Promise<AdminCategoriesResponse> => {
    const response = await api.get(
      "/admin/categories"
    );

    return response.data;
  };

export const createAdminCategory = async (
  name: string
): Promise<AdminCategoryResponse> => {
  const response = await api.post(
    "/admin/categories",
    { name }
  );

  return response.data;
};

export const updateAdminCategory = async (
  categoryId: string,
  name: string
): Promise<AdminCategoryResponse> => {
  const response = await api.patch(
    `/admin/categories/${categoryId}`,
    { name }
  );

  return response.data;
};

export const updateAdminCategoryStatus = async (
  categoryId: string,
  isActive: boolean
): Promise<AdminCategoryResponse> => {
  const response = await api.patch(
    `/admin/categories/${categoryId}/status`,
    { isActive }
  );

  return response.data;
};

export const deleteAdminCategory = async (
  categoryId: string
): Promise<AdminCategoryDeleteResponse> => {
  const response = await api.delete(
    `/admin/categories/${categoryId}`
  );

  return response.data;
};
