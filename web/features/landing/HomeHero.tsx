"use client";

import Link from "next/link";
import { ArrowRight, MapPin, Search, Ticket, Zap } from "lucide-react";

import { fallbackImage } from "./constants";
import { formatCurrency, getDay, getMonth } from "./utils";
import type { HomeState } from "./useHomeState";

interface HomeHeroProps {
  state: HomeState;
}

export function HomeHero({ state }: HomeHeroProps) {
  const {
    heroFeaturedEvent,
    searchHref,
    searchText,
    secondFeaturedEvent,
    setSearchText,
    thirdFeaturedEvent,
  } = state;

  return (
    <section className="relative isolate min-h-[780px] overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#5b21b6_0%,transparent_36%),radial-gradient(circle_at_80%_20%,#be123c_0%,transparent_30%),linear-gradient(135deg,#08070d_0%,#110d1e_48%,#08070d_100%)]" />
      <div className="hero-orb-one absolute -left-32 top-20 h-96 w-96 rounded-full bg-purple-600/30 blur-[100px]" />
      <div className="hero-orb-two absolute right-0 top-10 h-[420px] w-[420px] rounded-full bg-pink-500/25 blur-[120px]" />
      <div className="hero-orb-three absolute bottom-0 left-1/2 h-72 w-72 rounded-full bg-orange-500/15 blur-[110px]" />
      <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,.4)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.4)_1px,transparent_1px)] [background-size:70px_70px]" />

      <div className="relative mx-auto grid min-h-[780px] max-w-7xl items-center gap-16 px-6 py-20 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-4 py-2 backdrop-blur-xl transition-all duration-300 hover:border-white/30 hover:bg-white/[0.12]">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pink-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-pink-500" />
            </span>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">
              Exciting events happening now
            </span>
          </div>

          <h1 className="mt-7 max-w-3xl text-4xl font-black leading-[1.05] tracking-[-0.04em] sm:text-6xl sm:leading-[0.95] lg:text-[76px]">
            Find moments
            <span className="block animate-gradient bg-gradient-to-r from-pink-400 via-orange-300 to-yellow-300 bg-clip-text text-transparent [background-size:200%_auto]">
              worth remembering.
            </span>
          </h1>

          <p className="mt-7 max-w-xl text-base leading-7 text-white/60 sm:text-lg sm:leading-8">
            Discover concerts, festivals, sports, workshops and unforgettable
            experiences happening near you.
          </p>

          <div className="mt-9 max-w-2xl rounded-2xl border border-white/15 bg-white/[0.08] p-1.5 shadow-2xl backdrop-blur-2xl transition-all duration-300 focus-within:border-pink-500/50 focus-within:ring-2 focus-within:ring-pink-500/30 focus-within:shadow-[0_0_40px_rgba(244,63,94,0.25)] sm:rounded-[26px] sm:p-2">
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="flex flex-1 items-center gap-3 rounded-xl bg-black/20 px-4 transition-colors duration-200 focus-within:bg-black/35 sm:rounded-[20px] sm:px-5">
                <Search size={19} className="shrink-0 text-pink-400" />
                <input
                  type="text"
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder="Search concerts, sports, workshops..."
                  className="h-12 w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35 sm:h-14"
                />
              </div>
              <Link
                href={searchHref}
                className="group flex h-12 items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500 px-5 text-sm font-bold shadow-[0_12px_35px_rgba(244,63,94,0.35)] transition duration-300 hover:scale-[1.03] hover:shadow-[0_15px_45px_rgba(244,63,94,0.55)] active:scale-[0.98] sm:h-14 sm:rounded-[20px] sm:px-7"
              >
                Find Events
                <ArrowRight size={17} className="transition duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-8">
            <div className="flex -space-x-3">
              {[
                "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
                "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80",
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80",
                "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80",
              ].map((image, index) => (
                <img
                  key={image}
                  src={image}
                  alt={`Event user ${index + 1}`}
                  className="h-11 w-11 rounded-full border-2 border-[#110d1e] object-cover"
                />
              ))}
            </div>
            <div>
              <p className="font-bold">Join the experience</p>
              <p className="mt-1 text-sm text-white/45">
                Discover what everyone is talking about
              </p>
            </div>
          </div>
        </div>

        <div className="relative hidden h-[590px] lg:block">
          <FloatingEventCard event={secondFeaturedEvent} position="right" />
          <FloatingEventCard event={thirdFeaturedEvent} position="left" />

          <article className="featured-float absolute left-1/2 top-1/2 w-[370px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[38px] border border-white/20 bg-[#14101e]/90 shadow-[0_40px_100px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
            <div className="relative h-[310px] overflow-hidden">
              <img
                src={heroFeaturedEvent?.bannerImage || fallbackImage}
                alt={heroFeaturedEvent?.title || "Featured event"}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#14101e] via-transparent to-transparent" />
              <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full bg-black/40 px-4 py-2 text-xs font-bold backdrop-blur-xl">
                <Zap size={14} className="fill-yellow-300 text-yellow-300" />
                Featured
              </div>

              {heroFeaturedEvent?.bestPromotion && (
                <div className="absolute right-5 top-5 rounded-full bg-orange-500 px-4 py-2 text-xs font-black uppercase tracking-wide text-white shadow-lg">
                  {heroFeaturedEvent.bestPromotion.displayText}
                </div>
              )}

              <div className="absolute bottom-5 left-5 rounded-2xl border border-white/20 bg-white/15 px-4 py-3 backdrop-blur-xl">
                <p className="text-2xl font-black">
                  {heroFeaturedEvent ? getDay(heroFeaturedEvent.eventDate) : "25"}
                </p>
                <p className="text-xs font-bold uppercase tracking-wider text-white/65">
                  {heroFeaturedEvent ? getMonth(heroFeaturedEvent.eventDate) : "JUL"}
                </p>
              </div>
            </div>

            <div className="p-6">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-pink-400">
                {heroFeaturedEvent?.category || "Featured"}
              </p>
              <h2 className="mt-3 text-2xl font-black leading-tight">
                {heroFeaturedEvent?.title || "Featured events coming soon"}
              </h2>
              <p className="mt-4 flex items-center gap-2 text-sm text-white/55">
                <MapPin size={16} className="text-orange-400" />
                {heroFeaturedEvent?.venue || "Admin-approved highlights"}
              </p>
              <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-5">
                <div>
                  <p className="text-xs text-white/40">Ticket starts at</p>
                  <p className="mt-1 text-xl font-black">
                    {heroFeaturedEvent
                      ? formatCurrency(heroFeaturedEvent.ticketPrice)
                      : "Coming soon"}
                  </p>
                </div>
                <Link
                  href={heroFeaturedEvent ? `/events/${heroFeaturedEvent._id}` : "/events"}
                  className="group flex h-12 w-12 items-center justify-center rounded-full bg-white text-black transition hover:rotate-[-10deg] hover:bg-pink-500 hover:text-white"
                >
                  <ArrowRight size={19} className="transition group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          </article>

          <div className="badge-float absolute bottom-6 right-2 rounded-2xl border border-white/15 bg-white/10 p-4 shadow-xl backdrop-blur-xl transition duration-300 hover:scale-105">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-orange-500">
                <Ticket size={19} />
              </div>
              <div>
                <p className="text-xs text-white/45">Quick booking</p>
                <p className="mt-1 text-sm font-bold">Simple and secure</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FloatingEventCard({
  event,
  position,
}: {
  event: HomeState["secondFeaturedEvent"];
  position: "left" | "right";
}) {
  if (!event) return null;

  const className =
    position === "right"
      ? "floating-card group absolute right-5 top-6 h-[450px] w-[310px] rotate-[8deg] overflow-hidden rounded-[36px] border border-white/15 bg-white/10 opacity-70 transition hover:opacity-100"
      : "floating-card-reverse group absolute left-0 top-28 h-[390px] w-[280px] -rotate-[9deg] overflow-hidden rounded-[36px] border border-white/15 bg-white/10 opacity-70 transition hover:opacity-100";

  return (
    <Link href={`/events/${event._id}`} className={className}>
      <img
        src={event.bannerImage || fallbackImage}
        alt={event.title}
        className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
      <div className="absolute bottom-5 left-5 right-5">
        <p className="line-clamp-2 text-lg font-black leading-tight">{event.title}</p>
        <p className="mt-2 text-sm font-bold text-white/70">
          {formatCurrency(event.ticketPrice)}
        </p>
      </div>
    </Link>
  );
}
