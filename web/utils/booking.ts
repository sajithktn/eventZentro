import type { Booking } from "@/types/booking";
import type { Event } from "@/types/event";

export const getBookingEvent = (booking: Booking): Event | null => {
  if (!booking.event || typeof booking.event === "string") {
    return null;
  }

  return booking.event;
};

export const formatBookingDate = (date?: string | Date | null) => {
  if (!date) {
    return "N/A";
  }
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return "N/A";
  }
  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};
