"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { CalendarDays, Eye, IndianRupee, Ticket } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { getOrganizerDashboard, getOrganizerEvents } from "@/services/event.service";
import type { Event, OrganizerDashboardStatistics } from "@/types/event";
import type { PaginationMetadata } from "@/types/pagination";
import { formatCurrency } from "@/utils/event";
import { createUrlWithQueryParams, DEFAULT_PAGE_SIZE, getPageFromSearchParams, SUMMARY_PAGE_SIZE } from "@/utils/pagination";
import { emptyStatistics } from "./constants";

export function useMyEventsState() {
  const router = useRouter();

  const pathname = usePathname();

  const searchParams = useSearchParams();

  const resultsRef = useRef<HTMLDivElement>(null);

  const previousPageRef = useRef(1);

  const user = useAppSelector((state) => state.auth.user);

  const currentPage = getPageFromSearchParams(searchParams);

  const search = searchParams.get("search") || "";

  const selectedStatus = searchParams.get("status") || "all";

  const [events, setEvents] = useState<Event[]>([]);

  const [summaryEvents, setSummaryEvents] = useState<Event[]>([]);

  const [statistics, setStatistics] = useState<OrganizerDashboardStatistics>(emptyStatistics);

  const [totalOwnedEvents, setTotalOwnedEvents] = useState(0);

  const [pagination, setPagination] = useState<PaginationMetadata | null>(null);

  const [loading, setLoading] = useState(false);

  const [summaryLoading, setSummaryLoading] = useState(false);

  const [error, setError] = useState("");

  const requestParams = useMemo(() => ({
      page: currentPage,
      limit: DEFAULT_PAGE_SIZE,
      search: search || undefined,
      status: selectedStatus !== "all"
          ? selectedStatus
          : undefined,
      sort: "newest",
  }), [currentPage, search, selectedStatus]);

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
          }
          catch {
              if (!isActive) {
                  return;
              }
              setError("Failed to load your events.");
              setEvents([]);
              setPagination(null);
              toast.error("Failed to load your events.");
          }
          finally {
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
              const [eventsResponse, dashboardResponse] = await Promise.all([
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
              setSummaryEvents(eventsResponse.data ||
                  eventsResponse.events ||
                  []);
              setStatistics(dashboardResponse.statistics);
              setTotalOwnedEvents(dashboardResponse.statistics.totalEvents);
          }
          catch {
              if (!isActive) {
                  return;
              }
              setSummaryEvents([]);
              setStatistics(emptyStatistics);
              setTotalOwnedEvents(0);
          }
          finally {
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
          cardClasses: "border-emerald-100 from-emerald-50 to-white",
      },
  ];

  const updateFilters = (updates: Record<string, string | undefined>) => {
      router.replace(createUrlWithQueryParams(pathname, searchParams, updates, true), { scroll: false });
  };

  const resetFilters = () => {
      updateFilters({
          search: undefined,
          status: undefined,
      });
  };

  const hasFilterResults = Boolean(search || selectedStatus !== "all");

  return {
    error,
    events,
    hasFilterResults,
    loading,
    pagination,
    resetFilters,
    resultsRef,
    search,
    selectedStatus,
    stats,
    statsLoading,
    totalOwnedEvents,
    totalTickets,
    updateFilters,
  };
}

export type MyEventsState = ReturnType<typeof useMyEventsState>;
