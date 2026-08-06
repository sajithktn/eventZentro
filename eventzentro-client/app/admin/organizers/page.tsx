"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BadgeCheck,
  Ban,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  SlidersHorizontal,
  UserCog,
} from "lucide-react";

import {
  getAdminOrganizers,
  type AdminOrganizer,
  type AdminOrganizerStatus,
  type AdminOrganizersPagination,
} from "@/services/admin.service";

const ORGANIZERS_PAGE_SIZE = 10;

const statusFilters: {
  label: string;
  value: AdminOrganizerStatus;
}[] = [
  {
    label: "All",
    value: "all",
  },
  {
    label: "Active",
    value: "active",
  },
  {
    label: "Blocked",
    value: "blocked",
  },
];

const getFullName = (organizer: AdminOrganizer) => {
  return (
    [organizer.firstName, organizer.lastName]
      .filter(Boolean)
      .join(" ") || "Organizer"
  );
};

const getInitials = (organizer: AdminOrganizer) => {
  const nameInitials = `${organizer.firstName?.[0] ?? ""}${
    organizer.lastName?.[0] ?? ""
  }`
    .trim()
    .toUpperCase();

  return (
    nameInitials ||
    organizer.email?.[0]?.toUpperCase() ||
    "O"
  );
};

const getProviderLabel = (provider?: string) => {
  if (!provider) {
    return "Local";
  }

  return provider
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const formatJoinedDate = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to fetch organizers.";
};

function OrganizerAvatar({
  organizer,
}: {
  organizer: AdminOrganizer;
}) {
  const fullName = getFullName(organizer);

  if (organizer.profileImage) {
    return (
      <img
        src={organizer.profileImage}
        alt={fullName}
        className="h-11 w-11 shrink-0 rounded-full object-cover"
      />
    );
  }

  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-black text-white">
      {getInitials(organizer)}
    </span>
  );
}

function VerificationBadge({
  isVerified,
}: {
  isVerified: boolean;
}) {
  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black ${
        isVerified
          ? "bg-orange-50 text-orange-600"
          : "bg-slate-100 text-slate-600"
      }`}
    >
      <BadgeCheck size={14} />
      {isVerified ? "Verified" : "Not verified"}
    </span>
  );
}

function AccountStatusBadge({
  isBlocked,
}: {
  isBlocked: boolean;
}) {
  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black ${
        isBlocked
          ? "bg-red-50 text-red-600"
          : "bg-emerald-50 text-emerald-600"
      }`}
    >
      {isBlocked ? <Ban size={14} /> : <BadgeCheck size={14} />}
      {isBlocked ? "Blocked" : "Active"}
    </span>
  );
}

function OrganizerCard({
  organizer,
}: {
  organizer: AdminOrganizer;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start gap-3">
        <OrganizerAvatar organizer={organizer} />

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-black text-slate-950">
            {getFullName(organizer)}
          </h3>

          <p className="mt-1 truncate text-sm font-medium text-slate-600">
            {organizer.email}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="font-bold text-slate-500">Provider</span>
          <span className="font-black text-slate-900">
            {getProviderLabel(organizer.provider)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="font-bold text-slate-500">
            Verification
          </span>
          <VerificationBadge isVerified={organizer.isVerified} />
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="font-bold text-slate-500">Status</span>
          <AccountStatusBadge isBlocked={organizer.isBlocked} />
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="font-bold text-slate-500">Joined</span>
          <span className="font-black text-slate-900">
            {formatJoinedDate(organizer.createdAt)}
          </span>
        </div>
      </div>
    </article>
  );
}

export default function AdminOrganizersPage() {
  const [organizers, setOrganizers] = useState<AdminOrganizer[]>([]);
  const [pagination, setPagination] =
    useState<AdminOrganizersPagination | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] =
    useState<AdminOrganizerStatus>("all");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOrganizers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      const response = await getAdminOrganizers({
        search: search || undefined,
        status,
        page,
        limit: ORGANIZERS_PAGE_SIZE,
      });

      if (!response.success) {
        throw new Error(
          response.message || "Unable to fetch organizers."
        );
      }

      setOrganizers(response.organizers);
      setPagination(response.pagination);
    } catch (error) {
      setOrganizers([]);
      setPagination(null);
      setError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadOrganizers();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadOrganizers]);

  const paginationSummary = useMemo(() => {
    if (!pagination || pagination.totalItems === 0) {
      return "No organizers found";
    }

    const firstItem =
      (pagination.currentPage - 1) * pagination.itemsPerPage + 1;
    const lastItem = Math.min(
      pagination.currentPage * pagination.itemsPerPage,
      pagination.totalItems
    );

    return `Showing ${firstItem}-${lastItem} of ${pagination.totalItems} organizers`;
  }, [pagination]);

  const totalPages = Math.max(pagination?.totalPages ?? 1, 1);
  const canGoPrevious =
    Boolean(pagination?.hasPreviousPage) && !isLoading;
  const canGoNext = Boolean(pagination?.hasNextPage) && !isLoading;

  const handleStatusChange = (nextStatus: AdminOrganizerStatus) => {
    setStatus(nextStatus);
    setPage(1);
  };

  const goToPreviousPage = () => {
    if (canGoPrevious) {
      setPage((currentPage) => Math.max(currentPage - 1, 1));
    }
  };

  const goToNextPage = () => {
    if (canGoNext) {
      setPage((currentPage) => currentPage + 1);
    }
  };

  return (
    <div className="mx-auto max-w-7xl">
      <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-500">
              Accounts
            </p>

            <h2 className="mt-2 text-2xl font-black text-slate-950">
              Manage Organizers
            </h2>

            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              View organizer accounts, verification details, providers,
              and account access status.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
            <div className="relative w-full sm:w-80">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search organizers..."
                className="h-12 w-full rounded-xl border-2 border-slate-200 pl-11 pr-4 text-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
              />
            </div>

            <div className="flex h-12 items-center gap-1 rounded-xl border-2 border-slate-200 bg-slate-50 p-1">
              <span className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm sm:flex">
                <SlidersHorizontal size={16} />
              </span>

              {statusFilters.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => handleStatusChange(filter.value)}
                  className={`h-9 rounded-lg px-3 text-xs font-black transition ${
                    status === filter.value
                      ? "bg-slate-950 text-white shadow-sm"
                      : "text-slate-600 hover:bg-white hover:text-orange-600"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6">
          {isLoading ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-14 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
                <RefreshCw size={26} className="animate-spin" />
              </div>

              <p className="mt-4 font-bold text-slate-600">
                Loading organizers...
              </p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center">
              <AlertCircle
                size={34}
                className="mx-auto text-red-500"
              />

              <p className="mt-4 font-black text-red-700">{error}</p>

              <button
                type="button"
                onClick={loadOrganizers}
                className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-black text-white transition hover:bg-red-700"
              >
                <RefreshCw size={17} />
                Retry
              </button>
            </div>
          ) : organizers.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-14 text-center">
              <UserCog
                size={34}
                className="mx-auto text-slate-300"
              />

              <p className="mt-4 font-bold text-slate-600">
                No organizers match your filters.
              </p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-hidden rounded-2xl border border-slate-200 lg:block">
                <table className="w-full border-collapse text-left">
                  <thead className="bg-slate-50">
                    <tr className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                      <th className="px-5 py-4">Organizer</th>
                      <th className="px-5 py-4">Provider</th>
                      <th className="px-5 py-4">Verification</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4">Joined</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200 bg-white">
                    {organizers.map((organizer) => (
                      <tr
                        key={organizer._id}
                        className="transition hover:bg-orange-50/50"
                      >
                        <td className="px-5 py-4">
                          <div className="flex min-w-0 items-center gap-3">
                            <OrganizerAvatar organizer={organizer} />

                            <div className="min-w-0">
                              <p className="truncate font-black text-slate-950">
                                {getFullName(organizer)}
                              </p>

                              <p className="mt-1 truncate text-sm font-medium text-slate-500">
                                {organizer.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm font-black text-slate-800">
                          {getProviderLabel(organizer.provider)}
                        </td>

                        <td className="px-5 py-4">
                          <VerificationBadge
                            isVerified={organizer.isVerified}
                          />
                        </td>

                        <td className="px-5 py-4">
                          <AccountStatusBadge
                            isBlocked={organizer.isBlocked}
                          />
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-2 text-sm font-bold text-slate-600">
                            <CalendarDays
                              size={15}
                              className="text-orange-500"
                            />
                            {formatJoinedDate(organizer.createdAt)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-4 lg:hidden">
                {organizers.map((organizer) => (
                  <OrganizerCard
                    key={organizer._id}
                    organizer={organizer}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {pagination && pagination.totalItems > 0 && (
          <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-orange-100 bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-center text-sm font-semibold text-slate-500 sm:text-left">
              {paginationSummary}
            </p>

            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={goToPreviousPage}
                disabled={!canGoPrevious}
                className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-bold transition ${
                  canGoPrevious
                    ? "border-orange-100 bg-white text-slate-600 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600"
                    : "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300"
                }`}
              >
                <ChevronLeft size={17} />
                Previous
              </button>

              <span className="rounded-xl border border-orange-100 bg-orange-50 px-3 py-2 text-sm font-bold text-orange-600">
                Page {pagination.currentPage} of {totalPages}
              </span>

              <button
                type="button"
                onClick={goToNextPage}
                disabled={!canGoNext}
                className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-bold transition ${
                  canGoNext
                    ? "border-orange-100 bg-white text-slate-600 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600"
                    : "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300"
                }`}
              >
                Next
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
