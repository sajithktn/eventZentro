"use client";

import Link from "next/link";
import { ArrowLeft, BadgePercent, CalendarDays, Clock3, MapPin } from "lucide-react";

import { fallbackEventImage, formatCurrency, formatEventDate } from "@/utils/event";
import type { EventDetailsState } from "./useEventDetailsState";

interface EventDetailsHeroProps {
  event: NonNullable<EventDetailsState["event"]>;
  state: EventDetailsState;
}

export function EventDetailsHero({ event, state }: EventDetailsHeroProps) {
  const {
    availableTickets,
    bookingUnavailable,
    isEventCompleted,
    isSoldOut,
    ticketPrice,
  } = state;

  return (
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

            <h1 className="mt-6 max-w-3xl text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              {event.title}
            </h1>
            <p className="mt-5 line-clamp-3 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              {event.description}
            </p>

            <div className="mt-7 flex flex-wrap gap-2.5 sm:gap-3">
              <HeroMeta icon={<CalendarDays size={19} />} label="Event date">
                {formatEventDate(event.eventDate)}
              </HeroMeta>
              <HeroMeta icon={<Clock3 size={19} />} label="Event time" tone="yellow">
                {event.startTime}
                {event.endTime ? ` - ${event.endTime}` : ""}
              </HeroMeta>
              <HeroMeta icon={<MapPin size={19} />} label="Location" tone="red">
                <span className="block max-w-44 truncate sm:max-w-52">{event.venue}</span>
              </HeroMeta>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-[30px] border border-orange-100 bg-white p-2 shadow-[0_30px_80px_rgba(249,115,22,0.16)]">
            <img
              src={event.bannerImage || fallbackEventImage}
              alt={event.title}
              className="h-[260px] w-full rounded-[24px] object-cover transition-transform duration-700 group-hover:scale-[1.03] sm:h-[360px] lg:h-[400px]"
            />
            <div className="pointer-events-none absolute inset-2 rounded-[24px] bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-white/80">
                  Ticket price
                </p>
                <p className="mt-1 text-3xl font-black text-white">
                  {ticketPrice === 0 ? "Free" : formatCurrency(ticketPrice)}
                </p>
              </div>
              <span className="rounded-full border border-white/30 bg-white/20 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md">
                {isEventCompleted ? "Completed" : `${availableTickets} left`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroMeta({
  children,
  icon,
  label,
  tone = "orange",
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  label: string;
  tone?: "orange" | "red" | "yellow";
}) {
  const colors = {
    orange: "border-orange-100 text-orange-500",
    red: "border-red-100 text-red-500",
    yellow: "border-yellow-100 text-yellow-500",
  };

  return (
    <div className={`flex w-full items-center gap-3 rounded-2xl border bg-white/80 px-4 py-3 shadow-sm backdrop-blur-md sm:w-auto ${colors[tone]}`}>
      <span className="shrink-0">{icon}</span>
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm font-semibold text-slate-800">{children}</p>
      </div>
    </div>
  );
}
