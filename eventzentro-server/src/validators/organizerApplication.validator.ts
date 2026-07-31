import { z } from "zod";

const isValidUrl = (value: string) => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

const optionalUrlSchema = (fieldName: string) =>
  z.preprocess(
    (value) =>
      typeof value === "string"
        ? value.trim()
        : value,
    z
      .string()
      .refine(
        (value) =>
          value === "" || isValidUrl(value),
        `${fieldName} must be a valid URL`
      )
      .optional()
  );

export const createOrganizerApplicationSchema =
  z.object({
    organizerName: z
      .string()
      .trim()
      .min(
        3,
        "Organizer name must be at least 3 characters"
      )
      .max(
        120,
        "Organizer name cannot exceed 120 characters"
      ),

    category: z
      .string()
      .trim()
      .min(2, "Organizer category is required")
      .max(
        80,
        "Organizer category cannot exceed 80 characters"
      ),

    description: z
      .string()
      .trim()
      .min(
        30,
        "Description must be at least 30 characters"
      )
      .max(
        2000,
        "Description cannot exceed 2000 characters"
      ),

    phone: z
      .string()
      .trim()
      .min(
        8,
        "Phone number must be at least 8 characters"
      )
      .max(
        30,
        "Phone number cannot exceed 30 characters"
      ),

    location: z
      .string()
      .trim()
      .min(2, "Location is required")
      .max(
        120,
        "Location cannot exceed 120 characters"
      ),

    website: optionalUrlSchema("Website"),
    instagram: optionalUrlSchema("Instagram"),
    linkedin: optionalUrlSchema("LinkedIn"),
    profileImage: optionalUrlSchema("Profile image"),
  });

export type CreateOrganizerApplicationInput =
  z.infer<
    typeof createOrganizerApplicationSchema
  >;
