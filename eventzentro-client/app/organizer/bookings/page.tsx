"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { toast } from "sonner";
import {
  BadgePercent,
  CalendarDays,
  CircleDollarSign,
  IndianRupee,
  Search,
  Ticket,
  Users,
  X,
} from "lucide-react";

import Pagination from "@/components/common/Pagination";
import { getOrganizerBookings } from "@/services/booking.service";
import type { User } from "@/types/auth";
import type { Booking } from "@/types/booking";
import type { Event } from "@/types/event";
import type { PaginationMetadata } from "@/types/pagination";
import {
  formatBookingDate,
  getBookingEvent,
} from "@/utils/booking";
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

const getBookingUser = (
  booking: Booking
): User | null => {
  if (
    !booking.user ||
    typeof booking.user === "string"
  ) {
    return null;
  }

  return booking.user;
};

const getAmountPaid = (
  booking: Booking
) => {
  return Number(
    booking.amountPaid ??
      booking.finalAmount ??
      booking.totalAmount ??
      0
  );
};

const getAdminCommissionAmount = (
  booking: Booking
) => {
  return Number(
    booking.adminCommissionAmount ?? 0
  );
};

const getOrganizerEarnings = (
  booking: Booking
) => {
  if (
    typeof booking.organizerEarnings ===
    "number"
  ) {
    return booking.organizerEarnings;
  }

  return Math.max(
    getAmountPaid(booking) -
      getAdminCommissionAmount(booking),
    0
  );
};

const getAdminCommissionRate = (
  booking: Booking
) => {
  if (
    typeof booking.adminCommissionRate ===
    "number"
  ) {
    return booking.adminCommissionRate;
  }

  const amountPaid =
    getAmountPaid(booking);

  const commission =
    getAdminCommissionAmount(booking);

  if (amountPaid <= 0 || commission <= 0) {
    return 0;
  }

  return Number(
    (
      (commission / amountPaid) *
      100
    ).toFixed(2)
  );
};

const statusStyles: Record<
  string,
  string
> = {
  confirmed:
    "bg-emerald-100 text-emerald-700",
  pending:
    "bg-amber-100 text-amber-700",
  cancelled:
    "bg-red-100 text-red-700",
};

const paymentStatusStyles: Record<
  string,
  string
> = {
  paid: "text-emerald-600",
  pending: "text-amber-600",
  verifying: "text-sky-600",
  unpaid: "text-slate-500",
  failed: "text-red-600",
  refunded: "text-purple-600",
};

const statusOptions = [
  {
    label: "All",
    value: "all",
  },
  {
    label: "Confirmed",
    value: "confirmed",
  },
  {
    label: "Pending",
    value: "pending",
  },
  {
    label: "Cancelled",
    value: "cancelled",
  },
];

const paginationTargetId =
  "organizer-bookings-results";

function OrganizerBookingsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const resultsRef =
    useRef<HTMLDivElement>(null);

  const currentPage =
    getPageFromSearchParams(
      searchParams
    );

  const previousPageRef =
    useRef(currentPage);

  const search =
    searchParams.get("search") || "";

  const selectedStatus =
    searchParams.get("status") || "all";

  const [bookings, setBookings] =
    useState<Booking[]>([]);

  const [
    summaryBookings,
    setSummaryBookings,
  ] = useState<Booking[]>([]);

  const [pagination, setPagination] =
    useState<PaginationMetadata | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [
    summaryLoading,
    setSummaryLoading,
  ] = useState(true);

  const [error, setError] =
    useState("");

  const requestParams = useMemo(
    () => ({
      page: currentPage,
      limit: DEFAULT_PAGE_SIZE,
      search:
        search || undefined,
      status:
        selectedStatus !== "all"
          ? selectedStatus
          : undefined,
      sort: "newest",
    }),
    [
      currentPage,
      search,
      selectedStatus,
    ]
  );

  useEffect(() => {
    let isActive = true;

    const fetchBookings =
      async () => {
        try {
          setLoading(true);
          setError("");

          const response =
            await getOrganizerBookings(
              requestParams
            );

          if (!isActive) {
            return;
          }

          setBookings(
            response.data ||
              response.bookings ||
              []
          );

          setPagination(
            response.pagination
          );
        } catch {
          if (!isActive) {
            return;
          }

          setError(
            "Failed to load bookings."
          );

          setBookings([]);
          setPagination(null);

          toast.error(
            "Failed to load bookings."
          );
        } finally {
          if (isActive) {
            setLoading(false);
          }
        }
      };

    fetchBookings();

    return () => {
      isActive = false;
    };
  }, [requestParams]);

  useEffect(() => {
    let isActive = true;

    const fetchSummaryBookings =
      async () => {
        try {
          setSummaryLoading(true);

          const response =
            await getOrganizerBookings({
              page: 1,
              limit: SUMMARY_PAGE_SIZE,
              sort: "newest",
            });

          if (!isActive) {
            return;
          }

          setSummaryBookings(
            response.data ||
              response.bookings ||
              []
          );
        } catch {
          if (!isActive) {
            return;
          }

          setSummaryBookings([]);
        } finally {
          if (isActive) {
            setSummaryLoading(false);
          }
        }
      };

    fetchSummaryBookings();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (
      previousPageRef.current !==
      currentPage
    ) {
      resultsRef.current?.scrollIntoView(
        {
          behavior: "smooth",
          block: "start",
        }
      );
    }

    previousPageRef.current =
      currentPage;
  }, [currentPage]);

  const paidBookings = useMemo(
    () =>
      summaryBookings.filter(
        (booking) =>
          booking.status ===
            "confirmed" &&
          booking.paymentStatus ===
            "paid"
      ),
    [summaryBookings]
  );

  const totalBookings =
    paidBookings.length;

  const totalTicketsSold =
    paidBookings.reduce(
      (total, booking) =>
        total +
        (booking.ticketCount ??
          booking.quantity),
      0
    );

  const totalGrossRevenue =
    paidBookings.reduce(
      (total, booking) =>
        total +
        getAmountPaid(booking),
      0
    );

  const totalAdminCommission =
    paidBookings.reduce(
      (total, booking) =>
        total +
        getAdminCommissionAmount(
          booking
        ),
      0
    );

  const totalOrganizerEarnings =
    paidBookings.reduce(
      (total, booking) =>
        total +
        getOrganizerEarnings(
          booking
        ),
      0
    );

  const statsLoading =
    loading || summaryLoading;

  const stats = [
    {
      title: "Paid Bookings",
      value:
        totalBookings.toString(),
      description:
        "Successfully paid bookings",
      icon: Users,
      iconClassName:
        "bg-orange-100 text-orange-600",
      cardClassName:
        "border-orange-100 from-orange-50 to-white",
    },
    {
      title: "Tickets Sold",
      value:
        totalTicketsSold.toString(),
      description:
        "Tickets from paid bookings",
      icon: Ticket,
      iconClassName:
        "bg-yellow-100 text-yellow-600",
      cardClassName:
        "border-yellow-100 from-yellow-50 to-white",
    },
    {
      title: "Gross Revenue",
      value: formatCurrency(
        totalGrossRevenue
      ),
      description:
        "Total amount paid by customers",
      icon: CircleDollarSign,
      iconClassName:
        "bg-emerald-100 text-emerald-600",
      cardClassName:
        "border-emerald-100 from-emerald-50 to-white",
    },
    {
      title: "Commission",
      value: formatCurrency(
        totalAdminCommission
      ),
      description:
        "Platform commission deducted",
      icon: BadgePercent,
      iconClassName:
        "bg-purple-100 text-purple-600",
      cardClassName:
        "border-purple-100 from-purple-50 to-white",
    },
    {
      title: "Net Earnings",
      value: formatCurrency(
        totalOrganizerEarnings
      ),
      description:
        "Organizer earnings after commission",
      icon: IndianRupee,
      iconClassName:
        "bg-teal-100 text-teal-600",
      cardClassName:
        "border-teal-100 from-teal-50 to-white",
    },
  ];

  const updateFilters = (
    updates: Record<
      string,
      string | undefined
    >
  ) => {
    router.replace(
      createUrlWithQueryParams(
        pathname,
        searchParams,
        updates,
        true
      ),
      {
        scroll: false,
      }
    );
  };

  const clearFilters = () => {
    updateFilters({
      search: undefined,
      status: undefined,
    });
  };

  const hasFilterResults =
    Boolean(
      search ||
        selectedStatus !== "all"
    );

  return (
    <main className="min-h-screen bg-[#fffaf5] px-4 pb-16 pt-6 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <section className="relative overflow-hidden rounded-[30px] border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-rose-50 px-6 py-8 shadow-sm sm:px-8">
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-orange-200/40 blur-[110px]" />

          <div className="absolute -bottom-28 right-0 h-72 w-72 rounded-full bg-rose-200/40 blur-[110px]" />

          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-600">
              Ticket Management
            </p>

            <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Bookings
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Review customer bookings,
              ticket sales, platform
              commission and your final
              earnings across all events.
            </p>
          </div>
        </section>

        <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <article
                key={stat.title}
                className={`rounded-[22px] border bg-gradient-to-br p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${stat.cardClassName}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">
                      {stat.title}
                    </p>

                    <p className="mt-2 break-words text-2xl font-black text-slate-900">
                      {statsLoading
                        ? "..."
                        : stat.value}
                    </p>

                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      {
                        stat.description
                      }
                    </p>
                  </div>

                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${stat.iconClassName}`}
                  >
                    <Icon size={21} />
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {error}
          </div>
        )}

        <section className="mt-7">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="flex flex-1 items-center gap-3 rounded-xl border-2 border-slate-200 bg-white px-4 shadow-sm transition focus-within:border-orange-400 focus-within:ring-4 focus-within:ring-orange-100">
              <Search
                size={18}
                className="shrink-0 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  updateFilters({
                    search:
                      event.target.value,
                  })
                }
                placeholder="Search booking code, customer or event"
                className="w-full bg-transparent py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />

              {search && (
                <button
                  type="button"
                  onClick={() =>
                    updateFilters({
                      search: undefined,
                    })
                  }
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-orange-50 hover:text-orange-600"
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="flex gap-2 overflow-x-auto">
              {statusOptions.map(
                (option) => (
                  <button
                    key={
                      option.value
                    }
                    type="button"
                    onClick={() =>
                      updateFilters({
                        status:
                          option.value ===
                          "all"
                            ? undefined
                            : option.value,
                      })
                    }
                    className={`shrink-0 rounded-xl px-4 py-3 text-sm font-bold transition ${
                      selectedStatus ===
                      option.value
                        ? "bg-slate-900 text-white shadow-sm"
                        : "border-2 border-slate-200 bg-white text-slate-600 hover:border-orange-300 hover:text-orange-600"
                    }`}
                  >
                    {option.label}
                  </button>
                )
              )}
            </div>
          </div>
        </section>

        <div
          id={paginationTargetId}
          ref={resultsRef}
        />

        <section className="mt-6 overflow-hidden rounded-[24px] border border-orange-100 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-4 border-b border-orange-100 px-5 py-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-500">
                Customer activity
              </p>

              <h2 className="mt-1 text-xl font-black text-slate-900">
                Booking Activity
              </h2>
            </div>

            {hasFilterResults && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-2 rounded-lg bg-orange-50 px-3 py-2 text-xs font-bold text-orange-600 transition hover:bg-orange-100"
              >
                <X size={15} />
                Clear
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex min-h-60 items-center justify-center">
              <div className="text-center">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-orange-100 border-t-orange-500" />

                <p className="mt-4 text-sm font-medium text-slate-500">
                  Loading bookings...
                </p>
              </div>
            </div>
          ) : bookings.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                <Ticket size={28} />
              </div>

              <h3 className="mt-5 text-xl font-black text-slate-900">
                {!hasFilterResults
                  ? "No bookings yet"
                  : "No matching bookings found"}
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                {!hasFilterResults
                  ? "Customer bookings will appear here."
                  : "Try changing your search or status filter."}
              </p>

              {hasFilterResults && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-5 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-600"
                >
                  Clear search and
                  filters
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1280px] text-left text-sm">
                <thead className="bg-orange-50/70 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4">
                      Booking
                    </th>

                    <th className="px-5 py-4">
                      Customer
                    </th>

                    <th className="px-5 py-4">
                      Event
                    </th>

                    <th className="px-5 py-4">
                      Tickets
                    </th>

                    <th className="px-5 py-4">
                      Amount Paid
                    </th>

                    <th className="px-5 py-4">
                      Commission
                    </th>

                    <th className="px-5 py-4">
                      Net Earnings
                    </th>

                    <th className="px-5 py-4">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-orange-50">
                  {bookings.map(
                    (booking) => {
                      const event =
                        getBookingEvent(
                          booking
                        ) as Event | null;

                      const customer =
                        getBookingUser(
                          booking
                        );

                      const customerName =
                        [
                          customer?.firstName,
                          customer?.lastName,
                        ]
                          .filter(Boolean)
                          .join(" ") ||
                        customer?.email ||
                        "Customer";

                      const status =
                        booking.status?.toLowerCase() ||
                        "confirmed";

                      const paymentStatus =
                        booking.paymentStatus ||
                        "unpaid";

                      const amountPaid =
                        getAmountPaid(
                          booking
                        );

                      const commission =
                        getAdminCommissionAmount(
                          booking
                        );

                      const commissionRate =
                        getAdminCommissionRate(
                          booking
                        );

                      const organizerEarnings =
                        getOrganizerEarnings(
                          booking
                        );

                      return (
                        <tr
                          key={booking._id}
                          className="text-slate-700 transition hover:bg-orange-50/40"
                        >
                          <td className="px-5 py-4">
                            <p className="font-bold text-slate-900">
                              {
                                booking.bookingCode
                              }
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {formatBookingDate(
                                booking.createdAt
                              )}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 font-bold text-orange-600">
                                {customerName
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div>
                                <p className="font-semibold text-slate-900">
                                  {
                                    customerName
                                  }
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                  {customer?.email ||
                                    "No email"}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <p className="max-w-52 truncate font-semibold text-slate-900">
                              {event?.title ||
                                "Event"}
                            </p>

                            <p className="mt-1 max-w-52 truncate text-xs text-slate-500">
                              {event
                                ? formatEventDate(
                                    event.eventDate
                                  )
                                : "Date unavailable"}
                            </p>

                            <p className="mt-1 max-w-52 truncate text-xs text-slate-500">
                              {event?.venue ||
                                "Venue unavailable"}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <span className="inline-flex items-center gap-2 font-bold text-slate-900">
                              <Ticket
                                size={16}
                                className="text-orange-500"
                              />

                              {booking.ticketCount ??
                                booking.quantity}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <p className="font-bold text-slate-900">
                              {amountPaid ===
                              0
                                ? "Free"
                                : formatCurrency(
                                    amountPaid
                                  )}
                            </p>

                            <p
                              className={`mt-1 text-xs font-semibold capitalize ${
                                paymentStatusStyles[
                                  paymentStatus
                                ] ||
                                "text-slate-500"
                              }`}
                            >
                              {
                                paymentStatus
                              }
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <p className="font-bold text-purple-700">
                              {commission ===
                              0
                                ? formatCurrency(
                                    0
                                  )
                                : formatCurrency(
                                    commission
                                  )}
                            </p>

                            <p className="mt-1 text-xs font-semibold text-slate-500">
                              {
                                commissionRate
                              }
                              % rate
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <p className="font-black text-emerald-700">
                              {organizerEarnings ===
                              0
                                ? formatCurrency(
                                    0
                                  )
                                : formatCurrency(
                                    organizerEarnings
                                  )}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              After commission
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`rounded-full px-3 py-1.5 text-xs font-bold capitalize ${
                                statusStyles[
                                  status
                                ] ||
                                statusStyles.confirmed
                              }`}
                            >
                              {
                                booking.status
                              }
                            </span>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {pagination && (
          <Pagination
            pagination={pagination}
            resultLabel="bookings"
            className="mt-8"
            scrollTargetId={
              paginationTargetId
            }
          />
        )}
      </div>
    </main>
  );
}

export default function OrganizerBookingsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#fffaf5] px-4 pb-16 pt-6 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="mt-6 flex min-h-60 items-center justify-center rounded-[24px] border border-orange-100 bg-white shadow-sm">
              <div className="text-center">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-orange-100 border-t-orange-500" />

                <p className="mt-4 text-sm font-medium text-slate-500">
                  Loading bookings...
                </p>
              </div>
            </div>
          </div>
        </main>
      }
    >
      <OrganizerBookingsContent />
    </Suspense>
  );
}