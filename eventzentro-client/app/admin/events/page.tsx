"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { toast } from "sonner";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Eye,
  LoaderCircle,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react";

import {
  deleteAdminEvent,
  getAdminEvents,
  updateAdminEventStatus,
  type AdminEvent,
  type AdminEventStatus,
  type AdminPagination,
} from "@/services/admin.service";
import {
  formatCurrency,
  formatEventDate,
} from "@/utils/event";
import { DEFAULT_PAGE_SIZE } from "@/utils/pagination";

const statusFilters: Array<
  AdminEventStatus | "all"
> = ["all", "draft", "published", "cancelled", "completed"];

const fieldClassName =
  "h-12 rounded-xl border-2 border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100";

type PendingEventAction =
  | {
      type: "status";
      event: AdminEvent;
      status: AdminEventStatus;
    }
  | {
      type: "delete";
      event: AdminEvent;
    };

const initialPagination: AdminPagination = {
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  itemsPerPage: DEFAULT_PAGE_SIZE,
  hasNextPage: false,
  hasPreviousPage: false,
};

const getOrganizerName = (event: AdminEvent) => {
  if (!event.organizer) {
    return "Unknown organizer";
  }

  if (typeof event.organizer === "string") {
    return "Unknown organizer";
  }

  return (
    [
      event.organizer.firstName,
      event.organizer.lastName,
    ]
      .filter(Boolean)
      .join(" ") ||
    event.organizer.email ||
    "Unknown organizer"
  );
};

const getTicketsSold = (event: AdminEvent) =>
  Math.max(
    event.totalTickets - event.availableTickets,
    0
  );

const getErrorMessage = (
  error: unknown,
  fallback: string
) => {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;

    return typeof message === "string"
      ? message
      : fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};

export default function AdminEventsPage() {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [pagination, setPagination] =
    useState<AdminPagination>(initialPagination);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<
    AdminEventStatus | "all"
  >("all");
  const [categoryInput, setCategoryInput] =
    useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingAction, setPendingAction] =
    useState<PendingEventAction | null>(null);
  const [actionLoading, setActionLoading] =
    useState(false);

  const requestParams = useMemo(
    () => ({
      page,
      limit: DEFAULT_PAGE_SIZE,
      search: search || undefined,
      status: status !== "all" ? status : undefined,
      category: category || undefined,
      sort: "newest",
    }),
    [category, page, search, status]
  );

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await getAdminEvents(requestParams);

      setEvents(response.events);
      setPagination(response.pagination);
    } catch (loadError) {
      const message = getErrorMessage(
        loadError,
        "Unable to load events."
      );

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isActive = true;

    void Promise.resolve().then(async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await getAdminEvents(requestParams);

        if (!isActive) {
          return;
        }

        setEvents(response.events);
        setPagination(response.pagination);
      } catch (loadError) {
        if (!isActive) {
          return;
        }

        const message = getErrorMessage(
          loadError,
          "Unable to load events."
        );

        setError(message);
        toast.error(message);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    });

    return () => {
      isActive = false;
    };
  }, [requestParams]);

  const applyFilters = () => {
    setPage(1);
    setSearch(searchInput.trim());
    setCategory(categoryInput.trim());
  };

  const resetFilters = () => {
    setSearchInput("");
    setSearch("");
    setCategoryInput("");
    setCategory("");
    setStatus("all");
    setPage(1);
  };

  const refetchAfterRemoval = () => {
    if (events.length === 1 && page > 1) {
      setPage((currentPage) =>
        Math.max(currentPage - 1, 1)
      );
      return;
    }

    loadEvents();
  };

  const executeAction = async () => {
    if (!pendingAction) {
      return;
    }

    try {
      setActionLoading(true);

      if (pendingAction.type === "delete") {
        const response = await deleteAdminEvent(
          pendingAction.event._id
        );

        toast.success(response.message);
        setPendingAction(null);
        refetchAfterRemoval();
        return;
      }

      const response =
        await updateAdminEventStatus(
          pendingAction.event._id,
          pendingAction.status
        );

      toast.success(response.message);
      setPendingAction(null);
      loadEvents();
    } catch (actionError) {
      toast.error(
        getErrorMessage(
          actionError,
          "Unable to complete event action."
        )
      );
    } finally {
      setActionLoading(false);
    }
  };

  const hasActiveFilters =
    Boolean(search) ||
    Boolean(category) ||
    status !== "all";

  return (
    <div className="mx-auto max-w-7xl">
      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-500">
              Platform events
            </p>

            <h2 className="mt-2 text-2xl font-black text-slate-950">
              Manage Events
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Review organizer events, publication
              status and deletion safety.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-700">
              {pagination.totalItems.toLocaleString(
                "en-IN"
              )}{" "}
              events
            </span>

            <button
              type="button"
              onClick={loadEvents}
              disabled={loading}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={17}
                className={
                  loading ? "animate-spin" : ""
                }
              />
              Refresh
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_180px_190px_auto]">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={searchInput}
              onChange={(event) =>
                setSearchInput(event.target.value)
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  applyFilters();
                }
              }}
              placeholder="Search title, venue or city..."
              className="h-12 w-full rounded-xl border-2 border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
            />
          </div>

          <select
            value={status}
            onChange={(event) => {
              const nextStatus = event.target
                .value as AdminEventStatus | "all";
              setStatus(nextStatus);
              setPage(1);
            }}
            className={fieldClassName}
          >
            {statusFilters.map((option) => (
              <option key={option} value={option}>
                {option === "all"
                  ? "All statuses"
                  : option}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={categoryInput}
            onChange={(event) =>
              setCategoryInput(event.target.value)
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                applyFilters();
              }
            }}
            placeholder="Category"
            className={fieldClassName}
          />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={applyFilters}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-orange-600"
            >
              <Search size={16} />
              Search
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600 transition hover:border-orange-300 hover:text-orange-600"
              >
                <X size={16} />
                Clear
              </button>
            )}
          </div>
        </div>
      </section>

      {error && (
        <section className="mt-5 flex flex-col justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 sm:flex-row sm:items-center">
          <p className="text-sm font-bold text-red-600">
            {error}
          </p>

          <button
            type="button"
            onClick={loadEvents}
            className="w-fit text-sm font-black text-red-700 underline underline-offset-4"
          >
            Try again
          </button>
        </section>
      )}

      <section className="mt-5 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <LoadingState label="Loading events..." />
        ) : events.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] text-left">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th className="px-5 py-4">Event</th>
                  <th className="px-5 py-4">Organizer</th>
                  <th className="px-5 py-4">Date</th>
                  <th className="px-5 py-4">Tickets</th>
                  <th className="px-5 py-4">Price</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {events.map((event) => (
                  <EventRow
                    key={event._id}
                    event={event}
                    onAction={setPendingAction}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && events.length > 0 && (
          <PaginationControls
            pagination={pagination}
            onPageChange={setPage}
          />
        )}
      </section>

      {pendingAction && (
        <ConfirmationModal
          action={pendingAction}
          loading={actionLoading}
          onCancel={() => {
            if (!actionLoading) {
              setPendingAction(null);
            }
          }}
          onConfirm={executeAction}
        />
      )}
    </div>
  );
}

function EventRow({
  event,
  onAction,
}: {
  event: AdminEvent;
  onAction: (action: PendingEventAction) => void;
}) {
  const soldTickets = getTicketsSold(event);

  return (
    <tr className="align-top transition hover:bg-orange-50/40">
      <td className="px-5 py-4">
        <p className="font-black text-slate-950">
          {event.title}
        </p>
        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          {event.category}
        </p>
        <p className="mt-2 max-w-xs truncate text-sm font-medium text-slate-500">
          {event.city ? `${event.city} - ` : ""}
          {event.venue}
        </p>
      </td>

      <td className="px-5 py-4 text-sm font-semibold text-slate-700">
        {getOrganizerName(event)}
      </td>

      <td className="px-5 py-4 text-sm font-semibold text-slate-600">
        <span className="inline-flex items-center gap-2">
          <CalendarDays
            size={15}
            className="text-orange-500"
          />
          {formatEventDate(event.eventDate)}
        </span>
      </td>

      <td className="px-5 py-4">
        <p className="text-sm font-black text-slate-900">
          {soldTickets}/{event.totalTickets} sold
        </p>
        <p className="mt-1 text-xs font-semibold text-slate-500">
          {event.availableTickets} available
        </p>
      </td>

      <td className="px-5 py-4 text-sm font-black text-slate-900">
        {formatCurrency(event.ticketPrice)}
      </td>

      <td className="px-5 py-4">
        <StatusBadge status={event.status} />
      </td>

      <td className="px-5 py-4">
        <div className="flex flex-wrap justify-end gap-2">
          <Link
            href={`/events/${event._id}`}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 transition hover:border-orange-300 hover:text-orange-600"
          >
            <Eye size={15} />
            View
          </Link>

          {event.status !== "published" && (
            <button
              type="button"
              onClick={() =>
                onAction({
                  type: "status",
                  event,
                  status: "published",
                })
              }
              className="inline-flex h-9 items-center justify-center rounded-xl bg-emerald-50 px-3 text-xs font-black text-emerald-600 transition hover:bg-emerald-100"
            >
              Publish
            </button>
          )}

          {event.status !== "cancelled" && (
            <button
              type="button"
              onClick={() =>
                onAction({
                  type: "status",
                  event,
                  status: "cancelled",
                })
              }
              className="inline-flex h-9 items-center justify-center rounded-xl bg-amber-50 px-3 text-xs font-black text-amber-600 transition hover:bg-amber-100"
            >
              Cancel
            </button>
          )}

          <button
            type="button"
            onClick={() =>
              onAction({
                type: "delete",
                event,
              })
            }
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-500 transition hover:bg-red-100"
            aria-label={`Delete ${event.title}`}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </td>
    </tr>
  );
}

function StatusBadge({
  status,
}: {
  status: AdminEventStatus;
}) {
  const className =
    status === "published"
      ? "bg-emerald-50 text-emerald-600"
      : status === "cancelled"
        ? "bg-red-50 text-red-600"
        : status === "completed"
          ? "bg-slate-100 text-slate-600"
        : "bg-slate-100 text-slate-600";

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1.5 text-xs font-black capitalize ${className}`}
    >
      {status}
    </span>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex min-h-80 items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-orange-100 border-t-orange-500" />
        <p className="mt-4 text-sm font-semibold text-slate-500">
          {label}
        </p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="px-6 py-20 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
        <CalendarDays size={30} />
      </div>

      <h3 className="mt-5 text-lg font-black text-slate-950">
        No events found
      </h3>

      <p className="mt-2 text-sm text-slate-500">
        Try changing the search term or selected
        filters.
      </p>
    </div>
  );
}

function PaginationControls({
  pagination,
  onPageChange,
}: {
  pagination: AdminPagination;
  onPageChange: (updater: (page: number) => number) => void;
}) {
  return (
    <div className="flex flex-col justify-between gap-4 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center">
      <p className="text-sm font-semibold text-slate-600">
        Page {pagination.currentPage} of{" "}
        {pagination.totalPages}
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={!pagination.hasPreviousPage}
          onClick={() =>
            onPageChange((current) =>
              Math.max(current - 1, 1)
            )
          }
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-orange-300 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={17} />
          Previous
        </button>

        <button
          type="button"
          disabled={!pagination.hasNextPage}
          onClick={() =>
            onPageChange((current) => current + 1)
          }
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
          <ChevronRight size={17} />
        </button>
      </div>
    </div>
  );
}

function ConfirmationModal({
  action,
  loading,
  onCancel,
  onConfirm,
}: {
  action: PendingEventAction;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const isDelete = action.type === "delete";
  const title = isDelete
    ? "Delete event?"
    : action.status === "cancelled"
      ? "Cancel event?"
      : "Update event status?";

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onMouseDown={onCancel}
    >
      <div
        className="w-full max-w-lg rounded-[24px] bg-white p-6 shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-500">
            <ShieldAlert size={24} />
          </span>

          <div className="min-w-0 flex-1">
            <h3 className="text-xl font-black text-slate-950">
              {title}
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              {isDelete
                ? "Deletion is permanent and may be blocked when the event has booking history. Cancel the event instead when bookings exist."
                : `This will set "${action.event.title}" to ${action.status}.`}
            </p>

            <p className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-900">
              {action.event.title}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 transition hover:border-orange-300 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && (
              <LoaderCircle
                size={17}
                className="animate-spin"
              />
            )}
            {isDelete ? "Delete event" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
