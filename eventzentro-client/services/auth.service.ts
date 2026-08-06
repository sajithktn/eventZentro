import api from "@/lib/axios";

import {
  LoginSchema,
  RegisterSchema,
  VerifyEmailSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
} from "@/lib/validations/auth";
import type {
  AuthResponse,
  UpdateProfileData,
  User,
} from "@/types/auth";

export const registerUser = async (
  data: RegisterSchema
) => {
  const response = await api.post(
    "/auth/register",
    data
  );

  return response.data;
};

export const loginUser = async (
  data: LoginSchema
): Promise<AuthResponse> => {
  const response = await api.post(
    "/auth/login",
    {
      ...data,
      email: data.email
        .trim()
        .toLowerCase(),
    },
    {
      validateStatus: (status) =>
        status < 500,
    }
  );

  return response.data;
};

export const getCurrentUser =
  async (): Promise<User> => {
    const response =
      await api.get("/auth/me");

    return response.data.user;
  };

export const verifyEmail = async (
  data: VerifyEmailSchema
) => {
  const response = await api.post(
    "/auth/verify-email",
    data
  );

  return response.data;
};

export const resendOTP = async (
  data: {
    email: string;
  }
) => {
  const response = await api.post(
    "/auth/resend-otp",
    data
  );

  return response.data;
};

export const forgotPassword = async (
  data: ForgotPasswordSchema
) => {
  const response = await api.post(
    "/auth/forgot-password",
    data
  );

  return response.data;
};

export const resetPassword = async (
  data: ResetPasswordSchema
) => {
  const response = await api.post(
    "/auth/reset-password",
    data
  );

  return response.data;
};

export const updateProfile = async (
  data: UpdateProfileData
): Promise<AuthResponse> => {
  const response = await api.patch(
    "/auth/profile",
    data
  );

  return response.data;
};

export const logoutUser = async () => {
  const response = await api.post(
    "/auth/logout"
  );

  return response.data;
};

