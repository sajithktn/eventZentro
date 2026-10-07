"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAppSelector } from "@/store/hooks";
import { cancelBooking, createBooking, createRazorpayOrder, verifyRazorpayPayment } from "@/services/booking.service";
import { getEventById } from "@/services/event.service";
import { getEventPromotions, quotePromotion } from "@/services/promotion.service";
import type { Event } from "@/types/event";
import type { EventPromotionsResponse, PromotionQuoteResponse } from "@/types/promotion";
import { getTicketsSold, hasEventEnded } from "@/utils/event";
import { RazorpayOptions, loadRazorpayScript } from "./razorpay";
import { eventEndedBookingMessage, getAxiosMessage } from "./utils";

export function useEventDetailsState() {
  const params = useParams<{
      id: string;
  }>();

  const router = useRouter();

  const { user, isAuthChecked } = useAppSelector((state) => state.auth);

  const [event, setEvent] = useState<Event | null>(null);

  const [promotions, setPromotions] = useState<EventPromotionsResponse["promotions"]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [quantity, setQuantity] = useState(1);

  const [booking, setBooking] = useState(false);

  const [couponInput, setCouponInput] = useState("");

  const [activeCouponCode, setActiveCouponCode] = useState<string | undefined>();

  const [quote, setQuote] = useState<PromotionQuoteResponse | null>(null);

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
          }
          catch {
              if (isActive) {
                  setError("Event details could not be loaded.");
              }
          }
          finally {
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

  const isEventCompleted = Boolean(event &&
      (event.status === "completed" ||
          hasEventEnded(event.eventDate, event.endTime)));

  const bookingUnavailable = isEventCompleted || isSoldOut;

  const soldPercent = totalTickets > 0
      ? Math.min(100, Math.round((soldTickets / totalTickets) * 100))
      : 0;

  const fallbackSubtotal = useMemo(() => quantity * ticketPrice, [quantity, ticketPrice]);

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
          }
          catch (quoteFailure: unknown) {
              if (!isActive) {
                  return;
              }
              const message = getAxiosMessage(quoteFailure, "Failed to calculate promotion.");
              if (activeCouponCode) {
                  setCouponError(message);
                  setActiveCouponCode(undefined);
                  return;
              }
              setQuote(null);
              setQuoteError(message);
          }
          finally {
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

  const automaticOfferApplied = appliedPromotion?.promotionMode === "automatic";

  const automaticPromotions = promotions.filter((promotion) => promotion.promotionMode === "automatic");

  const publicCoupons = promotions.filter((promotion) => promotion.promotionMode === "coupon" && promotion.code);

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
      }
      catch (applyFailure: unknown) {
          const message = getAxiosMessage(applyFailure, "Failed to apply coupon.");
          setActiveCouponCode(undefined);
          setCouponError(message);
          toast.error(message);
      }
      finally {
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
      }
      catch {
          toast.error("Could not copy coupon code.");
      }
  };

  const releaseBooking = async (bookingId: string) => {
      try {
          await cancelBooking(bookingId);
      }
      catch {
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
          const bookingResponse = await createBooking(event._id, quantity, activeCouponCode);
          const bookingId = bookingResponse.booking._id;
          if (bookingResponse.booking.paymentStatus === "paid" ||
              bookingResponse.booking.totalAmount === 0) {
              if (bookingResponse.event) {
                  setEvent(bookingResponse.event);
              }
              toast.success(bookingResponse.message ||
                  "Ticket booked successfully.");
              router.push("/my-tickets");
              return;
          }
          const scriptLoaded = await loadRazorpayScript();
          if (!scriptLoaded) {
              await releaseBooking(bookingId);
              toast.error("Razorpay checkout could not be loaded. Please try again.");
              setBooking(false);
              return;
          }
          const paymentOrder = await createRazorpayOrder(bookingId);
          if (paymentOrder.freeBooking || !paymentOrder.order) {
              toast.success(paymentOrder.message || "Ticket booked successfully.");
              router.push("/my-tickets");
              return;
          }
          const options: RazorpayOptions = {
              key: paymentOrder.key,
              amount: Number(paymentOrder.order.amount),
              currency: paymentOrder.order.currency,
              name: "EventZentro",
              description: `${quantity} ${quantity === 1 ? "ticket" : "tickets"} for ${event.title}`,
              order_id: paymentOrder.order.id,
              handler: async (paymentResponse) => {
                  try {
                      const verificationResponse = await verifyRazorpayPayment({
                          bookingId,
                          razorpay_order_id: paymentResponse.razorpay_order_id,
                          razorpay_payment_id: paymentResponse.razorpay_payment_id,
                          razorpay_signature: paymentResponse.razorpay_signature,
                      });
                      toast.success(verificationResponse.message ||
                          "Payment completed successfully.");
                      router.push("/my-tickets");
                  }
                  catch (verificationError: unknown) {
                      toast.error(getAxiosMessage(verificationError, "Payment verification failed."));
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
                      toast.error("Payment was not completed. Please try again.");
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
      }
      catch (bookingFailure: unknown) {
          toast.error(getAxiosMessage(bookingFailure, "Failed to start booking payment."));
          setBooking(false);
      }
  };

  return {
    appliedPromotion,
    automaticOfferApplied,
    automaticPromotions,
    availableTickets,
    booking,
    bookingUnavailable,
    copyCoupon,
    couponError,
    couponInput,
    decreaseQuantity,
    discountAmount,
    error,
    event,
    handleApplyCoupon,
    handleBooking,
    handleRemoveDiscounts,
    increaseQuantity,
    isAuthChecked,
    isEventCompleted,
    isSoldOut,
    loading,
    payableAmount,
    promotions,
    publicCoupons,
    quantity,
    quote,
    quoteError,
    quoteLoading,
    setCouponError,
    setCouponInput,
    soldPercent,
    soldTickets,
    subtotal,
    ticketPrice,
    totalTickets,
    user,
  };
}

export type EventDetailsState = ReturnType<typeof useEventDetailsState>;
