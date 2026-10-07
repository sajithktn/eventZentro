"use client";

import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cancelFeaturedEventRequest, createFeaturedEventPaymentOrder, createFeaturedEventRequest, getEligibleFeaturedEvents, getFeaturedEventSettings, getOrganizerFeaturedEventRequests, verifyFeaturedEventPayment } from "@/services/featuredEvent.service";
import type { Event } from "@/types/event";
import type { FeaturedEventRequest, FeaturedEventRequestStatus, FeaturedEventSettings, RazorpayOrder } from "@/types/featuredEvent";
import type { PaginationMetadata } from "@/types/pagination";
import { useAppSelector } from "@/store/hooks";
import { formatCurrency, formatEventDate } from "@/utils/event";
import { createUrlWithQueryParams, DEFAULT_PAGE_SIZE, getPageFromSearchParams } from "@/utils/pagination";
import { RazorpayConstructor, RazorpayOptions, loadRazorpayScript } from "./razorpay";
import { formatDateInput, getErrorMessage, getEventId, getRequestEvent } from "./utils";

export function useOrganizerFeaturedEventsState() {
  const router = useRouter();

  const pathname = usePathname();

  const searchParams = useSearchParams();

  const resultsRef = useRef<HTMLDivElement>(null);

  const previousPageRef = useRef(1);

  const user = useAppSelector((state) => state.auth.user);

  const currentPage = getPageFromSearchParams(searchParams);

  const search = searchParams.get("search") || "";

  const status = searchParams.get("status") || "all";

  const [settings, setSettings] = useState<FeaturedEventSettings | null>(null);

  const [events, setEvents] = useState<Event[]>([]);

  const [requests, setRequests] = useState<FeaturedEventRequest[]>([]);

  const [pagination, setPagination] = useState<PaginationMetadata | null>(null);

  const [selectedEventId, setSelectedEventId] = useState("");

  const [startDate, setStartDate] = useState(() => formatDateInput(new Date()));

  const [endDate, setEndDate] = useState(() => {
      const date = new Date();
      date.setDate(date.getDate() + 6);
      return formatDateInput(date);
  });

  const [loading, setLoading] = useState(true);

  const [formLoading, setFormLoading] = useState(false);

  const [actionRequestId, setActionRequestId] = useState<string | null>(null);

  const [refreshNonce, setRefreshNonce] = useState(0);

  const requestParams = useMemo(() => ({
      page: currentPage,
      limit: DEFAULT_PAGE_SIZE,
      search: search || undefined,
      status: status !== "all"
          ? (status as FeaturedEventRequestStatus)
          : undefined,
      sort: "newest",
  }), [currentPage, search, status]);

  const loadData = async () => {
      try {
          setLoading(true);
          const [settingsResponse, eventsResponse, requestsResponse,] = await Promise.all([
              getFeaturedEventSettings(),
              getEligibleFeaturedEvents(),
              getOrganizerFeaturedEventRequests(requestParams),
          ]);
          setSettings(settingsResponse.settings);
          setEvents(eventsResponse.data ||
              eventsResponse.events ||
              []);
          setRequests(requestsResponse.data ||
              requestsResponse.requests ||
              []);
          setPagination(requestsResponse.pagination);
      }
      catch (error) {
          toast.error(getErrorMessage(error, "Failed to load featured promotion details."));
          setRequests([]);
          setPagination(null);
      }
      finally {
          setLoading(false);
      }
  };

  useEffect(() => {
      let isActive = true;
      void Promise.resolve().then(async () => {
          try {
              setLoading(true);
              const [settingsResponse, eventsResponse, requestsResponse,] = await Promise.all([
                  getFeaturedEventSettings(),
                  getEligibleFeaturedEvents(),
                  getOrganizerFeaturedEventRequests(requestParams),
              ]);
              if (!isActive) {
                  return;
              }
              const eligibleEvents = eventsResponse.data ||
                  eventsResponse.events ||
                  [];
              setSettings(settingsResponse.settings);
              setEvents(eligibleEvents);
              setRequests(requestsResponse.data ||
                  requestsResponse.requests ||
                  []);
              setPagination(requestsResponse.pagination);
              if (!selectedEventId && eligibleEvents[0]) {
                  setSelectedEventId(eligibleEvents[0]._id);
              }
          }
          catch (error) {
              if (!isActive) {
                  return;
              }
              toast.error(getErrorMessage(error, "Failed to load featured promotion details."));
              setRequests([]);
              setPagination(null);
          }
          finally {
              if (isActive) {
                  setLoading(false);
              }
          }
      });
      return () => {
          isActive = false;
      };
  }, [requestParams, refreshNonce, selectedEventId]);

  useEffect(() => {
      if (previousPageRef.current !==
          currentPage) {
          resultsRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "start",
          });
      }
      previousPageRef.current = currentPage;
  }, [currentPage]);

  const updateFilters = (updates: Record<string, string | undefined>) => {
      router.replace(createUrlWithQueryParams(pathname, searchParams, updates, true), {
          scroll: false,
      });
  };

  const refresh = () => {
      setRefreshNonce((value) => value + 1);
  };

  const openPayment = async (request: FeaturedEventRequest, order?: RazorpayOrder | null, key?: string) => {
      if (request.status !== "payment_pending" ||
          !request.approvedStartDate ||
          !request.approvedEndDate) {
          toast.error("Admin approval and an approved promotion period are required before payment.");
          return;
      }
      const approvedPeriod = `${formatEventDate(request.approvedStartDate)} to ${formatEventDate(request.approvedEndDate)}`;
      const confirmed = window.confirm(`Pay ${formatCurrency(request.promotionFee)} for the approved promotion period ${approvedPeriod}?`);
      if (!confirmed) {
          return;
      }
      const paymentOrder = order && key
          ? {
              order,
              key,
          }
          : await createFeaturedEventPaymentOrder(request._id);
      if ("freePromotion" in paymentOrder &&
          paymentOrder.freePromotion) {
          toast.success(paymentOrder.message);
          refresh();
          return;
      }
      const paymentMessage = "message" in paymentOrder
          ? paymentOrder.message
          : "No payment is required.";
      if (!paymentOrder.order || !paymentOrder.key) {
          toast.success(paymentMessage);
          refresh();
          return;
      }
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
          toast.error("Razorpay checkout could not be loaded. Please try again.");
          return;
      }
      const Razorpay = (window as Window & {
          Razorpay?: RazorpayConstructor;
      }).Razorpay;
      if (!Razorpay) {
          toast.error("Razorpay checkout is unavailable.");
          return;
      }
      const event = getRequestEvent(request);
      const options: RazorpayOptions = {
          key: paymentOrder.key,
          amount: Number(paymentOrder.order.amount),
          currency: paymentOrder.order.currency,
          name: "EventZentro",
          description: `Featured promotion for ${event?.title || "event"}`,
          order_id: paymentOrder.order.id,
          handler: async (paymentResponse) => {
              try {
                  const verification = await verifyFeaturedEventPayment({
                      requestId: request._id,
                      razorpay_order_id: paymentResponse.razorpay_order_id,
                      razorpay_payment_id: paymentResponse.razorpay_payment_id,
                      razorpay_signature: paymentResponse.razorpay_signature,
                  });
                  toast.success(verification.message);
                  refresh();
              }
              catch (error) {
                  toast.error(getErrorMessage(error, "Payment verification failed."));
              }
          },
          prefill: {
              name: [user?.firstName, user?.lastName]
                  .filter(Boolean)
                  .join(" "),
              email: user?.email,
          },
          notes: {
              requestId: request._id,
              eventId: getEventId(request),
          },
          theme: {
              color: "#f97316",
          },
          modal: {
              ondismiss: () => {
                  toast.error("Payment was not completed.");
              },
          },
      };
      const checkout = new Razorpay(options);
      checkout.on("payment.failed", () => {
          toast.error("Payment failed. Please try again.");
      });
      checkout.open();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!selectedEventId) {
          toast.error("Select an event to feature.");
          return;
      }
      try {
          setFormLoading(true);
          const response = await createFeaturedEventRequest({
              eventId: selectedEventId,
              requestedStartDate: startDate,
              requestedEndDate: endDate,
          });
          toast.success(response.message);
          refresh();
      }
      catch (error) {
          toast.error(getErrorMessage(error, "Failed to submit featured event request."));
      }
      finally {
          setFormLoading(false);
      }
  };

  const handleCancel = async (request: FeaturedEventRequest) => {
      const confirmed = window.confirm("Cancel this featured promotion request?");
      if (!confirmed) {
          return;
      }
      try {
          setActionRequestId(request._id);
          const response = await cancelFeaturedEventRequest(request._id);
          toast.success(response.message);
          refresh();
      }
      catch (error) {
          toast.error(getErrorMessage(error, "Failed to cancel featured request."));
      }
      finally {
          setActionRequestId(null);
      }
  };

  const hasFilters = Boolean(search) || status !== "all";

  return {
    actionRequestId,
    endDate,
    events,
    formLoading,
    handleCancel,
    handleSubmit,
    hasFilters,
    loadData,
    loading,
    openPayment,
    pagination,
    requests,
    resultsRef,
    search,
    selectedEventId,
    setEndDate,
    setSelectedEventId,
    setStartDate,
    settings,
    startDate,
    status,
    updateFilters,
  };
}

export type OrganizerFeaturedEventsState = ReturnType<typeof useOrganizerFeaturedEventsState>;
