"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Filter,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";

import api from "@/lib/axios";
import Pagination from "@/components/common/Pagination";
import EventCard from "@/components/events/EventCard";
import LocationSelector from "@/components/location/LocationSelector";
import { getAllEvents } from "@/services/event.service";
import type { Event } from "@/types/event";
import type { PaginationMetadata } from "@/types/pagination";
import {
  createUrlWithQueryParams,
  getPageFromSearchParams,
} from "@/utils/pagination";

interface Category {
  _id: string;
  name: string;
}

const sortOptions = [
  { label: "Newest", value: "newest" },
  { label: "Soonest", value: "soonest" },
  {
    label: "Lowest Price",
    value: "price-low",
  },
  {
    label: "Highest Price",
    value: "price-high",
  },
];

const paginationTargetId = "events-results";

function EventsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const resultsRef =
    useRef<HTMLDivElement>(null);
  const previousPageRef = useRef(1);

  const currentPage =
    getPageFromSearchParams(searchParams);

  const search =
    searchParams.get("search") || "";

  const category =
    searchParams.get("category") || "All";

  const location =
    searchParams.get("location") || "";

  const minPrice =
    searchParams.get("minPrice") || "";

  const maxPrice =
    searchParams.get("maxPrice") || "";

  const dateFrom =
    searchParams.get("dateFrom") || "";

  const dateTo =
    searchParams.get("dateTo") || "";

  const sortBy =
    searchParams.get("sort") || "newest";

  const [events, setEvents] =
    useState<Event[]>([]);

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [pagination, setPagination] =
    useState<PaginationMetadata | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [showFilters, setShowFilters] =
    useState(
      Boolean(
        searchParams.get("category")
      )
    );

  const requestParams = useMemo(
    () => ({
      page: currentPage,
      limit: 12,
      search: search || undefined,
      category:
        category !== "All"
          ? category
          : undefined,
      location: location || undefined,
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      sort: sortBy,
    }),
    [
      currentPage,
      search,
      category,
      location,
      minPrice,
      maxPrice,
      dateFrom,
      dateTo,
      sortBy,
    ]
  );

  useEffect(() => {
    const fetchCategories =
      async () => {
        try {
          const response =
            await api.get(
              "/categories"
            );

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
          toast.error(
            "Failed to load categories."
          );
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

        const response =
          await getAllEvents(
            requestParams
          );

        if (!isActive) {
          return;
        }

        setEvents(
          response.data ||
            response.events ||
            []
        );

        setPagination(
          response.pagination
        );
      } catch {
        if (!isActive) {
          return;
        }

        setError(
          "Failed to load events."
        );

        setEvents([]);
        setPagination(null);

        toast.error(
          "Failed to load events."
        );
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
    if (
      previousPageRef.current !==
      currentPage
    ) {
      resultsRef.current?.scrollIntoView(
        {
          behavior: "smooth",
          block: "start",
        }
      );
    }

    previousPageRef.current =
      currentPage;
  }, [currentPage]);

  const updateFilters = (
    updates: Record<
      string,
      string | undefined
    >
  ) => {
    router.replace(
      createUrlWithQueryParams(
        pathname,
        searchParams,
        updates,
        true
      ),
      {
        scroll: false,
      }
    );
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

  const hasActiveFilters =
    category !== "All" ||
    location !== "" ||
    minPrice !== "" ||
    maxPrice !== "" ||
    dateFrom !== "" ||
    dateTo !== "" ||
    sortBy !== "newest";

  return (
    <main className="min-h-screen bg-[#f7f8fc] px-4 pb-16 pt-0 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-blue-600">
            Explore Events
          </p>

          <h1 className="mt-2 text-4xl font-black text-slate-900">
            Discover upcoming events
          </h1>

          <p className="mt-3 text-slate-600">
            Find concerts, workshops,
            conferences and more.
          </p>
        </div>

        <section className="mt-8">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm transition focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10">
              <Search
                size={20}
                className="shrink-0 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  updateFilters({
                    search:
                      event.target.value,
                  })
                }
                placeholder="Search events by title, category or venue"
                className="w-full bg-transparent py-4 text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />

              {search && (
                <button
                  type="button"
                  onClick={() =>
                    updateFilters({
                      search: undefined,
                    })
                  }
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
                  aria-label="Clear search"
                >
                  <X size={17} />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() =>
                setShowFilters(
                  (previous) =>
                    !previous
                )
              }
              className={`relative inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl px-6 text-sm font-bold transition ${
                showFilters
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-blue-300 hover:text-blue-600"
              }`}
            >
              <Filter size={19} />
              Filters

              {hasActiveFilters && (
                <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-[#f7f8fc] bg-orange-500" />
              )}
            </button>
          </div>

          <div className="mt-4">
            <LocationSelector
              onLocationDetected={(
                detectedLocation
              ) => {
                updateFilters({
                  location:
                    detectedLocation,
                });

                setShowFilters(true);
              }}
            />
          </div>

          {showFilters && (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <SlidersHorizontal
                    size={18}
                  />

                  Filter events
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowFilters(false)
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
                  aria-label="Close filters"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Category
                  </span>

                  <select
                    value={category}
                    onChange={(event) =>
                      updateFilters({
                        category:
                          event.target
                            .value ===
                          "All"
                            ? undefined
                            : event.target
                                .value,
                      })
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  >
                    <option value="All">
                      All
                    </option>

                    {categories.map(
                      (item) => (
                        <option
                          key={item._id}
                          value={item.name}
                        >
                          {item.name}
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Location
                  </span>

                  <input
                    type="text"
                    value={location}
                    onChange={(event) =>
                      updateFilters({
                        location:
                          event.target
                            .value,
                      })
                    }
                    placeholder="Venue or city"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Minimum price
                  </span>

                  <input
                    type="number"
                    min="0"
                    value={minPrice}
                    onChange={(event) =>
                      updateFilters({
                        minPrice:
                          event.target
                            .value,
                      })
                    }
                    placeholder="Rs. 0"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Maximum price
                  </span>

                  <input
                    type="number"
                    min="0"
                    value={maxPrice}
                    onChange={(event) =>
                      updateFilters({
                        maxPrice:
                          event.target
                            .value,
                      })
                    }
                    placeholder="Any price"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    From date
                  </span>

                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(event) =>
                      updateFilters({
                        dateFrom:
                          event.target
                            .value,
                      })
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    To date
                  </span>

                  <input
                    type="date"
                    value={dateTo}
                    onChange={(event) =>
                      updateFilters({
                        dateTo:
                          event.target
                            .value,
                      })
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Sort by
                  </span>

                  <select
                    value={sortBy}
                    onChange={(event) =>
                      updateFilters({
                        sort:
                          event.target
                            .value ===
                          "newest"
                            ? undefined
                            : event.target
                                .value,
                      })
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  >
                    {sortOptions.map(
                      (option) => (
                        <option
                          key={
                            option.value
                          }
                          value={
                            option.value
                          }
                        >
                          {option.label}
                        </option>
                      )
                    )}
                  </select>
                </label>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={clearFilters}
                    disabled={
                      !hasActiveFilters
                    }
                    className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <X size={17} />
                    Clear filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        <div
          id={paginationTargetId}
          ref={resultsRef}
        />

        {loading ? (
          <div className="mt-12 rounded-2xl bg-white p-10 text-center text-slate-600 shadow-sm">
            Loading events...
          </div>
        ) : error ? (
          <div className="mt-12 rounded-2xl border border-red-200 bg-red-50 p-10 text-center text-red-600">
            {error}
          </div>
        ) : events.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">
              No events found
            </h2>

            <p className="mt-2 text-slate-500">
              Try changing your search
              or filters.
            </p>

            <button
              type="button"
              onClick={
                resetSearchAndFilters
              }
              className="mt-5 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-600"
            >
              Reset search and filters
            </button>
          </div>
        ) : (
          <>
            <div className="mt-10 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {events.map(
                (event) => (
                  <EventCard
                    key={event._id}
                    event={event}
                  />
                )
              )}
            </div>

            {pagination && (
              <Pagination
  pagination={pagination}
  className="mt-10 flex justify-center"
  scrollTargetId={paginationTargetId}
/>
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default function EventsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f7f8fc] px-4 pb-16 pt-0 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="mt-12 rounded-2xl bg-white p-10 text-center text-slate-600 shadow-sm">
              Loading events...
            </div>
          </div>
        </main>
      }
    >
      <EventsContent />
    </Suspense>
  );
}