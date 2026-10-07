import { Request, Response } from "express";
import { deleteAdminEventService, getAdminEventByIdService, getAdminEventsService, updateAdminEventStatusService } from "./admin.service";
import { parsePaginationQuery } from "../../utils/pagination";

import { getQueryString, getRouteParam, sendAdminError } from "./controller.helpers";

export const getAdminEvents = async (req: Request, res: Response): Promise<void> => {
    try {
        const paginationQuery = parsePaginationQuery(req.query);
        const result = await getAdminEventsService({
            ...paginationQuery,
            organizer: getQueryString(req.query.organizer),
        });
        res.status(200).json(result);
    }
    catch (error) {
        sendAdminError(res, error, "Unable to load admin events.");
    }
};

export const getAdminEventById = async (req: Request, res: Response): Promise<void> => {
    try {
        const event = await getAdminEventByIdService(getRouteParam(req.params.eventId, "event ID"));
        res.status(200).json({
            success: true,
            message: "Admin event fetched successfully.",
            event,
        });
    }
    catch (error) {
        sendAdminError(res, error, "Unable to load admin event.");
    }
};

export const updateAdminEventStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const status = typeof req.body.status === "string"
            ? req.body.status
            : "";
        const event = await updateAdminEventStatusService(getRouteParam(req.params.eventId, "event ID"), status);
        res.status(200).json({
            success: true,
            message: "Event status updated successfully.",
            event,
        });
    }
    catch (error) {
        sendAdminError(res, error, "Unable to update event status.");
    }
};

export const deleteAdminEvent = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await deleteAdminEventService(getRouteParam(req.params.eventId, "event ID"));
        res.status(200).json(result);
    }
    catch (error) {
        sendAdminError(res, error, "Unable to delete event.");
    }
};
