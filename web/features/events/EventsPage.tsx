"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpDown,
  Layers,
  LoaderCircle,
  LocateFixed,
  MapPin,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import api from "@/lib/axios";
import Pagination from "@/components/ui/Pagination";
import EventCard from "@/features/events/EventCard";
import { getAllEvents } from "@/services/event.service";
import { reverseGeocodeCoordinates } from "@/services/location.service";
import type { Event } from "@/types/event";
import type { PaginationMetadata } from "@/types/pagination";
import { createUrlWithQueryParams, getPageFromSearchParams } from "@/utils/pagination";

interface Category {
  _id: string;
  name: string;
}

const sortOptions = [
  { label: "Newest", value: "newest" },
  { label: "Soonest", value: "soonest" },
  { label: "Lowest Price", value: "price-low" },
  { label: "Highest Price", value: "price-high" },
];

const paginationTargetId = "events-results";

function EventsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const resultsRef = useRef<HTMLDivElement>(null);
  const previousPageRef = useRef(1);

  const currentPage = getPageFromSearchParams(searchParams);
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "All";
  const location = searchParams.get("location") || "";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const dateFrom = searchParams.get("dateFrom") || "";
  const dateTo = searchParams.get("dateTo") || "";
  const sortBy = searchParams.get("sort") || "newest";

  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<PaginationMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  const requestParams = useMemo(
    () => ({
      page: currentPage,
      limit: 12,
      search: search || undefined,
      category: category !== "All" ? category : undefined,
      location: location || undefined,
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      sort: sortBy,
    }),
    [currentPage, search, category, location, minPrice, maxPrice, dateFrom, dateTo, sortBy]
  );

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get("/categories");
        const result =
          response.data?.data ?? response.data?.categories ?? response.data;
        setCategories(Array.isArray(result) ? result : []);
      } catch {
        toast.error("Failed to load categories.");
      }
    };

    void fetchCategories();
  }, []);

  useEffect(() => {
    let isActive = true;

    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await getAllEvents(requestParams);

        if (!isActive) return;

        setEvents(response.data || response.events || []);
        setPagination(response.pagination);
      } catch {
        if (!isActive) return;
        setError("Failed to load events.");
        setEvents([]);
        setPagination(null);
        toast.error("Failed to load events.");
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    void fetchEvents();

    return () => {
      isActive = false;
    };
  }, [requestParams]);

  useEffect(() => {
    if (previousPageRef.current !== currentPage) {
      resultsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
    previousPageRef.current = currentPage;
  }, [currentPage]);

  const updateFilters = (updates: Record<string, string | undefined>) => {
    router.replace(createUrlWithQueryParams(pathname, searchParams, updates, true), {
      scroll: false,
    });
  };

  const clearFilters = () => {
    updateFilters({
      category: undefined,
      location: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      sort: undefined,
    });
  };

  const resetSearchAndFilters = () => {
    updateFilters({
      search: undefined,
      category: undefined,
      location: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      sort: undefined,
    });
  };

  const handleDetectLocation = () => {
    if (!("geolocation" in navigator)) {
      toast.error("Your browser does not support geolocation.");
      return;
    }

    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const detected = await reverseGeocodeCoordinates({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          const detectedName = [detected.city, detected.state].filter(Boolean).join(", ");
          updateFilters({ location: detectedName });
          toast.success(`Location set: ${detectedName}`);
        } catch {
          toast.error("Unable to identify your city.");
        } finally {
          setIsDetectingLocation(false);
        }
      },
      () => {
        setIsDetectingLocation(false);
        toast.error("Location permission denied or unavailable.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const hasExtraActiveFilters =
    Boolean(minPrice) || Boolean(maxPrice) || Boolean(dateFrom) || Boolean(dateTo);

  const extraFilterCount = [minPrice, maxPrice, dateFrom, dateTo].filter(Boolean).length;

  const hasActiveFilters =
    Boolean(search) ||
    category !== "All" ||
    Boolean(location) ||
    Boolean(minPrice) ||
    Boolean(maxPrice) ||
    Boolean(dateFrom) ||
    Boolean(dateTo) ||
    sortBy !== "newest";

  return (
    <main className="min-h-[calc(100vh-72px)] w-full overflow-hidden bg-[#08070d] text-white">
      {/* Full-width Hero and Filter Section */}
      <section className="relative isolate overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_top_left,#5b21b6_0%,transparent_36%),radial-gradient(circle_at_80%_20%,#be123c_0%,transparent_30%),linear-gradient(135deg,#08070d_0%,#110d1e_48%,#08070d_100%)] px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="hero-orb-one pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-purple-600/25 blur-[100px]" />
        <div className="hero-orb-two pointer-events-none absolute right-0 top-0 h-[400px] w-[400px] rounded-full bg-pink-500/20 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-0 left-1/2 h-72 w-72 rounded-full bg-orange-500/15 blur-[110px]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,.4)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.4)_1px,transparent_1px)] [background-size:60px_60px]" />

        <div className="relative mx-auto w-full max-w-[1600px]">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-white/80 backdrop-blur-xl">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pink-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-pink-500" />
            </span>
            Discover Live Experiences
          </div>

          <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
            Explore Upcoming Events
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60 sm:text-base">
            Discover concerts, festivals, sports, workshops and unforgettable experiences happening near you.
          </p>

          {/* Sleek Compact Search & Filter Toolbar */}
          <div className="mt-6 w-full rounded-2xl border border-white/15 bg-white/[0.08] p-2 shadow-2xl backdrop-blur-2xl">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
              {/* Search by keyword */}
              <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl bg-black/30 px-4 py-2.5 sm:py-3">
                <Search size={18} className="shrink-0 text-pink-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => updateFilters({ search: e.target.value })}
                  placeholder="Search events by title or keywords..."
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/40"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => updateFilters({ search: undefined })}
                    className="text-white/40 hover:text-white transition"
                    aria-label="Clear search"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Location Input with inline GPS detection */}
              <div className="flex min-w-[210px] items-center gap-2 rounded-xl bg-black/30 px-3.5 py-2.5 sm:py-3">
                <MapPin size={18} className="shrink-0 text-orange-400" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => updateFilters({ location: e.target.value })}
                  placeholder="City or venue"
                  className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/40"
                />
                {location && (
                  <button
                    type="button"
                    onClick={() => updateFilters({ location: undefined })}
                    className="text-white/40 hover:text-white transition"
                    aria-label="Clear location"
                  >
                    <X size={15} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={isDetectingLocation}
                  title="Detect my current location"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10 text-orange-400 hover:bg-orange-500 hover:text-white transition disabled:opacity-50"
                  aria-label="Detect my location"
                >
                  {isDetectingLocation ? (
                    <LoaderCircle size={14} className="animate-spin" />
                  ) : (
                    <LocateFixed size={14} />
                  )}
                </button>
              </div>

              {/* Category Dropdown */}
              <div className="flex min-w-[170px] items-center gap-2 rounded-xl bg-black/30 px-3.5 py-2.5 sm:py-3">
                <Layers size={17} className="shrink-0 text-purple-400" />
                <select
                  value={category}
                  onChange={(e) =>
                    updateFilters({
                      category: e.target.value === "All" ? undefined : e.target.value,
                    })
                  }
                  className="w-full cursor-pointer bg-transparent text-sm text-white outline-none [&>option]:bg-[#130f1e] [&>option]:text-white"
                >
                  <option value="All">All Categories</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Dropdown */}
              <div className="flex min-w-[150px] items-center gap-2 rounded-xl bg-black/30 px-3.5 py-2.5 sm:py-3">
                <ArrowUpDown size={16} className="shrink-0 text-yellow-400" />
                <select
                  value={sortBy}
                  onChange={(e) =>
                    updateFilters({
                      sort: e.target.value === "newest" ? undefined : e.target.value,
                    })
                  }
                  className="w-full cursor-pointer bg-transparent text-sm text-white outline-none [&>option]:bg-[#130f1e] [&>option]:text-white"
                >
                  {sortOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filters Toggle Button */}
              <button
                type="button"
                onClick={() => setShowFilters((prev) => !prev)}
                className={`flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition ${
                  showFilters || hasExtraActiveFilters
                    ? "bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500 text-white shadow-lg shadow-pink-500/25"
                    : "border border-white/15 bg-white/10 text-white hover:bg-white/15"
                }`}
              >
                <SlidersHorizontal size={17} />
                <span>Filters</span>
                {hasExtraActiveFilters && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-black text-rose-600">
                    {extraFilterCount}
                  </span>
                )}
              </button>
            </div>

            {/* Compact Secondary Filters (Price & Date) */}
            {showFilters && (
              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-2.5 text-xs text-white/80">
                <div className="flex flex-wrap items-center gap-4">
                  {/* Price Range */}
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white/60">Price (₹):</span>
                    <input
                      type="number"
                      min="0"
                      value={minPrice}
                      onChange={(e) => updateFilters({ minPrice: e.target.value })}
                      placeholder="Min"
                      className="h-8 w-20 rounded-lg border border-white/15 bg-black/30 px-2.5 text-xs text-white outline-none placeholder:text-white/35 focus:border-pink-500"
                    />
                    <span className="text-white/40">-</span>
                    <input
                      type="number"
                      min="0"
                      value={maxPrice}
                      onChange={(e) => updateFilters({ maxPrice: e.target.value })}
                      placeholder="Max"
                      className="h-8 w-20 rounded-lg border border-white/15 bg-black/30 px-2.5 text-xs text-white outline-none placeholder:text-white/35 focus:border-pink-500"
                    />
                  </div>

                  {/* Date Range */}
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white/60">Date:</span>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => updateFilters({ dateFrom: e.target.value })}
                      className="h-8 rounded-lg border border-white/15 bg-black/30 px-2.5 text-xs text-white outline-none focus:border-pink-500 [color-scheme:dark]"
                    />
                    <span className="text-white/40">to</span>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => updateFilters({ dateTo: e.target.value })}
                      className="h-8 rounded-lg border border-white/15 bg-black/30 px-2.5 text-xs text-white outline-none focus:border-pink-500 [color-scheme:dark]"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20 hover:text-white"
                    >
                      <X size={13} />
                      Clear filters
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowFilters(false)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-white/50 transition hover:bg-white/10 hover:text-white"
                    aria-label="Close filters"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Category Pill Tabs */}
          <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => updateFilters({ category: undefined })}
              className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition ${
                category === "All"
                  ? "bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow-md shadow-pink-500/20"
                  : "border border-white/15 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              All Categories
            </button>
            {categories.map((c) => (
              <button
                key={c._id}
                type="button"
                onClick={() => updateFilters({ category: c.name })}
                className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition ${
                  category === c.name
                    ? "bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow-md shadow-pink-500/20"
                    : "border border-white/15 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Active Filter Chips */}
          {hasActiveFilters && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-white/40">Active filters:</span>
              {search && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-pink-500/40 bg-pink-500/15 px-3 py-1 text-pink-300">
                  Search: &quot;{search}&quot;
                  <button
                    type="button"
                    onClick={() => updateFilters({ search: undefined })}
                    aria-label="Remove search filter"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
              {category !== "All" && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/40 bg-purple-500/15 px-3 py-1 text-purple-300">
                  Category: {category}
                  <button
                    type="button"
                    onClick={() => updateFilters({ category: undefined })}
                    aria-label="Remove category filter"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
              {location && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/40 bg-orange-500/15 px-3 py-1 text-orange-300">
                  Location: {location}
                  <button
                    type="button"
                    onClick={() => updateFilters({ location: undefined })}
                    aria-label="Remove location filter"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
              {(minPrice || maxPrice) && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-yellow-500/40 bg-yellow-500/15 px-3 py-1 text-yellow-300">
                  Price: {minPrice ? `₹${minPrice}` : "₹0"} - {maxPrice ? `₹${maxPrice}` : "Any"}
                  <button
                    type="button"
                    onClick={() => updateFilters({ minPrice: undefined, maxPrice: undefined })}
                    aria-label="Remove price filter"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
              {(dateFrom || dateTo) && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/40 bg-blue-500/15 px-3 py-1 text-blue-300">
                  Date: {dateFrom || "Any"} to {dateTo || "Any"}
                  <button
                    type="button"
                    onClick={() => updateFilters({ dateFrom: undefined, dateTo: undefined })}
                    aria-label="Remove date filter"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
              {sortBy !== "newest" && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-1 text-emerald-300">
                  Sort: {sortOptions.find((o) => o.value === sortBy)?.label || sortBy}
                  <button
                    type="button"
                    onClick={() => updateFilters({ sort: undefined })}
                    aria-label="Reset sort"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
              <button
                type="button"
                onClick={resetSearchAndFilters}
                className="ml-1 text-xs font-semibold text-rose-400 underline underline-offset-2 hover:text-rose-300"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Events Results Section */}
      <section className="relative mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
        <div id={paginationTargetId} ref={resultsRef} />

        {loading ? (
          <div className="mt-8 flex min-h-72 items-center justify-center rounded-3xl border border-white/10 bg-[#120f1c] p-10 text-center">
            <div>
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-pink-500/20 border-t-pink-500" />
              <p className="mt-4 text-sm font-semibold text-white/60">Loading events...</p>
            </div>
          </div>
        ) : error ? (
          <div className="mt-8 rounded-3xl border border-red-500/20 bg-red-950/30 p-10 text-center text-red-300">
            <p className="font-semibold">{error}</p>
            <button
              type="button"
              onClick={() => router.refresh()}
              className="mt-4 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-red-500"
            >
              Try again
            </button>
          </div>
        ) : events.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-white/10 bg-[#120f1c] px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-pink-400">
              <Search size={30} />
            </div>
            <h2 className="mt-5 text-2xl font-black text-white">No events found</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-white/50">
              We couldn&apos;t find any events matching your criteria. Try adjusting your search or clearing active filters.
            </p>
            <button
              type="button"
              onClick={resetSearchAndFilters}
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-pink-500/25 transition hover:scale-[1.02]"
            >
              <X size={17} />
              Reset search and filters
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between text-sm text-white/60">
              <p>
                Showing <span className="font-bold text-white">{events.length}</span> event
                {events.length === 1 ? "" : "s"}
                {pagination?.totalItems ? ` of ${pagination.totalItems}` : ""}
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {events.map((event) => (
                <EventCard key={event._id} event={event} />
              ))}
            </div>

            {pagination && (
              <Pagination
                pagination={pagination}
                variant="dark"
                className="mt-12 flex justify-center"
                scrollTargetId={paginationTargetId}
              />
            )}
          </>
        )}
      </section>
    </main>
  );
}

export default function EventsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-[calc(100vh-72px)] w-full bg-[#08070d] px-4 py-16 text-white">
          <div className="mx-auto max-w-[1600px] text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-pink-500/20 border-t-pink-500" />
            <p className="mt-4 text-sm font-medium text-white/50">Loading events...</p>
          </div>
        </main>
      }
    >
      <EventsContent />
    </Suspense>
  );
}
