"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import PromotionForm from "@/components/organizer/PromotionForm";

export default function CreatePromotionPage() {
  const searchParams = useSearchParams();
  const initialEventId = searchParams.get("eventId") || undefined;

  return (
    <main className="bg-[#fffaf5] px-4 py-3 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">
              Create Promotion
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Add a coupon code or automatic offer for an event.
            </p>
          </div>

          <Link
            href="/organizer/coupons"
            className="inline-flex w-fit items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600"
          >
            <ArrowLeft size={17} />
            Back to promotions
          </Link>
        </div>

        <div className="mt-3">
          <PromotionForm
            mode="create"
            initialEventId={initialEventId}
          />
        </div>
      </div>
    </main>
  );
}
