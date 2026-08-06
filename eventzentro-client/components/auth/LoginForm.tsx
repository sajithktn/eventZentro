"use client";

import { useState } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  loginSchema,
  type LoginSchema,
} from "@/lib/validations/auth";
import { loginUser } from "@/services/auth.service";
import { useAppDispatch } from "@/redux/hooks";
import { setUser } from "@/redux/features/auth/authSlice";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();
  const dispatch = useAppDispatch();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
  });

  const handleGoogleLogin = () => {
    window.location.href =
      "http://localhost:5000/api/auth/google";
  };

  const onSubmit = async (data: LoginSchema) => {
    try {
      const response = await loginUser({
        ...data,
        email: data.email.trim().toLowerCase(),
      });

      if (!response.success) {
        toast.error(response.message || "Login failed");
        return;
      }

      if (!response.user) {
        toast.error(
          "User data was not returned from the backend."
        );
        return;
      }

      dispatch(setUser(response.user));

      toast.success(
        response.message || "Login successful"
      );

      router.push("/");
      router.refresh();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message || "Login failed"
        );
        return;
      }

      if (error instanceof Error) {
        toast.error(error.message);
        return;
      }

      toast.error("Something went wrong");
    }
  };

  return (
    <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-[#111116]/95 p-6 shadow-[0_30px_100px_rgba(0,0,0,0.55)] backdrop-blur-2xl sm:p-9">
      <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-[#8b5cf6]/20 blur-[90px]" />
      <div className="absolute -bottom-24 -left-20 h-52 w-52 rounded-full bg-[#ff3d57]/20 blur-[90px]" />

      <div className="relative">
        <div className="mb-8 text-center">
          <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-[#ff3d57]/20 bg-[#ff3d57]/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#ff8a9a]">
            <Sparkles size={14} />
            Welcome back
          </div>

          <h1 className="mt-5 text-3xl font-black tracking-tight text-white sm:text-4xl">
            Sign in to{" "}
            <span className="bg-gradient-to-r from-[#ffb703] via-[#ff3d57] to-[#a78bfa] bg-clip-text text-transparent">
              EventZentro
            </span>
          </h1>

          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-white">
            Access your events, tickets and personalized
            dashboard.
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
        >
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
            placeholder="Enter your password"
            autoComplete="current-password"
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

          <div className="flex items-center justify-end text-sm">
            <Link
              href="/forgot-password"
              className="font-semibold text-[#ff8a9a] transition hover:text-white"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            fullWidth
            size="lg"
            isLoading={isSubmitting}
          >
            {isSubmitting ? "Signing in..." : "Sign In"}
            {!isSubmitting && <ArrowRight size={18} />}
          </Button>
        </form>

        <div className="my-7 flex items-center gap-4">
          <div className="h-px flex-1 bg-white/20" />

          <span className="text-xs font-bold uppercase tracking-[0.18em] text-white">
            Or continue with
          </span>

          <div className="h-px flex-1 bg-white/20" />
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-white/20 bg-white/[0.08] text-sm font-semibold text-white transition duration-300 hover:border-white/30 hover:bg-white/15"
        >
          <svg
            viewBox="0 0 48 48"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path
              fill="#FFC107"
              d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12S17.4 12 24 12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.1 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.3-.4-3.5z"
            />
            <path
              fill="#FF3D00"
              d="M6.3 14.7l6.6 4.8C14.7 15.4 18.9 12 24 12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
            />
            <path
              fill="#4CAF50"
              d="M24 44c5.2 0 10-2 13.5-5.2l-6.2-5.2c-2.1 1.5-4.7 2.4-7.3 2.4-5.3 0-9.7-3.3-11.3-8H6.5C9.9 39.4 16.3 44 24 44z"
            />
            <path
              fill="#1976D2"
              d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.2-3.6 5.8-6.8 7.5l6.2 5.2C38.9 37.4 44 31.4 44 24c0-1.3-.1-2.3-.4-3.5z"
            />
          </svg>

          Continue with Google
        </button>

        <p className="mt-7 text-center text-sm text-white">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-bold text-[#ff8a9a] transition hover:text-white"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}