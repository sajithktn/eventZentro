"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
ArrowLeft,
ArrowRight,
Eye,
EyeOff,
KeyRound,
LoaderCircle,
LockKeyhole,
Mail,
ShieldCheck,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPassword } from "@/services/auth.service";
import {
resetPasswordSchema,
ResetPasswordSchema,
} from "@/lib/validations/auth";

export default function ResetPasswordForm() {
const searchParams = useSearchParams();
const email = searchParams.get("email") || "";

const router = useRouter();

const [showNewPassword, setShowNewPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);
const [isSubmitting, setIsSubmitting] = useState(false);

const {
register,
handleSubmit,
formState: { errors },
} = useForm<ResetPasswordSchema>({
resolver: zodResolver(resetPasswordSchema),
defaultValues: {
email,
otp: "",
password: "",
confirmPassword: "",
},
});

const onSubmit = async (data: ResetPasswordSchema) => {
try {
setIsSubmitting(true);

  const result = await resetPassword({
    ...data,
    email: email.trim().toLowerCase(),
  });

  toast.success(result.message || "Password reset successful.");

  router.push("/login");
} catch (error: unknown) {
  if (axios.isAxiosError(error)) {
    toast.error(
      error.response?.data?.message || "Reset password failed."
    );

    return;
  }

  toast.error(
    error instanceof Error
      ? error.message
      : "Reset password failed."
  );
} finally {
  setIsSubmitting(false);
}

};

return ( <div className="relative w-full max-w-lg overflow-hidden rounded-[32px] border border-white/20 bg-[#0d0d14] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.55)] sm:p-10"> <div className="absolute -left-20 -top-20 h-56 w-56 rounded-full bg-red-500/20 blur-[100px]" /> <div className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-yellow-400/15 blur-[100px]" />

  <div className="relative">
    <Link
      href="/forgot-password"
      className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-white transition hover:text-yellow-300"
    >
      <ArrowLeft size={17} />
      Back to forgot password
    </Link>

    <div className="mb-8">
      <Link href="/" className="inline-flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-yellow-400 text-lg font-black text-black shadow-lg shadow-red-500/20">
          E
        </div>

        <span className="text-2xl font-black tracking-tight text-white">
          EventZentro
        </span>
      </Link>

      <h1 className="mt-8 text-3xl font-bold tracking-tight text-white">
        Reset your password
      </h1>

      <p className="mt-3 leading-6 text-white">
        Enter the OTP sent to your email and create a secure new password
        for your account.
      </p>

      {email && (
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/20 bg-white/[0.06] px-4 py-3">
          <Mail size={18} className="shrink-0 text-yellow-300" />

          <p className="break-all text-sm font-medium text-white">
            {email}
          </p>
        </div>
      )}
    </div>

    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <input type="hidden" {...register("email")} />

      <div>
        <label
          htmlFor="otp"
          className="mb-2.5 block text-sm font-medium text-white"
        >
          Verification OTP
        </label>

        <div className="group relative">
          <KeyRound
            size={19}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white transition group-focus-within:text-yellow-300"
          />

          <input
            {...register("otp")}
            id="otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="Enter 6-digit OTP"
            disabled={isSubmitting}
            className="h-14 w-full rounded-2xl border border-white/30 bg-white/10 pl-12 pr-4 text-center text-lg font-semibold tracking-[0.35em] text-white outline-none transition placeholder:text-sm placeholder:font-normal placeholder:tracking-normal placeholder:text-gray-300 hover:border-white/50 focus:border-yellow-300 focus:bg-white/15 focus:ring-4 focus:ring-yellow-300/10 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>

        {errors.otp && (
          <p className="mt-2 text-sm font-medium text-red-400">
            {errors.otp.message}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="newPassword"
          className="mb-2.5 block text-sm font-medium text-white"
        >
          New password
        </label>

        <div className="group relative">
          <LockKeyhole
            size={19}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white transition group-focus-within:text-yellow-300"
          />

          <input
            {...register("password")}
            id="newPassword"
            type={showNewPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Enter new password"
            disabled={isSubmitting}
            className="h-14 w-full rounded-2xl border border-white/30 bg-white/10 pl-12 pr-12 text-white outline-none transition placeholder:text-gray-300 hover:border-white/50 focus:border-yellow-300 focus:bg-white/15 focus:ring-4 focus:ring-yellow-300/10 disabled:cursor-not-allowed disabled:opacity-60"
          />

          <button
            type="button"
            onClick={() => setShowNewPassword((current) => !current)}
            disabled={isSubmitting}
            aria-label={
              showNewPassword ? "Hide new password" : "Show new password"
            }
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white transition hover:text-yellow-300 disabled:cursor-not-allowed"
          >
            {showNewPassword ? (
              <EyeOff size={20} />
            ) : (
              <Eye size={20} />
            )}
          </button>
        </div>

        {errors.password && (
          <p className="mt-2 text-sm font-medium text-red-400">
            {errors.password.message}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="mb-2.5 block text-sm font-medium text-white"
        >
          Confirm password
        </label>

        <div className="group relative">
          <LockKeyhole
            size={19}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white transition group-focus-within:text-yellow-300"
          />

          <input
            {...register("confirmPassword")}
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Confirm new password"
            disabled={isSubmitting}
            className="h-14 w-full rounded-2xl border border-white/30 bg-white/10 pl-12 pr-12 text-white outline-none transition placeholder:text-gray-300 hover:border-white/50 focus:border-yellow-300 focus:bg-white/15 focus:ring-4 focus:ring-yellow-300/10 disabled:cursor-not-allowed disabled:opacity-60"
          />

          <button
            type="button"
            onClick={() =>
              setShowConfirmPassword((current) => !current)
            }
            disabled={isSubmitting}
            aria-label={
              showConfirmPassword
                ? "Hide confirmed password"
                : "Show confirmed password"
            }
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white transition hover:text-yellow-300 disabled:cursor-not-allowed"
          >
            {showConfirmPassword ? (
              <EyeOff size={20} />
            ) : (
              <Eye size={20} />
            )}
          </button>
        </div>

        {errors.confirmPassword && (
          <p className="mt-2 text-sm font-medium text-red-400">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="group relative flex h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-red-500 via-orange-500 to-yellow-400 px-5 font-bold text-black shadow-[0_15px_45px_rgba(239,68,68,0.22)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_55px_rgba(239,68,68,0.32)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
      >
        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

        {isSubmitting ? (
          <>
            <LoaderCircle size={20} className="animate-spin" />
            Resetting password...
          </>
        ) : (
          <>
            Reset password
            <ArrowRight
              size={20}
              className="transition-transform group-hover:translate-x-1"
            />
          </>
        )}
      </button>
    </form>

    <div className="mt-6 rounded-2xl border border-white/20 bg-white/[0.06] p-4">
      <div className="flex gap-3">
        <ShieldCheck
          size={20}
          className="mt-0.5 shrink-0 text-green-400"
        />

        <p className="text-sm leading-6 text-white">
          Use a strong password that you have not used before. Never share
          your password or OTP with anyone.
        </p>
      </div>
    </div>

    <p className="mt-7 text-center text-sm text-white">
      Remember your password?{" "}
      <Link
        href="/login"
        className="font-semibold text-yellow-300 transition hover:text-yellow-200"
      >
        Back to login
      </Link>
    </p>
  </div>
</div>

);
}

