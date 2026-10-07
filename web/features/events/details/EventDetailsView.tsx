"use client";

import Link from "next/link";
import { ArrowLeft, Ticket } from "lucide-react";

import { BookingPanel } from "./BookingPanel";
import { EventDetailsContent } from "./EventDetailsContent";
import { EventDetailsHero } from "./EventDetailsHero";
import type { EventDetailsState } from "./useEventDetailsState";

interface EventDetailsViewProps {
  state: EventDetailsState;
}

export function EventDetailsView({ state }: EventDetailsViewProps) {
  const { error, event, loading } = state;

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
      <EventDetailsHero event={event} state={state} />
      <section className="mx-auto grid max-w-7xl gap-8 px-4 pb-16 sm:px-6 lg:grid-cols-[1fr_390px] lg:px-8">
        <EventDetailsContent event={event} state={state} />
        <BookingPanel state={state} />
      </section>
    </main>
  );
}
