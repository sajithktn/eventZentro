"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { BadgePercent, CircleDollarSign, IndianRupee, Ticket, Users } from "lucide-react";
import { getOrganizerBookings } from "@/services/booking.service";
import type { Booking } from "@/types/booking";
import type { PaginationMetadata } from "@/types/pagination";
import { formatCurrency } from "@/utils/event";
import { createUrlWithQueryParams, DEFAULT_PAGE_SIZE, getPageFromSearchParams, SUMMARY_PAGE_SIZE } from "@/utils/pagination";
import { getAdminCommissionAmount, getAmountPaid, getOrganizerEarnings } from "./utils";

export function useOrganizerBookingsState() {
  const router = useRouter();

  const pathname = usePathname();

  const searchParams = useSearchParams();

  const resultsRef = useRef<HTMLDivElement>(null);

  const currentPage = getPageFromSearchParams(searchParams);

  const previousPageRef = useRef(currentPage);

  const search = searchParams.get("search") || "";

  const selectedStatus = searchParams.get("status") || "all";

  const [bookings, setBookings] = useState<Booking[]>([]);

  const [summaryBookings, setSummaryBookings,] = useState<Booking[]>([]);

  const [pagination, setPagination] = useState<PaginationMetadata | null>(null);

  const [loading, setLoading] = useState(true);

  const [summaryLoading, setSummaryLoading,] = useState(true);

  const [error, setError] = useState("");

  const requestParams = useMemo(() => ({
      page: currentPage,
      limit: DEFAULT_PAGE_SIZE,
      search: search || undefined,
      status: selectedStatus !== "all"
          ? selectedStatus
          : undefined,
      sort: "newest",
  }), [
      currentPage,
      search,
      selectedStatus,
  ]);

  useEffect(() => {
      let isActive = true;
      const fetchBookings = async () => {
          try {
              setLoading(true);
              setError("");
              const response = await getOrganizerBookings(requestParams);
              if (!isActive) {
                  return;
              }
              setBookings(response.data ||
                  response.bookings ||
                  []);
              setPagination(response.pagination);
          }
          catch {
              if (!isActive) {
                  return;
              }
              setError("Failed to load bookings.");
              setBookings([]);
              setPagination(null);
              toast.error("Failed to load bookings.");
          }
          finally {
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
      const fetchSummaryBookings = async () => {
          try {
              setSummaryLoading(true);
              const response = await getOrganizerBookings({
                  page: 1,
                  limit: SUMMARY_PAGE_SIZE,
                  sort: "newest",
              });
              if (!isActive) {
                  return;
              }
              setSummaryBookings(response.data ||
                  response.bookings ||
                  []);
          }
          catch {
              if (!isActive) {
                  return;
              }
              setSummaryBookings([]);
          }
          finally {
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
      if (previousPageRef.current !==
          currentPage) {
          resultsRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "start",
          });
      }
      previousPageRef.current =
          currentPage;
  }, [currentPage]);

  const paidBookings = useMemo(() => summaryBookings.filter((booking) => booking.status ===
      "confirmed" &&
      booking.paymentStatus ===
          "paid"), [summaryBookings]);

  const totalBookings = paidBookings.length;

  const totalTicketsSold = paidBookings.reduce((total, booking) => total +
      (booking.ticketCount ??
          booking.quantity), 0);

  const totalGrossRevenue = paidBookings.reduce((total, booking) => total +
      getAmountPaid(booking), 0);

  const totalAdminCommission = paidBookings.reduce((total, booking) => total +
      getAdminCommissionAmount(booking), 0);

  const totalOrganizerEarnings = paidBookings.reduce((total, booking) => total +
      getOrganizerEarnings(booking), 0);

  const statsLoading = loading || summaryLoading;

  const stats = [
      {
          title: "Paid Bookings",
          value: totalBookings.toString(),
          description: "Successfully paid bookings",
          icon: Users,
          iconClassName: "bg-orange-100 text-orange-600",
          cardClassName: "border-orange-100 from-orange-50 to-white",
      },
      {
          title: "Tickets Sold",
          value: totalTicketsSold.toString(),
          description: "Tickets from paid bookings",
          icon: Ticket,
          iconClassName: "bg-yellow-100 text-yellow-600",
          cardClassName: "border-yellow-100 from-yellow-50 to-white",
      },
      {
          title: "Gross Revenue",
          value: formatCurrency(totalGrossRevenue),
          description: "Total amount paid by customers",
          icon: CircleDollarSign,
          iconClassName: "bg-emerald-100 text-emerald-600",
          cardClassName: "border-emerald-100 from-emerald-50 to-white",
      },
      {
          title: "Commission",
          value: formatCurrency(totalAdminCommission),
          description: "Platform commission deducted",
          icon: BadgePercent,
          iconClassName: "bg-purple-100 text-purple-600",
          cardClassName: "border-purple-100 from-purple-50 to-white",
      },
      {
          title: "Net Earnings",
          value: formatCurrency(totalOrganizerEarnings),
          description: "Organizer earnings after commission",
          icon: IndianRupee,
          iconClassName: "bg-teal-100 text-teal-600",
          cardClassName: "border-teal-100 from-teal-50 to-white",
      },
  ];

  const updateFilters = (updates: Record<string, string | undefined>) => {
      router.replace(createUrlWithQueryParams(pathname, searchParams, updates, true), {
          scroll: false,
      });
  };

  const clearFilters = () => {
      updateFilters({
          search: undefined,
          status: undefined,
      });
  };

  const hasFilterResults = Boolean(search ||
      selectedStatus !== "all");

  return {
    bookings,
    clearFilters,
    error,
    hasFilterResults,
    loading,
    pagination,
    resultsRef,
    search,
    selectedStatus,
    stats,
    statsLoading,
    updateFilters,
  };
}

export type OrganizerBookingsState = ReturnType<typeof useOrganizerBookingsState>;
