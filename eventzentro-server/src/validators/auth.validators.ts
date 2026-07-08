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
    .min(2, "Last name must be at least 2 characters")
    .max(50),


    username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(30)
    .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores"
    ),

    email: z
  .string()
  .trim()
  .email("Invalid email address"),


    phone: z
    .string()
    .trim()
    .min(10, "Phone number must be at least 10 digits")
    .max(15),

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
  
    password: z.string().min(1, "Password is required")
});

export type LoginInput = z.infer<typeof loginSchema>; 