import Event from "../event/event.model";
import Category from "../category/category.model";

import { createCategorySlug, escapeRegExp, getObjectIdOrThrow, normalizeCategoryName } from "./service.helpers";
import { AdminServiceError } from "./types";

export const getAdminCategoriesService = async () => {
    const categories = await Category.find().sort({
        name: 1,
    });
    const categoriesWithEventCount = await Promise.all(categories.map(async (category) => {
        const eventsCount = await Event.countDocuments({
            category: new RegExp(`^${escapeRegExp(category.name)}$`, "i"),
        });
        return {
            ...category.toObject(),
            eventCount: eventsCount,
        };
    }));
    return {
        success: true,
        message: "Categories fetched successfully.",
        categories: categoriesWithEventCount,
    };
};

export const createAdminCategoryService = async (name: string) => {
    const normalizedName = normalizeCategoryName(name);
    const slug = createCategorySlug(normalizedName);
    if (!slug) {
        throw new AdminServiceError("Category name must contain letters or numbers.", 400);
    }
    const existingCategory = await Category.findOne({
        $or: [
            {
                name: new RegExp(`^${escapeRegExp(normalizedName)}$`, "i"),
            },
            {
                slug,
            },
        ],
    });
    if (existingCategory) {
        throw new AdminServiceError("A category with this name already exists.", 409);
    }
    const category = await Category.create({
        name: normalizedName,
        slug,
        isActive: true,
    });
    return category;
};

export const updateAdminCategoryService = async (categoryId: string, name: string) => {
    const categoryObjectId = getObjectIdOrThrow(categoryId, "category ID");
    const category = await Category.findById(categoryObjectId);
    if (!category) {
        throw new AdminServiceError("Category not found.", 404);
    }
    const normalizedName = normalizeCategoryName(name);
    const slug = createCategorySlug(normalizedName);
    if (!slug) {
        throw new AdminServiceError("Category name must contain letters or numbers.", 400);
    }
    const duplicateCategory = await Category.findOne({
        _id: {
            $ne: categoryObjectId,
        },
        $or: [
            {
                name: new RegExp(`^${escapeRegExp(normalizedName)}$`, "i"),
            },
            {
                slug,
            },
        ],
    });
    if (duplicateCategory) {
        throw new AdminServiceError("A category with this name already exists.", 409);
    }
    const previousName = category.name;
    category.name = normalizedName;
    category.slug = slug;
    await category.save();
    if (previousName.toLowerCase() !==
        normalizedName.toLowerCase()) {
        await Event.updateMany({
            category: new RegExp(`^${escapeRegExp(previousName)}$`, "i"),
        }, {
            $set: {
                category: normalizedName,
            },
        });
    }
    const eventsCount = await Event.countDocuments({
        category: new RegExp(`^${escapeRegExp(normalizedName)}$`, "i"),
    });
    return {
        ...category.toObject(),
        eventCount: eventsCount,
    };
};

export const updateAdminCategoryStatusService = async (categoryId: string, isActive: boolean) => {
    const categoryObjectId = getObjectIdOrThrow(categoryId, "category ID");
    const category = await Category.findByIdAndUpdate(categoryObjectId, {
        $set: {
            isActive,
        },
    }, {
        new: true,
        runValidators: true,
    });
    if (!category) {
        throw new AdminServiceError("Category not found.", 404);
    }
    const eventsCount = await Event.countDocuments({
        category: new RegExp(`^${escapeRegExp(category.name)}$`, "i"),
    });
    return {
        ...category.toObject(),
        eventCount: eventsCount,
    };
};

export const deleteAdminCategoryService = async (categoryId: string) => {
    const categoryObjectId = getObjectIdOrThrow(categoryId, "category ID");
    const category = await Category.findById(categoryObjectId);
    if (!category) {
        throw new AdminServiceError("Category not found.", 404);
    }
    const eventsCount = await Event.countDocuments({
        category: new RegExp(`^${escapeRegExp(category.name)}$`, "i"),
    });
    if (eventsCount > 0) {
        throw new AdminServiceError(`Cannot delete this category because ${eventsCount} event${eventsCount === 1 ? " is" : "s are"} using it. Disable it instead.`, 409);
    }
    await category.deleteOne();
    return {
        success: true,
        message: "Category deleted successfully.",
        categoryId,
    };
};
