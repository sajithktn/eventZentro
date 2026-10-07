"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import type { Event } from "@/types/event";
import { formatCurrency, formatEventDate } from "@/utils/event";

export interface EventSectionProps {
    title: string;
    description: string;
    events: Event[];
    loading: boolean;
    emptyMessage: string;
    showAllHref: string;
}

export function EventSection({ title, description, events, loading, emptyMessage, showAllHref, }: EventSectionProps) {
    return (<section className="rounded-[24px] border border-orange-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-black text-slate-900">
            {title}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {description}
          </p>
        </div>

        <Link href={showAllHref} className="inline-flex w-fit items-center gap-2 text-sm font-bold text-orange-600 transition hover:text-red-600">
          View all

          <ArrowRight size={16}/>
        </Link>
      </div>

      {loading ? (<div className="flex min-h-52 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-orange-100 border-t-orange-500"/>

            <p className="mt-3 text-sm font-medium text-slate-500">
              Loading events...
            </p>
          </div>
        </div>) : events.length === 0 ? (<div className="mt-5 rounded-2xl border-2 border-dashed border-orange-100 bg-orange-50/40 px-6 py-10 text-center">
          <CalendarDays size={30} className="mx-auto text-orange-300"/>

          <p className="mt-3 text-sm font-semibold text-slate-500">
            {emptyMessage}
          </p>
        </div>) : (<div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {events
                .slice(0, 3)
                .map((event) => (<OrganizerEventCard key={event._id} event={event}/>))}
        </div>)}
    </section>);
}

export interface OrganizerEventCardProps {
    event: Event;
}

export function OrganizerEventCard({ event, }: OrganizerEventCardProps) {
    return (<Link href={`/events/${event._id}`} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg">
      <div className="relative h-36 overflow-hidden bg-gradient-to-br from-orange-400 to-red-500">
        {event.bannerImage ? (<img src={event.bannerImage} alt={event.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-110"/>) : (<div className="flex h-full items-center justify-center">
            <CalendarDays size={35} className="text-white/80"/>
          </div>)}

        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-orange-600 shadow-sm">
          {event.category}
        </span>
      </div>

      <div className="p-4">
        <h3 className="line-clamp-2 font-black text-slate-900 transition group-hover:text-orange-600">
          {event.title}
        </h3>

        <div className="mt-3 space-y-2 text-xs font-medium text-slate-500">
          <p className="flex items-center gap-2">
            <CalendarDays size={15} className="shrink-0 text-orange-500"/>

            {formatEventDate(event.eventDate)}
          </p>

          <p className="flex items-center gap-2">
            <MapPin size={15} className="shrink-0 text-orange-500"/>

            <span className="truncate">
              {event.venue}
            </span>
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
          <span className="text-sm font-black text-slate-900">
            {event.ticketPrice ===
            0
            ? "Free"
            : formatCurrency(event.ticketPrice)}
          </span>

          <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-600">
            View

            <ArrowRight size={14}/>
          </span>
        </div>
      </div>
    </Link>);
}
