import { Request, Response } from "express";
import { blockAdminUserService, changeAdminUserRoleService, getAdminOrganizersService, getAdminUserDetailsService, getAdminUsersService, restoreAdminUserService, softDeleteAdminUserService, unblockAdminUserService, verifyAdminUserService } from "./admin.service";
import { parsePaginationQuery } from "../../utils/pagination";

import { getAuthenticatedAdminId, getRouteParam, sendAdminError } from "./controller.helpers";

export const getAdminUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const paginationQuery = parsePaginationQuery(req.query);
        const role = typeof req.query.role === "string"
            ? req.query.role
            : undefined;
        const result = await getAdminUsersService({
            ...paginationQuery,
            role,
        });
        res.status(200).json(result);
    }
    catch (error) {
        sendAdminError(res, error, "Unable to load users.");
    }
};

export const getAdminOrganizers = async (req: Request, res: Response): Promise<void> => {
    try {
        const paginationQuery = parsePaginationQuery(req.query);
        const result = await getAdminOrganizersService(paginationQuery);
        res.status(200).json(result);
    }
    catch (error) {
        sendAdminError(res, error, "Unable to load organizers.");
    }
};

export const getAdminUserDetails = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await getAdminUserDetailsService(getRouteParam(req.params.userId, "user ID"));
        res.status(200).json({
            success: true,
            message: "User details fetched successfully.",
            ...result,
        });
    }
    catch (error) {
        sendAdminError(res, error, "Unable to load user details.");
    }
};

export const blockAdminUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = getAuthenticatedAdminId(req);
        const user = await blockAdminUserService(getRouteParam(req.params.userId, "user ID"), adminId);
        res.status(200).json({
            success: true,
            message: "User blocked successfully.",
            user,
        });
    }
    catch (error) {
        sendAdminError(res, error, "Unable to block user.");
    }
};

export const unblockAdminUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = getAuthenticatedAdminId(req);
        const user = await unblockAdminUserService(getRouteParam(req.params.userId, "user ID"), adminId);
        res.status(200).json({
            success: true,
            message: "User unblocked successfully.",
            user,
        });
    }
    catch (error) {
        sendAdminError(res, error, "Unable to unblock user.");
    }
};

export const verifyAdminUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = getAuthenticatedAdminId(req);
        const user = await verifyAdminUserService(getRouteParam(req.params.userId, "user ID"), adminId);
        res.status(200).json({
            success: true,
            message: "User email verified successfully.",
            user,
        });
    }
    catch (error) {
        sendAdminError(res, error, "Unable to verify user.");
    }
};

export const changeAdminUserRole = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = getAuthenticatedAdminId(req);
        const role = typeof req.body.role === "string"
            ? req.body.role
            : "";
        const user = await changeAdminUserRoleService(getRouteParam(req.params.userId, "user ID"), role, adminId);
        res.status(200).json({
            success: true,
            message: "User role updated successfully.",
            user,
        });
    }
    catch (error) {
        sendAdminError(res, error, "Unable to update user role.");
    }
};

export const deleteAdminUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = getAuthenticatedAdminId(req);
        const user = await softDeleteAdminUserService(getRouteParam(req.params.userId, "user ID"), adminId);
        res.status(200).json({
            success: true,
            message: "User deleted successfully.",
            user,
        });
    }
    catch (error) {
        sendAdminError(res, error, "Unable to delete user.");
    }
};

export const restoreAdminUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = getAuthenticatedAdminId(req);
        const user = await restoreAdminUserService(getRouteParam(req.params.userId, "user ID"), adminId);
        res.status(200).json({
            success: true,
            message: "User restored successfully.",
            user,
        });
    }
    catch (error) {
        sendAdminError(res, error, "Unable to restore user.");
    }
};
