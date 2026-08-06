"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  IndianRupee,
  MapPin,
  Search,
  Sparkles,
  Ticket,
  TrendingUp,
} from "lucide-react";
import UserRoute from "@/components/auth/UserRoute";
import { useAppSelector } from "@/redux/hooks";
import { getMyBookings } from "@/services/booking.service";
import { getAllEvents } from "@/services/event.service";
import type { Booking } from "@/types/booking";
import type { Event } from "@/types/event";
import { getBookingEvent } from "@/utils/booking";
import {
  fallbackEventImage,
  formatCurrency,
  formatEventDate,
} from "@/utils/event";
import { SUMMARY_PAGE_SIZE } from "@/utils/pagination";

function UserDashboardContent() {
  const user = useAppSelector((state) => state.auth.user);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const [bookingResponse, eventResponse] =
          await Promise.all([
            getMyBookings({
              limit: SUMMARY_PAGE_SIZE,
            }),
            getAllEvents({
              limit: SUMMARY_PAGE_SIZE,
            }),
          ]);

        setBookings(bookingResponse.bookings || []);
        setEvents(eventResponse.events || []);
        setCurrentTime(Date.now());
      } catch {
        setBookings([]);
        setEvents([]);
        setCurrentTime(Date.now());
        setError("Some dashboard information could not be loaded.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const upcomingBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const event = getBookingEvent(booking);

      return event
        ? new Date(event.eventDate).getTime() >= currentTime
        : false;
    });
  }, [bookings, currentTime]);

  const totalTickets = bookings.reduce(
    (total, booking) => total + booking.quantity,
    0
  );

  const totalSpent = bookings.reduce(
    (total, booking) => total + booking.totalAmount,
    0
  );

  const recommendedEvents = [...events]
    .filter((event) => (event.availableTickets ?? 0) > 0)
    .sort(
      (first, second) =>
        new Date(first.eventDate).getTime() -
        new Date(second.eventDate).getTime()
    )
    .slice(0, 3);

  const stats = [
    {
      title: "Total Tickets",
      value: loading ? "..." : totalTickets.toString(),
      description: "Tickets you have booked",
      icon: Ticket,
      iconClasses: "bg-orange-100 text-orange-600",
      cardClasses:
        "border-orange-100 from-orange-50 to-white",
    },
    {
      title: "Upcoming Events",
      value: loading
        ? "..."
        : upcomingBookings.length.toString(),
      description: "Events waiting for you",
      icon: CalendarDays,
      iconClasses: "bg-red-100 text-red-600",
      cardClasses: "border-red-100 from-red-50 to-white",
    },
    {
      title: "Total Spent",
      value: loading ? "..." : formatCurrency(totalSpent),
      description: "Across all bookings",
      icon: IndianRupee,
      iconClasses: "bg-emerald-100 text-emerald-600",
      cardClasses:
        "border-emerald-100 from-emerald-50 to-white",
    },
  ];

  return (
    <main className="min-h-screen bg-[#fffaf5] px-4 pb-16 pt-6 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <section className="relative overflow-hidden rounded-[32px] border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-rose-50 px-6 py-8 shadow-sm sm:px-8 sm:py-10">
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-orange-200/40 blur-[110px]" />
          <div className="absolute -bottom-28 right-0 h-72 w-72 rounded-full bg-rose-200/40 blur-[110px]" />

          <div className="relative z-10 flex flex-col justify-between gap-7 lg:flex-row lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-orange-600 shadow-sm">
                <Sparkles size={15} />
                User Dashboard
              </div>

              <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                Welcome, {user?.firstName || "there"}
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
                Track your ticket bookings, view upcoming events and
                discover new experiences.
              </p>
            </div>

            <Link
              href="/events"
              className="inline-flex w-fit shrink-0 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-200 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-300"
            >
              <Search size={18} />
              Explore Events
            </Link>
          </div>
        </section>

        {error && (
          <div className="mt-6 rounded-2xl border border-yellow-200 bg-yellow-50 px-5 py-4 text-sm font-semibold text-yellow-700">
            {error}
          </div>
        )}

        <section className="mt-8 grid gap-5 md:grid-cols-3">
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
                      {stat.value}
                    </p>

                    <p className="mt-2 text-xs text-slate-500">
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

        <section className="mt-8 overflow-hidden rounded-[28px] border border-orange-100 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-4 border-b border-orange-100 px-6 py-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-500">
                Booking history
              </p>

              <h2 className="mt-1 text-xl font-black text-slate-900">
                Recent Tickets
              </h2>
            </div>

            <Link
              href="/my-tickets"
              className="inline-flex items-center gap-2 rounded-xl bg-orange-50 px-4 py-2.5 text-sm font-bold text-orange-600 transition hover:bg-orange-100"
            >
              View all
              <ArrowRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div className="flex min-h-52 items-center justify-center">
              <div className="text-center">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-orange-100 border-t-orange-500" />

                <p className="mt-4 text-sm font-medium text-slate-500">
                  Loading tickets...
                </p>
              </div>
            </div>
          ) : bookings.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                <Ticket size={26} />
              </div>

              <h3 className="mt-4 text-xl font-black text-slate-900">
                No bookings yet
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Your booked tickets will appear here.
              </p>

              <Link
                href="/events"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-600"
              >
                Browse events
                <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-orange-50">
              {bookings.slice(0, 4).map((booking) => {
                const event = getBookingEvent(booking);
                const status = booking.status?.toLowerCase();

                const statusClasses =
                  status === "confirmed"
                    ? "bg-emerald-100 text-emerald-700"
                    : status === "cancelled"
                      ? "bg-red-100 text-red-600"
                      : "bg-yellow-100 text-yellow-700";

                return (
                  <div
                    key={booking._id}
                    className="flex flex-col gap-5 px-6 py-5 transition hover:bg-orange-50/40 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 sm:flex">
                        <Ticket size={23} />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate font-bold text-slate-900">
                            {event?.title || "Event"}
                          </h3>

                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${statusClasses}`}
                          >
                            {booking.status}
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">
                          {event && (
                            <span className="inline-flex items-center gap-1.5">
                              <CalendarDays size={14} />
                              {formatEventDate(event.eventDate)}
                            </span>
                          )}

                          <span>
                            Booking ID: {booking.bookingCode}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-5 sm:justify-end">
                      <div className="text-left sm:text-right">
                        <p className="text-xs text-slate-400">
                          Booking total
                        </p>

                        <p className="mt-1 font-bold text-slate-900">
                          {booking.totalAmount === 0
                            ? "Free"
                            : formatCurrency(
                                booking.totalAmount
                              )}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {booking.quantity}{" "}
                          {booking.quantity === 1
                            ? "ticket"
                            : "tickets"}
                        </p>
                      </div>

                      {event && (
                        <Link
                          href={`/events/${event._id}`}
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-orange-100 bg-orange-50 text-orange-600 transition hover:border-orange-300 hover:bg-orange-100"
                          aria-label={`View ${event.title}`}
                        >
                          <ArrowRight size={17} />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-orange-500">
                <TrendingUp size={18} />

                <p className="text-xs font-bold uppercase tracking-[0.18em]">
                  Selected for you
                </p>
              </div>

              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
                Recommended Events
              </h2>
            </div>

            <Link
              href="/events"
              className="hidden items-center gap-2 text-sm font-bold text-orange-600 transition hover:text-orange-700 sm:inline-flex"
            >
              Browse all
              <ArrowRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-80 animate-pulse rounded-[26px] border border-orange-100 bg-white"
                />
              ))}
            </div>
          ) : recommendedEvents.length === 0 ? (
            <div className="mt-6 rounded-[26px] border border-orange-100 bg-white px-6 py-10 text-center shadow-sm">
              <p className="font-bold text-slate-900">
                No recommended events available
              </p>

              <p className="mt-2 text-sm text-slate-500">
                New events will appear here when they become available.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              {recommendedEvents.map((event) => (
                <Link
                  key={event._id}
                  href={`/events/${event._id}`}
                  className="group overflow-hidden rounded-[26px] border border-orange-100 bg-white shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-orange-100"
                >
                  <div className="relative h-52 overflow-hidden">
                    <img
                      src={
                        event.bannerImage || fallbackEventImage
                      }
                      alt={event.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />

                    <span className="absolute left-4 top-4 rounded-full border border-white/30 bg-black/30 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
                      {event.category}
                    </span>

                    <p className="absolute bottom-4 left-4 text-xl font-black text-white">
                      {event.ticketPrice === 0
                        ? "Free"
                        : formatCurrency(event.ticketPrice)}
                    </p>
                  </div>

                  <div className="p-5">
                    <h3 className="line-clamp-1 text-lg font-black text-slate-900 transition group-hover:text-orange-600">
                      {event.title}
                    </h3>

                    <div className="mt-4 space-y-3 text-sm text-slate-500">
                      <p className="flex items-center gap-2">
                        <CalendarDays
                          size={16}
                          className="text-orange-500"
                        />
                        {formatEventDate(event.eventDate)}
                      </p>

                      <p className="flex items-center gap-2">
                        <Clock3
                          size={16}
                          className="text-yellow-500"
                        />
                        {event.startTime}
                      </p>

                      <p className="flex items-center gap-2">
                        <MapPin
                          size={16}
                          className="text-red-500"
                        />

                        <span className="line-clamp-1">
                          {event.venue}
                        </span>
                      </p>
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-orange-100 pt-4">
                      <span className="text-sm font-semibold text-slate-500">
                        {event.availableTickets ?? 0} tickets left
                      </span>

                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-orange-600 transition group-hover:bg-orange-500 group-hover:text-white">
                        <ArrowRight size={17} />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <Link
            href="/events"
            className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-orange-600 sm:hidden"
          >
            Browse all events
            <ArrowRight size={16} />
          </Link>
        </section>
      </div>
    </main>
  );
}

export default function UserDashboardPage() {
  return (
    <UserRoute>
      <UserDashboardContent />
    </UserRoute>
  );
}
