import { z } from "zod";

export const createCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Category name must be at least 2 characters")
    .max(50, "Category name cannot exceed 50 characters"),
});

export const updateCategorySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Category name must be at least 2 characters")
      .max(50, "Category name cannot exceed 50 characters")
      .optional(),

    isActive: z
      .boolean({
        error: "Category status must be true or false",
      })
      .optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.isActive !== undefined,
    {
      message: "Provide a category name or status to update",
    }
  );

export type CreateCategoryInput = z.infer<
  typeof createCategorySchema
>;

export type UpdateCategoryInput = z.infer<
  typeof updateCategorySchema
>;