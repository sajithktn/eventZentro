import { z } from "zod";

export  const registerSchema = z
.object({
    firstName: z
    .string()
    .trim()
    .min(2, "First name must be at least 2 characters")
    .max(50),

    lastName: z
    .string()
    .trim()
    .min(1, "Last name must be at least 2 characters")
    .max(50),


    email: z
  .string()
  .trim()
  .email("Invalid email address"),


    password: z
    .string()
    .min(8,"Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
       .regex(
        /[^A-Za-z0-9]/,
        "Password must contain at least one special character"
      ),

      confirmPassword: z.string(),
})
.refine((data) => data.password === data.confirmPassword, {
    path: ["ConfirmPassword"],
    message: "Passwords do not match",
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({

    email: z
  .string()
  .trim()
  .email("Invalid email address"),
  
    password: z.string().min(6, "Password is required")
});

export type LoginInput = z.infer<typeof loginSchema>; 


export const verifyEmailSchema = z.object({
    email: z
        .string()
        .trim()
        .email("Invalid email address"),

    otp: z
        .string()
        .trim()
        .length(6, "OTP must be 6 digits"),
});

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;



export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address"),
});



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
    path: ["ConfirmPassword"],
  });


  export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;


export const resendOTPSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Invalid email address"),
});
export type ResendOTPInput = z.infer<typeof resendOTPSchema>;
