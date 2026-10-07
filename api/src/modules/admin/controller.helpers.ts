import { Request, Response } from "express";
import { AdminServiceError } from "./admin.service";
import { getAuthenticatedUserId, RequestUserError } from "../../utils/requestUser";

export const sendAdminError = (res: Response, error: unknown, fallbackMessage: string) => {
    if (error instanceof AdminServiceError) {
        res.status(error.statusCode).json({
            success: false,
            message: error.message,
        });
        return;
    }
    if (error instanceof RequestUserError) {
        res.status(error.statusCode).json({
            success: false,
            message: error.message,
        });
        return;
    }
    console.error(fallbackMessage, error);
    res.status(500).json({
        success: false,
        message: fallbackMessage,
    });
};

export const getAuthenticatedAdminId = (req: Request) => {
    if (!req.user) {
        throw new AdminServiceError("Admin authentication is required.", 401);
    }
    return getAuthenticatedUserId(req);
};

export const getRouteParam = (value: string | string[] | undefined, label: string) => {
    if (!value || Array.isArray(value)) {
        throw new AdminServiceError(`Invalid ${label}.`, 400);
    }
    return value;
};

export const getQueryString = (value: unknown) => {
    if (typeof value !== "string") {
        return undefined;
    }
    const trimmedValue = value.trim();
    return trimmedValue || undefined;
};
