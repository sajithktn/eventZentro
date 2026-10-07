"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import {
  ArrowRight,
  Clock3,
  Loader2,
  Mail,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { resendOTP, verifyEmail } from "@/services/auth.service";

const OTP_EXPIRY_MS = 5 * 60 * 1000;

export default function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = searchParams.get("email") || "";

  const [otp, setOtp] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTimerReady, setIsTimerReady] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    let expiryTime = Number(localStorage.getItem("otpExpiry"));

    if (!expiryTime) {
      expiryTime = Date.now() + OTP_EXPIRY_MS;
      localStorage.setItem("otpExpiry", expiryTime.toString());
    }

    const updateTimer = () => {
      const remainingTime = Math.max(
        0,
        Math.ceil((expiryTime - Date.now()) / 1000)
      );

      setTimeLeft(remainingTime);
      setIsTimerReady(true);
    };

    updateTimer();

    const timer = window.setInterval(updateTimer, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const handleOtpChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value
      .replace(/\D/g, "")
      .slice(0, 6);

    setOtp(value);
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!email) {
      toast.error("Email address is missing.");
      return;
    }

    if (otp.length !== 6) {
      toast.error("Enter the complete 6-digit OTP.");
      return;
    }

    if (timeLeft <= 0) {
      toast.error("OTP has expired. Please request a new one.");
      return;
    }

    try {
      setIsVerifying(true);

      await verifyEmail({
        email,
        otp,
      });

      localStorage.removeItem("otpExpiry");

      toast.success("Email verified successfully.");

      router.replace("/login");
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message ||
            "Invalid or expired verification code."
        );
        return;
      }

      toast.error(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    if (!email) {
      toast.error("Email address is missing.");
      return;
    }

    try {
      setIsResending(true);

      await resendOTP({ email });

      const newExpiryTime = Date.now() + OTP_EXPIRY_MS;

      localStorage.setItem(
        "otpExpiry",
        newExpiryTime.toString()
      );

      setOtp("");
      setTimeLeft(OTP_EXPIRY_MS / 1000);

      toast.success("A new OTP has been sent to your email.");
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message ||
            "Failed to resend OTP."
        );
        return;
      }

      toast.error("Failed to resend OTP.");
    } finally {
      setIsResending(false);
    }
  };

  const isExpired = isTimerReady && timeLeft <= 0;

  return (
    <div className="relative w-full max-w-md overflow-hidden rounded-[30px] border border-white/10 bg-[#12121c]/95 p-7 shadow-[0_30px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:p-9">
      <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-orange-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-20 h-52 w-52 rounded-full bg-purple-600/20 blur-3xl" />

      <div className="relative">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 via-red-500 to-purple-600 shadow-lg shadow-orange-500/20">
            <ShieldCheck size={30} className="text-white" />
          </div>

          <p className="text-xs font-bold uppercase tracking-[0.28em] text-orange-400">
            EventZentro
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight text-white">
            Verify your email
          </h1>

          <p className="mt-3 text-sm leading-6 text-white/50">
            Enter the 6-digit verification code we sent to your
            email address.
          </p>
        </div>

        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
            <Mail size={20} />
          </div>

          <div className="min-w-0">
            <p className="text-xs text-white/40">
              Verification code sent to
            </p>

            <p className="truncate text-sm font-semibold text-white">
              {email || "Email address not found"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <label
            htmlFor="otp"
            className="mb-2 block text-sm font-semibold text-white/70"
          >
            Verification code
          </label>

          <input
            id="otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={otp}
            onChange={handleOtpChange}
            placeholder="000000"
            autoFocus
            className="h-16 w-full rounded-2xl border border-white/10 bg-white/[0.05] px-5 text-center text-2xl font-bold tracking-[0.5em] text-white outline-none transition placeholder:text-white/15 focus:border-orange-400/80 focus:bg-white/[0.07] focus:ring-4 focus:ring-orange-500/10"
          />

          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Clock3
                size={16}
                className={
                  isExpired ? "text-red-400" : "text-orange-400"
                }
              />

              {isExpired ? (
                <span className="font-medium text-red-400">
                  OTP expired
                </span>
              ) : (
                <span className="text-white/45">
                  Expires in{" "}
                  <span className="font-bold text-orange-400">
                    {isTimerReady
                      ? `${minutes}:${seconds
                          .toString()
                          .padStart(2, "0")}`
                      : "--:--"}
                  </span>
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleResendOTP}
              disabled={
                !isExpired ||
                isResending ||
                isVerifying
              }
              className="flex items-center gap-2 text-sm font-semibold text-orange-400 transition hover:text-orange-300 disabled:cursor-not-allowed disabled:text-white/25"
            >
              <RefreshCw
                size={15}
                className={isResending ? "animate-spin" : ""}
              />

              {isResending ? "Sending" : "Resend OTP"}
            </button>
          </div>

          <button
            type="submit"
            disabled={
              isVerifying ||
              isResending ||
              otp.length !== 6 ||
              timeLeft <= 0
            }
            className="group mt-7 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-400 via-red-500 to-purple-600 px-5 font-bold text-white shadow-lg shadow-orange-500/20 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-500/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {isVerifying ? (
              <>
                <Loader2 size={19} className="animate-spin" />
                Verifying
              </>
            ) : (
              <>
                Verify email
                <ArrowRight
                  size={19}
                  className="transition-transform group-hover:translate-x-1"
                />
              </>
            )}
          </button>
        </form>

        <p className="mt-7 text-center text-sm text-white/45">
          Entered the wrong email?{" "}
          <Link
            href="/register"
            className="font-semibold text-orange-400 transition hover:text-orange-300"
          >
            Register again
          </Link>
        </p>

        <p className="mt-3 text-center text-sm text-white/45">
          Back to{" "}
          <Link
            href="/login"
            className="font-semibold text-white/70 transition hover:text-white"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}