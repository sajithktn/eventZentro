"use client";

import {
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import {
  ArrowRight,
  Laugh,
  MapPin,
  Mic2,
  Music2,
  Palette,
  Search,
  Sparkles,
  Ticket,
  Trophy,
  Users,
  UtensilsCrossed,
  Zap,
} from "lucide-react";

import api from "@/lib/axios";
import EventCard from "@/components/events/EventCard";
import BecomeOrganizerButton from "@/components/organizer/BecomeOrganizerButton";
import { getAllEvents } from "@/services/event.service";
import { getPublicFeaturedEvents } from "@/services/featuredEvent.service";
import type { Event } from "@/types/event";

interface Category {
  _id: string;
  name: string;
}

const fallbackImage =
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=85";

const categoryStyles = [
  {
    icon: Music2,
    color: "from-fuchsia-500 to-pink-500",
  },
  {
    icon: Trophy,
    color: "from-orange-400 to-red-500",
  },
  {
    icon: Laugh,
    color: "from-yellow-400 to-orange-500",
  },
  {
    icon: UtensilsCrossed,
    color: "from-emerald-400 to-cyan-500",
  },
  {
    icon: Palette,
    color: "from-violet-500 to-indigo-500",
  },
  {
    icon: Mic2,
    color: "from-blue-400 to-cyan-500",
  },
];

const formatCurrency = (value: number) => {
  if (value === 0) return "Free";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
};

const getDay = (date: string | Date) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
  });

const getMonth = (date: string | Date) =>
  new Date(date).toLocaleDateString("en-IN", {
    month: "short",
  });

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [featuredEvents, setFeaturedEvents] =
    useState<Event[]>([]);
  const [categories, setCategories] =
    useState<Category[]>([]);

  const [loadingEvents, setLoadingEvents] =
    useState(true);

  const [
    loadingCategories,
    setLoadingCategories,
  ] = useState(true);

  const [searchText, setSearchText] =
    useState("");

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await getAllEvents({
          page: 1,
          limit: 3,
          sort: "price-high",
        });

        setEvents(
          response.data ||
            response.events ||
            []
        );
      } catch {
        setEvents([]);
      } finally {
        setLoadingEvents(false);
      }
    };

    void fetchEvents();
  }, []);

  useEffect(() => {
    const fetchFeaturedEvents = async () => {
      try {
        const response =
          await getPublicFeaturedEvents();

        setFeaturedEvents(
          response.data ||
            response.events ||
            []
        );
      } catch {
        setFeaturedEvents([]);
      }
    };

    void fetchFeaturedEvents();
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response =
          await api.get("/categories");

        const result =
          response.data?.data ??
          response.data?.categories ??
          response.data;

        setCategories(
          Array.isArray(result)
            ? result
            : []
        );
      } catch {
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };

    void fetchCategories();
  }, []);

  const popularEvents = events;
  const heroFeaturedEvent = featuredEvents[0];
  const secondFeaturedEvent = featuredEvents[1];
  const thirdFeaturedEvent = featuredEvents[2];

  const searchHref = searchText.trim()
    ? `/events?search=${encodeURIComponent(
        searchText.trim()
      )}`
    : "/events";

  return (
    <main className="min-h-screen overflow-hidden bg-[#08070d] text-white">
      {/* Hero */}
      <section className="relative isolate min-h-[780px] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#5b21b6_0%,transparent_36%),radial-gradient(circle_at_80%_20%,#be123c_0%,transparent_30%),linear-gradient(135deg,#08070d_0%,#110d1e_48%,#08070d_100%)]" />

        <div className="hero-orb-one absolute -left-32 top-20 h-96 w-96 rounded-full bg-purple-600/30 blur-[100px]" />

        <div className="hero-orb-two absolute right-0 top-10 h-[420px] w-[420px] rounded-full bg-pink-500/25 blur-[120px]" />

        <div className="absolute bottom-0 left-1/2 h-72 w-72 rounded-full bg-orange-500/15 blur-[110px]" />

        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,.4)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.4)_1px,transparent_1px)] [background-size:70px_70px]" />

        <div className="relative mx-auto grid min-h-[780px] max-w-7xl items-center gap-16 px-6 py-20 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-4 py-2 backdrop-blur-xl">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pink-400 opacity-75" />

                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-pink-500" />
              </span>

              <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">
                Exciting events happening now
              </span>
            </div>

            <h1 className="mt-7 max-w-3xl text-5xl font-black leading-[0.95] tracking-[-0.05em] sm:text-6xl lg:text-[76px]">
              Find moments

              <span className="block bg-gradient-to-r from-pink-400 via-orange-300 to-yellow-300 bg-clip-text text-transparent">
                worth remembering.
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-8 text-white/60 sm:text-lg">
              Discover concerts, festivals, sports,
              workshops and unforgettable experiences
              happening near you.
            </p>

            {/* Search */}
            <div className="mt-9 max-w-2xl rounded-[26px] border border-white/15 bg-white/[0.08] p-2 shadow-2xl backdrop-blur-2xl">
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="flex flex-1 items-center gap-3 rounded-[20px] bg-black/20 px-5">
                  <Search
                    size={19}
                    className="shrink-0 text-pink-400"
                  />

                  <input
                    type="text"
                    value={searchText}
                    onChange={(event) =>
                      setSearchText(
                        event.target.value
                      )
                    }
                    placeholder="Search concerts, sports, workshops..."
                    className="h-14 w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"
                  />
                </div>

                <Link
                  href={searchHref}
                  className="group flex h-14 items-center justify-center gap-3 rounded-[20px] bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500 px-7 text-sm font-bold shadow-[0_12px_35px_rgba(244,63,94,0.35)] transition duration-300 hover:scale-[1.03]"
                >
                  Find Events

                  <ArrowRight
                    size={17}
                    className="transition group-hover:translate-x-1"
                  />
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
                    alt={`Event user ${
                      index + 1
                    }`}
                    className="h-11 w-11 rounded-full border-2 border-[#110d1e] object-cover"
                  />
                ))}
              </div>

              <div>
                <p className="font-bold">
                  Join the experience
                </p>

                <p className="mt-1 text-sm text-white/45">
                  Discover what everyone is talking
                  about
                </p>
              </div>
            </div>
          </div>

          {/* Floating event visual */}
          <div className="relative hidden h-[590px] lg:block">
            {secondFeaturedEvent && (
              <Link
                href={`/events/${secondFeaturedEvent._id}`}
                className="floating-card group absolute right-5 top-6 h-[450px] w-[310px] rotate-[8deg] overflow-hidden rounded-[36px] border border-white/15 bg-white/10 opacity-70 transition hover:opacity-100"
              >
                <img
                  src={
                    secondFeaturedEvent.bannerImage ||
                    fallbackImage
                  }
                  alt={secondFeaturedEvent.title}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />

                <div className="absolute bottom-5 left-5 right-5">
                  <p className="line-clamp-2 text-lg font-black leading-tight">
                    {secondFeaturedEvent.title}
                  </p>

                  <p className="mt-2 text-sm font-bold text-white/70">
                    {formatCurrency(
                      secondFeaturedEvent.ticketPrice
                    )}
                  </p>
                </div>
              </Link>
            )}

            {thirdFeaturedEvent && (
              <Link
                href={`/events/${thirdFeaturedEvent._id}`}
                className="floating-card-reverse group absolute left-0 top-28 h-[390px] w-[280px] -rotate-[9deg] overflow-hidden rounded-[36px] border border-white/15 bg-white/10 opacity-70 transition hover:opacity-100"
              >
                <img
                  src={
                    thirdFeaturedEvent.bannerImage ||
                    fallbackImage
                  }
                  alt={thirdFeaturedEvent.title}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />

                <div className="absolute bottom-5 left-5 right-5">
                  <p className="line-clamp-2 text-lg font-black leading-tight">
                    {thirdFeaturedEvent.title}
                  </p>

                  <p className="mt-2 text-sm font-bold text-white/70">
                    {formatCurrency(
                      thirdFeaturedEvent.ticketPrice
                    )}
                  </p>
                </div>
              </Link>
            )}

            <article className="featured-float absolute left-1/2 top-1/2 w-[370px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[38px] border border-white/20 bg-[#14101e]/90 shadow-[0_40px_100px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
              <div className="relative h-[310px] overflow-hidden">
                <img
                  src={
                    heroFeaturedEvent?.bannerImage ||
                    fallbackImage
                  }
                  alt={
                    heroFeaturedEvent?.title ||
                    "Featured event"
                  }
                  className="h-full w-full object-cover"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-[#14101e] via-transparent to-transparent" />

                <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full bg-black/40 px-4 py-2 text-xs font-bold backdrop-blur-xl">
                  <Zap
                    size={14}
                    className="fill-yellow-300 text-yellow-300"
                  />
                  Featured
                </div>

                {heroFeaturedEvent?.bestPromotion && (
                  <div className="absolute right-5 top-5 rounded-full bg-orange-500 px-4 py-2 text-xs font-black uppercase tracking-wide text-white shadow-lg">
                    {
                      heroFeaturedEvent.bestPromotion
                        .displayText
                    }
                  </div>
                )}

                <div className="absolute bottom-5 left-5 rounded-2xl border border-white/20 bg-white/15 px-4 py-3 backdrop-blur-xl">
                  <p className="text-2xl font-black">
                    {heroFeaturedEvent
                      ? getDay(
                          heroFeaturedEvent.eventDate
                        )
                      : "25"}
                  </p>

                  <p className="text-xs font-bold uppercase tracking-wider text-white/65">
                    {heroFeaturedEvent
                      ? getMonth(
                          heroFeaturedEvent.eventDate
                        )
                      : "JUL"}
                  </p>
                </div>
              </div>

              <div className="p-6">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-pink-400">
                  {heroFeaturedEvent?.category ||
                    "Featured"}
                </p>

                <h2 className="mt-3 text-2xl font-black leading-tight">
                  {heroFeaturedEvent?.title ||
                    "Featured events coming soon"}
                </h2>

                <p className="mt-4 flex items-center gap-2 text-sm text-white/55">
                  <MapPin
                    size={16}
                    className="text-orange-400"
                  />

                  {heroFeaturedEvent?.venue ||
                    "Admin-approved highlights"}
                </p>

                <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-5">
                  <div>
                    <p className="text-xs text-white/40">
                      Ticket starts at
                    </p>

                    <p className="mt-1 text-xl font-black">
                      {heroFeaturedEvent
                        ? formatCurrency(
                            heroFeaturedEvent.ticketPrice
                          )
                        : "Coming soon"}
                    </p>
                  </div>

                  <Link
                    href={
                      heroFeaturedEvent
                        ? `/events/${heroFeaturedEvent._id}`
                        : "/events"
                    }
                    className="group flex h-12 w-12 items-center justify-center rounded-full bg-white text-black transition hover:rotate-[-10deg] hover:bg-pink-500 hover:text-white"
                  >
                    <ArrowRight
                      size={19}
                      className="transition group-hover:translate-x-0.5"
                    />
                  </Link>
                </div>
              </div>
            </article>

            <div className="absolute bottom-6 right-2 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-orange-500">
                  <Ticket size={19} />
                </div>

                <div>
                  <p className="text-xs text-white/45">
                    Quick booking
                  </p>

                  <p className="mt-1 text-sm font-bold">
                    Simple and secure
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Moving ticker */}
      <section className="overflow-hidden border-y border-white/10 bg-white/[0.04] py-5">
        <div className="marquee-track flex min-w-max items-center gap-10 whitespace-nowrap">
          {[
            "LIVE CONCERTS",
            "FOOD FESTIVALS",
            "SPORTS",
            "COMEDY NIGHTS",
            "TECH EVENTS",
            "WORKSHOPS",
            "CULTURAL SHOWS",
            "ART EXHIBITIONS",
          ].map((item) => (
            <div
              key={item}
              className="flex items-center gap-10 text-sm font-black tracking-[0.18em] text-white/60"
            >
              <span>{item}</span>

              <Sparkles
                size={17}
                className="text-pink-400"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="relative bg-[#f7f5fa] px-6 py-24 text-[#14111a]">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-pink-600">
                Choose your vibe
              </p>

              <h2 className="mt-4 max-w-2xl text-4xl font-black tracking-[-0.04em] sm:text-5xl">
                Experiences for every version of you.
              </h2>
            </div>

            <p className="max-w-md text-sm leading-7 text-neutral-500">
              From loud concert nights to calm creative
              workshops, find an experience that matches
              your mood.
            </p>
          </div>

          {loadingCategories ? (
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-[230px] animate-pulse rounded-[28px] bg-white shadow-sm"
                />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="mt-12 rounded-[28px] border border-black/5 bg-white p-10 text-center text-neutral-500">
              No categories are available.
            </div>
          ) : (
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map(
                (category, index) => {
                  const style =
                    categoryStyles[
                      index %
                        categoryStyles.length
                    ];

                  const Icon = style.icon;

                  return (
                    <Link
                      key={category._id}
                      href={`/events?category=${encodeURIComponent(
                        category.name
                      )}`}
                      className="category-card group relative overflow-hidden rounded-[28px] border border-black/5 bg-white p-6 shadow-[0_15px_45px_rgba(27,20,40,0.07)]"
                    >
                      <div
                        className={`absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br ${style.color} opacity-15 blur-2xl transition duration-500 group-hover:scale-150 group-hover:opacity-30`}
                      />

                      <div className="relative flex items-start justify-between">
                        <div
                          className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${style.color} text-white shadow-lg transition duration-500 group-hover:rotate-[-8deg] group-hover:scale-110`}
                        >
                          <Icon size={23} />
                        </div>

                        <div className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 transition duration-300 group-hover:rotate-[-20deg] group-hover:bg-black group-hover:text-white">
                          <ArrowRight size={17} />
                        </div>
                      </div>

                      <h3 className="relative mt-10 text-2xl font-black">
                        {category.name}
                      </h3>

                      <p className="relative mt-2 text-sm text-neutral-500">
                        Explore upcoming{" "}
                        {category.name.toLowerCase()}{" "}
                        events.
                      </p>

                      <div
                        className={`absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r ${style.color} transition-all duration-500 group-hover:w-full`}
                      />

                      {index === 0 && (
                        <span className="absolute right-6 top-[88px] rounded-full bg-pink-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-pink-600">
                          Popular
                        </span>
                      )}
                    </Link>
                  );
                }
              )}
            </div>
          )}
        </div>
      </section>

      {/* Events */}
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

              <ArrowRight
                size={18}
                className="transition group-hover:translate-x-1"
              />
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
              <Ticket
                size={38}
                className="mx-auto text-pink-400"
              />

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
                <EventCard
                  key={event._id}
                  event={event}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="bg-[#f7f5fa] px-6 py-24 text-[#14111a]">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                icon: Search,
                title: "Discover easily",
                description:
                  "Search events by name, category, location and interests.",
                color:
                  "from-purple-500 to-indigo-500",
              },
              {
                icon: Ticket,
                title: "Book instantly",
                description:
                  "Reserve your tickets with a simple and seamless experience.",
                color:
                  "from-pink-500 to-rose-500",
              },
              {
                icon: Users,
                title: "Celebrate together",
                description:
                  "Connect with people who enjoy the same experiences as you.",
                color:
                  "from-orange-400 to-yellow-500",
              },
            ].map(
              ({
                icon: Icon,
                title,
                description,
                color,
              }) => (
                <div
                  key={title}
                  className="group rounded-[30px] border border-black/5 bg-white p-8 transition duration-300 hover:-translate-y-2 hover:shadow-[0_25px_60px_rgba(31,20,47,0.12)]"
                >
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${color} text-white shadow-xl transition duration-500 group-hover:rotate-[10deg]`}
                  >
                    <Icon size={23} />
                  </div>

                  <h3 className="mt-7 text-2xl font-black">
                    {title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-neutral-500">
                    {description}
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* Organizer CTA */}
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
                <Sparkles
                  size={14}
                  className="text-yellow-300"
                />
                For event creators
              </div>

              <h2 className="mt-6 max-w-3xl text-4xl font-black leading-tight tracking-[-0.04em] sm:text-5xl">
                Turn your idea into the next big
                experience.
              </h2>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-white/50">
                Create your event, manage bookings and
                connect with an audience that is ready
                to show up.
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
          <Link
            href="/"
            className="text-2xl font-black tracking-tight"
          >
            Event

            <span className="bg-gradient-to-r from-pink-400 to-orange-400 bg-clip-text text-transparent">
              Zentro
            </span>
          </Link>

          <p className="text-sm text-white/40">
            Find moments worth remembering.
          </p>

          <p className="text-sm text-white/40">
            © 2026 EventZentro
          </p>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes floatOne {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
          }

          50% {
            transform: translate3d(
              24px,
              30px,
              0
            );
          }
        }

        @keyframes floatTwo {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
          }

          50% {
            transform: translate3d(
              -28px,
              25px,
              0
            );
          }
        }

        @keyframes cardFloat {
          0%,
          100% {
            transform: translateY(0)
              rotate(8deg);
          }

          50% {
            transform: translateY(-18px)
              rotate(6deg);
          }
        }

        @keyframes cardFloatReverse {
          0%,
          100% {
            transform: translateY(0)
              rotate(-9deg);
          }

          50% {
            transform: translateY(16px)
              rotate(-6deg);
          }
        }

        @keyframes featuredFloat {
          0%,
          100% {
            transform: translate(
              -50%,
              -50%
            );
          }

          50% {
            transform: translate(
              -50%,
              calc(-50% - 12px)
            );
          }
        }

        @keyframes marquee {
          from {
            transform: translateX(0);
          }

          to {
            transform: translateX(-50%);
          }
        }

        .hero-orb-one {
          animation: floatOne 9s ease-in-out
            infinite;
        }

        .hero-orb-two {
          animation: floatTwo 11s ease-in-out
            infinite;
        }

        .floating-card {
          animation: cardFloat 7s ease-in-out
            infinite;
        }

        .floating-card-reverse {
          animation: cardFloatReverse 8s
            ease-in-out infinite;
        }

        .featured-float {
          animation: featuredFloat 6s
            ease-in-out infinite;
        }

        .marquee-track {
          animation: marquee 24s linear infinite;
        }

        .category-card {
          transition:
            transform 350ms ease,
            box-shadow 350ms ease;
        }

        .category-card:hover {
          transform: translateY(-10px)
            rotate(-1deg);

          box-shadow: 0 25px 60px
            rgba(31, 20, 47, 0.14);
        }

        .event-card {
          transition:
            transform 350ms ease,
            border-color 350ms ease,
            box-shadow 350ms ease;
        }

        .event-card:hover {
          transform: translateY(-12px);

          border-color: rgba(
            244,
            114,
            182,
            0.4
          );

          box-shadow: 0 35px 80px
            rgba(0, 0, 0, 0.4);
        }

        .event-shine {
          background: linear-gradient(
            115deg,
            transparent 30%,
            rgba(255, 255, 255, 0.18) 48%,
            transparent 66%
          );

          transform: translateX(-130%);
          transition: transform 750ms ease;
        }

        .event-card:hover .event-shine {
          transform: translateX(130%);
        }

        @media (
          prefers-reduced-motion: reduce
        ) {
          .hero-orb-one,
          .hero-orb-two,
          .floating-card,
          .floating-card-reverse,
          .featured-float,
          .marquee-track {
            animation: none;
          }
        }
      `}</style>
    </main>
  );
}
