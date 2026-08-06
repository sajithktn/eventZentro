"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import {
ArrowLeft,
ArrowRight,
LoaderCircle,
Mail,
ShieldCheck,
} from "lucide-react";
import { forgotPassword } from "@/services/auth.service";

export default function ForgotPasswordForm() {
const [email, setEmail] = useState("");
const [isSubmitting, setIsSubmitting] = useState(false);

const router = useRouter();

const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
e.preventDefault();

const normalizedEmail = email.trim().toLowerCase();

if (!normalizedEmail) {
  toast.error("Please enter your email address.");
  return;
}

try {
  setIsSubmitting(true);

  const response = await forgotPassword({
    email: normalizedEmail,
  });

  toast.success(
    response.message || "Password reset OTP sent successfully."
  );

  router.push(
    `/reset-password?email=${encodeURIComponent(normalizedEmail)}`
  );
} catch (error: unknown) {
  if (axios.isAxiosError(error)) {
    const fieldError = error.response?.data?.errors?.email?.[0];

    toast.error(
      fieldError ||
        error.response?.data?.message ||
        "Failed to send reset OTP."
    );

    return;
  }

  toast.error(
    error instanceof Error
      ? error.message
      : "Failed to send reset OTP."
  );
} finally {
  setIsSubmitting(false);
}

};

return ( <div className="relative w-full max-w-lg overflow-hidden rounded-[32px] border border-white/20 bg-[#0d0d14] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.55)] sm:p-10"> <div className="absolute -left-20 -top-20 h-56 w-56 rounded-full bg-red-500/20 blur-[100px]" /> <div className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-yellow-400/15 blur-[100px]" />

  <div className="relative">
    <Link
      href="/"
      className="mb-10 inline-flex items-center gap-2 text-sm font-medium text-white transition hover:text-yellow-300"
    >
      <ArrowLeft size={17} />
      Back to EventZentro
    </Link>

    <div className="mb-9">
      <Link href="/" className="inline-flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-yellow-400 text-lg font-black text-black shadow-lg shadow-red-500/20">
          E
        </div>

        <span className="text-2xl font-black tracking-tight text-white">
          EventZentro
        </span>
      </Link>

      <h1 className="mt-9 text-3xl font-bold tracking-tight text-white">
        Forgot your password?
      </h1>

      <p className="mt-3 leading-6 text-white">
        Enter the email connected to your account. We will send you an OTP
        to create a new password.
      </p>
    </div>

    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="email"
          className="mb-2.5 block text-sm font-medium text-white"
        >
          Email address
        </label>

        <div className="group relative">
          <Mail
            size={19}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white transition group-focus-within:text-yellow-300"
          />

          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
            className="h-14 w-full rounded-2xl border border-white/30 bg-white/10 pl-12 pr-4 text-white outline-none transition placeholder:text-gray-300 hover:border-white/50 focus:border-yellow-300 focus:bg-white/15 focus:ring-4 focus:ring-yellow-300/10 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>
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
            Sending OTP...
          </>
        ) : (
          <>
            Send reset OTP
            <ArrowRight
              size={20}
              className="transition-transform group-hover:translate-x-1"
            />
          </>
        )}
      </button>
    </form>

    <div className="mt-7 rounded-2xl border border-white/20 bg-white/[0.06] p-4">
      <div className="flex gap-3">
        <ShieldCheck
          size={20}
          className="mt-0.5 shrink-0 text-green-400"
        />

        <p className="text-sm leading-6 text-white">
          The OTP is valid only for a limited time. Do not share it with
          anyone.
        </p>
      </div>
    </div>

    <p className="mt-8 text-center text-sm text-white">
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
