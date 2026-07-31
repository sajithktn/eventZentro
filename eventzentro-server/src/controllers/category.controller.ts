import { Request, Response } from "express";
import { getActiveCategoriesService } from "../services/category.service";

export const getActiveCategories = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = await getActiveCategoriesService();

    res.status(200).json(result);
  } catch (error) {
    console.error("Unable to load active categories.", error);

    res.status(500).json({
      success: false,
      message: "Unable to load active categories.",
    });
  }
};