"use client";

import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, Eye, Trash2 } from "lucide-react";
import { type AdminEvent, type AdminEventStatus, type AdminPagination } from "@/services/admin.service";
import { formatCurrency, formatEventDate } from "@/utils/event";

import { PendingEventAction } from "./types";
import { getOrganizerName, getTicketsSold } from "./utils";

export function EventRow({ event, onAction, }: {
    event: AdminEvent;
    onAction: (action: PendingEventAction) => void;
}) {
    const soldTickets = getTicketsSold(event);
    return (<tr className="align-top transition hover:bg-orange-50/40">
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
          <CalendarDays size={15} className="text-orange-500"/>
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
        <StatusBadge status={event.status}/>
      </td>

      <td className="px-5 py-4">
        <div className="flex flex-wrap justify-end gap-2">
          <Link href={`/events/${event._id}`} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 transition hover:border-orange-300 hover:text-orange-600">
            <Eye size={15}/>
            View
          </Link>

          {event.status !== "published" && (<button type="button" onClick={() => onAction({
                type: "status",
                event,
                status: "published",
            })} className="inline-flex h-9 items-center justify-center rounded-xl bg-emerald-50 px-3 text-xs font-black text-emerald-600 transition hover:bg-emerald-100">
              Publish
            </button>)}

          {event.status !== "cancelled" && (<button type="button" onClick={() => onAction({
                type: "status",
                event,
                status: "cancelled",
            })} className="inline-flex h-9 items-center justify-center rounded-xl bg-amber-50 px-3 text-xs font-black text-amber-600 transition hover:bg-amber-100">
              Cancel
            </button>)}

          <button type="button" onClick={() => onAction({
            type: "delete",
            event,
        })} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-500 transition hover:bg-red-100" aria-label={`Delete ${event.title}`}>
            <Trash2 size={15}/>
          </button>
        </div>
      </td>
    </tr>);
}

export function StatusBadge({ status, }: {
    status: AdminEventStatus;
}) {
    const className = status === "published"
        ? "bg-emerald-50 text-emerald-600"
        : status === "cancelled"
            ? "bg-red-50 text-red-600"
            : status === "completed"
                ? "bg-slate-100 text-slate-600"
                : "bg-slate-100 text-slate-600";
    return (<span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-black capitalize ${className}`}>
      {status}
    </span>);
}

export function LoadingState({ label }: {
    label: string;
}) {
    return (<div className="flex min-h-80 items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-orange-100 border-t-orange-500"/>
        <p className="mt-4 text-sm font-semibold text-slate-500">
          {label}
        </p>
      </div>
    </div>);
}

export function EmptyState() {
    return (<div className="px-6 py-20 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
        <CalendarDays size={30}/>
      </div>

      <h3 className="mt-5 text-lg font-black text-slate-950">
        No events found
      </h3>

      <p className="mt-2 text-sm text-slate-500">
        Try changing the search term or selected
        filters.
      </p>
    </div>);
}

export function PaginationControls({ pagination, onPageChange, }: {
    pagination: AdminPagination;
    onPageChange: (updater: (page: number) => number) => void;
}) {
    return (<div className="flex flex-col justify-between gap-4 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center">
      <p className="text-sm font-semibold text-slate-600">
        Page {pagination.currentPage} of{" "}
        {pagination.totalPages}
      </p>

      <div className="flex items-center gap-2">
        <button type="button" disabled={!pagination.hasPreviousPage} onClick={() => onPageChange((current) => Math.max(current - 1, 1))} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-orange-300 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-40">
          <ChevronLeft size={17}/>
          Previous
        </button>

        <button type="button" disabled={!pagination.hasNextPage} onClick={() => onPageChange((current) => current + 1)} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-40">
          Next
          <ChevronRight size={17}/>
        </button>
      </div>
    </div>);
}
