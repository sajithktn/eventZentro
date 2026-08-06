"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  LoaderCircle,
  RefreshCw,
  Search,
  ShieldAlert,
  Ticket,
  X,
} from "lucide-react";

import {
  getAdminBookingById,
  getAdminBookings,
  updateAdminBookingStatus,
  type AdminBooking,
  type AdminBookingStatus,
  type AdminPagination,
  type AdminPaymentStatus,
} from "@/services/admin.service";
import {
  formatCurrency,
  formatEventDate,
} from "@/utils/event";
import { DEFAULT_PAGE_SIZE } from "@/utils/pagination";

const bookingStatusFilters: Array<
  AdminBookingStatus | "all"
> = ["all", "pending", "confirmed", "cancelled"];

const paymentStatusFilters: Array<
  AdminPaymentStatus | "all"
> = [
  "all",
  "unpaid",
  "pending",
  "verifying",
  "paid",
  "failed",
  "refunded",
];

const fieldClassName =
  "h-12 rounded-xl border-2 border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100";

const initialPagination: AdminPagination = {
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  itemsPerPage: DEFAULT_PAGE_SIZE,
  hasNextPage: false,
  hasPreviousPage: false,
};

interface PendingBookingAction {
  booking: AdminBooking;
  status: AdminBookingStatus;
}

const isPopulatedUser = (
  user: AdminBooking["user"]
) => Boolean(user && typeof user !== "string");

const isPopulatedEvent = (
  event: AdminBooking["event"]
) => Boolean(event && typeof event !== "string");

const getCustomerName = (booking: AdminBooking) => {
  if (!isPopulatedUser(booking.user)) {
    return "Deleted user";
  }

  const user = booking.user;

  if (!user || typeof user === "string") {
    return "Deleted user";
  }

  return (
    [user.firstName, user.lastName]
      .filter(Boolean)
      .join(" ") ||
    user.email ||
    "Deleted user"
  );
};

const getCustomerEmail = (booking: AdminBooking) => {
  if (!isPopulatedUser(booking.user)) {
    return "";
  }

  const user = booking.user;

  return user && typeof user !== "string"
    ? user.email || ""
    : "";
};

const getEventTitle = (booking: AdminBooking) => {
  if (!isPopulatedEvent(booking.event)) {
    return "Deleted event";
  }

  const event = booking.event;

  return event && typeof event !== "string"
    ? event.title || "Deleted event"
    : "Deleted event";
};

const getEventVenue = (booking: AdminBooking) => {
  if (!isPopulatedEvent(booking.event)) {
    return "";
  }

  const event = booking.event;

  return event && typeof event !== "string"
    ? event.venue || event.city || ""
    : "";
};

const getTicketCount = (booking: AdminBooking) =>
  booking.ticketCount || booking.quantity;

const getOriginalAmount = (booking: AdminBooking) =>
  booking.originalAmount ??
  booking.subtotalAmount ??
  booking.totalAmount;

const getFinalAmount = (booking: AdminBooking) =>
  booking.finalAmount ?? booking.totalAmount;

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

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<
    AdminBooking[]
  >([]);
  const [pagination, setPagination] =
    useState<AdminPagination>(initialPagination);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<
    AdminBookingStatus | "all"
  >("all");
  const [paymentStatus, setPaymentStatus] =
    useState<AdminPaymentStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [details, setDetails] =
    useState<AdminBooking | null>(null);
  const [detailsLoading, setDetailsLoading] =
    useState(false);
  const [detailsError, setDetailsError] = useState("");
  const [pendingAction, setPendingAction] =
    useState<PendingBookingAction | null>(null);
  const [actionLoading, setActionLoading] =
    useState(false);

  const requestParams = useMemo(
    () => ({
      page,
      limit: DEFAULT_PAGE_SIZE,
      search: search || undefined,
      status: status !== "all" ? status : undefined,
      paymentStatus:
        paymentStatus !== "all"
          ? paymentStatus
          : undefined,
      sort: "newest",
    }),
    [page, paymentStatus, search, status]
  );

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await getAdminBookings(requestParams);

      setBookings(response.bookings);
      setPagination(response.pagination);
    } catch (loadError) {
      const message = getErrorMessage(
        loadError,
        "Unable to load bookings."
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
          await getAdminBookings(requestParams);

        if (!isActive) {
          return;
        }

        setBookings(response.bookings);
        setPagination(response.pagination);
      } catch (loadError) {
        if (!isActive) {
          return;
        }

        const message = getErrorMessage(
          loadError,
          "Unable to load bookings."
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

      const response =
        await getAdminBookingById(bookingId);

      setDetails(response.booking);
    } catch (detailsLoadError) {
      const message = getErrorMessage(
        detailsLoadError,
        "Unable to load booking details."
      );

      setDetailsError(message);
      toast.error(message);
    } finally {
      setDetailsLoading(false);
    }
  };

  const executeAction = async () => {
    if (!pendingAction) {
      return;
    }

    try {
      setActionLoading(true);

      const response =
        await updateAdminBookingStatus(
          pendingAction.booking._id,
          pendingAction.status
        );

      toast.success(response.message);
      setPendingAction(null);
      loadBookings();

      if (
        details?._id ===
        pendingAction.booking._id
      ) {
        setDetails(response.booking);
      }
    } catch (actionError) {
      toast.error(
        getErrorMessage(
          actionError,
          "Unable to update booking."
        )
      );
    } finally {
      setActionLoading(false);
    }
  };

  const hasActiveFilters =
    Boolean(search) ||
    status !== "all" ||
    paymentStatus !== "all";

  return (
    <div className="mx-auto max-w-7xl">
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
              {pagination.totalItems.toLocaleString(
                "en-IN"
              )}{" "}
              bookings
            </span>

            <button
              type="button"
              onClick={loadBookings}
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
                  applySearch();
                }
              }}
              placeholder="Search booking, user or event..."
              className="h-12 w-full rounded-xl border-2 border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
            />
          </div>

          <select
            value={status}
            onChange={(event) => {
              const nextStatus = event.target
                .value as AdminBookingStatus | "all";
              setStatus(nextStatus);
              setPage(1);
            }}
            className={fieldClassName}
          >
            {bookingStatusFilters.map((option) => (
              <option key={option} value={option}>
                {option === "all"
                  ? "All bookings"
                  : option}
              </option>
            ))}
          </select>

          <select
            value={paymentStatus}
            onChange={(event) => {
              const nextStatus = event.target
                .value as AdminPaymentStatus | "all";
              setPaymentStatus(nextStatus);
              setPage(1);
            }}
            className={fieldClassName}
          >
            {paymentStatusFilters.map((option) => (
              <option key={option} value={option}>
                {option === "all"
                  ? "All payments"
                  : option}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={applySearch}
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
            onClick={loadBookings}
            className="w-fit text-sm font-black text-red-700 underline underline-offset-4"
          >
            Try again
          </button>
        </section>
      )}

      <section className="mt-5 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <LoadingState label="Loading bookings..." />
        ) : bookings.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto">
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
                {bookings.map((booking) => (
                  <BookingRow
                    key={booking._id}
                    booking={booking}
                    onDetails={loadDetails}
                    onAction={setPendingAction}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && bookings.length > 0 && (
          <PaginationControls
            pagination={pagination}
            onPageChange={setPage}
          />
        )}
      </section>

      {(details ||
        detailsLoading ||
        detailsError) && (
        <BookingDetailsModal
          booking={details}
          loading={detailsLoading}
          error={detailsError}
          onRetry={() => {
            if (details?._id) {
              loadDetails(details._id);
            }
          }}
          onClose={() => {
            if (!detailsLoading) {
              setDetails(null);
              setDetailsError("");
            }
          }}
        />
      )}

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

function BookingRow({
  booking,
  onDetails,
  onAction,
}: {
  booking: AdminBooking;
  onDetails: (bookingId: string) => void;
  onAction: (action: PendingBookingAction) => void;
}) {
  const canConfirm =
    booking.status === "pending" &&
    booking.paymentStatus === "paid";
  const canCancel = booking.status !== "cancelled";

  return (
    <tr className="align-top transition hover:bg-orange-50/40">
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
        {getCustomerEmail(booking) && (
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {getCustomerEmail(booking)}
          </p>
        )}
      </td>

      <td className="px-5 py-4">
        <p className="max-w-xs truncate font-bold text-slate-900">
          {getEventTitle(booking)}
        </p>
        {getEventVenue(booking) && (
          <p className="mt-1 max-w-xs truncate text-xs font-semibold text-slate-500">
            {getEventVenue(booking)}
          </p>
        )}
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
          <StatusBadge status={booking.status} />
          <PaymentBadge
            status={booking.paymentStatus}
          />
        </div>
      </td>

      <td className="px-5 py-4">
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => onDetails(booking._id)}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 transition hover:border-orange-300 hover:text-orange-600"
          >
            <Eye size={15} />
            Details
          </button>

          {canConfirm && (
            <button
              type="button"
              onClick={() =>
                onAction({
                  booking,
                  status: "confirmed",
                })
              }
              className="inline-flex h-9 items-center justify-center rounded-xl bg-emerald-50 px-3 text-xs font-black text-emerald-600 transition hover:bg-emerald-100"
            >
              Confirm
            </button>
          )}

          <button
            type="button"
            onClick={() =>
              onAction({
                booking,
                status: "cancelled",
              })
            }
            disabled={!canCancel}
            title={
              canCancel
                ? "Cancel booking"
                : "Booking is already cancelled"
            }
            className="inline-flex h-9 items-center justify-center rounded-xl bg-red-50 px-3 text-xs font-black text-red-500 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          >
            Cancel
          </button>
        </div>
      </td>
    </tr>
  );
}

function StatusBadge({
  status,
}: {
  status: AdminBookingStatus;
}) {
  const className =
    status === "confirmed"
      ? "bg-emerald-50 text-emerald-600"
      : status === "cancelled"
        ? "bg-red-50 text-red-600"
        : "bg-amber-50 text-amber-600";

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1.5 text-xs font-black capitalize ${className}`}
    >
      {status}
    </span>
  );
}

function PaymentBadge({
  status,
}: {
  status?: AdminPaymentStatus;
}) {
  const paymentStatus = status || "unpaid";
  const className =
    paymentStatus === "paid"
      ? "bg-emerald-50 text-emerald-600"
      : paymentStatus === "failed"
        ? "bg-red-50 text-red-600"
        : paymentStatus === "refunded"
          ? "bg-indigo-50 text-indigo-600"
          : "bg-slate-100 text-slate-600";

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1.5 text-xs font-black capitalize ${className}`}
    >
      {paymentStatus}
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
        <Ticket size={30} />
      </div>

      <h3 className="mt-5 text-lg font-black text-slate-950">
        No bookings found
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

function BookingDetailsModal({
  booking,
  loading,
  error,
  onRetry,
  onClose,
}: {
  booking: AdminBooking | null;
  loading: boolean;
  error: string;
  onRetry: () => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        className="max-h-[86vh] w-full max-w-2xl overflow-y-auto rounded-[24px] bg-white p-6 shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-500">
              Booking details
            </p>
            <h3 className="mt-2 text-xl font-black text-slate-950">
              {booking?.bookingCode || "Loading booking"}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
            aria-label="Close booking details"
          >
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <LoadingState label="Loading booking details..." />
        ) : error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-6 text-center">
            <AlertCircle
              size={30}
              className="mx-auto text-red-500"
            />
            <p className="mt-3 font-bold text-red-600">
              {error}
            </p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-black text-white"
            >
              Retry
            </button>
          </div>
        ) : booking ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <DetailItem
              label="Customer"
              value={getCustomerName(booking)}
            />
            <DetailItem
              label="Event"
              value={getEventTitle(booking)}
            />
            <DetailItem
              label="Tickets"
              value={String(getTicketCount(booking))}
            />
            <DetailItem
              label="Original amount"
              value={formatCurrency(
                getOriginalAmount(booking)
              )}
            />
            <DetailItem
              label="Discount"
              value={formatCurrency(
                booking.discountAmount || 0
              )}
            />
            <DetailItem
              label="Final amount"
              value={formatCurrency(
                getFinalAmount(booking)
              )}
            />
            <DetailItem
              label="Booking status"
              value={booking.status}
            />
            <DetailItem
              label="Payment status"
              value={booking.paymentStatus || "unpaid"}
            />
            <DetailItem
              label="Razorpay order"
              value={booking.razorpayOrderId || "Not created"}
            />
            <DetailItem
              label="Razorpay payment"
              value={
                booking.razorpayPaymentId || "Not paid"
              }
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function ConfirmationModal({
  action,
  loading,
  onCancel,
  onConfirm,
}: {
  action: PendingBookingAction;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const isCancellation =
    action.status === "cancelled";

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
              {isCancellation
                ? "Cancel booking?"
                : "Confirm booking?"}
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              {isCancellation
                ? "Confirmed bookings restore ticket availability only once. Paid bookings stay paid until an actual refund is processed."
                : "Only paid pending bookings can be confirmed. Tickets will be claimed when confirmation succeeds."}
            </p>

            <p className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-900">
              {action.booking.bookingCode}
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
            {isCancellation
              ? "Cancel booking"
              : "Confirm booking"}
          </button>
        </div>
      </div>
    </div>
  );
}
