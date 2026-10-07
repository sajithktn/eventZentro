import { z } from "zod";

const dateString = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .refine(
      (value) =>
        !Number.isNaN(new Date(value).getTime()),
      `Invalid ${label.toLowerCase()}`
    );

export const createFeaturedEventRequestSchema =
  z.object({
    eventId: z
      .string()
      .trim()
      .min(1, "Event is required"),
    requestedStartDate: dateString("Start date"),
    requestedEndDate: dateString("End date"),
  });

export const verifyFeaturedEventPaymentSchema =
  z.object({
    requestId: z
      .string()
      .trim()
      .min(1, "Featured request is required"),
    razorpay_order_id: z
      .string()
      .trim()
      .min(1, "Razorpay order ID is required"),
    razorpay_payment_id: z
      .string()
      .trim()
      .min(1, "Razorpay payment ID is required"),
    razorpay_signature: z
      .string()
      .trim()
      .min(1, "Razorpay signature is required"),
  });

export const updateFeaturedEventSettingsSchema =
  z.object({
    promotionFee: z
      .number({
        error: "Promotion fee must be a number",
      })
      .min(0, "Promotion fee cannot be negative"),

    isPromotionEnabled: z.boolean({
      error:
        "Promotion enabled status must be a boolean",
    }),

    maximumFeaturedEventsOnHomepage: z
      .number({
        error:
          "Maximum featured events must be a number",
      })
      .int(
        "Maximum featured events must be a whole number"
      )
      .min(1, "At least one featured event is required")
      .max(
        12,
        "Maximum featured events cannot exceed 12"
      ),

    defaultPromotionDurationDays: z
      .number({
        error:
          "Default duration must be a number",
      })
      .int(
        "Default duration must be a whole number"
      )
      .min(1, "Default duration must be at least 1 day")
      .max(
        365,
        "Default duration cannot exceed 365 days"
      )
      .optional(),

    requirePaymentBeforeApproval: z.boolean({
      error:
        "Payment requirement setting must be a boolean",
    }),
  });

export const approveFeaturedEventRequestSchema =
  z.object({
    approvedStartDate: dateString(
      "Approved start date"
    ).optional(),
    approvedEndDate: dateString(
      "Approved end date"
    ).optional(),
    adminNote: z
      .string()
      .trim()
      .max(1000, "Admin note is too long")
      .optional(),
  });

export const rejectFeaturedEventRequestSchema =
  z.object({
    rejectionReason: z
      .string()
      .trim()
      .min(
        3,
        "Rejection reason must be at least 3 characters"
      )
      .max(1000, "Rejection reason is too long"),
  });

export const updateFeaturedEventRequestSchema =
  z.object({
    isActive: z
      .boolean({
        error: "Active status must be a boolean",
      })
      .optional(),
    approvedStartDate: dateString(
      "Approved start date"
    ).optional(),
    approvedEndDate: dateString(
      "Approved end date"
    ).optional(),
    adminNote: z
      .string()
      .trim()
      .max(1000, "Admin note is too long")
      .optional(),
  });

export type CreateFeaturedEventRequestInput =
  z.infer<
    typeof createFeaturedEventRequestSchema
  >;

export type VerifyFeaturedEventPaymentInput =
  z.infer<
    typeof verifyFeaturedEventPaymentSchema
  >;

export type UpdateFeaturedEventSettingsInput =
  z.infer<
    typeof updateFeaturedEventSettingsSchema
  >;

export type ApproveFeaturedEventRequestInput =
  z.infer<
    typeof approveFeaturedEventRequestSchema
  >;

export type RejectFeaturedEventRequestInput =
  z.infer<
    typeof rejectFeaturedEventRequestSchema
  >;

export type UpdateFeaturedEventRequestInput =
  z.infer<
    typeof updateFeaturedEventRequestSchema
  >;
