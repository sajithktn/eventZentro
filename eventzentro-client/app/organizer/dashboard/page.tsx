"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgePercent,
  BarChart3,
  CalendarDays,
  CircleDollarSign,
  IndianRupee,
  MapPin,
  Plus,
  Sparkles,
  Ticket,
  Upload,
  UsersRound,
} from "lucide-react";
import { useAppSelector } from "@/redux/hooks";
import { getOrganizerDashboard } from "@/services/event.service";
import type {
  Event,
  OrganizerDashboardStatistics,
} from "@/types/event";
import {
  fallbackEventImage,
  formatCurrency,
  formatEventDate,
  getEventRevenue,
  getTicketsSold,
} from "@/utils/event";

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

export default function OrganizerDashboardPage() {
  const user = useAppSelector(
    (state) => state.auth.user
  );

  const [statistics, setStatistics] =
    useState<OrganizerDashboardStatistics>(
      emptyStatistics
    );

  const [recentEvents, setRecentEvents] =
    useState<Event[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await getOrganizerDashboard();

        setStatistics({
          ...emptyStatistics,
          ...response.statistics,

          totalGrossRevenue:
            response.statistics.totalGrossRevenue ??
            response.statistics.totalRevenue ??
            0,

          totalAdminCommission:
            response.statistics.totalAdminCommission ??
            0,

          totalOrganizerEarnings:
            response.statistics.totalOrganizerEarnings ??
            response.statistics.totalRevenue ??
            0,
        });

        setRecentEvents(
          response.recentEvents || []
        );
      } catch (requestError) {
        const message =
          requestError instanceof Error
            ? requestError.message
            : "Failed to load dashboard information.";

        setError(message);
        setStatistics(emptyStatistics);
        setRecentEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const stats = [
    {
      title: "Total Events",
      value: loading
        ? "..."
        : statistics.totalEvents.toString(),
      description: "Events you have created",
      icon: CalendarDays,
      iconClasses:
        "bg-orange-100 text-orange-600",
      cardClasses:
        "border-orange-100 from-orange-50 to-white",
    },
    {
      title: "Published Events",
      value: loading
        ? "..."
        : statistics.publishedEvents.toString(),
      description: "Events visible to users",
      icon: Upload,
      iconClasses:
        "bg-red-100 text-red-600",
      cardClasses:
        "border-red-100 from-red-50 to-white",
    },
    {
      title: "Draft Events",
      value: loading
        ? "..."
        : statistics.draftEvents.toString(),
      description:
        "Events still being prepared",
      icon: BarChart3,
      iconClasses:
        "bg-slate-100 text-slate-600",
      cardClasses:
        "border-slate-100 from-slate-50 to-white",
    },
    {
      title: "Cancelled Events",
      value: loading
        ? "..."
        : statistics.cancelledEvents.toString(),
      description:
        "Events no longer available",
      icon: CalendarDays,
      iconClasses:
        "bg-rose-100 text-rose-600",
      cardClasses:
        "border-rose-100 from-rose-50 to-white",
    },
    {
      title: "Completed Events",
      value: loading
        ? "..."
        : statistics.completedEvents.toString(),
      description:
        "Past events kept in history",
      icon: CalendarDays,
      iconClasses:
        "bg-slate-100 text-slate-600",
      cardClasses:
        "border-slate-100 from-slate-50 to-white",
    },
    {
      title: "Tickets Sold",
      value: loading
        ? "..."
        : statistics.totalTicketsSold.toString(),
      description:
        "Tickets booked by users",
      icon: Ticket,
      iconClasses:
        "bg-yellow-100 text-yellow-600",
      cardClasses:
        "border-yellow-100 from-yellow-50 to-white",
    },
    {
      title: "Total Bookings",
      value: loading
        ? "..."
        : statistics.totalBookings.toString(),
      description:
        "Confirmed paid bookings",
      icon: UsersRound,
      iconClasses:
        "bg-sky-100 text-sky-600",
      cardClasses:
        "border-sky-100 from-sky-50 to-white",
    },
    {
      title: "Gross Revenue",
      value: loading
        ? "..."
        : formatCurrency(
            statistics.totalGrossRevenue
          ),
      description:
        "Total amount paid by customers",
      icon: CircleDollarSign,
      iconClasses:
        "bg-emerald-100 text-emerald-600",
      cardClasses:
        "border-emerald-100 from-emerald-50 to-white",
    },
    {
      title: "Commission Deducted",
      value: loading
        ? "..."
        : formatCurrency(
            statistics.totalAdminCommission
          ),
      description:
        "Platform commission from bookings",
      icon: BadgePercent,
      iconClasses:
        "bg-purple-100 text-purple-600",
      cardClasses:
        "border-purple-100 from-purple-50 to-white",
    },
    {
      title: "Net Earnings",
      value: loading
        ? "..."
        : formatCurrency(
            statistics.totalOrganizerEarnings
          ),
      description:
        "Your earnings after commission",
      icon: IndianRupee,
      iconClasses:
        "bg-teal-100 text-teal-600",
      cardClasses:
        "border-teal-100 from-teal-50 to-white",
    },
  ];

  const quickActions = [
    {
      title: "Create Event",
      description:
        "Create and publish a new event.",
      href: "/organizer/events/create",
      icon: Plus,
      iconClasses:
        "bg-orange-100 text-orange-600",
    },
    {
      title: "Manage Events",
      description:
        "Edit, update or manage your events.",
      href: "/organizer/events",
      icon: CalendarDays,
      iconClasses:
        "bg-red-100 text-red-600",
    },
    {
      title: "View Bookings",
      description:
        "Check bookings made for your events.",
      href: "/organizer/bookings",
      icon: UsersRound,
      iconClasses:
        "bg-emerald-100 text-emerald-600",
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
                Organizer Dashboard
              </div>

              <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                Welcome,{" "}
                {user?.firstName ||
                  "Organizer"}
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
                Manage your events, monitor
                ticket sales and track your
                gross revenue, commission
                deductions and net earnings
                from one place.
              </p>
            </div>

            <Link
              href="/organizer/events/create"
              className="inline-flex w-fit shrink-0 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-200 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-300"
            >
              <Plus size={19} />
              Create Event
            </Link>
          </div>
        </section>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-600">
            {error}
          </div>
        )}

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
                      {stat.value}
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

        <section className="mt-8">
          <div className="flex items-center gap-2 text-orange-500">
            <BarChart3 size={18} />

            <p className="text-xs font-bold uppercase tracking-[0.18em]">
              Organizer tools
            </p>
          </div>

          <h2 className="mt-2 text-2xl font-black text-slate-900">
            Quick Actions
          </h2>

          <div className="mt-5 grid gap-5 md:grid-cols-3">
            {quickActions.map(
              (action) => {
                const Icon = action.icon;

                return (
                  <Link
                    key={action.title}
                    href={action.href}
                    className="group rounded-[24px] border border-orange-100 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-100"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl ${action.iconClasses}`}
                      >
                        <Icon size={22} />
                      </div>

                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition group-hover:bg-orange-500 group-hover:text-white">
                        <ArrowRight
                          size={17}
                        />
                      </span>
                    </div>

                    <h3 className="mt-5 text-lg font-black text-slate-900 transition group-hover:text-orange-600">
                      {action.title}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {
                        action.description
                      }
                    </p>
                  </Link>
                );
              }
            )}
          </div>
        </section>

        <section className="mt-10 overflow-hidden rounded-[28px] border border-orange-100 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-orange-100 px-6 py-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-500">
                Event management
              </p>

              <h2 className="mt-1 text-xl font-black text-slate-900">
                Recent Events
              </h2>
            </div>

            <Link
              href="/organizer/events"
              className="inline-flex w-fit items-center gap-2 rounded-xl bg-orange-50 px-4 py-2.5 text-sm font-bold text-orange-600 transition hover:bg-orange-100"
            >
              Manage all events
              <ArrowRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div className="flex min-h-60 items-center justify-center">
              <div className="text-center">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-orange-100 border-t-orange-500" />

                <p className="mt-4 text-sm font-medium text-slate-500">
                  Loading your
                  events...
                </p>
              </div>
            </div>
          ) : recentEvents.length ===
            0 ? (
            <div className="px-6 py-14 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                <CalendarDays
                  size={29}
                />
              </div>

              <h3 className="mt-5 text-xl font-black text-slate-900">
                No events created yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Create your first event
                and start accepting ticket
                bookings from users.
              </p>

              <Link
                href="/organizer/events/create"
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 px-6 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-orange-200"
              >
                <Plus size={18} />
                Create your first event
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 p-6 md:grid-cols-2">
              {recentEvents.map(
                (event) => {
                  const ticketsSold =
                    getTicketsSold(event);

                  const eventRevenue =
                    getEventRevenue(event);

                  const availableTickets =
                    event.availableTickets ??
                    0;

                  const statusClasses =
                    event.status ===
                    "published"
                      ? "bg-emerald-100 text-emerald-700"
                      : event.status ===
                          "cancelled"
                        ? "bg-red-100 text-red-600"
                        : event.status ===
                            "completed"
                          ? "bg-slate-100 text-slate-600"
                        : "bg-yellow-100 text-yellow-700";

                  return (
                    <article
                      key={event._id}
                      className="group overflow-hidden rounded-[24px] border border-orange-100 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-100"
                    >
                      <div className="relative h-52 overflow-hidden">
                        <img
                          src={
                            event.bannerImage ||
                            fallbackEventImage
                          }
                          alt={event.title}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />

                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                          <span
                            className={`rounded-full px-3 py-1.5 text-xs font-bold capitalize ${statusClasses}`}
                          >
                            {event.status ||
                              "draft"}
                          </span>

                          <span className="rounded-full border border-white/30 bg-black/30 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
                            {
                              event.category
                            }
                          </span>
                        </div>

                        <div className="absolute bottom-4 left-4 right-4">
                          <h3 className="line-clamp-1 text-xl font-black text-white">
                            {event.title}
                          </h3>
                        </div>
                      </div>

                      <div className="p-5">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                              <CalendarDays
                                size={18}
                              />
                            </span>

                            <div>
                              <p className="text-xs text-slate-400">
                                Event date
                              </p>

                              <p className="text-sm font-semibold text-slate-700">
                                {formatEventDate(
                                  event.eventDate
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="flex min-w-0 items-center gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                              <MapPin
                                size={18}
                              />
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
                              Sold
                            </p>

                            <p className="mt-1 font-black text-slate-900">
                              {
                                ticketsSold
                              }
                            </p>
                          </div>

                          <div className="border-x border-orange-100">
                            <p className="text-xs text-slate-500">
                              Available
                            </p>

                            <p className="mt-1 font-black text-slate-900">
                              {
                                availableTickets
                              }
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-slate-500">
                              Revenue
                            </p>

                            <p className="mt-1 truncate font-black text-slate-900">
                              {formatCurrency(
                                eventRevenue
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 flex gap-3">
                          <Link
                            href={`/events/${event._id}`}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-bold text-orange-600 transition hover:bg-orange-100"
                          >
                            View event
                          </Link>

                          <Link
                            href={`/organizer/events/${event._id}/edit`}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-orange-600"
                          >
                            Edit event
                            <ArrowRight
                              size={16}
                            />
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
