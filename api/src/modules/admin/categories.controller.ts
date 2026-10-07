import { Request, Response } from "express";
import { createAdminCategoryService, deleteAdminCategoryService, getAdminCategoriesService, updateAdminCategoryService, updateAdminCategoryStatusService } from "./admin.service";

import { getRouteParam, sendAdminError } from "./controller.helpers";

export const getAdminCategories = async (_req: Request, res: Response): Promise<void> => {
    try {
        const result = await getAdminCategoriesService();
        res.status(200).json(result);
    }
    catch (error) {
        sendAdminError(res, error, "Unable to load categories.");
    }
};

export const createAdminCategory = async (req: Request, res: Response): Promise<void> => {
    try {
        const category = await createAdminCategoryService(req.body.name);
        res.status(201).json({
            success: true,
            message: "Category created successfully.",
            category,
        });
    }
    catch (error) {
        sendAdminError(res, error, "Unable to create category.");
    }
};

export const updateAdminCategory = async (req: Request, res: Response): Promise<void> => {
    try {
        const category = await updateAdminCategoryService(getRouteParam(req.params.categoryId, "category ID"), req.body.name);
        res.status(200).json({
            success: true,
            message: "Category updated successfully.",
            category,
        });
    }
    catch (error) {
        sendAdminError(res, error, "Unable to update category.");
    }
};

export const updateAdminCategoryStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const category = await updateAdminCategoryStatusService(getRouteParam(req.params.categoryId, "category ID"), req.body.isActive);
        res.status(200).json({
            success: true,
            message: req.body.isActive
                ? "Category activated successfully."
                : "Category deactivated successfully.",
            category,
        });
    }
    catch (error) {
        sendAdminError(res, error, "Unable to update category status.");
    }
};

export const deleteAdminCategory = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await deleteAdminCategoryService(getRouteParam(req.params.categoryId, "category ID"));
        res.status(200).json(result);
    }
    catch (error) {
        sendAdminError(res, error, "Unable to delete category.");
    }
};
