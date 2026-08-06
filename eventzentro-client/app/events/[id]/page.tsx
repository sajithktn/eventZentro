"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import {
  ArrowLeft,
  BadgePercent,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Copy,
  IndianRupee,
  MapPin,
  Minus,
  Plus,
  ShieldCheck,
  Tag,
  Ticket,
  UserRound,
  X,
} from "lucide-react";

import { useAppSelector } from "@/redux/hooks";
import {
  cancelBooking,
  createBooking,
  createRazorpayOrder,
  verifyRazorpayPayment,
} from "@/services/booking.service";
import { getEventById } from "@/services/event.service";
import {
  getEventPromotions,
  quotePromotion,
} from "@/services/promotion.service";
import type { Event } from "@/types/event";
import type {
  EventPromotionsResponse,
  PromotionQuoteResponse,
} from "@/types/promotion";
import {
  fallbackEventImage,
  formatCurrency,
  formatEventDate,
  getOrganizerName,
  getTicketsSold,
  hasEventEnded,
} from "@/utils/event";

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
    bookingId: string;
    eventId: string;
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

declare global {
  interface Window {
    Razorpay: new (
      options: RazorpayOptions
    ) => RazorpayInstance;
  }
}

const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(true));
      existingScript.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");

    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });
};

const getAxiosMessage = (
  error: unknown,
  fallback: string
) => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || fallback;
  }

  return error instanceof Error ? error.message : fallback;
};

const eventEndedBookingMessage =
  "This event has already ended and is no longer available for booking.";

export default function EventDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const { user, isAuthChecked } = useAppSelector(
    (state) => state.auth
  );

  const [event, setEvent] = useState<Event | null>(null);
  const [promotions, setPromotions] = useState<
    EventPromotionsResponse["promotions"]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [booking, setBooking] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [activeCouponCode, setActiveCouponCode] =
    useState<string | undefined>();
  const [quote, setQuote] =
    useState<PromotionQuoteResponse | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState("");
  const [couponError, setCouponError] = useState("");

  useEffect(() => {
    let isActive = true;

    const fetchEvent = async () => {
      try {
        setLoading(true);
        setError("");

        const [currentEvent, offersResponse] = await Promise.all([
          getEventById(params.id),
          getEventPromotions(params.id),
        ]);

        if (!isActive) {
          return;
        }

        setEvent(currentEvent);
        setPromotions(offersResponse.promotions || []);
      } catch {
        if (isActive) {
          setError("Event details could not be loaded.");
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    fetchEvent();

    return () => {
      isActive = false;
    };
  }, [params.id]);

  const availableTickets = Number(event?.availableTickets ?? 0);
  const totalTickets = Number(event?.totalTickets ?? 0);
  const ticketPrice = Number(event?.ticketPrice ?? 0);
  const soldTickets = event ? Number(getTicketsSold(event) ?? 0) : 0;
  const isSoldOut = availableTickets <= 0;
  const isEventCompleted = Boolean(
    event &&
      (event.status === "completed" ||
        hasEventEnded(
          event.eventDate,
          event.endTime
        ))
  );
  const bookingUnavailable =
    isEventCompleted || isSoldOut;

  const soldPercent =
    totalTickets > 0
      ? Math.min(
          100,
          Math.round((soldTickets / totalTickets) * 100)
        )
      : 0;

  const fallbackSubtotal = useMemo(
    () => quantity * ticketPrice,
    [quantity, ticketPrice]
  );

  useEffect(() => {
    let isActive = true;

    if (!event || ticketPrice <= 0 || isEventCompleted) {
      void Promise.resolve().then(() => {
        if (!isActive) {
          return;
        }

        setQuote(null);
        setQuoteError("");
        setCouponError("");
      });

      return () => {
        isActive = false;
      };
    }

    const fetchQuote = async () => {
      try {
        setQuoteLoading(true);
        setQuoteError("");

        const response = await quotePromotion({
          eventId: event._id,
          ticketCount: quantity,
          couponCode: activeCouponCode,
        });

        if (!isActive) {
          return;
        }

        setQuote(response);
        setCouponError(response.couponError || "");
      } catch (quoteFailure: unknown) {
        if (!isActive) {
          return;
        }

        const message = getAxiosMessage(
          quoteFailure,
          "Failed to calculate promotion."
        );

        if (activeCouponCode) {
          setCouponError(message);
          setActiveCouponCode(undefined);
          return;
        }

        setQuote(null);
        setQuoteError(message);
      } finally {
        if (isActive) {
          setQuoteLoading(false);
        }
      }
    };

    const timer = window.setTimeout(fetchQuote, 200);

    return () => {
      isActive = false;
      window.clearTimeout(timer);
    };
  }, [
    activeCouponCode,
    event,
    isEventCompleted,
    quantity,
    ticketPrice,
  ]);

  const appliedPromotion = quote?.appliedPromotion || null;
  const subtotal = quote?.subtotal ?? fallbackSubtotal;
  const discountAmount = quote?.discountAmount ?? 0;
  const payableAmount = quote?.finalAmount ?? fallbackSubtotal;
  const automaticOfferApplied =
    appliedPromotion?.promotionMode === "automatic";

  const automaticPromotions = promotions.filter(
    (promotion) => promotion.promotionMode === "automatic"
  );

  const publicCoupons = promotions.filter(
    (promotion) => promotion.promotionMode === "coupon" && promotion.code
  );

  const increaseQuantity = () => {
    if (!bookingUnavailable && quantity < availableTickets) {
      setQuantity((current) => current + 1);
    }
  };

  const decreaseQuantity = () => {
    if (!bookingUnavailable && quantity > 1) {
      setQuantity((current) => current - 1);
    }
  };

  const handleApplyCoupon = async (code?: string) => {
    if (!event || ticketPrice === 0) {
      return;
    }

    if (isEventCompleted) {
      toast.error(eventEndedBookingMessage);
      return;
    }

    const normalizedCode = (code || couponInput).trim().toUpperCase();

    if (!normalizedCode) {
      toast.error("Enter a coupon code.");
      return;
    }

    try {
      setQuoteLoading(true);
      setCouponError("");

      const response = await quotePromotion({
        eventId: event._id,
        ticketCount: quantity,
        couponCode: normalizedCode,
      });

      setQuote(response);
      setCouponInput(normalizedCode);

      if (response.couponError) {
        setActiveCouponCode(undefined);
        setCouponError(response.couponError);
        toast.error(response.couponError);
        return;
      }

      setActiveCouponCode(normalizedCode);
      toast.success(response.message);
    } catch (applyFailure: unknown) {
      const message = getAxiosMessage(
        applyFailure,
        "Failed to apply coupon."
      );

      setActiveCouponCode(undefined);
      setCouponError(message);
      toast.error(message);
    } finally {
      setQuoteLoading(false);
    }
  };

  const handleRemoveDiscounts = () => {
    setActiveCouponCode(undefined);
    setCouponInput("");
    setCouponError("");
  };

  const copyCoupon = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Coupon code copied.");
    } catch {
      toast.error("Could not copy coupon code.");
    }
  };

  const releaseBooking = async (bookingId: string) => {
    try {
      await cancelBooking(bookingId);
    } catch {
      return;
    }
  };

  const handleBooking = async () => {
    if (!event) {
      return;
    }

    if (isEventCompleted) {
      toast.error(eventEndedBookingMessage);
      return;
    }

    if (!user) {
      toast.error("Please login to book tickets.");
      router.push("/login");
      return;
    }

    if (isSoldOut) {
      toast.error("This event is sold out.");
      return;
    }

    if (quantity > availableTickets) {
      toast.error("Not enough tickets are available.");
      return;
    }

    try {
      setBooking(true);

      const bookingResponse = await createBooking(
        event._id,
        quantity,
        activeCouponCode
      );

      const bookingId = bookingResponse.booking._id;

      if (
        bookingResponse.booking.paymentStatus === "paid" ||
        bookingResponse.booking.totalAmount === 0
      ) {
        if (bookingResponse.event) {
          setEvent(bookingResponse.event);
        }

        toast.success(
          bookingResponse.message ||
            "Ticket booked successfully."
        );

        router.push("/my-tickets");
        return;
      }

      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded) {
        await releaseBooking(bookingId);
        toast.error(
          "Razorpay checkout could not be loaded. Please try again."
        );
        setBooking(false);
        return;
      }

      const paymentOrder = await createRazorpayOrder(bookingId);

      if (paymentOrder.freeBooking || !paymentOrder.order) {
        toast.success(
          paymentOrder.message || "Ticket booked successfully."
        );
        router.push("/my-tickets");
        return;
      }

      const options: RazorpayOptions = {
        key: paymentOrder.key,
        amount: Number(paymentOrder.order.amount),
        currency: paymentOrder.order.currency,
        name: "EventZentro",
        description: `${quantity} ${
          quantity === 1 ? "ticket" : "tickets"
        } for ${event.title}`,
        order_id: paymentOrder.order.id,

        handler: async (paymentResponse) => {
          try {
            const verificationResponse =
              await verifyRazorpayPayment({
                bookingId,
                razorpay_order_id:
                  paymentResponse.razorpay_order_id,
                razorpay_payment_id:
                  paymentResponse.razorpay_payment_id,
                razorpay_signature:
                  paymentResponse.razorpay_signature,
              });

            toast.success(
              verificationResponse.message ||
                "Payment completed successfully."
            );

            router.push("/my-tickets");
          } catch (verificationError: unknown) {
            toast.error(
              getAxiosMessage(
                verificationError,
                "Payment verification failed."
              )
            );

            setBooking(false);
          }
        },

        prefill: {
          name: `${user.firstName} ${user.lastName ?? ""}`.trim(),
          email: user.email,
        },

        notes: {
          bookingId,
          eventId: event._id,
        },

        theme: {
          color: "#f97316",
        },

        modal: {
          ondismiss: () => {
            void releaseBooking(bookingId);
            setBooking(false);

            toast.error(
              "Payment was not completed. Please try again."
            );
          },
        },
      };

      const razorpayCheckout = new window.Razorpay(options);

      razorpayCheckout.on("payment.failed", () => {
        void releaseBooking(bookingId);
        setBooking(false);

        toast.error("Payment failed. Please try again.");
      });

      razorpayCheckout.open();
    } catch (bookingFailure: unknown) {
      toast.error(
        getAxiosMessage(
          bookingFailure,
          "Failed to start booking payment."
        )
      );

      setBooking(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-[75vh] items-center justify-center bg-[#fffaf5] px-6">
        <div className="text-center">
          <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-orange-100 border-t-orange-500" />
          <p className="mt-4 text-sm font-medium text-slate-500">
            Loading event details...
          </p>
        </div>
      </main>
    );
  }

  if (error || !event) {
    return (
      <main className="flex min-h-[75vh] items-center justify-center bg-[#fffaf5] px-6">
        <div className="w-full max-w-md rounded-3xl border border-orange-100 bg-white p-8 text-center shadow-xl shadow-orange-100/50">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
            <Ticket size={26} />
          </div>

          <h1 className="mt-5 text-2xl font-bold text-slate-900">
            Event not found
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {error || "This event is no longer available."}
          </p>

          <Link
            href="/events"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 px-5 py-3 text-sm font-bold text-white transition hover:shadow-lg hover:shadow-orange-200"
          >
            <ArrowLeft size={17} />
            Browse events
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fffaf5] text-slate-900">
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-rose-50">
        <img
          src={event.bannerImage || fallbackEventImage}
          alt=""
          className="absolute inset-0 h-full w-full scale-110 object-cover opacity-[0.08] blur-3xl"
        />

        <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-6 lg:px-8">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm backdrop-blur-md transition hover:border-orange-300 hover:text-orange-600"
          >
            <ArrowLeft size={17} />
            Back to events
          </Link>

          <div className="mt-7 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-orange-200 bg-orange-100 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-orange-600">
                  {event.category}
                </span>

                {event.bestPromotion && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-4 py-2 text-xs font-black uppercase tracking-wide text-white">
                    <BadgePercent size={15} />
                    {event.bestPromotion.displayText}
                  </span>
                )}

                <span
                  className={`rounded-full px-4 py-2 text-xs font-bold ${
                    bookingUnavailable
                      ? "bg-red-100 text-red-600"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {isEventCompleted
                    ? "Event completed"
                    : isSoldOut
                    ? "Sold out"
                    : `${availableTickets} tickets available`}
                </span>
              </div>

              <h1 className="mt-6 max-w-3xl text-4xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                {event.title}
              </h1>

              <p className="mt-5 line-clamp-3 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                {event.description}
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <div className="flex items-center gap-3 rounded-2xl border border-orange-100 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-md">
                  <CalendarDays size={19} className="text-orange-500" />
                  <div>
                    <p className="text-xs text-slate-400">Event date</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {formatEventDate(event.eventDate)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-yellow-100 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-md">
                  <Clock3 size={19} className="text-yellow-500" />
                  <div>
                    <p className="text-xs text-slate-400">Event time</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {event.startTime}
                      {event.endTime ? ` - ${event.endTime}` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-red-100 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-md">
                  <MapPin size={19} className="text-red-500" />
                  <div>
                    <p className="text-xs text-slate-400">Location</p>
                    <p className="max-w-52 truncate text-sm font-semibold text-slate-800">
                      {event.venue}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-[30px] border border-orange-100 bg-white p-2 shadow-[0_30px_80px_rgba(249,115,22,0.16)]">
              <img
                src={event.bannerImage || fallbackEventImage}
                alt={event.title}
                className="h-[320px] w-full rounded-[24px] object-cover transition-transform duration-700 group-hover:scale-[1.03] sm:h-[400px]"
              />

              <div className="pointer-events-none absolute inset-2 rounded-[24px] bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

              <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-white/80">
                    Ticket price
                  </p>
                  <p className="mt-1 text-3xl font-black text-white">
                    {ticketPrice === 0
                      ? "Free"
                      : formatCurrency(ticketPrice)}
                  </p>
                </div>

                <span className="rounded-full border border-white/30 bg-white/20 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md">
                  {isEventCompleted
                    ? "Completed"
                    : `${availableTickets} left`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 pb-16 sm:px-6 lg:grid-cols-[1fr_390px] lg:px-8">
        <div className="space-y-6">
          <div className="rounded-[26px] border border-orange-100 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-3">
              <span className="h-7 w-1.5 rounded-full bg-gradient-to-b from-orange-400 to-red-500" />
              <h2 className="text-2xl font-black text-slate-900">
                About this event
              </h2>
            </div>

            <p className="mt-5 whitespace-pre-line text-sm leading-7 text-slate-600 sm:text-base">
              {event.description}
            </p>
          </div>

          <div className="rounded-[26px] border border-orange-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                  <BadgePercent size={22} />
                </span>
                <div>
                  <h2 className="text-2xl font-black text-slate-900">
                    Offers available
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Automatic offers and public coupon codes for this event.
                  </p>
                </div>
              </div>
            </div>

            {promotions.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center text-sm font-semibold text-slate-500">
                No public offers are active right now.
              </div>
            ) : (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {promotions.map((promotion) => (
                  <article
                    key={promotion.id}
                    className="rounded-2xl border border-orange-100 bg-orange-50/50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-slate-900">
                          {promotion.name}
                        </p>
                        <p className="mt-1 text-sm font-bold text-orange-600">
                          {promotion.displayText}
                        </p>
                      </div>

                      <span className="rounded-full bg-white px-3 py-1 text-[11px] font-black uppercase tracking-wide text-slate-600">
                        {promotion.promotionMode === "coupon"
                          ? "Coupon"
                          : "Automatic"}
                      </span>
                    </div>

                    {promotion.code && (
                      <div className="mt-4 flex items-center gap-2">
                        <code className="rounded-xl border border-orange-200 bg-white px-3 py-2 text-sm font-black tracking-wide text-slate-900">
                          {promotion.code}
                        </code>
                        <button
                          type="button"
                          onClick={() => copyCoupon(promotion.code || "")}
                          className="flex h-10 w-10 items-center justify-center rounded-xl border border-orange-200 bg-white text-orange-600 transition hover:bg-orange-100"
                          aria-label={`Copy ${promotion.code}`}
                        >
                          <Copy size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            void handleApplyCoupon(promotion.code)
                          }
                          disabled={isEventCompleted}
                          className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-black text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                        >
                          Apply
                        </button>
                      </div>
                    )}

                    <div className="mt-4 space-y-1 text-xs font-semibold text-slate-500">
                      {promotion.minimumBookingAmount !== undefined && (
                        <p>
                          Minimum booking{" "}
                          {formatCurrency(
                            promotion.minimumBookingAmount
                          )}
                        </p>
                      )}
                      {promotion.maximumDiscountAmount !== undefined && (
                        <p>
                          Maximum discount{" "}
                          {formatCurrency(
                            promotion.maximumDiscountAmount
                          )}
                        </p>
                      )}
                      {promotion.remainingOfferTickets !== undefined && (
                        <p>
                          Only {promotion.remainingOfferTickets} offer
                          tickets left
                        </p>
                      )}
                      <p>
                        Valid until {formatEventDate(promotion.validUntil)}
                      </p>
                    </div>

                    {promotion.terms.length > 0 && (
                      <ul className="mt-3 space-y-1 text-xs text-slate-500">
                        {promotion.terms.slice(0, 3).map((term) => (
                          <li key={term}>{term}</li>
                        ))}
                      </ul>
                    )}
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-[22px] border border-orange-100 bg-gradient-to-br from-orange-50 to-white p-5 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                <Ticket size={21} />
              </div>
              <p className="mt-4 text-sm text-slate-500">
                Tickets remaining
              </p>
              <p className="mt-1 text-2xl font-black text-slate-900">
                {availableTickets}
              </p>
            </div>

            <div className="rounded-[22px] border border-yellow-100 bg-gradient-to-br from-yellow-50 to-white p-5 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-yellow-100 text-yellow-600">
                <IndianRupee size={21} />
              </div>
              <p className="mt-4 text-sm text-slate-500">
                Ticket price
              </p>
              <p className="mt-1 text-2xl font-black text-slate-900">
                {ticketPrice === 0
                  ? "Free"
                  : formatCurrency(ticketPrice)}
              </p>
            </div>

            <div className="rounded-[22px] border border-red-100 bg-gradient-to-br from-red-50 to-white p-5 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                <UserRound size={21} />
              </div>
              <p className="mt-4 text-sm text-slate-500">
                Event organizer
              </p>
              <p className="mt-1 line-clamp-1 text-lg font-bold text-slate-900">
                {getOrganizerName(event)}
              </p>
            </div>
          </div>

          {totalTickets > 0 && (
            <div className="rounded-[26px] border border-orange-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-slate-900">
                    Ticket availability
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {soldTickets} of {totalTickets} tickets sold
                  </p>
                </div>
                <p className="text-xl font-black text-orange-500">
                  {soldPercent}%
                </p>
              </div>

              <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-orange-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 transition-all duration-700"
                  style={{ width: `${soldPercent}%` }}
                />
              </div>
            </div>
          )}

          <div className="rounded-[26px] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-orange-50 p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                <ShieldCheck size={22} />
              </div>

              <div>
                <h3 className="font-bold text-slate-900">
                  Secure ticket booking
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Your ticket will be available on the My Tickets page
                  after successful confirmation.
                </p>
              </div>
            </div>
          </div>
        </div>

        <aside className="h-fit rounded-[26px] border border-orange-100 bg-white p-6 shadow-[0_25px_70px_rgba(249,115,22,0.12)] lg:sticky lg:top-24">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-orange-500">
                {isEventCompleted
                  ? "Event completed"
                  : "Reserve your spot"}
              </p>
              <h2 className="mt-1 text-2xl font-black text-slate-900">
                {isEventCompleted
                  ? "Bookings closed"
                  : "Book tickets"}
              </h2>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
              <Ticket size={23} />
            </div>
          </div>

          {isEventCompleted && (
            <p className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
              This event has ended and ticket booking is closed.
            </p>
          )}

          <div className="mt-6">
            <p className="text-sm font-semibold text-slate-700">
              Ticket quantity
            </p>

            <div className="mt-3 flex items-center justify-between rounded-2xl border border-orange-100 bg-orange-50/60 p-2">
              <button
                type="button"
                onClick={decreaseQuantity}
                disabled={quantity <= 1 || bookingUnavailable}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-orange-100 bg-white text-slate-700 shadow-sm transition hover:border-orange-300 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="Decrease ticket quantity"
              >
                <Minus size={19} />
              </button>

              <div className="text-center">
                <p className="text-2xl font-black text-slate-900">
                  {quantity}
                </p>
                <p className="text-xs text-slate-500">
                  {quantity === 1 ? "Ticket" : "Tickets"}
                </p>
              </div>

              <button
                type="button"
                onClick={increaseQuantity}
                disabled={
                  quantity >= availableTickets ||
                  bookingUnavailable
                }
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-orange-100 bg-white text-slate-700 shadow-sm transition hover:border-orange-300 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="Increase ticket quantity"
              >
                <Plus size={19} />
              </button>
            </div>
          </div>

          {ticketPrice > 0 && (
            <div className="mt-4 rounded-2xl border border-orange-100 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <label
                  htmlFor="couponCode"
                  className="text-sm font-semibold text-slate-700"
                >
                  Coupon code
                </label>

                {quoteLoading && (
                  <span className="text-xs font-semibold text-slate-400">
                    Checking...
                  </span>
                )}
              </div>

              <div className="mt-3 flex gap-2">
                <input
                  id="couponCode"
                  type="text"
                  value={couponInput}
                  onChange={(changeEvent) => {
                    setCouponInput(
                      changeEvent.target.value.toUpperCase()
                    );
                    setCouponError("");
                  }}
                  disabled={
                    quoteLoading ||
                    booking ||
                    isEventCompleted
                  }
                  placeholder="Enter coupon"
                  className="min-w-0 flex-1 rounded-xl border border-orange-100 bg-orange-50/60 px-4 py-3 text-sm font-bold uppercase tracking-wide text-slate-900 outline-none transition placeholder:normal-case placeholder:font-medium placeholder:tracking-normal placeholder:text-slate-400 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-60"
                />

                <button
                  type="button"
                  onClick={() => void handleApplyCoupon()}
                  disabled={
                    quoteLoading ||
                    booking ||
                    isEventCompleted ||
                    !couponInput.trim()
                  }
                  className="inline-flex min-w-24 items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                >
                  Apply
                </button>
              </div>

              {couponError && (
                <p className="mt-2 text-xs font-bold text-red-500">
                  {couponError}
                </p>
              )}

              {publicCoupons.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                    Public coupons
                  </p>
                  {publicCoupons.slice(0, 3).map((promotion) => (
                    <button
                      key={promotion.id}
                      type="button"
                      onClick={() =>
                        void handleApplyCoupon(promotion.code)
                      }
                      disabled={
                        quoteLoading ||
                        booking ||
                        isEventCompleted
                      }
                      className="flex w-full items-center justify-between gap-3 rounded-xl border border-orange-100 bg-orange-50 px-3 py-2 text-left transition hover:border-orange-300 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span>
                        <span className="block text-sm font-black text-slate-900">
                          {promotion.code}
                        </span>
                        <span className="text-xs font-semibold text-orange-600">
                          {promotion.displayText}
                        </span>
                      </span>
                      <Tag size={16} className="text-orange-500" />
                    </button>
                  ))}
                </div>
              )}

              {appliedPromotion && (
                <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  <span className="font-semibold">
                    {appliedPromotion.name} applied
                    {quote?.bestOfferApplied ? " · Best offer applied" : ""}
                  </span>

                  <button
                    type="button"
                    onClick={handleRemoveDiscounts}
                    disabled={booking || isEventCompleted}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Remove discounts"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {automaticOfferApplied && (
                <p className="mt-2 text-xs font-bold text-orange-600">
                  Automatic offer applied.
                </p>
              )}
            </div>
          )}

          {automaticPromotions.length > 0 && (
            <div className="mt-4 rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
              <p className="text-xs font-black uppercase tracking-wide text-orange-500">
                Available automatic offers
              </p>
              <div className="mt-3 space-y-2">
                {automaticPromotions.slice(0, 2).map((promotion) => (
                  <div
                    key={promotion.id}
                    className="rounded-xl bg-white px-3 py-2"
                  >
                    <p className="text-sm font-black text-slate-900">
                      {promotion.name}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {promotion.displayText}
                      {promotion.remainingOfferTickets !== undefined
                        ? ` · ${promotion.remainingOfferTickets} left`
                        : ""}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 rounded-2xl border border-orange-100 bg-[#fffaf5] p-4">
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>Price per ticket</span>
              <span className="font-semibold text-slate-900">
                {ticketPrice === 0 ? "Free" : formatCurrency(ticketPrice)}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
              <span>Quantity</span>
              <span className="font-semibold text-slate-900">
                {quantity}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-900">
                {formatCurrency(subtotal)}
              </span>
            </div>

            {discountAmount > 0 && (
              <div className="mt-3 flex items-center justify-between text-sm text-emerald-600">
                <span>
                  Discount
                  {appliedPromotion
                    ? ` (${appliedPromotion.code || appliedPromotion.name})`
                    : ""}
                </span>
                <span className="font-bold">
                  -{formatCurrency(discountAmount)}
                </span>
              </div>
            )}

            {quoteError && (
              <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-500">
                {quoteError}
              </p>
            )}

            <div className="mt-4 border-t border-orange-100 pt-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">
                  Final payable
                </span>
                <span className="text-2xl font-black text-orange-600">
                  {payableAmount === 0
                    ? "Free"
                    : formatCurrency(payableAmount)}
                </span>
              </div>

              {appliedPromotion && (
                <p className="mt-2 text-xs font-bold text-slate-500">
                  Applied promotion: {appliedPromotion.name}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            disabled={
              booking ||
              quoteLoading ||
              bookingUnavailable ||
              quantity > availableTickets ||
              !isAuthChecked
            }
            onClick={handleBooking}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 px-5 py-4 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:shadow-[0_15px_35px_rgba(249,115,22,0.3)] disabled:cursor-not-allowed disabled:from-slate-300 disabled:via-slate-300 disabled:to-slate-300 disabled:text-slate-500 disabled:shadow-none"
          >
            {isEventCompleted ? (
              "Event completed"
            ) : isSoldOut ? (
              "Sold out"
            ) : booking ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Processing...
              </>
            ) : user ? (
              <>
                <CheckCircle2 size={18} />
                Confirm booking
              </>
            ) : (
              <>
                <UserRound size={18} />
                Login to book
              </>
            )}
          </button>

          {!user && isAuthChecked && (
            <p className="mt-3 text-center text-xs text-slate-500">
              You need to sign in before booking tickets.
            </p>
          )}
        </aside>
      </section>
    </main>
  );
}
