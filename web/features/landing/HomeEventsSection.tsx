"use client";

import Link from "next/link";
import { ArrowRight, Search, Sparkles, Ticket, Users } from "lucide-react";

import EventCard from "@/features/events/EventCard";
import BecomeOrganizerButton from "@/features/dashboard/organizer/BecomeOrganizerButton";
import type { HomeState } from "./useHomeState";

interface HomeEventsSectionProps {
  state: HomeState;
}

const featureCards = [
  {
    icon: Search,
    title: "Discover easily",
    description: "Search events by name, category, location and interests.",
    color: "from-purple-500 to-indigo-500",
  },
  {
    icon: Ticket,
    title: "Book instantly",
    description: "Reserve your tickets with a simple and seamless experience.",
    color: "from-pink-500 to-rose-500",
  },
  {
    icon: Users,
    title: "Celebrate together",
    description: "Connect with people who enjoy the same experiences as you.",
    color: "from-orange-400 to-yellow-500",
  },
];

const tickerItems = [
  "LIVE CONCERTS",
  "FOOD FESTIVALS",
  "SPORTS",
  "COMEDY NIGHTS",
  "TECH EVENTS",
  "WORKSHOPS",
  "CULTURAL SHOWS",
  "ART EXHIBITIONS",
];

export function HomeEventsSection({ state }: HomeEventsSectionProps) {
  const { loadingEvents, popularEvents } = state;

  return (
    <>
      <section className="overflow-hidden border-y border-white/10 bg-white/[0.04] py-5">
        <div className="marquee-track flex min-w-max items-center gap-10 whitespace-nowrap">
          {tickerItems.map((item) => (
            <div
              key={item}
              className="flex items-center gap-10 text-sm font-black tracking-[0.18em] text-white/60"
            >
              <span>{item}</span>
              <Sparkles size={17} className="text-pink-400" />
            </div>
          ))}
        </div>
      </section>

      <section className="relative bg-[#0d0a13] px-6 py-24">
        <div className="absolute left-0 top-0 h-80 w-80 rounded-full bg-purple-600/10 blur-[110px]" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-pink-500/10 blur-[120px]" />
        <div className="relative mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.24em] text-pink-400">
                <span className="h-2 w-2 animate-pulse rounded-full bg-pink-500" />
                Trending now
              </div>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
                Events everyone is talking about.
              </h2>
            </div>
            <Link
              href="/events"
              className="group inline-flex items-center gap-3 text-sm font-bold text-white/60 transition hover:text-white"
            >
              Explore all events
              <ArrowRight size={18} className="transition group-hover:translate-x-1" />
            </Link>
          </div>

          {loadingEvents ? (
            <div className="mt-12 grid gap-7 md:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-[500px] animate-pulse rounded-[32px] bg-white/[0.07]"
                />
              ))}
            </div>
          ) : popularEvents.length === 0 ? (
            <div className="mt-12 rounded-[32px] border border-white/10 bg-white/[0.05] p-14 text-center backdrop-blur-xl">
              <Ticket size={38} className="mx-auto text-pink-400" />
              <h3 className="mt-5 text-2xl font-black">
                Something exciting is coming
              </h3>
              <p className="mt-3 text-sm text-white/45">
                Newly created events will appear here.
              </p>
            </div>
          ) : (
            <div className="mt-12 grid gap-7 md:grid-cols-2 xl:grid-cols-3">
              {popularEvents.map((event) => (
                <EventCard key={event._id} event={event} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-[#f7f5fa] px-6 py-24 text-[#14111a]">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-5 md:grid-cols-3">
            {featureCards.map(({ icon: Icon, title, description, color }) => (
              <div
                key={title}
                className="group rounded-[30px] border border-black/5 bg-white p-8 transition duration-300 hover:-translate-y-2 hover:shadow-[0_25px_60px_rgba(31,20,47,0.12)]"
              >
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${color} text-white shadow-xl transition duration-500 group-hover:rotate-[10deg]`}
                >
                  <Icon size={23} />
                </div>
                <h3 className="mt-7 text-2xl font-black">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-neutral-500">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f7f5fa] px-6 pb-24 text-[#14111a]">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[42px] bg-[#15101f] px-8 py-14 text-white sm:px-12 lg:px-16 lg:py-20">
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-pink-500/25 blur-[80px]" />
          <div className="absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-purple-600/25 blur-[100px]" />
          <div className="absolute right-10 top-10 hidden rotate-12 text-[130px] font-black leading-none text-white/[0.03] lg:block">
            CREATE
          </div>
          <div className="relative flex flex-col items-start justify-between gap-10 lg:flex-row lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-4 py-2 text-xs font-bold uppercase tracking-[0.2em]">
                <Sparkles size={14} className="text-yellow-300" />
                For event creators
              </div>
              <h2 className="mt-6 max-w-3xl text-4xl font-black leading-tight tracking-[-0.04em] sm:text-5xl">
                Turn your idea into the next big experience.
              </h2>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-white/50">
                Create your event, manage bookings and connect with an audience
                that is ready to show up.
              </p>
            </div>
            <div className="shrink-0">
              <BecomeOrganizerButton />
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-[#08070d] px-6 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 sm:flex-row">
          <Link href="/" className="text-2xl font-black tracking-tight">
            Event
            <span className="bg-gradient-to-r from-pink-400 to-orange-400 bg-clip-text text-transparent">
              Zentro
            </span>
          </Link>
          <p className="text-sm text-white/40">Find moments worth remembering.</p>
          <p className="text-sm text-white/40">(c) 2026 EventZentro</p>
        </div>
      </footer>
    </>
  );
}
