import type { User } from "@/types/auth";
import type { Event } from "@/types/event";

export const fallbackEventImage =
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80";

export const getOrganizerId = (event: Event) => {
  if (!event.organizer) {
    return "";
  }

  if (typeof event.organizer === "string") {
    return event.organizer;
  }

  return event.organizer._id || event.organizer.id || "";
};

const normalizeId = (id?: string) => (id || "").toString();

export const getEventsForUser = (events: Event[], user: User | null) => {
  if (!user) {
    return [];
  }

  if (user.role === "admin") {
    return events;
  }

  const userId = normalizeId(user._id || user.id);

  return events.filter(
    (event) => normalizeId(getOrganizerId(event)) === userId
  );
};

export const getOrganizerName = (event: Event) => {
  if (!event.organizer || typeof event.organizer === "string") {
    return "Organizer";
  }

  return (
    [event.organizer.firstName, event.organizer.lastName]
      .filter(Boolean)
      .join(" ") ||
    event.organizer.email ||
    "Organizer"
  );
};

export const getTicketsSold = (event: Event) => {
  const totalTickets = event.totalTickets || 0;
  const availableTickets = event.availableTickets || 0;

  return Math.max(totalTickets - availableTickets, 0);
};

export const getEventRevenue = (event: Event) =>
  getTicketsSold(event) * event.ticketPrice;

const eventTimePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const getEventEndDateTime = (
  eventDate: string | Date,
  endTime?: string
) => {
  const timeMatch = eventTimePattern.exec(endTime || "");

  if (!timeMatch) {
    return null;
  }

  const eventEndDate =
    eventDate instanceof Date
      ? new Date(eventDate)
      : new Date(eventDate);

  if (Number.isNaN(eventEndDate.getTime())) {
    return null;
  }

  eventEndDate.setHours(
    Number(timeMatch[1]),
    Number(timeMatch[2]),
    0,
    0
  );

  return eventEndDate;
};

export const hasEventEnded = (
  eventDate: string | Date,
  endTime?: string,
  now = new Date()
) => {
  const eventEndDateTime = getEventEndDateTime(
    eventDate,
    endTime
  );

  return Boolean(
    eventEndDateTime &&
      eventEndDateTime.getTime() <= now.getTime()
  );
};

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export const formatEventDate = (date: string) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
