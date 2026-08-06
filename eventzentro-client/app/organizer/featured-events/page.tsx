"use client";

import {
  type FormEvent,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  CalendarDays,
  LoaderCircle,
  Megaphone,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";

import Loader from "@/components/common/Loader";
import Pagination from "@/components/common/Pagination";
import {
  cancelFeaturedEventRequest,
  createFeaturedEventPaymentOrder,
  createFeaturedEventRequest,
  getEligibleFeaturedEvents,
  getFeaturedEventSettings,
  getOrganizerFeaturedEventRequests,
  verifyFeaturedEventPayment,
} from "@/services/featuredEvent.service";
import type { Event } from "@/types/event";
import type {
  FeaturedEventPaymentStatus,
  FeaturedEventRequest,
  FeaturedEventRequestStatus,
  FeaturedEventSettings,
  RazorpayOrder,
} from "@/types/featuredEvent";
import type { PaginationMetadata } from "@/types/pagination";
import { useAppSelector } from "@/redux/hooks";
import {
  formatCurrency,
  formatEventDate,
} from "@/utils/event";
import {
  createUrlWithQueryParams,
  DEFAULT_PAGE_SIZE,
  getPageFromSearchParams,
} from "@/utils/pagination";

interface RazorpayPaymentResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (
    response: RazorpayPaymentResponse
  ) => Promise<void>;
  prefill?: {
    name?: string;
    email?: string;
  };
  notes?: {
    requestId: string;
    eventId?: string;
  };
  theme?: {
    color: string;
  };
  modal?: {
    ondismiss: () => void;
  };
}

interface RazorpayInstance {
  open: () => void;
  on: (
    event: string,
    callback: (response: unknown) => void
  ) => void;
}

type RazorpayConstructor = new (
  options: RazorpayOptions
) => RazorpayInstance;

const paginationTargetId =
  "organizer-featured-events-results";

const fieldClassName =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition hover:border-orange-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-100";

const statusOptions: Array<
  FeaturedEventRequestStatus | "all"
> = [
  "all",
  "pending",
  "payment_pending",
  "paid",
  "approved",
  "rejected",
  "expired",
  "cancelled",
];

const getErrorMessage = (
  error: unknown,
  fallback: string
) => {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;

    return typeof message === "string"
      ? message
      : fallback;
  }

  return error instanceof Error
    ? error.message
    : fallback;
};

const getRequestEvent = (
  request: FeaturedEventRequest
) =>
  request.event && typeof request.event !== "string"
    ? request.event
    : null;

const getEventName = (
  request: FeaturedEventRequest
) => getRequestEvent(request)?.title || "Event";

const getEventId = (request: FeaturedEventRequest) => {
  const event = getRequestEvent(request);

  return event?._id;
};

const statusClasses: Record<
  FeaturedEventRequestStatus,
  string
> = {
  pending: "bg-sky-50 text-sky-700",
  payment_pending: "bg-amber-50 text-amber-700",
  paid: "bg-blue-50 text-blue-700",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
  expired: "bg-slate-100 text-slate-600",
  cancelled: "bg-zinc-100 text-zinc-600",
};

const paymentClasses: Record<
  FeaturedEventPaymentStatus,
  string
> = {
  unpaid: "bg-amber-50 text-amber-700",
  pending: "bg-blue-50 text-blue-700",
  paid: "bg-emerald-50 text-emerald-700",
  failed: "bg-red-50 text-red-700",
  refunded: "bg-slate-100 text-slate-600",
};

const formatDateInput = (date: Date) =>
  date.toISOString().slice(0, 10);

const loadRazorpayScript = (): Promise<boolean> =>
  new Promise((resolve) => {
    const razorpay = (
      window as Window & {
        Razorpay?: RazorpayConstructor;
      }
    ).Razorpay;

    if (razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );

    if (existingScript) {
      existingScript.addEventListener("load", () =>
        resolve(true)
      );
      existingScript.addEventListener("error", () =>
        resolve(false)
      );
      return;
    }

    const script = document.createElement("script");

    script.src =
      "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });

function OrganizerFeaturedEventsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const resultsRef =
    useRef<HTMLDivElement>(null);
  const previousPageRef = useRef(1);
  const user = useAppSelector(
    (state) => state.auth.user
  );

  const currentPage =
    getPageFromSearchParams(searchParams);
  const search = searchParams.get("search") || "";
  const status =
    searchParams.get("status") || "all";

  const [settings, setSettings] =
    useState<FeaturedEventSettings | null>(
      null
    );
  const [events, setEvents] = useState<Event[]>([]);
  const [requests, setRequests] = useState<
    FeaturedEventRequest[]
  >([]);
  const [pagination, setPagination] =
    useState<PaginationMetadata | null>(null);
  const [selectedEventId, setSelectedEventId] =
    useState("");
  const [startDate, setStartDate] = useState(() =>
    formatDateInput(new Date())
  );
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 6);
    return formatDateInput(date);
  });
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] =
    useState(false);
  const [actionRequestId, setActionRequestId] =
    useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] =
    useState(0);

  const requestParams = useMemo(
    () => ({
      page: currentPage,
      limit: DEFAULT_PAGE_SIZE,
      search: search || undefined,
      status:
        status !== "all"
          ? (status as FeaturedEventRequestStatus)
          : undefined,
      sort: "newest",
    }),
    [currentPage, search, status]
  );

  const loadData = async () => {
    try {
      setLoading(true);

      const [
        settingsResponse,
        eventsResponse,
        requestsResponse,
      ] = await Promise.all([
        getFeaturedEventSettings(),
        getEligibleFeaturedEvents(),
        getOrganizerFeaturedEventRequests(
          requestParams
        ),
      ]);

      setSettings(settingsResponse.settings);
      setEvents(
        eventsResponse.data ||
          eventsResponse.events ||
          []
      );
      setRequests(
        requestsResponse.data ||
          requestsResponse.requests ||
          []
      );
      setPagination(requestsResponse.pagination);
    } catch (error) {
      toast.error(
        getErrorMessage(
          error,
          "Failed to load featured promotion details."
        )
      );
      setRequests([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isActive = true;

    void Promise.resolve().then(async () => {
      try {
        setLoading(true);

        const [
          settingsResponse,
          eventsResponse,
          requestsResponse,
        ] = await Promise.all([
          getFeaturedEventSettings(),
          getEligibleFeaturedEvents(),
          getOrganizerFeaturedEventRequests(
            requestParams
          ),
        ]);

        if (!isActive) {
          return;
        }

        const eligibleEvents =
          eventsResponse.data ||
          eventsResponse.events ||
          [];

        setSettings(settingsResponse.settings);
        setEvents(eligibleEvents);
        setRequests(
          requestsResponse.data ||
            requestsResponse.requests ||
            []
        );
        setPagination(requestsResponse.pagination);

        if (!selectedEventId && eligibleEvents[0]) {
          setSelectedEventId(eligibleEvents[0]._id);
        }
      } catch (error) {
        if (!isActive) {
          return;
        }

        toast.error(
          getErrorMessage(
            error,
            "Failed to load featured promotion details."
          )
        );
        setRequests([]);
        setPagination(null);
      } finally {
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
    if (
      previousPageRef.current !==
      currentPage
    ) {
      resultsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }

    previousPageRef.current = currentPage;
  }, [currentPage]);

  const updateFilters = (
    updates: Record<
      string,
      string | undefined
    >
  ) => {
    router.replace(
      createUrlWithQueryParams(
        pathname,
        searchParams,
        updates,
        true
      ),
      {
        scroll: false,
      }
    );
  };

  const refresh = () => {
    setRefreshNonce((value) => value + 1);
  };

  const openPayment = async (
    request: FeaturedEventRequest,
    order?: RazorpayOrder | null,
    key?: string
  ) => {
    if (
      request.status !== "payment_pending" ||
      !request.approvedStartDate ||
      !request.approvedEndDate
    ) {
      toast.error(
        "Admin approval and an approved promotion period are required before payment."
      );
      return;
    }

    const approvedPeriod = `${formatEventDate(
      request.approvedStartDate
    )} to ${formatEventDate(
      request.approvedEndDate
    )}`;
    const confirmed = window.confirm(
      `Pay ${formatCurrency(
        request.promotionFee
      )} for the approved promotion period ${approvedPeriod}?`
    );

    if (!confirmed) {
      return;
    }

    const paymentOrder =
      order && key
        ? {
            order,
            key,
          }
        : await createFeaturedEventPaymentOrder(
            request._id
          );

    if (
      "freePromotion" in paymentOrder &&
      paymentOrder.freePromotion
    ) {
      toast.success(paymentOrder.message);
      refresh();
      return;
    }

    const paymentMessage =
      "message" in paymentOrder
        ? paymentOrder.message
        : "No payment is required.";

    if (!paymentOrder.order || !paymentOrder.key) {
      toast.success(
        paymentMessage
      );
      refresh();
      return;
    }

    const scriptLoaded =
      await loadRazorpayScript();

    if (!scriptLoaded) {
      toast.error(
        "Razorpay checkout could not be loaded. Please try again."
      );
      return;
    }

    const Razorpay = (
      window as Window & {
        Razorpay?: RazorpayConstructor;
      }
    ).Razorpay;

    if (!Razorpay) {
      toast.error(
        "Razorpay checkout is unavailable."
      );
      return;
    }

    const event = getRequestEvent(request);

    const options: RazorpayOptions = {
      key: paymentOrder.key,
      amount: Number(paymentOrder.order.amount),
      currency: paymentOrder.order.currency,
      name: "EventZentro",
      description: `Featured promotion for ${
        event?.title || "event"
      }`,
      order_id: paymentOrder.order.id,
      handler: async (paymentResponse) => {
        try {
          const verification =
            await verifyFeaturedEventPayment({
              requestId: request._id,
              razorpay_order_id:
                paymentResponse.razorpay_order_id,
              razorpay_payment_id:
                paymentResponse.razorpay_payment_id,
              razorpay_signature:
                paymentResponse.razorpay_signature,
            });

          toast.success(verification.message);
          refresh();
        } catch (error) {
          toast.error(
            getErrorMessage(
              error,
              "Payment verification failed."
            )
          );
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
          toast.error(
            "Payment was not completed."
          );
        },
      },
    };

    const checkout = new Razorpay(options);

    checkout.on("payment.failed", () => {
      toast.error("Payment failed. Please try again.");
    });

    checkout.open();
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!selectedEventId) {
      toast.error("Select an event to feature.");
      return;
    }

    try {
      setFormLoading(true);

      const response =
        await createFeaturedEventRequest({
          eventId: selectedEventId,
          requestedStartDate: startDate,
          requestedEndDate: endDate,
        });

      toast.success(response.message);

      refresh();
    } catch (error) {
      toast.error(
        getErrorMessage(
          error,
          "Failed to submit featured event request."
        )
      );
    } finally {
      setFormLoading(false);
    }
  };

  const handleCancel = async (
    request: FeaturedEventRequest
  ) => {
    const confirmed = window.confirm(
      "Cancel this featured promotion request?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionRequestId(request._id);

      const response =
        await cancelFeaturedEventRequest(
          request._id
        );

      toast.success(response.message);
      refresh();
    } catch (error) {
      toast.error(
        getErrorMessage(
          error,
          "Failed to cancel featured request."
        )
      );
    } finally {
      setActionRequestId(null);
    }
  };

  const hasFilters =
    Boolean(search) || status !== "all";

  return (
    <main className="min-h-screen bg-[#fffaf5] px-4 pb-16 pt-6 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <section className="relative overflow-hidden rounded-[30px] border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-rose-50 px-6 py-8 shadow-sm sm:px-8">
          <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-600">
                Featured placement
              </p>

              <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                Paid Event Promotion
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                Request homepage hero placement for your
                published upcoming events and track
                approval, payment and active status.
              </p>
            </div>

            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="inline-flex w-fit items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={17}
                className={
                  loading ? "animate-spin" : ""
                }
              />
              Refresh
            </button>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[390px_1fr]">
          <form
            onSubmit={handleSubmit}
            className="rounded-[24px] border border-orange-100 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                <Megaphone size={22} />
              </span>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-500">
                  New request
                </p>

                <h2 className="text-xl font-black text-slate-950">
                  Feature an event
                </h2>
              </div>
            </div>

            <div className="mt-5 rounded-2xl bg-orange-50 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-orange-500">
                Promotional fee
              </p>

              <p className="mt-1 text-2xl font-black text-slate-950">
                {settings
                  ? formatCurrency(settings.promotionFee)
                  : "Loading..."}
              </p>

              <p className="mt-1 text-xs font-semibold text-slate-500">
                {settings?.requirePaymentBeforeApproval
                  ? "Payment becomes available after admin approval reserves a slot."
                  : "Admin approval can activate the promotion without payment."}
              </p>
            </div>

            <label className="mt-5 block">
              <span className="text-sm font-bold text-slate-700">
                Event
              </span>

              <select
                value={selectedEventId}
                onChange={(changeEvent) =>
                  setSelectedEventId(
                    changeEvent.target.value
                  )
                }
                className={`${fieldClassName} mt-2`}
                disabled={!settings?.isPromotionEnabled}
              >
                <option value="">
                  Select event
                </option>

                {events.map((item) => (
                  <option
                    key={item._id}
                    value={item._id}
                  >
                    {item.title}
                  </option>
                ))}
              </select>
            </label>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <label className="block">
                <span className="text-sm font-bold text-slate-700">
                  Start date
                </span>

                <input
                  type="date"
                  value={startDate}
                  onChange={(changeEvent) =>
                    setStartDate(
                      changeEvent.target.value
                    )
                  }
                  className={`${fieldClassName} mt-2`}
                  disabled={!settings?.isPromotionEnabled}
                />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-700">
                  End date
                </span>

                <input
                  type="date"
                  value={endDate}
                  onChange={(changeEvent) =>
                    setEndDate(
                      changeEvent.target.value
                    )
                  }
                  className={`${fieldClassName} mt-2`}
                  disabled={!settings?.isPromotionEnabled}
                />
              </label>
            </div>

            {!settings?.isPromotionEnabled && (
              <p className="mt-4 rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-600">
                Featured promotion is currently disabled.
              </p>
            )}

            <button
              type="submit"
              disabled={
                formLoading ||
                loading ||
                !settings?.isPromotionEnabled ||
                events.length === 0
              }
              className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 px-4 text-sm font-black text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {formLoading && (
                <LoaderCircle
                  size={17}
                  className="animate-spin"
                />
              )}
              Submit request
            </button>
          </form>

          <section className="rounded-[24px] border border-orange-100 bg-white shadow-sm">
            <div className="border-b border-orange-100 p-5">
              <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-500">
                    Request history
                  </p>

                  <h2 className="text-2xl font-black text-slate-950">
                    Featured Requests
                  </h2>
                </div>

                {hasFilters && (
                  <button
                    type="button"
                    onClick={() =>
                      updateFilters({
                        search: undefined,
                        status: undefined,
                      })
                    }
                    className="inline-flex w-fit items-center gap-2 rounded-xl bg-orange-50 px-4 py-2.5 text-sm font-bold text-orange-600 transition hover:bg-orange-100"
                  >
                    <X size={16} />
                    Clear
                  </button>
                )}
              </div>

              <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_220px]">
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 shadow-sm transition focus-within:border-orange-400 focus-within:ring-4 focus-within:ring-orange-100">
                  <Search
                    size={18}
                    className="shrink-0 text-slate-400"
                  />

                  <input
                    type="text"
                    value={search}
                    onChange={(changeEvent) =>
                      updateFilters({
                        search:
                          changeEvent.target.value,
                      })
                    }
                    placeholder="Search event title, category or venue"
                    className="w-full bg-transparent py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </div>

                <select
                  value={status}
                  onChange={(changeEvent) =>
                    updateFilters({
                      status:
                        changeEvent.target
                          .value === "all"
                          ? undefined
                          : changeEvent.target.value,
                    })
                  }
                  className={fieldClassName}
                >
                  {statusOptions.map((option) => (
                    <option
                      key={option}
                      value={option}
                    >
                      {option === "all"
                        ? "All statuses"
                        : option.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div
              id={paginationTargetId}
              ref={resultsRef}
            />

            {loading ? (
              <div className="flex min-h-80 items-center justify-center">
                <Loader text="Loading featured requests..." />
              </div>
            ) : requests.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                  <CalendarDays size={28} />
                </div>

                <h3 className="mt-5 text-xl font-black text-slate-900">
                  No featured requests found
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Submit a request for one of your
                  published upcoming events.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1040px] text-left text-sm">
                  <thead className="bg-orange-50/70 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-4">Event</th>
                      <th className="px-5 py-4">
                        Promotion period
                      </th>
                      <th className="px-5 py-4">Fee</th>
                      <th className="px-5 py-4">
                        Payment
                      </th>
                      <th className="px-5 py-4">
                        Status
                      </th>
                      <th className="px-5 py-4">
                        Admin note
                      </th>
                      <th className="px-5 py-4 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-orange-50">
                    {requests.map((request) => {
                      const event =
                        getRequestEvent(request);
                      const actionLoading =
                        actionRequestId ===
                        request._id;
                      const canPay =
                        request.status ===
                          "payment_pending" &&
                        request.paymentStatus !==
                          "paid";
                      const canCancel =
                        request.paymentStatus !==
                          "paid" &&
                        [
                          "pending",
                          "payment_pending",
                        ].includes(request.status);

                      return (
                        <tr
                          key={request._id}
                          className="align-top text-slate-700 transition hover:bg-orange-50/40"
                        >
                          <td className="px-5 py-4">
                            <p className="max-w-56 truncate font-black text-slate-900">
                              {getEventName(request)}
                            </p>

                            <p className="mt-1 text-xs font-semibold text-slate-500">
                              {event?.venue ||
                                "Venue unavailable"}
                            </p>
                          </td>

                          <td className="px-5 py-4 text-xs font-semibold text-slate-600">
                            <p className="mb-1 text-[11px] font-black uppercase tracking-wide text-slate-400">
                              {request.approvedStartDate &&
                              request.approvedEndDate
                                ? "Approved"
                                : "Requested"}
                            </p>
                            <p>
                              {formatEventDate(
                                request.approvedStartDate ||
                                  request.requestedStartDate
                              )}
                            </p>
                            <p className="mt-1">
                              to{" "}
                              {formatEventDate(
                                request.approvedEndDate ||
                                  request.requestedEndDate
                              )}
                            </p>
                          </td>

                          <td className="px-5 py-4 font-black text-slate-900">
                            {formatCurrency(
                              request.promotionFee
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <Badge
                              label={
                                request.paymentStatus
                              }
                              className={
                                paymentClasses[
                                  request.paymentStatus
                                ]
                              }
                            />
                          </td>

                          <td className="px-5 py-4">
                            <Badge
                              label={request.status}
                              className={
                                statusClasses[
                                  request.status
                                ]
                              }
                            />
                          </td>

                          <td className="px-5 py-4">
                            <p className="max-w-64 text-xs font-semibold leading-5 text-slate-500">
                              {request.status ===
                              "rejected"
                                ? request.rejectionReason ||
                                  "Rejected"
                                : request.adminNote ||
                                  "No note"}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-2">
                              {canPay && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    openPayment(
                                      request
                                    )
                                  }
                                  disabled={
                                    actionLoading
                                  }
                                  className="inline-flex h-10 min-w-20 items-center justify-center rounded-xl bg-slate-950 px-3 text-xs font-black text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  Pay
                                </button>
                              )}

                              {canCancel && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCancel(
                                      request
                                    )
                                  }
                                  disabled={
                                    actionLoading
                                  }
                                  className="inline-flex h-10 min-w-24 items-center justify-center rounded-xl border border-red-100 bg-red-50 px-3 text-xs font-black text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {actionLoading ? (
                                    <LoaderCircle
                                      size={15}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    "Cancel"
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </section>

        {pagination && (
          <Pagination
            pagination={pagination}
            resultLabel="featured requests"
            className="mt-8"
            scrollTargetId={paginationTargetId}
          />
        )}
      </div>
    </main>
  );
}

function Badge({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1.5 text-xs font-black capitalize ${className}`}
    >
      {label.replace("_", " ")}
    </span>
  );
}

export default function OrganizerFeaturedEventsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#fffaf5] px-4 pb-16 pt-6 sm:px-6">
          <div className="mx-auto flex min-h-80 max-w-7xl items-center justify-center rounded-[24px] border border-orange-100 bg-white shadow-sm">
            <Loader text="Loading featured requests..." />
          </div>
        </main>
      }
    >
      <OrganizerFeaturedEventsContent />
    </Suspense>
  );
}
