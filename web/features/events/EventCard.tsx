import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  Clock3,
  MapPin,
  Ticket,
} from "lucide-react";
import type { Event } from "@/types/event";
import {
  fallbackEventImage,
  formatCurrency,
  formatEventDate,
} from "@/utils/event";

interface EventCardProps {
  event: Event;
}

export default function EventCard({
  event,
}: EventCardProps) {
  const availableTickets = event.availableTickets ?? 0;
  const isSoldOut = availableTickets <= 0;

  const eventLocation = event.city
    ? `${event.venue}, ${event.city}`
    : event.venue;

  return (
    <article className="group relative overflow-hidden rounded-[24px] border border-white/10 bg-[#111114] shadow-[0_20px_60px_rgba(0,0,0,0.25)] transition-all duration-500 hover:-translate-y-2 hover:border-orange-400/40 hover:shadow-[0_25px_70px_rgba(249,115,22,0.16)]">
      <div className="relative h-60 overflow-hidden">
        <img
          src={event.bannerImage || fallbackEventImage}
          alt={event.title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-[#111114] via-black/10 to-transparent" />

        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />

        <div className="absolute left-4 top-4">
          <div className="flex flex-col items-start gap-2">
            <span className="inline-flex rounded-full border border-white/15 bg-black/45 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
              {event.category}
            </span>

            {event.bestPromotion && (
              <span className="inline-flex rounded-full border border-orange-200/50 bg-orange-500 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-white shadow-lg shadow-orange-950/20">
                {event.bestPromotion.displayText}
              </span>
            )}
          </div>
        </div>

        <div className="absolute right-4 top-4">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md ${
              isSoldOut
                ? "bg-red-500/90"
                : "bg-emerald-500/90"
            }`}
          >
            <Ticket size={13} />

            {isSoldOut
              ? "Sold out"
              : `${availableTickets} left`}
          </span>
        </div>

        <div className="absolute bottom-4 left-4">
          <p className="text-2xl font-black text-white">
            {event.ticketPrice === 0
              ? "Free"
              : formatCurrency(event.ticketPrice)}
          </p>
        </div>
      </div>

      <div className="p-5">
        <h2 className="line-clamp-1 text-xl font-bold tracking-tight text-white transition-colors group-hover:text-orange-400">
          {event.title}
        </h2>

        <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-zinc-400">
          {event.description}
        </p>

        <div className="mt-5 space-y-3">
          <div className="flex items-center gap-3 text-sm text-zinc-300">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
              <CalendarDays size={17} />
            </span>

            <span>
              {formatEventDate(event.eventDate)}
            </span>
          </div>

          <div className="flex items-center gap-3 text-sm text-zinc-300">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-yellow-500/10 text-yellow-400">
              <Clock3 size={17} />
            </span>

            <span>{event.startTime}</span>
          </div>

          <div className="flex items-center gap-3 text-sm text-zinc-300">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
              <MapPin size={17} />
            </span>

            <span className="line-clamp-1">
              {eventLocation}
            </span>
          </div>
        </div>

        <Link
          href={`/events/${event._id}`}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 px-4 py-3 text-sm font-bold text-white transition-all duration-300 hover:gap-3 hover:shadow-[0_12px_35px_rgba(249,115,22,0.3)]"
        >
          View event
          <ArrowUpRight size={17} />
        </Link>
      </div>
    </article>
  );
}
