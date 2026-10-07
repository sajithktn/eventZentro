"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowUpRight,
  CalendarDays,
  Hash,
  IndianRupee,
  MapPin,
  Sparkles,
  Ticket,
} from "lucide-react";
import { toast } from "sonner";
import UserRoute from "@/features/auth/components/UserRoute";
import Pagination from "@/components/ui/Pagination";
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
  const [pagination, setPagination] = useState<PaginationMetadata | null>(null);
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

    void fetchBookings();

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
    <main className="flex min-h-[calc(100vh-72px)] w-full flex-col justify-between overflow-hidden bg-[#08070d] text-white">
      <div>
        {/* Top Hero Banner matching homepage aesthetics */}
        <section className="relative isolate overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_top_left,#5b21b6_0%,transparent_36%),radial-gradient(circle_at_80%_20%,#be123c_0%,transparent_30%),linear-gradient(135deg,#08070d_0%,#110d1e_48%,#08070d_100%)]">
          <div className="pointer-events-none absolute -left-32 top-10 h-96 w-96 rounded-full bg-purple-600/20 blur-[100px]" />
          <div className="pointer-events-none absolute right-0 top-0 h-[400px] w-[400px] rounded-full bg-pink-500/20 blur-[120px]" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,.4)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.4)_1px,transparent_1px)] [background-size:70px_70px]" />

          <div className="relative mx-auto flex w-full max-w-[1600px] flex-col justify-between gap-6 px-4 py-12 sm:px-6 md:flex-row md:items-center lg:px-8">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-pink-400 backdrop-blur-xl">
                <Ticket size={14} className="text-pink-400" />
                Confirmed Bookings
              </div>

              <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">
                My{" "}
                <span className="bg-gradient-to-r from-pink-400 via-rose-300 to-orange-300 bg-clip-text text-transparent">
                  Tickets
                </span>
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-white/60 sm:text-base">
                View your confirmed bookings, access venue details, and track your upcoming event passes in one place.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.08] px-5 py-3 text-sm font-semibold text-white/90 backdrop-blur-xl transition hover:bg-white/15 hover:text-white"
              >
                <Sparkles size={16} className="text-pink-400" />
                Dashboard
                <ArrowUpRight size={16} />
              </Link>

              <Link
                href="/events"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-pink-500/25 transition hover:scale-[1.02]"
              >
                Browse Events
                <ArrowUpRight size={16} />
              </Link>
            </div>
          </div>
        </section>

        {/* Results Section */}
        <section className="relative mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
          <div id={paginationTargetId} ref={resultsRef} />

          {error && (
            <div className="mb-8 rounded-3xl border border-red-500/20 bg-red-950/30 p-6 text-center text-sm font-semibold text-red-300">
              {error}
            </div>
          )}

          {loading ? (
            <div className="mt-8 flex min-h-72 items-center justify-center rounded-3xl border border-white/10 bg-[#120f1c] p-12 text-center">
              <div>
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-pink-500/20 border-t-pink-500" />
                <p className="mt-4 text-sm font-semibold text-white/60">
                  Loading your tickets...
                </p>
              </div>
            </div>
          ) : bookings.length === 0 ? (
            <div className="mt-8 rounded-3xl border border-white/10 bg-[#120f1c] px-6 py-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-pink-400">
                <Ticket size={32} />
              </div>

              <h2 className="mt-5 text-2xl font-black text-white">
                No tickets booked yet
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm text-white/50">
                Explore upcoming concerts, workshops, and festivals to book your first experience. Your passes will show up here.
              </p>

              <Link
                href="/events"
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-pink-500/25 transition hover:scale-[1.02]"
              >
                Browse Events
                <ArrowUpRight size={17} />
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6 flex items-center justify-between text-sm text-white/60">
                <p>
                  Showing <span className="font-bold text-white">{bookings.length}</span> booking
                  {bookings.length === 1 ? "" : "s"}
                  {pagination?.totalItems ? ` of ${pagination.totalItems}` : ""}
                </p>
              </div>

              <div className="grid gap-6">
                {bookings.map((booking) => {
                  const event = getBookingEvent(booking);
                  const status = booking.status?.toLowerCase();

                  const statusClasses =
                    status === "confirmed"
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                      : status === "cancelled"
                        ? "bg-red-500/15 text-red-400 border border-red-500/30"
                        : "bg-amber-500/15 text-amber-400 border border-amber-500/30";

                  return (
                    <article
                      key={booking._id}
                      className="group relative overflow-hidden rounded-3xl border border-white/10 bg-[#110e1c] shadow-2xl transition duration-300 hover:border-pink-500/30 hover:shadow-pink-500/10"
                    >
                      <div className="grid lg:grid-cols-[280px_1fr_260px] xl:grid-cols-[320px_1fr_280px]">
                        {/* Event Banner Image */}
                        <div className="relative min-h-60 overflow-hidden bg-black/40 lg:min-h-full">
                          <img
                            src={event?.bannerImage || fallbackEventImage}
                            alt={event?.title || "Event"}
                            className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#110e1c] via-black/25 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-[#110e1c]" />

                          <div className="absolute bottom-4 left-4 z-10">
                            <span className="inline-flex rounded-full border border-white/20 bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
                              {event?.category || "Event"}
                            </span>
                          </div>
                        </div>

                        {/* Booking Details */}
                        <div className="flex min-w-0 flex-col justify-between p-6 sm:p-7">
                          <div>
                            <div className="flex flex-wrap items-center gap-3">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold capitalize ${statusClasses}`}
                              >
                                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                {booking.status}
                              </span>

                              <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-mono font-medium text-white/70">
                                <Hash size={13} className="text-pink-400" />
                                {booking.bookingCode}
                              </span>
                            </div>

                            <h2 className="mt-3 line-clamp-2 text-2xl font-black tracking-tight text-white transition group-hover:text-pink-200 sm:text-3xl">
                              {event?.title || "Event Booking"}
                            </h2>

                            <div className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
                              {event && (
                                <>
                                  <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-3">
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                                      <CalendarDays size={18} />
                                    </span>
                                    <div className="min-w-0">
                                      <p className="text-xs text-white/40">Event Date</p>
                                      <p className="truncate font-semibold text-white">
                                        {formatEventDate(event.eventDate)}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-3">
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400">
                                      <MapPin size={18} />
                                    </span>
                                    <div className="min-w-0">
                                      <p className="text-xs text-white/40">Venue</p>
                                      <p className="truncate font-semibold text-white">
                                        {event.venue}
                                      </p>
                                    </div>
                                  </div>
                                </>
                              )}

                              <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-3">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                                  <Ticket size={18} />
                                </span>
                                <div className="min-w-0">
                                  <p className="text-xs text-white/40">Passes</p>
                                  <p className="truncate font-semibold text-white">
                                    {booking.quantity} {booking.quantity === 1 ? "ticket" : "tickets"}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-3">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                                  <IndianRupee size={18} />
                                </span>
                                <div className="min-w-0">
                                  <p className="text-xs text-white/40">Total Amount</p>
                                  <p className="truncate font-semibold text-white">
                                    {booking.totalAmount === 0
                                      ? "Free"
                                      : formatCurrency(booking.totalAmount)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Ticket Stub Area */}
                        <div className="relative flex flex-col justify-between border-t border-dashed border-white/10 bg-white/[0.02] p-6 lg:border-l lg:border-t-0">
                          {/* Ticket notch cutouts */}
                          <span className="absolute -left-3 -top-3 hidden h-6 w-6 rounded-full border border-white/10 bg-[#08070d] lg:block" />
                          <span className="absolute -bottom-3 -left-3 hidden h-6 w-6 rounded-full border border-white/10 bg-[#08070d] lg:block" />

                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-pink-400">
                              Booked On
                            </p>
                            <p className="mt-1 font-bold text-white">
                              {formatBookingDate(booking.createdAt)}
                            </p>
                          </div>

                          {event && (
                            <Link
                              href={`/events/${event._id}`}
                              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-gradient-to-r hover:from-pink-500 hover:to-rose-500 hover:shadow-lg hover:shadow-pink-500/25"
                            >
                              View Event
                              <ArrowUpRight size={17} />
                            </Link>
                          )}
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
                  variant="dark"
                  className="mt-10"
                  scrollTargetId={paginationTargetId}
                />
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}

export default function MyTicketsPage() {
  return (
    <UserRoute>
      <Suspense
        fallback={
          <main className="min-h-[calc(100vh-72px)] w-full bg-[#08070d] px-4 py-16 text-white">
            <div className="mx-auto max-w-[1600px] text-center">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-pink-500/20 border-t-pink-500" />
              <p className="mt-4 text-sm font-medium text-white/50">
                Loading your tickets...
              </p>
            </div>
          </main>
        }
      >
        <MyTicketsContent />
      </Suspense>
    </UserRoute>
  );
}
