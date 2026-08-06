import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),
});

export type LoginSchema = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(2, "First name must be at least 2 characters"),

    lastName: z
      .string()
      .min(1, "Last name is required"),

    email: z
      .string()
      .trim()
      .email("Please enter a valid email address"),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters"),

    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterSchema = z.infer<typeof registerSchema>;

export const verifyEmailSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address"),

  otp: z
    .string()
    .length(6, "OTP must be exactly 6 digits"),
});

export type VerifyEmailSchema = z.infer<typeof verifyEmailSchema>;


export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address"),
});

export type ForgotPasswordSchema = z.infer<
  typeof forgotPasswordSchema
>;

export const resetPasswordSchema = z
  .object({
    email: z
      .string()
      .trim()
      .email("Please enter a valid email address"),

    otp: z
      .string()
      .length(6, "OTP must be exactly 6 digits"),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters"),

    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordSchema = z.infer<
  typeof resetPasswordSchema
>;
