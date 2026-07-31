import { z } from "zod";

const objectIdSchema = z
  .string()
  .trim()
  .regex(
    /^[0-9a-fA-F]{24}$/,
    "Invalid ID"
  );

export const createBookingSchema = z.object({
  eventId: objectIdSchema,
  quantity: z
    .number({
      error: "Ticket quantity must be a number",
    })
    .int("Ticket quantity must be a whole number")
    .min(1, "Ticket quantity must be at least 1"),
  couponCode: z
    .string()
    .trim()
    .min(
      3,
      "Coupon code must be at least 3 characters"
    )
    .max(
      30,
      "Coupon code cannot exceed 30 characters"
    )
    .optional(),
});

export const createPaymentOrderSchema = z.object({
  bookingId: objectIdSchema,
});

export const verifyPaymentSchema = z.object({
  bookingId: objectIdSchema,

  razorpay_order_id: z
    .string()
    .trim()
    .min(
      1,
      "Razorpay order ID is required"
    ),

  razorpay_payment_id: z
    .string()
    .trim()
    .min(
      1,
      "Razorpay payment ID is required"
    ),

  razorpay_signature: z
    .string()
    .trim()
    .min(
      1,
      "Razorpay signature is required"
    ),
});

export type CreateBookingInput = z.infer<
  typeof createBookingSchema
>;

export type CreatePaymentOrderInput = z.infer<
  typeof createPaymentOrderSchema
>;

export type VerifyPaymentInput = z.infer<
  typeof verifyPaymentSchema
>;