import { Request, Response } from "express";
import { deleteAdminPromotionService, getAdminPromotionsService, updateAdminPromotionStatusService } from "./admin.service";
import { parsePaginationQuery } from "../../utils/pagination";

import { getQueryString, getRouteParam, sendAdminError } from "./controller.helpers";

export const getAdminPromotions = async (req: Request, res: Response): Promise<void> => {
    try {
        const paginationQuery = parsePaginationQuery(req.query);
        const result = await getAdminPromotionsService({
            ...paginationQuery,
            eventId: getQueryString(req.query.eventId),
            organizer: getQueryString(req.query.organizer),
            promotionMode: getQueryString(req.query.promotionMode),
        });
        res.status(200).json(result);
    }
    catch (error) {
        sendAdminError(res, error, "Unable to load admin promotions.");
    }
};

export const updateAdminPromotionStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const status = typeof req.body.status === "string"
            ? req.body.status
            : "";
        const promotion = await updateAdminPromotionStatusService(getRouteParam(req.params.promotionId, "promotion ID"), status);
        res.status(200).json({
            success: true,
            message: status.toLowerCase() === "active"
                ? "Promotion activated successfully."
                : "Promotion deactivated successfully.",
            promotion,
            coupon: promotion,
        });
    }
    catch (error) {
        sendAdminError(res, error, "Unable to update promotion status.");
    }
};

export const deleteAdminPromotion = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await deleteAdminPromotionService(getRouteParam(req.params.promotionId, "promotion ID"));
        res.status(200).json(result);
    }
    catch (error) {
        sendAdminError(res, error, "Unable to delete promotion.");
    }
};
