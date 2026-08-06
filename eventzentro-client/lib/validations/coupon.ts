import { z } from "zod";

const couponCodeSchema = z
  .string()
  .trim()
  .min(3, "Coupon code must be at least 3 characters")
  .max(30, "Coupon code cannot exceed 30 characters")
  .regex(
    /^[A-Za-z0-9_-]+$/,
    "Use only letters, numbers, hyphens and underscores"
  )
  .transform((value) => value.toUpperCase());

const optionalTextSchema = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength)
    .optional()
    .or(z.literal("").transform(() => undefined));

const dateStringSchema = z
  .string()
  .trim()
  .min(1, "Date is required")
  .refine(
    (value) => !Number.isNaN(new Date(value).getTime()),
    "Invalid date"
  );

const optionalPositiveNumber = (label: string) =>
  z
    .number({
      error: `${label} must be a number`,
    })
    .positive(`${label} must be greater than 0`)
    .optional();

const optionalNonNegativeNumber = (label: string) =>
  z
    .number({
      error: `${label} must be a number`,
    })
    .min(0, `${label} cannot be negative`)
    .optional();

const optionalPositiveInteger = (label: string) =>
  z
    .number({
      error: `${label} must be a number`,
    })
    .int(`${label} must be a whole number`)
    .min(1, `${label} must be at least 1`)
    .optional();

type PromotionRuleInput = {
  promotionMode?: "coupon" | "automatic";
  code?: string;
  discountType?: "percentage" | "fixed";
  discountValue?: number;
  validFrom?: string;
  validUntil?: string;
};

const validatePromotionRules = (
  data: PromotionRuleInput,
  ctx: z.RefinementCtx
) => {
  if (data.promotionMode === "coupon" && !data.code) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Coupon code is required",
      path: ["code"],
    });
  }

  if (data.promotionMode === "automatic" && data.code) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Automatic offers do not use coupon codes",
      path: ["code"],
    });
  }

  if (
    data.discountType === "percentage" &&
    typeof data.discountValue === "number" &&
    data.discountValue > 100
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Percentage discount cannot exceed 100",
      path: ["discountValue"],
    });
  }

  if (data.validFrom && data.validUntil) {
    const validFrom = new Date(data.validFrom);
    const validUntil = new Date(data.validUntil);

    if (validUntil <= validFrom) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Valid until must be later than valid from",
        path: ["validUntil"],
      });
    }
  }
};

export const couponSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, "Promotion name must be at least 3 characters")
      .max(120, "Promotion name cannot exceed 120 characters"),
    description: optionalTextSchema(800),
    eventId: z.string().trim().min(1, "Select an event"),
    promotionMode: z.enum(["coupon", "automatic"]),
    code: couponCodeSchema.optional(),
    discountType: z.enum(["percentage", "fixed"]),
    discountValue: z
      .number({
        error: "Discount value must be a number",
      })
      .positive("Discount value must be greater than 0"),
    minimumBookingAmount: optionalNonNegativeNumber(
      "Minimum booking amount"
    ),
    maximumDiscountAmount:
      optionalPositiveNumber("Maximum discount"),
    totalUsageLimit:
      optionalPositiveInteger("Total usage limit"),
    perUserUsageLimit:
      optionalPositiveInteger("Per-user usage limit"),
    firstNTickets: optionalPositiveInteger("First N tickets"),
    maxTicketsPerBooking: optionalPositiveInteger(
      "Maximum tickets per booking"
    ),
    validFrom: dateStringSchema,
    validUntil: dateStringSchema,
    status: z.enum(["active", "inactive", "expired"]),
    visibility: z.enum(["public", "hidden"]),
    displayText: optionalTextSchema(160),
  })
  .superRefine(validatePromotionRules);

export type CouponSchema = z.infer<typeof couponSchema>;
