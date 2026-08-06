"use client";

import { useState } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Sparkles,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";

import {
  registerSchema,
  type RegisterSchema,
} from "@/lib/validations/auth";
import { registerUser } from "@/services/auth.service";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";

const getOtpExpiryTime = () => Date.now() + 5 * 60 * 1000;

export default function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterSchema) => {
    try {
      const normalizedData = {
        ...data,
        firstName: data.firstName.trim(),
        lastName: data.lastName?.trim(),
        email: data.email.trim().toLowerCase(),
      };

      const response = await registerUser(normalizedData);

      const expiryTime = getOtpExpiryTime();

      localStorage.setItem(
        "otpExpiry",
        expiryTime.toString()
      );

      toast.success(
        response?.message ||
          "Account created. Check your email for the verification code."
      );

      router.push(
        `/verify-email?email=${encodeURIComponent(
          normalizedData.email
        )}`
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message ||
            "Account registration failed."
        );
        return;
      }

      if (error instanceof Error) {
        toast.error(error.message);
        return;
      }

      toast.error("Something went wrong.");
    }
  };

  return (
    <div className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/10 bg-[#111116]/95 p-6 shadow-[0_30px_100px_rgba(0,0,0,0.55)] backdrop-blur-2xl sm:p-9">
      <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-[#8b5cf6]/20 blur-[90px]" />
      <div className="absolute -bottom-24 -left-20 h-52 w-52 rounded-full bg-[#ff3d57]/20 blur-[90px]" />

      <div className="relative">
        <div className="mb-8 text-center">
          <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-[#ff3d57]/20 bg-[#ff3d57]/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#ff8a9a]">
            <Sparkles size={14} />
            Join EventZentro
          </div>

          <h1 className="mt-5 text-3xl font-black tracking-tight text-white sm:text-4xl">
            Create your{" "}
            <span className="bg-gradient-to-r from-[#ffb703] via-[#ff3d57] to-[#a78bfa] bg-clip-text text-transparent">
              account
            </span>
          </h1>

          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-white">
            Discover events, book tickets and manage your
            experiences in one place.
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              id="firstName"
              type="text"
              label="First Name"
              placeholder="First name"
              autoComplete="given-name"
              leftIcon={<UserRound size={18} />}
              error={errors.firstName?.message}
              {...register("firstName")}
            />

            <Input
              id="lastName"
              type="text"
              label="Last Name"
              placeholder="Last name"
              autoComplete="family-name"
              leftIcon={<UserRound size={18} />}
              error={errors.lastName?.message}
              {...register("lastName")}
            />
          </div>

          <Input
            id="email"
            type="email"
            label="Email Address"
            placeholder="Enter your email"
            autoComplete="email"
            leftIcon={<Mail size={18} />}
            error={errors.email?.message}
            {...register("email")}
          />

          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            label="Password"
            placeholder="Create a password"
            autoComplete="new-password"
            leftIcon={<LockKeyhole size={18} />}
            rightIcon={
              <button
                type="button"
                onClick={() =>
                  setShowPassword((previous) => !previous)
                }
                className="flex text-white/70 transition hover:text-white"
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                {showPassword ? (
                  <EyeOff size={19} />
                ) : (
                  <Eye size={19} />
                )}
              </button>
            }
            error={errors.password?.message}
            {...register("password")}
          />

          <Input
            id="confirmPassword"
            type={
              showConfirmPassword ? "text" : "password"
            }
            label="Confirm Password"
            placeholder="Confirm your password"
            autoComplete="new-password"
            leftIcon={<LockKeyhole size={18} />}
            rightIcon={
              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword(
                    (previous) => !previous
                  )
                }
                className="flex text-white/70 transition hover:text-white"
                aria-label={
                  showConfirmPassword
                    ? "Hide confirm password"
                    : "Show confirm password"
                }
              >
                {showConfirmPassword ? (
                  <EyeOff size={19} />
                ) : (
                  <Eye size={19} />
                )}
              </button>
            }
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />

          <Button
            type="submit"
            fullWidth
            size="lg"
            isLoading={isSubmitting}
          >
            {isSubmitting
              ? "Creating account..."
              : "Create Account"}

            {!isSubmitting && <ArrowRight size={18} />}
          </Button>
        </form>

        <p className="mt-7 text-center text-sm text-white">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-bold text-[#ff8a9a] transition hover:text-white"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
