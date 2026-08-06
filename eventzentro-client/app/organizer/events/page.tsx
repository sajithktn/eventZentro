"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowRight,
  BadgePercent,
  CalendarDays,
  CalendarPlus,
  Eye,
  IndianRupee,
  MapPin,
  Pencil,
  Search,
  Ticket,
  X,
} from "lucide-react";
import Pagination from "@/components/common/Pagination";
import { useAppSelector } from "@/redux/hooks";
import {
  getOrganizerDashboard,
  getOrganizerEvents,
} from "@/services/event.service";
import type {
  Event,
  OrganizerDashboardStatistics,
} from "@/types/event";
import type { PaginationMetadata } from "@/types/pagination";
import {
  fallbackEventImage,
  formatCurrency,
  formatEventDate,
  getTicketsSold,
} from "@/utils/event";
import {
  createUrlWithQueryParams,
  DEFAULT_PAGE_SIZE,
  getPageFromSearchParams,
  SUMMARY_PAGE_SIZE,
} from "@/utils/pagination";

const statusStyles: Record<string, string> = {
  draft: "bg-amber-100 text-amber-700",
  published: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
  completed: "bg-slate-100 text-slate-600",
};

const statusOptions = [
  { label: "All", value: "all" },
  { label: "Published", value: "published" },
  { label: "Draft", value: "draft" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Completed", value: "completed" },
];

const paginationTargetId = "organizer-events-results";

const emptyStatistics: OrganizerDashboardStatistics = {
  totalEvents: 0,
  publishedEvents: 0,
  draftEvents: 0,
  cancelledEvents: 0,
  completedEvents: 0,
  totalTicketsSold: 0,
  totalBookings: 0,
  totalRevenue: 0,
  totalGrossRevenue: 0,
  totalAdminCommission: 0,
  totalOrganizerEarnings: 0,
};

function MyEventsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const resultsRef = useRef<HTMLDivElement>(null);
  const previousPageRef = useRef(1);
  const user = useAppSelector((state) => state.auth.user);

  const currentPage = getPageFromSearchParams(searchParams);
  const search = searchParams.get("search") || "";
  const selectedStatus =
    searchParams.get("status") || "all";

  const [events, setEvents] = useState<Event[]>([]);
  const [summaryEvents, setSummaryEvents] = useState<
    Event[]
  >([]);
  const [statistics, setStatistics] =
    useState<OrganizerDashboardStatistics>(
      emptyStatistics
    );
  const [totalOwnedEvents, setTotalOwnedEvents] =
    useState(0);
  const [pagination, setPagination] =
    useState<PaginationMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] =
    useState(false);
  const [error, setError] = useState("");

  const requestParams = useMemo(
    () => ({
      page: currentPage,
      limit: DEFAULT_PAGE_SIZE,
      search: search || undefined,
      status:
        selectedStatus !== "all"
          ? selectedStatus
          : undefined,
      sort: "newest",
    }),
    [currentPage, search, selectedStatus]
  );

  useEffect(() => {
    if (!user) {
      return;
    }

    let isActive = true;

    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getOrganizerEvents(requestParams);

        if (!isActive) {
          return;
        }

        setEvents(response.data || response.events || []);
        setPagination(response.pagination);
      } catch {
        if (!isActive) {
          return;
        }

        setError("Failed to load your events.");
        setEvents([]);
        setPagination(null);
        toast.error("Failed to load your events.");
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    fetchEvents();

    return () => {
      isActive = false;
    };
  }, [requestParams, user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    let isActive = true;

    const fetchSummaryEvents = async () => {
      try {
        setSummaryLoading(true);

        const [eventsResponse, dashboardResponse] =
          await Promise.all([
            getOrganizerEvents({
              page: 1,
              limit: SUMMARY_PAGE_SIZE,
              sort: "newest",
            }),
            getOrganizerDashboard(),
          ]);

        if (!isActive) {
          return;
        }

        setSummaryEvents(
          eventsResponse.data ||
            eventsResponse.events ||
            []
        );
        setStatistics(dashboardResponse.statistics);
        setTotalOwnedEvents(
          dashboardResponse.statistics.totalEvents
        );
      } catch {
        if (!isActive) {
          return;
        }

        setSummaryEvents([]);
        setStatistics(emptyStatistics);
        setTotalOwnedEvents(0);
      } finally {
        if (isActive) {
          setSummaryLoading(false);
        }
      }
    };

    fetchSummaryEvents();

    return () => {
      isActive = false;
    };
  }, [user]);

  useEffect(() => {
    if (previousPageRef.current !== currentPage) {
      resultsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }

    previousPageRef.current = currentPage;
  }, [currentPage]);

  const totalTickets = summaryEvents.reduce((total, event) => {
    return total + (event.totalTickets || 0);
  }, 0);

  const statsLoading = loading || summaryLoading;

  const stats = [
    {
      title: "Total Events",
      value: totalOwnedEvents.toString(),
      description: "Events you have created",
      icon: CalendarDays,
      iconClasses: "bg-orange-100 text-orange-600",
      cardClasses: "border-orange-100 from-orange-50 to-white",
    },
    {
      title: "Published",
      value: statistics.publishedEvents.toString(),
      description: "Events visible to users",
      icon: Eye,
      iconClasses: "bg-red-100 text-red-600",
      cardClasses: "border-red-100 from-red-50 to-white",
    },
    {
      title: "Tickets Sold",
      value: statistics.totalTicketsSold.toString(),
      description: "Tickets booked by users",
      icon: Ticket,
      iconClasses: "bg-yellow-100 text-yellow-600",
      cardClasses: "border-yellow-100 from-yellow-50 to-white",
    },
    {
      title: "Revenue",
      value: formatCurrency(statistics.totalRevenue),
      description: "Revenue from ticket sales",
      icon: IndianRupee,
      iconClasses: "bg-emerald-100 text-emerald-600",
      cardClasses:
        "border-emerald-100 from-emerald-50 to-white",
    },
  ];

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

  const resetFilters = () => {
    updateFilters({
      search: undefined,
      status: undefined,
    });
  };

  const hasFilterResults = Boolean(
    search || selectedStatus !== "all"
  );

  return (
    <main className="min-h-screen bg-[#fffaf5] px-4 pb-16 pt-6 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <section className="relative overflow-hidden rounded-[32px] border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-rose-50 px-6 py-8 shadow-sm sm:px-8">
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-orange-200/40 blur-[110px]" />

          <div className="absolute -bottom-28 right-0 h-72 w-72 rounded-full bg-rose-200/40 blur-[110px]" />

          <div className="relative z-10 flex flex-col justify-between gap-7 lg:flex-row lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-600">
                Event Management
              </p>

              <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                My Events
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
                Manage your created events, monitor ticket sales and
                keep track of event performance.
              </p>
            </div>

            <Link
              href="/organizer/events/create"
              className="inline-flex w-fit shrink-0 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-200 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-300"
            >
              <CalendarPlus size={19} />
              Create Event
            </Link>
          </div>
        </section>

        <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <article
                key={stat.title}
                className={`rounded-[24px] border bg-gradient-to-br p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg ${stat.cardClasses}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">
                      {stat.title}
                    </p>

                    <p className="mt-2 text-3xl font-black tracking-tight text-slate-900">
                      {statsLoading ? "..." : stat.value}
                    </p>

                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      {stat.description}
                    </p>
                  </div>

                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${stat.iconClasses}`}
                  >
                    <Icon size={22} />
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-600">
            {error}
          </div>
        )}

        <section className="mt-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="flex flex-1 items-center gap-3 rounded-2xl border border-orange-100 bg-white px-4 shadow-sm transition focus-within:border-orange-300 focus-within:ring-4 focus-within:ring-orange-100">
              <Search
                size={19}
                className="shrink-0 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  updateFilters({
                    search: event.target.value,
                  })
                }
                placeholder="Search by event name, category or venue"
                className="w-full bg-transparent py-4 text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />

              {search && (
                <button
                  type="button"
                  onClick={() =>
                    updateFilters({ search: undefined })
                  }
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-orange-50 hover:text-orange-600"
                  aria-label="Clear search"
                >
                  <X size={17} />
                </button>
              )}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    updateFilters({
                      status:
                        option.value === "all"
                          ? undefined
                          : option.value,
                    })
                  }
                  className={`shrink-0 rounded-xl px-4 py-3 text-sm font-bold transition ${
                    selectedStatus === option.value
                      ? "bg-slate-900 text-white shadow-md"
                      : "border border-orange-100 bg-white text-slate-600 hover:border-orange-300 hover:text-orange-600"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <div id={paginationTargetId} ref={resultsRef} />

        {loading ? (
          <div className="mt-8 flex min-h-64 items-center justify-center rounded-[28px] border border-orange-100 bg-white shadow-sm">
            <div className="text-center">
              <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-orange-100 border-t-orange-500" />

              <p className="mt-4 text-sm font-medium text-slate-500">
                Loading your events...
              </p>
            </div>
          </div>
        ) : events.length === 0 ? (
          <div className="mt-8 rounded-[30px] border border-orange-100 bg-white px-6 py-14 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
              <CalendarDays size={29} />
            </div>

            <h2 className="mt-5 text-2xl font-black text-slate-900">
              {totalOwnedEvents === 0 && !hasFilterResults
                ? "No events created yet"
                : "No matching events found"}
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              {totalOwnedEvents === 0 && !hasFilterResults
                ? "Create your first event and start accepting ticket bookings."
                : "Try changing your search text or selected status."}
            </p>

            {totalOwnedEvents === 0 && !hasFilterResults ? (
              <Link
                href="/organizer/events/create"
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 px-6 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-orange-200"
              >
                <CalendarPlus size={18} />
                Create your first event
              </Link>
            ) : (
              <button
                type="button"
                onClick={resetFilters}
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-orange-600"
              >
                <X size={18} />
                Clear search and filters
              </button>
            )}
          </div>
        ) : (
          <>
            <section className="mt-8 grid gap-6 xl:grid-cols-2">
              {events.map((event) => {
                const status = event.status || "draft";
                const isCompleted = status === "completed";
                const ticketsSold = getTicketsSold(event);
                const totalEventTickets = event.totalTickets || 0;
                const availableTickets =
                  event.availableTickets ?? 0;

                const eventRevenue =
                  ticketsSold * event.ticketPrice;

                const soldPercent =
                  totalEventTickets > 0
                    ? Math.min(
                        100,
                        Math.round(
                          (ticketsSold / totalEventTickets) * 100
                        )
                      )
                    : 0;

                return (
                  <article
                    key={event._id}
                    className="group overflow-hidden rounded-[28px] border border-orange-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-100"
                  >
                    <div className="relative h-64 overflow-hidden">
                      <img
                        src={
                          event.bannerImage || fallbackEventImage
                        }
                        alt={event.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />

                      <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                        <span
                          className={`rounded-full px-3 py-1.5 text-xs font-bold capitalize ${
                            statusStyles[status] ||
                            statusStyles.draft
                          }`}
                        >
                          {status}
                        </span>

                        <span className="rounded-full border border-white/30 bg-black/30 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
                          {event.category}
                        </span>
                      </div>

                      <div className="absolute bottom-5 left-5 right-5">
                        <h2 className="line-clamp-1 text-2xl font-black text-white">
                          {event.title}
                        </h2>

                        <p className="mt-2 line-clamp-1 text-sm text-white/75">
                          {event.description}
                        </p>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                            <CalendarDays size={18} />
                          </span>

                          <div>
                            <p className="text-xs text-slate-400">
                              Event date
                            </p>

                            <p className="text-sm font-semibold text-slate-700">
                              {formatEventDate(event.eventDate)}
                            </p>
                          </div>
                        </div>

                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                            <MapPin size={18} />
                          </span>

                          <div className="min-w-0">
                            <p className="text-xs text-slate-400">
                              Venue
                            </p>

                            <p className="line-clamp-1 text-sm font-semibold text-slate-700">
                              {event.venue}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 grid grid-cols-3 gap-3 rounded-2xl bg-orange-50/70 p-4 text-center">
                        <div>
                          <p className="text-xs text-slate-500">
                            Tickets sold
                          </p>

                          <p className="mt-1 font-black text-slate-900">
                            {ticketsSold}
                          </p>
                        </div>

                        <div className="border-x border-orange-100">
                          <p className="text-xs text-slate-500">
                            Available
                          </p>

                          <p className="mt-1 font-black text-slate-900">
                            {availableTickets}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">
                            Revenue
                          </p>

                          <p className="mt-1 truncate font-black text-slate-900">
                            {formatCurrency(eventRevenue)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 rounded-2xl border border-orange-100 bg-white p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <p className="flex items-center gap-2 text-sm font-black text-slate-900">
                              <BadgePercent
                                size={17}
                                className="text-orange-500"
                              />
                              Active offers
                            </p>

                            <p className="mt-1 line-clamp-1 text-xs font-semibold text-slate-500">
                              {event.bestPromotion
                                ? event.bestPromotion.displayText
                                : "No active public offer"}
                            </p>
                          </div>

                          {isCompleted ? (
                            <span className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-black text-slate-500">
                              <BadgePercent size={15} />
                              Event completed
                            </span>
                          ) : (
                            <Link
                              href={`/organizer/coupons/create?eventId=${event._id}`}
                              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-orange-50 px-4 py-2.5 text-xs font-black text-orange-600 transition hover:bg-orange-100"
                            >
                              <BadgePercent size={15} />
                              Create discount offer
                            </Link>
                          )}
                        </div>
                      </div>

                      {totalEventTickets > 0 && (
                        <div className="mt-5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-500">
                              Ticket sales
                            </span>

                            <span className="font-bold text-orange-600">
                              {soldPercent}%
                            </span>
                          </div>

                          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-orange-100">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 transition-all duration-700"
                              style={{
                                width: `${soldPercent}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                        <Link
                          href={`/events/${event._id}`}
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-bold text-orange-600 transition hover:bg-orange-100"
                        >
                          <Eye size={17} />
                          View
                        </Link>

                        <Link
                          href={`/organizer/events/${event._id}/edit`}
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-orange-600"
                        >
                          <Pencil size={16} />
                          Edit Event
                        </Link>

                        {!isCompleted && (
                          <Link
                            href={`/organizer/coupons?eventId=${event._id}`}
                            className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 px-4 text-slate-600 transition hover:border-orange-300 hover:text-orange-600"
                            aria-label={`Manage offers for ${event.title}`}
                          >
                            <ArrowRight size={18} />
                          </Link>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>

            {pagination && (
              <Pagination
                pagination={pagination}
                resultLabel="events"
                className="mt-8"
                scrollTargetId={paginationTargetId}
              />
            )}
          </>
        )}

        {!loading && totalOwnedEvents > 0 && totalTickets === 0 && (
          <p className="mt-5 text-center text-sm text-slate-500">
            Ticket totals will update when your events include ticket
            inventory.
          </p>
        )}
      </div>
    </main>
  );
}

export default function MyEventsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#fffaf5] px-4 pb-16 pt-6 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="mt-8 flex min-h-64 items-center justify-center rounded-[28px] border border-orange-100 bg-white shadow-sm">
              <div className="text-center">
                <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-orange-100 border-t-orange-500" />

                <p className="mt-4 text-sm font-medium text-slate-500">
                  Loading your events...
                </p>
              </div>
            </div>
          </div>
        </main>
      }
    >
      <MyEventsContent />
    </Suspense>
  );
}
