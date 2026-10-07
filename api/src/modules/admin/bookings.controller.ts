import { Request, Response } from "express";
import { getAdminBookingByIdService, getAdminBookingsService, updateAdminBookingStatusService } from "./admin.service";
import { parsePaginationQuery } from "../../utils/pagination";

import { getQueryString, getRouteParam, sendAdminError } from "./controller.helpers";

export const getAdminBookings = async (req: Request, res: Response): Promise<void> => {
    try {
        const paginationQuery = parsePaginationQuery(req.query);
        const result = await getAdminBookingsService({
            ...paginationQuery,
            eventId: getQueryString(req.query.eventId),
            userId: getQueryString(req.query.userId),
            paymentStatus: getQueryString(req.query.paymentStatus),
        });
        res.status(200).json(result);
    }
    catch (error) {
        sendAdminError(res, error, "Unable to load admin bookings.");
    }
};

export const getAdminBookingById = async (req: Request, res: Response): Promise<void> => {
    try {
        const booking = await getAdminBookingByIdService(getRouteParam(req.params.bookingId, "booking ID"));
        res.status(200).json({
            success: true,
            message: "Admin booking fetched successfully.",
            booking,
        });
    }
    catch (error) {
        sendAdminError(res, error, "Unable to load admin booking.");
    }
};

export const updateAdminBookingStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const status = typeof req.body.status === "string"
            ? req.body.status
            : "";
        const result = await updateAdminBookingStatusService(getRouteParam(req.params.bookingId, "booking ID"), status);
        res.status(200).json({
            success: true,
            message: result.message,
            booking: result.booking,
        });
    }
    catch (error) {
        sendAdminError(res, error, "Unable to update booking status.");
    }
};
