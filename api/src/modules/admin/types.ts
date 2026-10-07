import { ParsedPaginationQuery } from "../../utils/pagination";

export interface RevenueResult {
    _id: null;
    totalRevenue: number;
    totalAdminCommission: number;
    totalOrganizerEarnings: number;
}

export interface FeaturedEventRevenueResult {
    _id: null;
    totalFeaturedEventRevenue: number;
}

export interface BookingSummaryResult {
    _id: null;
    totalBookings: number;
    confirmedBookings: number;
    cancelledBookings: number;
    totalSpent: number;
}

export interface AdminUsersQuery extends ParsedPaginationQuery {
    role?: string;
}

export interface AdminEventsQuery extends ParsedPaginationQuery {
    organizer?: string;
}

export interface AdminBookingsQuery extends ParsedPaginationQuery {
    eventId?: string;
    userId?: string;
    paymentStatus?: string;
}

export interface AdminPromotionsQuery extends ParsedPaginationQuery {
    eventId?: string;
    organizer?: string;
    promotionMode?: string;
}

export class AdminServiceError extends Error {
    statusCode: number;
    constructor(message: string, statusCode = 400) {
        super(message);
        this.name = "AdminServiceError";
        this.statusCode = statusCode;
    }
}
