import type { Booking } from "@/types/booking";
import type { Event } from "@/types/event";

export const getBookingEvent = (booking: Booking): Event | null => {
  if (!booking.event || typeof booking.event === "string") {
    return null;
  }

  return booking.event;
};

export const formatBookingDate = (date: string) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
