"use client";

import {
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowUpRight,
  CalendarDays,
  Hash,
  IndianRupee,
  MapPin,
  Ticket,
} from "lucide-react";
import { toast } from "sonner";
import UserRoute from "@/components/auth/UserRoute";
import Pagination from "@/components/common/Pagination";
import { getMyBookings } from "@/services/booking.service";
import type { Booking } from "@/types/booking";
import type { PaginationMetadata } from "@/types/pagination";
import {
  formatBookingDate,
  getBookingEvent,
} from "@/utils/booking";
import {
  fallbackEventImage,
  formatCurrency,
  formatEventDate,
} from "@/utils/event";
import {
  DEFAULT_PAGE_SIZE,
  getPageFromSearchParams,
} from "@/utils/pagination";

const paginationTargetId = "my-tickets-results";

function MyTicketsContent() {
  const searchParams = useSearchParams();
  const resultsRef = useRef<HTMLDivElement>(null);
  const currentPage = getPageFromSearchParams(searchParams);
  const previousPageRef = useRef(currentPage);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pagination, setPagination] =
    useState<PaginationMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    const fetchBookings = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getMyBookings({
          page: currentPage,
          limit: DEFAULT_PAGE_SIZE,
        });

        if (!isActive) {
          return;
        }

        setBookings(response.data || response.bookings || []);
        setPagination(response.pagination);
      } catch {
        if (!isActive) {
          return;
        }

        setError("Failed to load your tickets.");
        setBookings([]);
        setPagination(null);
        toast.error("Failed to load your tickets.");
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
  }, [currentPage]);

  useEffect(() => {
    if (previousPageRef.current !== currentPage) {
      resultsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }

    previousPageRef.current = currentPage;
  }, [currentPage]);

  return (
    <main className="min-h-screen bg-[#fffaf5] px-4 pb-16 pt-6 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <section className="relative overflow-hidden rounded-[30px] border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-rose-50 px-6 py-8 shadow-sm sm:px-8">
          <div className="absolute -left-20 -top-20 h-56 w-56 rounded-full bg-orange-200/40 blur-[90px]" />
          <div className="absolute -bottom-24 right-0 h-64 w-64 rounded-full bg-rose-200/40 blur-[100px]" />

            <div className="relative z-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-orange-600 shadow-sm">
                <Ticket size={15} />
                Your bookings
              </div>

              <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                My Tickets
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
                View your confirmed bookings and access all your event
                details in one place.
              </p>
            </div>

            <Link
              href="/dashboard"
              className="relative z-10 inline-flex w-fit shrink-0 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-200 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-300"
           >
               User Dashboard
              <ArrowUpRight size={17} />
            </Link>
          </div>
        </section>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-600">
            {error}
          </div>
        )}

        <div id={paginationTargetId} ref={resultsRef} />

        {loading ? (
          <div className="mt-8 flex min-h-64 items-center justify-center rounded-[26px] border border-orange-100 bg-white shadow-sm">
            <div className="text-center">
              <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-orange-100 border-t-orange-500" />

              <p className="mt-4 text-sm font-medium text-slate-500">
                Loading your tickets...
              </p>
            </div>
          </div>
        ) : bookings.length === 0 ? (
          <div className="mt-8 rounded-[30px] border border-orange-100 bg-white px-6 py-14 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
              <Ticket size={30} />
            </div>

            <h2 className="mt-5 text-2xl font-black text-slate-900">
              No tickets booked yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Explore upcoming events and book your first ticket. Your
              confirmed bookings will appear here.
            </p>

            <Link
              href="/events"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 px-6 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-orange-200"
            >
              Browse events
              <ArrowUpRight size={17} />
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-8 grid gap-6">
              {bookings.map((booking) => {
              const event = getBookingEvent(booking);
              const status = booking.status?.toLowerCase();

              const statusClasses =
                status === "confirmed"
                  ? "bg-emerald-100 text-emerald-700"
                  : status === "cancelled"
                    ? "bg-red-100 text-red-600"
                    : "bg-yellow-100 text-yellow-700";

                return (
                  <article
                    key={booking._id}
                    className="group overflow-hidden rounded-[28px] border border-orange-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-100/60"
                  >
                  <div className="grid lg:grid-cols-[260px_1fr_230px]">
                    <div className="relative min-h-56 overflow-hidden">
                      <img
                        src={
                          event?.bannerImage ||
                          fallbackEventImage
                        }
                        alt={event?.title || "Event"}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

                      <div className="absolute bottom-4 left-4">
                        <span className="inline-flex rounded-full border border-white/30 bg-black/30 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
                          {event?.category || "Event"}
                        </span>
                      </div>
                    </div>

                    <div className="min-w-0 p-6">
                      <div className="flex flex-wrap items-center gap-3">
                        <span
                          className={`rounded-full px-3 py-1.5 text-xs font-bold capitalize ${statusClasses}`}
                        >
                          {booking.status}
                        </span>

                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                          <Hash size={14} />
                          {booking.bookingCode}
                        </span>
                      </div>

                      <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-900">
                        {event?.title || "Event"}
                      </h2>

                      <div className="mt-5 grid gap-4 text-sm text-slate-600 sm:grid-cols-2">
                        {event && (
                          <>
                            <div className="flex items-center gap-3">
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                                <CalendarDays size={18} />
                              </span>

                              <div>
                                <p className="text-xs text-slate-400">
                                  Event date
                                </p>

                                <p className="font-semibold text-slate-700">
                                  {formatEventDate(
                                    event.eventDate
                                  )}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                                <MapPin size={18} />
                              </span>

                              <div className="min-w-0">
                                <p className="text-xs text-slate-400">
                                  Venue
                                </p>

                                <p className="line-clamp-1 font-semibold text-slate-700">
                                  {event.venue}
                                </p>
                              </div>
                            </div>
                          </>
                        )}

                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-100 text-yellow-600">
                            <Ticket size={18} />
                          </span>

                          <div>
                            <p className="text-xs text-slate-400">
                              Ticket quantity
                            </p>

                            <p className="font-semibold text-slate-700">
                              {booking.quantity}{" "}
                              {booking.quantity === 1
                                ? "ticket"
                                : "tickets"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                            <IndianRupee size={18} />
                          </span>

                          <div>
                            <p className="text-xs text-slate-400">
                              Total amount
                            </p>

                            <p className="font-semibold text-slate-700">
                              {booking.totalAmount === 0
                                ? "Free"
                                : formatCurrency(
                                    booking.totalAmount
                                  )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="relative border-t border-dashed border-orange-200 bg-gradient-to-br from-orange-50 to-rose-50 p-6 lg:border-l lg:border-t-0">
                      <span className="absolute -left-3 -top-3 hidden h-6 w-6 rounded-full bg-[#fffaf5] lg:block" />
                      <span className="absolute -bottom-3 -left-3 hidden h-6 w-6 rounded-full bg-[#fffaf5] lg:block" />

                      <div className="flex h-full flex-col justify-between">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-500">
                            Booked on
                          </p>

                          <p className="mt-2 font-bold text-slate-900">
                            {formatBookingDate(
                              booking.createdAt
                            )}
                          </p>
                        </div>

                        {event && (
                          <Link
                            href={`/events/${event._id}`}
                            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-orange-600"
                          >
                            View event
                            <ArrowUpRight size={17} />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                  </article>
                );
              })}
            </div>

            {pagination && (
              <Pagination
                pagination={pagination}
                resultLabel="tickets"
                className="mt-8"
                scrollTargetId={paginationTargetId}
              />
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default function MyTicketsPage() {
  return (
    <UserRoute>
      <Suspense
        fallback={
          <main className="min-h-screen bg-[#fffaf5] px-4 pb-16 pt-6 sm:px-6">
            <div className="mx-auto max-w-6xl">
              <div className="mt-8 flex min-h-64 items-center justify-center rounded-[26px] border border-orange-100 bg-white shadow-sm">
                <div className="text-center">
                  <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-orange-100 border-t-orange-500" />

                  <p className="mt-4 text-sm font-medium text-slate-500">
                    Loading your tickets...
                  </p>
                </div>
              </div>
            </div>
          </main>
        }
      >
        <MyTicketsContent />
      </Suspense>
    </UserRoute>
  );
}
