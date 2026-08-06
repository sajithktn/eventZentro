"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { toast } from "sonner";
import {
  BadgePercent,
  LoaderCircle,
  Save,
  TicketPercent,
} from "lucide-react";

import {
  couponSchema,
  type CouponSchema,
} from "@/lib/validations/coupon";
import {
  createPromotion,
  updatePromotion,
} from "@/services/promotion.service";
import { getAllEvents } from "@/services/event.service";
import type { Event } from "@/types/event";
import type { Promotion } from "@/types/promotion";
import { SUMMARY_PAGE_SIZE } from "@/utils/pagination";

interface PromotionFormProps {
  mode: "create" | "edit";
  promotion?: Promotion;
  initialEventId?: string;
}

const inputClassName =
  "w-full rounded-lg border-2 border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

const labelClassName =
  "mb-1.5 block text-sm font-bold text-slate-700";

const errorClassName =
  "mt-1 text-xs font-medium text-red-500";

const addDays = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);

  return date;
};

const toDateInputValue = (value: string | Date) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getPromotionEventId = (promotion?: Promotion) => {
  if (!promotion) {
    return "";
  }

  return typeof promotion.event === "string"
    ? promotion.event
    : promotion.event._id;
};

const getPromotionName = (promotion?: Promotion) =>
  promotion?.name ||
  promotion?.displayText ||
  promotion?.code ||
  "";

const getOptionalNumber = (value: unknown) => {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  const numericValue = Number(value);

  return Number.isFinite(numericValue)
    ? numericValue
    : undefined;
};

const getDefaultValues = (
  promotion?: Promotion,
  initialEventId?: string
): CouponSchema => ({
  name: getPromotionName(promotion),
  description: promotion?.description || undefined,
  eventId: getPromotionEventId(promotion) || initialEventId || "",
  promotionMode: promotion?.promotionMode || "coupon",
  code: promotion?.code || undefined,
  discountType: promotion?.discountType || "percentage",
  discountValue: promotion?.discountValue || 1,
  minimumBookingAmount:
    promotion?.minimumBookingAmount ??
    promotion?.minimumAmount ??
    undefined,
  maximumDiscountAmount:
    promotion?.maximumDiscountAmount ??
    promotion?.maximumDiscount ??
    undefined,
  totalUsageLimit:
    promotion?.totalUsageLimit ??
    promotion?.usageLimit ??
    undefined,
  perUserUsageLimit: promotion?.perUserUsageLimit ?? undefined,
  firstNTickets: promotion?.firstNTickets ?? undefined,
  maxTicketsPerBooking:
    promotion?.maxTicketsPerBooking ?? undefined,
  validFrom: promotion
    ? toDateInputValue(promotion.validFrom)
    : toDateInputValue(new Date()),
  validUntil: promotion
    ? toDateInputValue(promotion.validUntil)
    : toDateInputValue(addDays(30)),
  status:
    promotion?.status ||
    (promotion?.isActive === false ? "inactive" : "active"),
  visibility: promotion?.visibility || "public",
  displayText: promotion?.displayText || undefined,
});

export default function PromotionForm({
  mode,
  promotion,
  initialEventId,
}: PromotionFormProps) {
  const router = useRouter();

  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  const defaultValues = useMemo(
    () => getDefaultValues(promotion, initialEventId),
    [initialEventId, promotion]
  );

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CouponSchema>({
    resolver: zodResolver(couponSchema),
    defaultValues,
  });

  const promotionMode = watch("promotionMode");
  const discountType = watch("discountType");

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  useEffect(() => {
    if (promotionMode === "automatic") {
      setValue("code", undefined);
    }
  }, [promotionMode, setValue]);

  useEffect(() => {
    let isActive = true;

    const fetchEvents = async () => {
      try {
        setEventsLoading(true);

        const response = await getAllEvents({
          organizer: "me",
          page: 1,
          limit: SUMMARY_PAGE_SIZE,
          sort: "newest",
        });

        if (!isActive) {
          return;
        }

        setEvents(response.data || response.events || []);
      } catch {
        if (isActive) {
          setEvents([]);
          toast.error("Failed to load your events.");
        }
      } finally {
        if (isActive) {
          setEventsLoading(false);
        }
      }
    };

    fetchEvents();

    return () => {
      isActive = false;
    };
  }, []);

  const onSubmit = async (data: CouponSchema) => {
    try {
      const response =
        mode === "edit" && promotion
          ? await updatePromotion(promotion._id, data)
          : await createPromotion(data);

      toast.success(
        response.message ||
          (mode === "edit"
            ? "Promotion updated successfully."
            : "Promotion created successfully.")
      );

      router.push("/organizer/coupons");
      router.refresh();
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message ||
            "Failed to save promotion."
        );
        return;
      }

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save promotion."
      );
    }
  };

  const optionalNumberRegister = (
    field:
      | "minimumBookingAmount"
      | "maximumDiscountAmount"
      | "totalUsageLimit"
      | "perUserUsageLimit"
      | "firstNTickets"
      | "maxTicketsPerBooking"
  ) =>
    register(field, {
      setValueAs: getOptionalNumber,
    });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-xl border-2 border-orange-300 bg-white p-4 shadow-sm sm:p-5"
    >
      <div className="mb-4 flex items-center gap-3 border-b-2 border-slate-100 pb-4">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
          {promotionMode === "coupon" ? (
            <TicketPercent size={22} />
          ) : (
            <BadgePercent size={22} />
          )}
        </span>

        <div>
          <h2 className="text-xl font-black text-slate-900">
            {mode === "edit"
              ? "Edit promotion"
              : "Create promotion"}
          </h2>

          <p className="text-sm text-slate-500">
            Configure coupon codes or automatic event offers.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-12">
        <div className="md:col-span-6">
          <label htmlFor="name" className={labelClassName}>
            Promotion name
          </label>

          <input
            id="name"
            {...register("name")}
            className={inputClassName}
            placeholder="Kochi Special"
          />

          {errors.name && (
            <p className={errorClassName}>{errors.name.message}</p>
          )}
        </div>

        <div className="md:col-span-3">
          <label htmlFor="promotionMode" className={labelClassName}>
            Promotion mode
          </label>

          <select
            id="promotionMode"
            {...register("promotionMode")}
            className={inputClassName}
          >
            <option value="coupon">Coupon code</option>
            <option value="automatic">Automatic offer</option>
          </select>
        </div>

        <div className="md:col-span-3">
          <label htmlFor="eventId" className={labelClassName}>
            Event
          </label>

          <select
            id="eventId"
            {...register("eventId")}
            disabled={eventsLoading}
            className={inputClassName}
          >
            <option value="">
              {eventsLoading ? "Loading events..." : "Select event"}
            </option>

            {events.map((event) => (
              <option key={event._id} value={event._id}>
                {event.title}
              </option>
            ))}
          </select>

          {errors.eventId && (
            <p className={errorClassName}>
              {errors.eventId.message}
            </p>
          )}
        </div>

        <div className="md:col-span-6">
          <label htmlFor="description" className={labelClassName}>
            Description
          </label>

          <textarea
            id="description"
            {...register("description")}
            rows={3}
            className={`${inputClassName} h-[86px] resize-none`}
            placeholder="Short internal or public note"
          />
        </div>

        {promotionMode === "coupon" && (
          <div className="md:col-span-3">
            <label htmlFor="code" className={labelClassName}>
              Coupon code
            </label>

            <input
              id="code"
              {...register("code")}
              onInput={(event) => {
                event.currentTarget.value =
                  event.currentTarget.value.toUpperCase();
              }}
              className={`${inputClassName} uppercase tracking-wide`}
              placeholder="KOCHI20"
            />

            {errors.code && (
              <p className={errorClassName}>
                {errors.code.message}
              </p>
            )}
          </div>
        )}

        <div className="md:col-span-3">
          <label htmlFor="visibility" className={labelClassName}>
            Visibility
          </label>

          <select
            id="visibility"
            {...register("visibility")}
            className={inputClassName}
          >
            <option value="public">Public</option>
            <option value="hidden">Hidden</option>
          </select>
        </div>

        <div className="md:col-span-3">
          <label htmlFor="discountType" className={labelClassName}>
            Discount type
          </label>

          <select
            id="discountType"
            {...register("discountType")}
            className={inputClassName}
          >
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed amount</option>
          </select>
        </div>

        <div className="md:col-span-3">
          <label htmlFor="discountValue" className={labelClassName}>
            Discount value
          </label>

          <input
            id="discountValue"
            type="number"
            min="0"
            step="0.01"
            {...register("discountValue", {
              valueAsNumber: true,
            })}
            className={inputClassName}
          />

          {errors.discountValue && (
            <p className={errorClassName}>
              {errors.discountValue.message}
            </p>
          )}
        </div>

        <div className="md:col-span-3">
          <label
            htmlFor="minimumBookingAmount"
            className={labelClassName}
          >
            Minimum booking
          </label>

          <input
            id="minimumBookingAmount"
            type="number"
            min="0"
            step="0.01"
            {...optionalNumberRegister("minimumBookingAmount")}
            className={inputClassName}
            placeholder="Optional"
          />
        </div>

        {discountType === "percentage" && (
          <div className="md:col-span-3">
            <label
              htmlFor="maximumDiscountAmount"
              className={labelClassName}
            >
              Maximum discount
            </label>

            <input
              id="maximumDiscountAmount"
              type="number"
              min="0"
              step="0.01"
              {...optionalNumberRegister("maximumDiscountAmount")}
              className={inputClassName}
              placeholder="Optional"
            />
          </div>
        )}

        <div className="md:col-span-3">
          <label htmlFor="totalUsageLimit" className={labelClassName}>
            Total usage limit
          </label>

          <input
            id="totalUsageLimit"
            type="number"
            min="1"
            {...optionalNumberRegister("totalUsageLimit")}
            className={inputClassName}
            placeholder="Optional"
          />
        </div>

        <div className="md:col-span-3">
          <label htmlFor="perUserUsageLimit" className={labelClassName}>
            Per-user limit
          </label>

          <input
            id="perUserUsageLimit"
            type="number"
            min="1"
            {...optionalNumberRegister("perUserUsageLimit")}
            className={inputClassName}
            placeholder="Optional"
          />
        </div>

        <div className="md:col-span-3">
          <label htmlFor="firstNTickets" className={labelClassName}>
            First N tickets
          </label>

          <input
            id="firstNTickets"
            type="number"
            min="1"
            {...optionalNumberRegister("firstNTickets")}
            className={inputClassName}
            placeholder="Optional"
          />
        </div>

        <div className="md:col-span-3">
          <label
            htmlFor="maxTicketsPerBooking"
            className={labelClassName}
          >
            Max tickets per booking
          </label>

          <input
            id="maxTicketsPerBooking"
            type="number"
            min="1"
            {...optionalNumberRegister("maxTicketsPerBooking")}
            className={inputClassName}
            placeholder="Optional"
          />
        </div>

        <div className="md:col-span-3">
          <label htmlFor="validFrom" className={labelClassName}>
            Valid from
          </label>

          <input
            id="validFrom"
            type="date"
            {...register("validFrom")}
            className={inputClassName}
          />

          {errors.validFrom && (
            <p className={errorClassName}>
              {errors.validFrom.message}
            </p>
          )}
        </div>

        <div className="md:col-span-3">
          <label htmlFor="validUntil" className={labelClassName}>
            Valid until
          </label>

          <input
            id="validUntil"
            type="date"
            {...register("validUntil")}
            className={inputClassName}
          />

          {errors.validUntil && (
            <p className={errorClassName}>
              {errors.validUntil.message}
            </p>
          )}
        </div>

        <div className="md:col-span-3">
          <label htmlFor="status" className={labelClassName}>
            Status
          </label>

          <select
            id="status"
            {...register("status")}
            className={inputClassName}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="expired">Expired</option>
          </select>
        </div>

        <div className="md:col-span-6">
          <label htmlFor="displayText" className={labelClassName}>
            Display text
          </label>

          <input
            id="displayText"
            {...register("displayText")}
            className={inputClassName}
            placeholder="20% off up to Rs. 500"
          />
        </div>

        <div className="flex flex-col-reverse gap-3 border-t-2 border-slate-200 pt-3 md:col-span-12 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => router.push("/organizer/coupons")}
            disabled={isSubmitting}
            className="rounded-lg border-2 border-slate-300 bg-white px-6 py-2.5 text-sm font-bold text-slate-700 transition hover:border-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting || events.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <LoaderCircle size={17} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={17} />
                {mode === "edit" ? "Save changes" : "Create promotion"}
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}

