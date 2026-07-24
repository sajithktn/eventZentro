import { z } from "zod";

export const createEventSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, "Title must be at least 3 characters")
      .max(100, "Title cannot exceed 100 characters"),

    description: z
      .string()
      .trim()
      .min(20, "Description must be at least 20 characters")
      .max(2000, "Description cannot exceed 2000 characters"),

    category: z
      .string()
      .trim()
      .min(2, "Category is required"),

    venue: z
      .string()
      .trim()
      .min(3, "Venue is required"),

    eventDate: z
      .string()
      .min(1, "Event date is required")
      .refine(
        (date) => !Number.isNaN(new Date(date).getTime()),
        "Invalid event date"
      ),

    startTime: z
      .string()
      .regex(
        /^([01]\d|2[0-3]):([0-5]\d)$/,
        "Start time must use HH:mm format"
      ),

    endTime: z
      .string()
      .regex(
        /^([01]\d|2[0-3]):([0-5]\d)$/,
        "End time must use HH:mm format"
      ),

    ticketPrice: z
      .number({
        error: "Ticket price must be a number",
      })
      .min(0, "Ticket price cannot be negative"),

    totalTickets: z
      .number({
        error: "Total tickets must be a number",
      })
      .int("Total tickets must be a whole number")
      .min(1, "At least one ticket is required"),

    bannerImage: z
  .union([
    z.string().url("Invalid image URL"),
    z.literal(""),
  ])
  .optional(),
  })
  .refine(
    (data) => data.endTime > data.startTime,
    {
      message: "End time must be after start time",
      path: ["endTime"],
    }
  );

export type CreateEventInput = z.infer<
  typeof createEventSchema
>;