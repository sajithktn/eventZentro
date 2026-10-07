import { Request, Response } from "express";
import { getAdminDashboardService } from "./admin.service";
import { getAdminCommissionSettingService, updateAdminCommissionSettingService } from "../commission/commission.service";

import { sendAdminError } from "./controller.helpers";

export const getAdminDashboard = async (req: Request, res: Response): Promise<void> => {
    try {
        const statistics = await getAdminDashboardService();
        res.status(200).json({
            success: true,
            message: "Admin dashboard loaded successfully.",
            admin: {
                id: req.user?._id,
                firstName: req.user?.firstName,
                lastName: req.user?.lastName,
                email: req.user?.email,
                role: req.user?.role,
            },
            statistics,
        });
    }
    catch (error) {
        sendAdminError(res, error, "Unable to load the admin dashboard.");
    }
};

export const getAdminCommission = async (_req: Request, res: Response): Promise<void> => {
    try {
        const commission = await getAdminCommissionSettingService();
        res.status(200).json({
            success: true,
            message: "Commission settings fetched successfully.",
            commission,
        });
    }
    catch (error) {
        sendAdminError(res, error, "Unable to load commission settings.");
    }
};

export const updateAdminCommission = async (req: Request, res: Response): Promise<void> => {
    try {
        const commission = await updateAdminCommissionSettingService({
            commissionPercentage: req.body.commissionPercentage,
            isActive: req.body.isActive,
        });
        res.status(200).json({
            success: true,
            message: "Commission settings updated successfully.",
            commission,
        });
    }
    catch (error) {
        sendAdminError(res, error, "Unable to update commission settings.");
    }
};
