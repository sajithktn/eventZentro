"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  ArrowRight,
  BadgePercent,
  CalendarDays,
  CircleDollarSign,
  RefreshCw,
  ShieldCheck,
  Ticket,
  UserCog,
  UsersRound,
} from "lucide-react";

import {
  getAdminDashboard,
  type AdminDashboardStatistics,
} from "@/services/admin.service";

const initialStatistics: AdminDashboardStatistics = {
  totalUsers: 0,
  totalOrganizers: 0,
  totalEvents: 0,
  totalBookings: 0,
  totalRevenue: 0,
  totalAdminCommission: 0,
  totalOrganizerEarnings: 0,
  featuredEventRevenue: 0,
  totalPlatformEarnings: 0,
};

const formatNumber = (value: number) => {
  return value.toLocaleString("en-IN");
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
};

const quickActions = [
  {
    title: "Manage Users",
    description:
      "View users, organizers and account statuses.",
    href: "/admin/users",
    icon: UsersRound,
  },
  {
    title: "Manage Organizers",
    description:
      "View and manage organizer accounts and their access.",
    href: "/admin/organizers",
    icon: UserCog,
  },
  {
    title: "Manage Events",
    description:
      "Review and manage platform events.",
    href: "/admin/events",
    icon: CalendarDays,
  },
  {
    title: "Manage Bookings",
    description:
      "View bookings, ticket sales and payments.",
    href: "/admin/bookings",
    icon: Ticket,
  },
  {
    title: "Manage Promotions",
    description:
      "Review organizer coupons and automatic offers.",
    href: "/admin/promotions",
    icon: BadgePercent,
  },
  {
    title: "Manage Commission",
    description:
      "Set the platform commission percentage for bookings.",
    href: "/admin/commission",
    icon: CircleDollarSign,
  },
];

export default function AdminDashboardPage() {
  const [statistics, setStatistics] =
    useState<AdminDashboardStatistics>(
      initialStatistics
    );

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadDashboard =
    useCallback(async () => {
      try {
        setIsLoading(true);
        setError("");

        const response =
          await getAdminDashboard();

        if (
          !response.success ||
          !response.statistics
        ) {
          throw new Error(
            response.message ||
              "Unable to load dashboard statistics."
          );
        }

        setStatistics({
          ...initialStatistics,
          ...response.statistics,
        });
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Unable to load dashboard statistics."
        );
      } finally {
        setIsLoading(false);
      }
    }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const dashboardCards = [
    {
      title: "Total Users",
      value: formatNumber(
        statistics.totalUsers
      ),
      description:
        "All registered accounts",
      icon: UsersRound,
    },
    {
      title: "Total Organizers",
      value: formatNumber(
        statistics.totalOrganizers
      ),
      description:
        "Organizer accounts",
      icon: UserCog,
    },
    {
      title: "Total Events",
      value: formatNumber(
        statistics.totalEvents
      ),
      description:
        "Events on the platform",
      icon: CalendarDays,
    },
    {
      title: "Total Bookings",
      value: formatNumber(
        statistics.totalBookings
      ),
      description:
        "Ticket reservations",
      icon: Ticket,
    },
    {
      title: "Total Revenue",
      value: formatCurrency(
        statistics.totalRevenue
      ),
      description:
        "Confirmed paid booking revenue",
      icon: CircleDollarSign,
    },
    {
      title: "Admin Commission",
      value: formatCurrency(
        statistics.totalAdminCommission
      ),
      description:
        "Platform earnings from bookings",
      icon: BadgePercent,
    },
    {
      title: "Featured Event Revenue",
      value: formatCurrency(
        statistics.featuredEventRevenue
      ),
      description:
        "Paid featured promotion fees",
      icon: CalendarDays,
    },
    {
      title: "Total Platform Earnings",
      value: formatCurrency(
        statistics.totalPlatformEarnings
      ),
      description:
        "Commission plus featured fees",
      icon: CircleDollarSign,
    },
    {
      title: "Organizer Earnings",
      value: formatCurrency(
        statistics.totalOrganizerEarnings
      ),
      description:
        "Revenue payable to organizers",
      icon: UserCog,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl">
      <section className="relative overflow-hidden rounded-[28px] bg-slate-950 p-6 text-white shadow-xl sm:p-8">
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-orange-500/25 blur-[100px]" />

        <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-red-500/20 blur-[100px]" />

        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-orange-400">
              <ShieldCheck size={24} />
            </div>

            <h2 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">
              Welcome to the Admin Panel
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              Manage EventZentro users,
              organizers, events, bookings,
              promotions and platform
              commission from one secure
              dashboard.
            </p>
          </div>

          <button
            type="button"
            onClick={loadDashboard}
            disabled={isLoading}
            className="inline-flex w-fit items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={
                isLoading
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh
          </button>
        </div>
      </section>

      {error && (
        <div className="mt-6 flex flex-col justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 sm:flex-row sm:items-center">
          <p className="text-sm font-bold text-red-600">
            {error}
          </p>

          <button
            type="button"
            onClick={loadDashboard}
            className="w-fit text-sm font-black text-red-700 underline underline-offset-4"
          >
            Try again
          </button>
        </div>
      )}

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardCards.map(
          (item) => {
            const Icon =
              item.icon;

            return (
              <article
                key={item.title}
                className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
                    <Icon
                      size={21}
                    />
                  </div>

                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-600">
                    Live
                  </span>
                </div>

                <p className="mt-5 text-sm font-bold text-slate-600">
                  {item.title}
                </p>

                {isLoading ? (
                  <div className="mt-2 h-9 w-24 animate-pulse rounded-lg bg-slate-200" />
                ) : (
                  <p className="mt-1 break-words text-3xl font-black text-slate-950">
                    {item.value}
                  </p>
                )}

                <p className="mt-2 text-xs font-medium text-slate-500">
                  {item.description}
                </p>
              </article>
            );
          }
        )}
      </section>

      <section className="mt-6 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-500">
          Management
        </p>

        <h2 className="mt-2 text-2xl font-black text-slate-950">
          Quick Actions
        </h2>

        <p className="mt-1 text-sm text-slate-600">
          Open an admin section to
          manage the platform.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {quickActions.map(
            (action) => {
              const Icon =
                action.icon;

              return (
                <Link
                  key={
                    action.href
                  }
                  href={
                    action.href
                  }
                  className="group rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-1 hover:border-orange-200 hover:bg-orange-50 hover:shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-orange-500 shadow-sm">
                      <Icon
                        size={21}
                      />
                    </span>

                    <ArrowRight
                      size={19}
                      className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-orange-500"
                    />
                  </div>

                  <h3 className="mt-5 text-lg font-black text-slate-950">
                    {
                      action.title
                    }
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
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
    </div>
  );
}
