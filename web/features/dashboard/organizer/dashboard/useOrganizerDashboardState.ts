"use client";

import { useEffect, useState } from "react";
import { BadgePercent, BarChart3, CalendarDays, CircleDollarSign, IndianRupee, Plus, Ticket, Upload, UsersRound } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { getOrganizerDashboard } from "@/services/event.service";
import type { Event, OrganizerDashboardStatistics } from "@/types/event";
import { formatCurrency } from "@/utils/event";

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

export function useOrganizerDashboardState() {
  const user = useAppSelector((state) => state.auth.user);

  const [statistics, setStatistics] = useState<OrganizerDashboardStatistics>(emptyStatistics);

  const [recentEvents, setRecentEvents] = useState<Event[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
      const fetchEvents = async () => {
          try {
              setLoading(true);
              setError("");
              const response = await getOrganizerDashboard();
              setStatistics({
                  ...emptyStatistics,
                  ...response.statistics,
                  totalGrossRevenue: response.statistics.totalGrossRevenue ??
                      response.statistics.totalRevenue ??
                      0,
                  totalAdminCommission: response.statistics.totalAdminCommission ??
                      0,
                  totalOrganizerEarnings: response.statistics.totalOrganizerEarnings ??
                      response.statistics.totalRevenue ??
                      0,
              });
              setRecentEvents(response.recentEvents || []);
          }
          catch (requestError) {
              const message = requestError instanceof Error
                  ? requestError.message
                  : "Failed to load dashboard information.";
              setError(message);
              setStatistics(emptyStatistics);
              setRecentEvents([]);
          }
          finally {
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
          iconClasses: "bg-orange-100 text-orange-600",
          cardClasses: "border-orange-100 from-orange-50 to-white",
      },
      {
          title: "Published Events",
          value: loading
              ? "..."
              : statistics.publishedEvents.toString(),
          description: "Events visible to users",
          icon: Upload,
          iconClasses: "bg-red-100 text-red-600",
          cardClasses: "border-red-100 from-red-50 to-white",
      },
      {
          title: "Draft Events",
          value: loading
              ? "..."
              : statistics.draftEvents.toString(),
          description: "Events still being prepared",
          icon: BarChart3,
          iconClasses: "bg-slate-100 text-slate-600",
          cardClasses: "border-slate-100 from-slate-50 to-white",
      },
      {
          title: "Cancelled Events",
          value: loading
              ? "..."
              : statistics.cancelledEvents.toString(),
          description: "Events no longer available",
          icon: CalendarDays,
          iconClasses: "bg-rose-100 text-rose-600",
          cardClasses: "border-rose-100 from-rose-50 to-white",
      },
      {
          title: "Completed Events",
          value: loading
              ? "..."
              : statistics.completedEvents.toString(),
          description: "Past events kept in history",
          icon: CalendarDays,
          iconClasses: "bg-slate-100 text-slate-600",
          cardClasses: "border-slate-100 from-slate-50 to-white",
      },
      {
          title: "Tickets Sold",
          value: loading
              ? "..."
              : statistics.totalTicketsSold.toString(),
          description: "Tickets booked by users",
          icon: Ticket,
          iconClasses: "bg-yellow-100 text-yellow-600",
          cardClasses: "border-yellow-100 from-yellow-50 to-white",
      },
      {
          title: "Total Bookings",
          value: loading
              ? "..."
              : statistics.totalBookings.toString(),
          description: "Confirmed paid bookings",
          icon: UsersRound,
          iconClasses: "bg-sky-100 text-sky-600",
          cardClasses: "border-sky-100 from-sky-50 to-white",
      },
      {
          title: "Gross Revenue",
          value: loading
              ? "..."
              : formatCurrency(statistics.totalGrossRevenue),
          description: "Total amount paid by customers",
          icon: CircleDollarSign,
          iconClasses: "bg-emerald-100 text-emerald-600",
          cardClasses: "border-emerald-100 from-emerald-50 to-white",
      },
      {
          title: "Commission Deducted",
          value: loading
              ? "..."
              : formatCurrency(statistics.totalAdminCommission),
          description: "Platform commission from bookings",
          icon: BadgePercent,
          iconClasses: "bg-purple-100 text-purple-600",
          cardClasses: "border-purple-100 from-purple-50 to-white",
      },
      {
          title: "Net Earnings",
          value: loading
              ? "..."
              : formatCurrency(statistics.totalOrganizerEarnings),
          description: "Your earnings after commission",
          icon: IndianRupee,
          iconClasses: "bg-teal-100 text-teal-600",
          cardClasses: "border-teal-100 from-teal-50 to-white",
      },
  ];

  const quickActions = [
      {
          title: "Create Event",
          description: "Create and publish a new event.",
          href: "/organizer/events/create",
          icon: Plus,
          iconClasses: "bg-orange-100 text-orange-600",
      },
      {
          title: "Manage Events",
          description: "Edit, update or manage your events.",
          href: "/organizer/events",
          icon: CalendarDays,
          iconClasses: "bg-red-100 text-red-600",
      },
      {
          title: "View Bookings",
          description: "Check bookings made for your events.",
          href: "/organizer/bookings",
          icon: UsersRound,
          iconClasses: "bg-emerald-100 text-emerald-600",
      },
  ];

  return {
    error,
    loading,
    quickActions,
    recentEvents,
    stats,
    user,
  };
}

export type OrganizerDashboardState = ReturnType<typeof useOrganizerDashboardState>;
