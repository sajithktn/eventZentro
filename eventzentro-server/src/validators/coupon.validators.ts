import { z } from "zod";

const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID");

const couponCodeSchema = z
  .string()
  .trim()
  .min(3, "Coupon code must be at least 3 characters")
  .max(30, "Coupon code cannot exceed 30 characters")
  .regex(
    /^[A-Za-z0-9_-]+$/,
    "Coupon code can only contain letters, numbers, hyphens and underscores"
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

const optionalNonNegativeNumber = (label: string) =>
  z
    .number({
      error: `${label} must be a number`,
    })
    .min(0, `${label} cannot be negative`)
    .optional();

const optionalPositiveNumber = (label: string) =>
  z
    .number({
      error: `${label} must be a number`,
    })
    .positive(`${label} must be greater than 0`)
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
  firstNTickets?: number;
};

const validatePromotionRules = (
  data: PromotionRuleInput,
  ctx: z.RefinementCtx
) => {
  if (data.promotionMode === "coupon" && !data.code) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Coupon code is required for coupon promotions",
      path: ["code"],
    });
  }

  if (data.promotionMode === "automatic" && data.code) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Automatic offers must not use a coupon code",
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

const promotionBaseSchema = {
  name: z
    .string()
    .trim()
    .min(3, "Promotion name must be at least 3 characters")
    .max(120, "Promotion name cannot exceed 120 characters"),
  description: optionalTextSchema(800),
  eventId: objectIdSchema,
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
  maximumDiscountAmount: optionalPositiveNumber(
    "Maximum discount"
  ),
  totalUsageLimit: optionalPositiveInteger("Total usage limit"),
  perUserUsageLimit: optionalPositiveInteger("Per-user usage limit"),
  firstNTickets: optionalPositiveInteger("First N tickets"),
  maxTicketsPerBooking: optionalPositiveInteger(
    "Maximum tickets per booking"
  ),
  validFrom: dateStringSchema,
  validUntil: dateStringSchema,
  status: z.enum(["active", "inactive", "expired"]).default("active"),
  visibility: z.enum(["public", "hidden"]).default("public"),
  displayText: optionalTextSchema(160),
  isActive: z.boolean().optional(),
};

export const createCouponSchema = z
  .object(promotionBaseSchema)
  .superRefine(validatePromotionRules);

export const updateCouponSchema = z
  .object({
    name: promotionBaseSchema.name.optional(),
    description: promotionBaseSchema.description,
    eventId: promotionBaseSchema.eventId.optional(),
    promotionMode: promotionBaseSchema.promotionMode.optional(),
    code: promotionBaseSchema.code,
    discountType: promotionBaseSchema.discountType.optional(),
    discountValue: promotionBaseSchema.discountValue.optional(),
    minimumBookingAmount:
      promotionBaseSchema.minimumBookingAmount.optional(),
    maximumDiscountAmount:
      promotionBaseSchema.maximumDiscountAmount.optional(),
    totalUsageLimit:
      promotionBaseSchema.totalUsageLimit.optional(),
    perUserUsageLimit:
      promotionBaseSchema.perUserUsageLimit.optional(),
    firstNTickets: promotionBaseSchema.firstNTickets.optional(),
    maxTicketsPerBooking:
      promotionBaseSchema.maxTicketsPerBooking.optional(),
    validFrom: promotionBaseSchema.validFrom.optional(),
    validUntil: promotionBaseSchema.validUntil.optional(),
    status: promotionBaseSchema.status.optional(),
    visibility: promotionBaseSchema.visibility.optional(),
    displayText: promotionBaseSchema.displayText,
    isActive: promotionBaseSchema.isActive,
  })
  .superRefine(validatePromotionRules);

export const couponStatusSchema = z
  .object({
    status: z.enum(["active", "inactive", "expired"]).optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) =>
      typeof data.status === "string" ||
      typeof data.isActive === "boolean",
    {
      message: "Promotion status is required",
      path: ["status"],
    }
  );

export const quotePromotionSchema = z.object({
  eventId: objectIdSchema,
  ticketCount: z
    .number({
      error: "Ticket quantity must be a number",
    })
    .int("Ticket quantity must be a whole number")
    .min(1, "Ticket quantity must be at least 1"),
  couponCode: couponCodeSchema.optional(),
});

export const validateCouponSchema = z.object({
  eventId: objectIdSchema,
  code: couponCodeSchema,
  amount: z
    .number({
      error: "Amount must be a number",
    })
    .positive("Amount must be greater than 0")
    .optional(),
});

export type CreateCouponInput = z.infer<typeof createCouponSchema>;
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>;
export type CouponStatusInput = z.infer<typeof couponStatusSchema>;
export type QuotePromotionInput = z.infer<typeof quotePromotionSchema>;
