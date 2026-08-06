"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import {
  BadgePercent,
  CalendarDays,
  Eye,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  TicketPercent,
  Trash2,
  X,
} from "lucide-react";

import Loader from "@/components/common/Loader";
import Pagination from "@/components/common/Pagination";
import {
  deletePromotion,
  getPromotions,
  updatePromotionStatus,
} from "@/services/promotion.service";
import { getAllEvents } from "@/services/event.service";
import type { Event } from "@/types/event";
import type {
  Promotion,
  PromotionMode,
  PromotionStatus,
} from "@/types/promotion";
import type { PaginationMetadata } from "@/types/pagination";
import {
  formatCurrency,
  formatEventDate,
} from "@/utils/event";
import {
  createUrlWithQueryParams,
  DEFAULT_PAGE_SIZE,
  getPageFromSearchParams,
  SUMMARY_PAGE_SIZE,
} from "@/utils/pagination";

const paginationTargetId = "organizer-promotions-results";

const fieldClassName =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition hover:border-orange-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-100";

const getPromotionEvent = (promotion: Promotion) =>
  typeof promotion.event === "string" ? null : promotion.event;

const getPromotionName = (promotion: Promotion) =>
  promotion.name ||
  promotion.displayText ||
  promotion.code ||
  "Event offer";

const getPromotionCodeLabel = (promotion: Promotion) =>
  (promotion.promotionMode || "coupon") === "coupon"
    ? promotion.code || "Coupon"
    : "Automatic";

const getDiscountLabel = (promotion: Promotion) =>
  promotion.discountType === "percentage"
    ? `${promotion.discountValue}% off`
    : `${formatCurrency(promotion.discountValue)} off`;

const getUsageLimit = (promotion: Promotion) =>
  promotion.totalUsageLimit ?? promotion.usageLimit;

const getReservedTickets = (promotion: Promotion) =>
  promotion.discountedTicketsReserved || 0;

const getUsedTickets = (promotion: Promotion) =>
  promotion.discountedTicketsUsed || 0;

const getStatus = (promotion: Promotion): PromotionStatus => {
  if (promotion.status) {
    return promotion.status;
  }

  return promotion.isActive === false ? "inactive" : "active";
};

function OrganizerPromotionsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const resultsRef = useRef<HTMLDivElement>(null);
  const previousPageRef = useRef(1);

  const currentPage = getPageFromSearchParams(searchParams);
  const search = searchParams.get("search") || "";
  const selectedEventId = searchParams.get("eventId") || "";
  const selectedStatus =
    searchParams.get("status") || "all";
  const selectedMode =
    searchParams.get("promotionMode") || "all";

  const [events, setEvents] = useState<Event[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [pagination, setPagination] =
    useState<PaginationMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionPromotionId, setActionPromotionId] =
    useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  const requestParams = useMemo(
    () => ({
      page: currentPage,
      limit: DEFAULT_PAGE_SIZE,
      search: search || undefined,
      eventId: selectedEventId || undefined,
      status:
        selectedStatus !== "all"
          ? (selectedStatus as PromotionStatus)
          : undefined,
      promotionMode:
        selectedMode !== "all"
          ? (selectedMode as PromotionMode)
          : undefined,
      sort: "newest",
    }),
    [
      currentPage,
      search,
      selectedEventId,
      selectedMode,
      selectedStatus,
    ]
  );

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

        if (isActive) {
          setEvents(response.data || response.events || []);
        }
      } catch {
        if (isActive) {
          setEvents([]);
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

  useEffect(() => {
    let isActive = true;

    const fetchPromotions = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getPromotions(requestParams);

        if (!isActive) {
          return;
        }

        setPromotions(
          response.data ||
            response.promotions ||
            response.coupons ||
            []
        );
        setPagination(response.pagination);
      } catch {
        if (!isActive) {
          return;
        }

        setError("Failed to load promotions.");
        setPromotions([]);
        setPagination(null);
        toast.error("Failed to load promotions.");
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    fetchPromotions();

    return () => {
      isActive = false;
    };
  }, [requestParams, refreshNonce]);

  useEffect(() => {
    if (previousPageRef.current !== currentPage) {
      resultsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }

    previousPageRef.current = currentPage;
  }, [currentPage]);

  const updateFilters = (
    updates: Record<string, string | undefined>
  ) => {
    router.replace(
      createUrlWithQueryParams(
        pathname,
        searchParams,
        updates,
        true
      ),
      { scroll: false }
    );
  };

  const clearFilters = () => {
    updateFilters({
      search: undefined,
      eventId: undefined,
      status: undefined,
      promotionMode: undefined,
    });
  };

  const refreshPromotions = () => {
    setRefreshNonce((value) => value + 1);
  };

  const handleStatusToggle = async (promotion: Promotion) => {
    const nextStatus =
      getStatus(promotion) === "active" ? "inactive" : "active";

    try {
      setActionPromotionId(promotion._id);

      const response = await updatePromotionStatus(
        promotion._id,
        nextStatus
      );

      toast.success(response.message);
      refreshPromotions();
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message ||
            "Failed to update promotion status."
        );
        return;
      }

      toast.error("Failed to update promotion status.");
    } finally {
      setActionPromotionId(null);
    }
  };

  const handleDelete = async (promotion: Promotion) => {
    const confirmed = window.confirm(
      "Delete this promotion? Existing bookings keep their saved promotion history."
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionPromotionId(promotion._id);

      const response = await deletePromotion(promotion._id);

      toast.success(response.message);
      refreshPromotions();
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message ||
            "Failed to delete promotion."
        );
        return;
      }

      toast.error("Failed to delete promotion.");
    } finally {
      setActionPromotionId(null);
    }
  };

  const hasFilters = Boolean(
    search ||
      selectedEventId ||
      selectedStatus !== "all" ||
      selectedMode !== "all"
  );

  return (
    <main className="min-h-screen bg-[#fffaf5] px-4 pb-16 pt-6 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <section className="relative overflow-hidden rounded-[30px] border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-rose-50 px-6 py-8 shadow-sm sm:px-8">
          <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-600">
                Promotional tools
              </p>

              <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                Coupons & Offers
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                Manage coupon-code promotions and automatic event offers
                with usage, ticket and visibility controls.
              </p>
            </div>

            <Link
              href="/organizer/coupons/create"
              className="inline-flex w-fit items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-200 transition hover:-translate-y-0.5"
            >
              <Plus size={18} />
              Create promotion
            </Link>
          </div>
        </section>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-600">
            {error}
          </div>
        )}

        <section className="mt-8 rounded-[24px] border border-orange-100 bg-white shadow-sm">
          <div className="border-b border-orange-100 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-500">
                  Promotion list
                </p>

                <h2 className="mt-1 text-2xl font-black text-slate-900">
                  Manage Discounts
                </h2>
              </div>

              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex w-fit items-center gap-2 rounded-xl bg-orange-50 px-4 py-2.5 text-sm font-bold text-orange-600 transition hover:bg-orange-100"
                >
                  <X size={16} />
                  Clear
                </button>
              )}
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_220px_180px_180px]">
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 shadow-sm transition focus-within:border-orange-400 focus-within:ring-4 focus-within:ring-orange-100">
                <Search size={18} className="shrink-0 text-slate-400" />

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    updateFilters({
                      search: event.target.value,
                    })
                  }
                  placeholder="Search name, code or display text"
                  className="w-full bg-transparent py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
              </div>

              <select
                value={selectedEventId}
                onChange={(event) =>
                  updateFilters({
                    eventId: event.target.value || undefined,
                  })
                }
                className={fieldClassName}
              >
                <option value="">
                  {eventsLoading ? "Loading events..." : "All events"}
                </option>

                {events.map((event) => (
                  <option key={event._id} value={event._id}>
                    {event.title}
                  </option>
                ))}
              </select>

              <select
                value={selectedMode}
                onChange={(event) =>
                  updateFilters({
                    promotionMode:
                      event.target.value === "all"
                        ? undefined
                        : event.target.value,
                  })
                }
                className={fieldClassName}
              >
                <option value="all">All modes</option>
                <option value="coupon">Coupons</option>
                <option value="automatic">Automatic</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(event) =>
                  updateFilters({
                    status:
                      event.target.value === "all"
                        ? undefined
                        : event.target.value,
                  })
                }
                className={fieldClassName}
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>

          <div id={paginationTargetId} ref={resultsRef} />

          {loading ? (
            <div className="flex min-h-80 items-center justify-center">
              <Loader text="Loading promotions..." />
            </div>
          ) : promotions.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                <BadgePercent size={28} />
              </div>

              <h3 className="mt-5 text-xl font-black text-slate-900">
                {hasFilters
                  ? "No matching promotions found"
                  : "No promotions yet"}
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                {hasFilters
                  ? "Try changing the search text, event filter, mode or status."
                  : "Create a coupon or automatic offer for one of your events."}
              </p>

              {!hasFilters && (
                <Link
                  href="/organizer/coupons/create"
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-600"
                >
                  <Plus size={17} />
                  Create promotion
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1120px] text-left text-sm">
                <thead className="bg-orange-50/70 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Promotion</th>
                    <th className="px-5 py-4">Event</th>
                    <th className="px-5 py-4">Discount</th>
                    <th className="px-5 py-4">Usage</th>
                    <th className="px-5 py-4">First-N progress</th>
                    <th className="px-5 py-4">Validity</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Visibility</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-orange-50">
                  {promotions.map((promotion) => {
                    const event = getPromotionEvent(promotion);
                    const status = getStatus(promotion);
                    const usageLimit = getUsageLimit(promotion);
                    const actionLoading =
                      actionPromotionId === promotion._id;

                    return (
                      <tr
                        key={promotion._id}
                        className="text-slate-700 transition hover:bg-orange-50/40"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-start gap-3">
                            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                              {(promotion.promotionMode || "coupon") ===
                              "coupon" ? (
                                <TicketPercent size={17} />
                              ) : (
                                <BadgePercent size={17} />
                              )}
                            </span>

                            <div className="min-w-0">
                              <p className="max-w-52 truncate font-black text-slate-900">
                                {getPromotionName(promotion)}
                              </p>

                              <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">
                                {getPromotionCodeLabel(promotion)}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <p className="max-w-52 truncate font-semibold text-slate-900">
                            {event?.title || "Event"}
                          </p>

                          <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                            <CalendarDays size={14} />
                            {event?.eventDate
                              ? formatEventDate(event.eventDate)
                              : "Date unavailable"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-bold text-slate-900">
                            {getDiscountLabel(promotion)}
                          </p>

                          {promotion.minimumBookingAmount !== undefined && (
                            <p className="mt-1 text-xs text-slate-500">
                              Min{" "}
                              {formatCurrency(
                                promotion.minimumBookingAmount
                              )}
                            </p>
                          )}

                          {promotion.maximumDiscountAmount !== undefined && (
                            <p className="mt-1 text-xs text-slate-500">
                              Max{" "}
                              {formatCurrency(
                                promotion.maximumDiscountAmount
                              )}
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-bold text-slate-900">
                            {promotion.usedCount}
                            {usageLimit ? `/${usageLimit}` : ""} used
                          </p>

                          {promotion.perUserUsageLimit && (
                            <p className="mt-1 text-xs text-slate-500">
                              {promotion.perUserUsageLimit}/user
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          {promotion.firstNTickets ? (
                            <>
                              <p className="font-bold text-slate-900">
                                {getUsedTickets(promotion)} used ·{" "}
                                {getReservedTickets(promotion)} reserved
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                First {promotion.firstNTickets} tickets
                              </p>
                            </>
                          ) : (
                            <span className="text-xs font-semibold text-slate-400">
                              Not limited
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4 text-xs font-semibold text-slate-600">
                          <p>{formatEventDate(promotion.validFrom)}</p>
                          <p className="mt-1">
                            to {formatEventDate(promotion.validUntil)}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold capitalize ${
                              status === "active"
                                ? "bg-emerald-100 text-emerald-700"
                                : status === "expired"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {status}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-full bg-orange-50 px-3 py-1.5 text-xs font-bold capitalize text-orange-600">
                            {promotion.visibility || "public"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            {event && (
                              <Link
                                href={`/events/${event._id}`}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-orange-300 hover:text-orange-600"
                                aria-label="View event"
                              >
                                <Eye size={16} />
                              </Link>
                            )}

                            <Link
                              href={`/organizer/coupons/${promotion._id}/edit`}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-orange-300 hover:text-orange-600"
                              aria-label={`Edit ${getPromotionName(promotion)}`}
                            >
                              <Pencil size={16} />
                            </Link>

                            <button
                              type="button"
                              onClick={() => handleStatusToggle(promotion)}
                              disabled={actionLoading}
                              className={`inline-flex min-w-28 items-center justify-center rounded-xl px-3 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                status === "active"
                                  ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                  : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                              }`}
                            >
                              {actionLoading ? (
                                <LoaderCircle
                                  size={15}
                                  className="animate-spin"
                                />
                              ) : status === "active" ? (
                                "Deactivate"
                              ) : (
                                "Activate"
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(promotion)}
                              disabled={actionLoading}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-500 transition hover:border-red-200 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                              aria-label={`Delete ${getPromotionName(promotion)}`}
                            >
                              {actionLoading ? (
                                <LoaderCircle
                                  size={16}
                                  className="animate-spin"
                                />
                              ) : (
                                <Trash2 size={16} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {pagination && (
          <Pagination
            pagination={pagination}
            resultLabel="promotions"
            className="mt-8"
            scrollTargetId={paginationTargetId}
          />
        )}
      </div>
    </main>
  );
}

export default function OrganizerCouponsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#fffaf5] px-4 pb-16 pt-6 sm:px-6">
          <div className="mx-auto flex min-h-80 max-w-7xl items-center justify-center rounded-[24px] border border-orange-100 bg-white shadow-sm">
            <Loader text="Loading promotions..." />
          </div>
        </main>
      }
    >
      <OrganizerPromotionsContent />
    </Suspense>
  );
}
