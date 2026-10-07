"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { deletePromotion, getPromotions, updatePromotionStatus } from "@/services/promotion.service";
import { getAllEvents } from "@/services/event.service";
import type { Event } from "@/types/event";
import type { Promotion, PromotionMode, PromotionStatus } from "@/types/promotion";
import type { PaginationMetadata } from "@/types/pagination";
import { createUrlWithQueryParams, DEFAULT_PAGE_SIZE, getPageFromSearchParams, SUMMARY_PAGE_SIZE } from "@/utils/pagination";
import { getStatus } from "./utils";

export function useOrganizerPromotionsState() {
  const router = useRouter();

  const pathname = usePathname();

  const searchParams = useSearchParams();

  const resultsRef = useRef<HTMLDivElement>(null);

  const previousPageRef = useRef(1);

  const currentPage = getPageFromSearchParams(searchParams);

  const search = searchParams.get("search") || "";

  const selectedEventId = searchParams.get("eventId") || "";

  const selectedStatus = searchParams.get("status") || "all";

  const selectedMode = searchParams.get("promotionMode") || "all";

  const [events, setEvents] = useState<Event[]>([]);

  const [promotions, setPromotions] = useState<Promotion[]>([]);

  const [pagination, setPagination] = useState<PaginationMetadata | null>(null);

  const [loading, setLoading] = useState(true);

  const [eventsLoading, setEventsLoading] = useState(true);

  const [error, setError] = useState("");

  const [actionPromotionId, setActionPromotionId] = useState<string | null>(null);

  const [refreshNonce, setRefreshNonce] = useState(0);

  const requestParams = useMemo(() => ({
      page: currentPage,
      limit: DEFAULT_PAGE_SIZE,
      search: search || undefined,
      eventId: selectedEventId || undefined,
      status: selectedStatus !== "all"
          ? (selectedStatus as PromotionStatus)
          : undefined,
      promotionMode: selectedMode !== "all"
          ? (selectedMode as PromotionMode)
          : undefined,
      sort: "newest",
  }), [
      currentPage,
      search,
      selectedEventId,
      selectedMode,
      selectedStatus,
  ]);

  useEffect(() => {
      let isActive = true;
      const fetchEvents = async () => {
          try {
              setEventsLoading(true);
              const response = await getAllEvents({
                  organizer: "me",
                  page: 1,
                  limit: SUMMARY_PAGE_SIZE,
                  sort: "newest",
              });
              if (isActive) {
                  setEvents(response.data || response.events || []);
              }
          }
          catch {
              if (isActive) {
                  setEvents([]);
              }
          }
          finally {
              if (isActive) {
                  setEventsLoading(false);
              }
          }
      };
      fetchEvents();
      return () => {
          isActive = false;
      };
  }, []);

  useEffect(() => {
      let isActive = true;
      const fetchPromotions = async () => {
          try {
              setLoading(true);
              setError("");
              const response = await getPromotions(requestParams);
              if (!isActive) {
                  return;
              }
              setPromotions(response.data ||
                  response.promotions ||
                  response.coupons ||
                  []);
              setPagination(response.pagination);
          }
          catch {
              if (!isActive) {
                  return;
              }
              setError("Failed to load promotions.");
              setPromotions([]);
              setPagination(null);
              toast.error("Failed to load promotions.");
          }
          finally {
              if (isActive) {
                  setLoading(false);
              }
          }
      };
      fetchPromotions();
      return () => {
          isActive = false;
      };
  }, [requestParams, refreshNonce]);

  useEffect(() => {
      if (previousPageRef.current !== currentPage) {
          resultsRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "start",
          });
      }
      previousPageRef.current = currentPage;
  }, [currentPage]);

  const updateFilters = (updates: Record<string, string | undefined>) => {
      router.replace(createUrlWithQueryParams(pathname, searchParams, updates, true), { scroll: false });
  };

  const clearFilters = () => {
      updateFilters({
          search: undefined,
          eventId: undefined,
          status: undefined,
          promotionMode: undefined,
      });
  };

  const refreshPromotions = () => {
      setRefreshNonce((value) => value + 1);
  };

  const handleStatusToggle = async (promotion: Promotion) => {
      const nextStatus = getStatus(promotion) === "active" ? "inactive" : "active";
      try {
          setActionPromotionId(promotion._id);
          const response = await updatePromotionStatus(promotion._id, nextStatus);
          toast.success(response.message);
          refreshPromotions();
      }
      catch (error: unknown) {
          if (axios.isAxiosError(error)) {
              toast.error(error.response?.data?.message ||
                  "Failed to update promotion status.");
              return;
          }
          toast.error("Failed to update promotion status.");
      }
      finally {
          setActionPromotionId(null);
      }
  };

  const handleDelete = async (promotion: Promotion) => {
      const confirmed = window.confirm("Delete this promotion? Existing bookings keep their saved promotion history.");
      if (!confirmed) {
          return;
      }
      try {
          setActionPromotionId(promotion._id);
          const response = await deletePromotion(promotion._id);
          toast.success(response.message);
          refreshPromotions();
      }
      catch (error: unknown) {
          if (axios.isAxiosError(error)) {
              toast.error(error.response?.data?.message ||
                  "Failed to delete promotion.");
              return;
          }
          toast.error("Failed to delete promotion.");
      }
      finally {
          setActionPromotionId(null);
      }
  };

  const hasFilters = Boolean(search ||
      selectedEventId ||
      selectedStatus !== "all" ||
      selectedMode !== "all");

  return {
    actionPromotionId,
    clearFilters,
    error,
    events,
    eventsLoading,
    handleDelete,
    handleStatusToggle,
    hasFilters,
    loading,
    pagination,
    promotions,
    resultsRef,
    search,
    selectedEventId,
    selectedMode,
    selectedStatus,
    updateFilters,
  };
}

export type OrganizerPromotionsState = ReturnType<typeof useOrganizerPromotionsState>;
