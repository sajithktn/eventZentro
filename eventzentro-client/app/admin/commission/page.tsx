"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  ArrowLeft,
  BadgePercent,
  CircleDollarSign,
  RefreshCw,
  Save,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import {
  getAdminCommission,
  updateAdminCommission,
} from "@/services/admin.service";

export default function AdminCommissionPage() {
  const [
    commissionPercentage,
    setCommissionPercentage,
  ] = useState("10");

  const [isActive, setIsActive] =
    useState(true);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const loadCommission =
    useCallback(async () => {
      try {
        setIsLoading(true);
        setError("");

        const response =
          await getAdminCommission();

        if (
          !response.success ||
          !response.commission
        ) {
          throw new Error(
            response.message ||
              "Unable to load commission settings."
          );
        }

        setCommissionPercentage(
          String(
            response.commission
              .commissionPercentage
          )
        );

        setIsActive(
          response.commission
            .isActive
        );
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Unable to load commission settings."
        );
      } finally {
        setIsLoading(false);
      }
    }, []);

  useEffect(() => {
    loadCommission();
  }, [loadCommission]);

  const handleSave = async () => {
    const percentage = Number(
      commissionPercentage
    );

    if (
      !Number.isFinite(
        percentage
      ) ||
      percentage < 0 ||
      percentage > 100
    ) {
      toast.error(
        "Commission percentage must be between 0 and 100."
      );
      return;
    }

    try {
      setIsSaving(true);

      const response =
        await updateAdminCommission(
          {
            commissionPercentage:
              percentage,
            isActive,
          }
        );

      if (
        !response.success ||
        !response.commission
      ) {
        throw new Error(
          response.message ||
            "Unable to update commission settings."
        );
      }

      setCommissionPercentage(
        String(
          response.commission
            .commissionPercentage
        )
      );

      setIsActive(
        response.commission
          .isActive
      );

      toast.success(
        "Commission settings updated successfully."
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to update commission settings."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-orange-500"
      >
        <ArrowLeft size={17} />
        Back to Dashboard
      </Link>

      <section className="relative mt-5 overflow-hidden rounded-[28px] bg-slate-950 p-6 text-white shadow-xl sm:p-8">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-orange-500/25 blur-[100px]" />

        <div className="relative">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-orange-400">
            <BadgePercent size={24} />
          </div>

          <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">
            Admin Commission
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            Configure the platform
            commission collected from
            successfully paid event
            bookings.
          </p>
        </div>
      </section>

      {error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
          <p className="text-sm font-bold text-red-600">
            {error}
          </p>

          <button
            type="button"
            onClick={
              loadCommission
            }
            className="mt-3 inline-flex items-center gap-2 text-sm font-black text-red-700 underline underline-offset-4"
          >
            <RefreshCw
              size={16}
            />
            Try again
          </button>
        </div>
      )}

      <section className="mt-6 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
            <CircleDollarSign
              size={23}
            />
          </div>

          <div>
            <h2 className="text-xl font-black text-slate-950">
              Commission Settings
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-600">
              The percentage is
              calculated from the final
              amount paid after applying
              discounts.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="mt-7 space-y-4">
            <div className="h-12 animate-pulse rounded-xl bg-slate-100" />
            <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
            <div className="h-12 animate-pulse rounded-xl bg-slate-100" />
          </div>
        ) : (
          <div className="mt-7 space-y-6">
            <div>
              <label
                htmlFor="commissionPercentage"
                className="text-sm font-black text-slate-800"
              >
                Commission Percentage
              </label>

              <div className="relative mt-2">
                <input
                  id="commissionPercentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={
                    commissionPercentage
                  }
                  onChange={(event) =>
                    setCommissionPercentage(
                      event.target
                        .value
                    )
                  }
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 pr-12 text-sm font-bold text-slate-950 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                />

                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-500">
                  %
                </span>
              </div>

              <p className="mt-2 text-xs font-medium text-slate-500">
                Enter a value between 0
                and 100.
              </p>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div>
                <p className="text-sm font-black text-slate-900">
                  Commission Status
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Disable this to stop
                  collecting commission
                  from new successful
                  bookings.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setIsActive(
                    (current) =>
                      !current
                  )
                }
                aria-pressed={
                  isActive
                }
                className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                  isActive
                    ? "bg-orange-500"
                    : "bg-slate-300"
                }`}
              >
                <span
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
                    isActive
                      ? "left-6"
                      : "left-1"
                  }`}
                />
              </button>
            </div>

            <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4">
              <div className="flex gap-3">
                <ShieldCheck
                  size={20}
                  className="mt-0.5 shrink-0 text-orange-500"
                />

                <div>
                  <p className="text-sm font-black text-slate-900">
                    Current behaviour
                  </p>

                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {isActive
                      ? `${commissionPercentage || 0}% commission will be applied to new successful paid bookings.`
                      : "Commission collection is currently disabled for new successful paid bookings."}
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 text-sm font-black text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {isSaving ? (
                <RefreshCw
                  size={18}
                  className="animate-spin"
                />
              ) : (
                <Save size={18} />
              )}

              {isSaving
                ? "Saving..."
                : "Save Commission"}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}