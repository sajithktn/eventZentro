import { Router } from "express";
import passport from "passport";

import {
  register,
  login,
  verifyEmail,
  forgotPassword,
  resendOTP,
  resetPassword,
  googleCallback,
  getCurrentUser,
  logout,
  updateProfile,
} from "../controllers/auth.controller";

import validate from "../middleware/validate.middleware";

import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendOTPSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../validators/auth.validators";

import { protect } from "../middleware/auth.middleware";

const router = Router();

router.post("/register", validate(registerSchema), register);

router.post("/login", validate(loginSchema), login);

router.post("/verify-email", validate(verifyEmailSchema), verifyEmail);

router.post("/resend-otp", validate(resendOTPSchema), resendOTP);

router.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);

router.post("/reset-password", validate(resetPasswordSchema), resetPassword);

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get("/google/callback", passport.authenticate("google", { session: false, failureRedirect: "/api/auth/login" }), googleCallback);

router.get("/me", protect, getCurrentUser);

router.patch("/profile", protect, updateProfile);

router.post("/logout", logout);

export default router;
