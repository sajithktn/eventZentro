import Category from "../models/category.model";

export const getActiveCategoriesService = async () => {
  const categories = await Category.find({
    isActive: true,
  })
    .select("name slug")
    .sort({ name: 1 });

  return {
    success: true,
    message: "Active categories fetched successfully.",
    categories,
  };
};