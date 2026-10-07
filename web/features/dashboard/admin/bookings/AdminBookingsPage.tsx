"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { RefreshCw, Search, X } from "lucide-react";
import { getAdminBookingById, getAdminBookings, updateAdminBookingStatus, type AdminBooking, type AdminBookingStatus, type AdminPagination, type AdminPaymentStatus } from "@/services/admin.service";
import { DEFAULT_PAGE_SIZE } from "@/utils/pagination";

import { ConfirmationModal } from "./BookingConfirmationModal";
import { BookingDetailsModal } from "./BookingDetailsModal";
import { BookingRow, EmptyState, LoadingState, PaginationControls } from "./BookingList";
import { bookingStatusFilters, fieldClassName, initialPagination, paymentStatusFilters } from "./constants";
import { PendingBookingAction } from "./types";
import { getErrorMessage } from "./utils";

export default function AdminBookingsPage() {
    const [bookings, setBookings] = useState<AdminBooking[]>([]);
    const [pagination, setPagination] = useState<AdminPagination>(initialPagination);
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState<AdminBookingStatus | "all">("all");
    const [paymentStatus, setPaymentStatus] = useState<AdminPaymentStatus | "all">("all");
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [details, setDetails] = useState<AdminBooking | null>(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [detailsError, setDetailsError] = useState("");
    const [pendingAction, setPendingAction] = useState<PendingBookingAction | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const requestParams = useMemo(() => ({
        page,
        limit: DEFAULT_PAGE_SIZE,
        search: search || undefined,
        status: status !== "all" ? status : undefined,
        paymentStatus: paymentStatus !== "all"
            ? paymentStatus
            : undefined,
        sort: "newest",
    }), [page, paymentStatus, search, status]);
    const loadBookings = async () => {
        try {
            setLoading(true);
            setError("");
            const response = await getAdminBookings(requestParams);
            setBookings(response.bookings);
            setPagination(response.pagination);
        }
        catch (loadError) {
            const message = getErrorMessage(loadError, "Unable to load bookings.");
            setError(message);
            toast.error(message);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        let isActive = true;
        void Promise.resolve().then(async () => {
            try {
                setLoading(true);
                setError("");
                const response = await getAdminBookings(requestParams);
                if (!isActive) {
                    return;
                }
                setBookings(response.bookings);
                setPagination(response.pagination);
            }
            catch (loadError) {
                if (!isActive) {
                    return;
                }
                const message = getErrorMessage(loadError, "Unable to load bookings.");
                setError(message);
                toast.error(message);
            }
            finally {
                if (isActive) {
                    setLoading(false);
                }
            }
        });
        return () => {
            isActive = false;
        };
    }, [requestParams]);
    const applySearch = () => {
        setPage(1);
        setSearch(searchInput.trim());
    };
    const resetFilters = () => {
        setSearchInput("");
        setSearch("");
        setStatus("all");
        setPaymentStatus("all");
        setPage(1);
    };
    const loadDetails = async (bookingId: string) => {
        try {
            setDetailsLoading(true);
            setDetailsError("");
            setDetails(null);
            const response = await getAdminBookingById(bookingId);
            setDetails(response.booking);
        }
        catch (detailsLoadError) {
            const message = getErrorMessage(detailsLoadError, "Unable to load booking details.");
            setDetailsError(message);
            toast.error(message);
        }
        finally {
            setDetailsLoading(false);
        }
    };
    const executeAction = async () => {
        if (!pendingAction) {
            return;
        }
        try {
            setActionLoading(true);
            const response = await updateAdminBookingStatus(pendingAction.booking._id, pendingAction.status);
            toast.success(response.message);
            setPendingAction(null);
            loadBookings();
            if (details?._id ===
                pendingAction.booking._id) {
                setDetails(response.booking);
            }
        }
        catch (actionError) {
            toast.error(getErrorMessage(actionError, "Unable to update booking."));
        }
        finally {
            setActionLoading(false);
        }
    };
    const hasActiveFilters = Boolean(search) ||
        status !== "all" ||
        paymentStatus !== "all";
    return (<div className="mx-auto max-w-7xl">
      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-500">
              Reservations
            </p>

            <h2 className="mt-2 text-2xl font-black text-slate-950">
              Manage Bookings
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              View booking records, inspect payment
              state and manage supported status
              changes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-700">
              {pagination.totalItems.toLocaleString("en-IN")}{" "}
              bookings
            </span>

            <button type="button" onClick={loadBookings} disabled={loading} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60">
              <RefreshCw size={17} className={loading ? "animate-spin" : ""}/>
              Refresh
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_180px_190px_auto]">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>

            <input type="text" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} onKeyDown={(event) => {
            if (event.key === "Enter") {
                applySearch();
            }
        }} placeholder="Search booking, user or event..." className="h-12 w-full rounded-xl border-2 border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"/>
          </div>

          <select value={status} onChange={(event) => {
            const nextStatus = event.target
                .value as AdminBookingStatus | "all";
            setStatus(nextStatus);
            setPage(1);
        }} className={fieldClassName}>
            {bookingStatusFilters.map((option) => (<option key={option} value={option}>
                {option === "all"
                ? "All bookings"
                : option}
              </option>))}
          </select>

          <select value={paymentStatus} onChange={(event) => {
            const nextStatus = event.target
                .value as AdminPaymentStatus | "all";
            setPaymentStatus(nextStatus);
            setPage(1);
        }} className={fieldClassName}>
            {paymentStatusFilters.map((option) => (<option key={option} value={option}>
                {option === "all"
                ? "All payments"
                : option}
              </option>))}
          </select>

          <div className="flex gap-2">
            <button type="button" onClick={applySearch} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-orange-600">
              <Search size={16}/>
              Search
            </button>

            {hasActiveFilters && (<button type="button" onClick={resetFilters} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600 transition hover:border-orange-300 hover:text-orange-600">
                <X size={16}/>
                Clear
              </button>)}
          </div>
        </div>
      </section>

      {error && (<section className="mt-5 flex flex-col justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 sm:flex-row sm:items-center">
          <p className="text-sm font-bold text-red-600">
            {error}
          </p>

          <button type="button" onClick={loadBookings} className="w-fit text-sm font-black text-red-700 underline underline-offset-4">
            Try again
          </button>
        </section>)}

      <section className="mt-5 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
        {loading ? (<LoadingState label="Loading bookings..."/>) : bookings.length === 0 ? (<EmptyState />) : (<div className="overflow-x-auto">
            <table className="w-full min-w-[1160px] text-left">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th className="px-5 py-4">Booking</th>
                  <th className="px-5 py-4">Customer</th>
                  <th className="px-5 py-4">Event</th>
                  <th className="px-5 py-4">Tickets</th>
                  <th className="px-5 py-4">Amounts</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {bookings.map((booking) => (<BookingRow key={booking._id} booking={booking} onDetails={loadDetails} onAction={setPendingAction}/>))}
              </tbody>
            </table>
          </div>)}

        {!loading && bookings.length > 0 && (<PaginationControls pagination={pagination} onPageChange={setPage}/>)}
      </section>

      {(details ||
            detailsLoading ||
            detailsError) && (<BookingDetailsModal booking={details} loading={detailsLoading} error={detailsError} onRetry={() => {
                if (details?._id) {
                    loadDetails(details._id);
                }
            }} onClose={() => {
                if (!detailsLoading) {
                    setDetails(null);
                    setDetailsError("");
                }
            }}/>)}

      {pendingAction && (<ConfirmationModal action={pendingAction} loading={actionLoading} onCancel={() => {
                if (!actionLoading) {
                    setPendingAction(null);
                }
            }} onConfirm={executeAction}/>)}
    </div>);
}
