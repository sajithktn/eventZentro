"use client";

import { ChevronLeft, ChevronRight, Eye, Ticket } from "lucide-react";
import { type AdminBooking, type AdminBookingStatus, type AdminPagination, type AdminPaymentStatus } from "@/services/admin.service";
import { formatCurrency, formatEventDate } from "@/utils/event";

import { PendingBookingAction } from "./types";
import { getCustomerEmail, getCustomerName, getEventTitle, getEventVenue, getFinalAmount, getTicketCount } from "./utils";

export function BookingRow({ booking, onDetails, onAction, }: {
    booking: AdminBooking;
    onDetails: (bookingId: string) => void;
    onAction: (action: PendingBookingAction) => void;
}) {
    const canConfirm = booking.status === "pending" &&
        booking.paymentStatus === "paid";
    const canCancel = booking.status !== "cancelled";
    return (<tr className="align-top transition hover:bg-orange-50/40">
      <td className="px-5 py-4">
        <p className="font-black text-slate-950">
          {booking.bookingCode}
        </p>
        <p className="mt-1 text-xs font-semibold text-slate-500">
          {formatEventDate(booking.createdAt)}
        </p>
      </td>

      <td className="px-5 py-4">
        <p className="font-bold text-slate-900">
          {getCustomerName(booking)}
        </p>
        {getCustomerEmail(booking) && (<p className="mt-1 text-xs font-semibold text-slate-500">
            {getCustomerEmail(booking)}
          </p>)}
      </td>

      <td className="px-5 py-4">
        <p className="max-w-xs truncate font-bold text-slate-900">
          {getEventTitle(booking)}
        </p>
        {getEventVenue(booking) && (<p className="mt-1 max-w-xs truncate text-xs font-semibold text-slate-500">
            {getEventVenue(booking)}
          </p>)}
      </td>

      <td className="px-5 py-4 text-sm font-black text-slate-900">
        {getTicketCount(booking)}
      </td>

      <td className="px-5 py-4">
        <p className="font-black text-slate-950">
          {formatCurrency(getFinalAmount(booking))}
        </p>
        <p className="mt-1 text-xs font-semibold text-slate-500">
          Discount{" "}
          {formatCurrency(booking.discountAmount || 0)}
        </p>
      </td>

      <td className="px-5 py-4">
        <div className="space-y-2">
          <StatusBadge status={booking.status}/>
          <PaymentBadge status={booking.paymentStatus}/>
        </div>
      </td>

      <td className="px-5 py-4">
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" onClick={() => onDetails(booking._id)} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 transition hover:border-orange-300 hover:text-orange-600">
            <Eye size={15}/>
            Details
          </button>

          {canConfirm && (<button type="button" onClick={() => onAction({
                booking,
                status: "confirmed",
            })} className="inline-flex h-9 items-center justify-center rounded-xl bg-emerald-50 px-3 text-xs font-black text-emerald-600 transition hover:bg-emerald-100">
              Confirm
            </button>)}

          <button type="button" onClick={() => onAction({
            booking,
            status: "cancelled",
        })} disabled={!canCancel} title={canCancel
            ? "Cancel booking"
            : "Booking is already cancelled"} className="inline-flex h-9 items-center justify-center rounded-xl bg-red-50 px-3 text-xs font-black text-red-500 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400">
            Cancel
          </button>
        </div>
      </td>
    </tr>);
}

export function StatusBadge({ status, }: {
    status: AdminBookingStatus;
}) {
    const className = status === "confirmed"
        ? "bg-emerald-50 text-emerald-600"
        : status === "cancelled"
            ? "bg-red-50 text-red-600"
            : "bg-amber-50 text-amber-600";
    return (<span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-black capitalize ${className}`}>
      {status}
    </span>);
}

export function PaymentBadge({ status, }: {
    status?: AdminPaymentStatus;
}) {
    const paymentStatus = status || "unpaid";
    const className = paymentStatus === "paid"
        ? "bg-emerald-50 text-emerald-600"
        : paymentStatus === "failed"
            ? "bg-red-50 text-red-600"
            : paymentStatus === "refunded"
                ? "bg-indigo-50 text-indigo-600"
                : "bg-slate-100 text-slate-600";
    return (<span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-black capitalize ${className}`}>
      {paymentStatus}
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
        <Ticket size={30}/>
      </div>

      <h3 className="mt-5 text-lg font-black text-slate-950">
        No bookings found
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
