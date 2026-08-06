"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  BadgePercent,
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
  deleteAdminPromotion,
  getAdminPromotions,
  updateAdminPromotionStatus,
  type AdminPagination,
  type AdminPromotion,
  type AdminPromotionMode,
  type AdminPromotionStatus,
} from "@/services/admin.service";
import {
  formatCurrency,
  formatEventDate,
} from "@/utils/event";
import { DEFAULT_PAGE_SIZE } from "@/utils/pagination";

const modeFilters: Array<AdminPromotionMode | "all"> =
  ["all", "coupon", "automatic"];

const statusFilters: Array<
  AdminPromotionStatus | "all"
> = ["all", "active", "inactive", "expired"];

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

type PendingPromotionAction =
  | {
      type: "status";
      promotion: AdminPromotion;
      status: AdminPromotionStatus;
    }
  | {
      type: "delete";
      promotion: AdminPromotion;
    };

const getPromotionName = (
  promotion: AdminPromotion
) =>
  promotion.name ||
  promotion.displayText ||
  promotion.code ||
  "Event offer";

const getEventName = (
  promotion: AdminPromotion
) => {
  if (!promotion.event) {
    return "Deleted event";
  }

  if (typeof promotion.event === "string") {
    return "Deleted event";
  }

  return promotion.event.title || "Deleted event";
};

const getOrganizerName = (
  promotion: AdminPromotion
) => {
  if (!promotion.organizer) {
    return "Unknown organizer";
  }

  if (typeof promotion.organizer === "string") {
    return "Unknown organizer";
  }

  return (
    [
      promotion.organizer.firstName,
      promotion.organizer.lastName,
    ]
      .filter(Boolean)
      .join(" ") ||
    promotion.organizer.email ||
    "Unknown organizer"
  );
};

const getPromotionStatus = (
  promotion: AdminPromotion
): AdminPromotionStatus =>
  promotion.status ||
  (promotion.isActive === false
    ? "inactive"
    : "active");

const getDiscountLabel = (
  promotion: AdminPromotion
) =>
  promotion.discountType === "percentage"
    ? `${promotion.discountValue}% off`
    : `${formatCurrency(
        promotion.discountValue
      )} off`;

const getUsageLimit = (
  promotion: AdminPromotion
) =>
  promotion.totalUsageLimit ??
  promotion.usageLimit;

const getMaximumDiscount = (
  promotion: AdminPromotion
) =>
  promotion.maximumDiscountAmount ??
  promotion.maximumDiscount;

const getMinimumAmount = (
  promotion: AdminPromotion
) =>
  promotion.minimumBookingAmount ??
  promotion.minimumAmount;

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

export default function AdminPromotionsPage() {
  const [promotions, setPromotions] = useState<
    AdminPromotion[]
  >([]);
  const [pagination, setPagination] =
    useState<AdminPagination>(initialPagination);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<
    AdminPromotionMode | "all"
  >("all");
  const [status, setStatus] = useState<
    AdminPromotionStatus | "all"
  >("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [details, setDetails] =
    useState<AdminPromotion | null>(null);
  const [pendingAction, setPendingAction] =
    useState<PendingPromotionAction | null>(null);
  const [actionLoading, setActionLoading] =
    useState(false);

  const requestParams = useMemo(
    () => ({
      page,
      limit: DEFAULT_PAGE_SIZE,
      search: search || undefined,
      promotionMode:
        mode !== "all" ? mode : undefined,
      status: status !== "all" ? status : undefined,
      organizer: "all",
      sort: "newest",
    }),
    [mode, page, search, status]
  );

  const loadPromotions = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await getAdminPromotions(requestParams);

      setPromotions(response.promotions);
      setPagination(response.pagination);
    } catch (loadError) {
      const message = getErrorMessage(
        loadError,
        "Unable to load promotions."
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
          await getAdminPromotions(requestParams);

        if (!isActive) {
          return;
        }

        setPromotions(response.promotions);
        setPagination(response.pagination);
      } catch (loadError) {
        if (!isActive) {
          return;
        }

        const message = getErrorMessage(
          loadError,
          "Unable to load promotions."
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
    setMode("all");
    setStatus("all");
    setPage(1);
  };

  const refetchAfterRemoval = () => {
    if (promotions.length === 1 && page > 1) {
      setPage((currentPage) =>
        Math.max(currentPage - 1, 1)
      );
      return;
    }

    loadPromotions();
  };

  const executeAction = async () => {
    if (!pendingAction) {
      return;
    }

    try {
      setActionLoading(true);

      if (pendingAction.type === "delete") {
        const response =
          await deleteAdminPromotion(
            pendingAction.promotion._id
          );

        toast.success(response.message);
        setPendingAction(null);
        setDetails(null);
        refetchAfterRemoval();
        return;
      }

      const response =
        await updateAdminPromotionStatus(
          pendingAction.promotion._id,
          pendingAction.status
        );

      toast.success(response.message);
      setPendingAction(null);
      loadPromotions();

      const updatedPromotion =
        response.promotion || response.coupon || null;

      if (
        updatedPromotion &&
        details?._id === updatedPromotion._id
      ) {
        setDetails(updatedPromotion);
      }
    } catch (actionError) {
      toast.error(
        getErrorMessage(
          actionError,
          "Unable to update promotion."
        )
      );
    } finally {
      setActionLoading(false);
    }
  };

  const hasActiveFilters =
    Boolean(search) ||
    mode !== "all" ||
    status !== "all";

  return (
    <div className="mx-auto max-w-7xl">
      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-500">
              Platform discounts
            </p>

            <h2 className="mt-2 text-2xl font-black text-slate-950">
              Promotion Management
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Manage coupon and automatic event offers
              backed by the existing promotion model.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-700">
              {pagination.totalItems.toLocaleString(
                "en-IN"
              )}{" "}
              promotions
            </span>

            <button
              type="button"
              onClick={loadPromotions}
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

        <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_170px_180px_auto]">
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
              placeholder="Search name, code or event..."
              className="h-12 w-full rounded-xl border-2 border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
            />
          </div>

          <select
            value={mode}
            onChange={(event) => {
              const nextMode = event.target
                .value as AdminPromotionMode | "all";
              setMode(nextMode);
              setPage(1);
            }}
            className={fieldClassName}
          >
            {modeFilters.map((option) => (
              <option key={option} value={option}>
                {option === "all"
                  ? "All modes"
                  : option}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(event) => {
              const nextStatus = event.target
                .value as AdminPromotionStatus | "all";
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
            onClick={loadPromotions}
            className="w-fit text-sm font-black text-red-700 underline underline-offset-4"
          >
            Try again
          </button>
        </section>
      )}

      <section className="mt-5 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <LoadingState label="Loading promotions..." />
        ) : promotions.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] text-left">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th className="px-5 py-4">Promotion</th>
                  <th className="px-5 py-4">Organizer</th>
                  <th className="px-5 py-4">Event</th>
                  <th className="px-5 py-4">Discount</th>
                  <th className="px-5 py-4">Usage</th>
                  <th className="px-5 py-4">Validity</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {promotions.map((promotion) => (
                  <PromotionRow
                    key={promotion._id}
                    promotion={promotion}
                    onDetails={setDetails}
                    onAction={setPendingAction}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && promotions.length > 0 && (
          <PaginationControls
            pagination={pagination}
            onPageChange={setPage}
          />
        )}
      </section>

      {details && (
        <PromotionDetailsModal
          promotion={details}
          onClose={() => setDetails(null)}
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

function PromotionRow({
  promotion,
  onDetails,
  onAction,
}: {
  promotion: AdminPromotion;
  onDetails: (promotion: AdminPromotion) => void;
  onAction: (action: PendingPromotionAction) => void;
}) {
  const status = getPromotionStatus(promotion);
  const nextStatus =
    status === "active" ? "inactive" : "active";

  return (
    <tr className="align-top transition hover:bg-orange-50/40">
      <td className="px-5 py-4">
        <p className="font-black text-slate-950">
          {getPromotionName(promotion)}
        </p>
        <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">
          {promotion.promotionMode === "automatic"
            ? "Automatic offer"
            : promotion.code || "Coupon"}
        </p>
      </td>

      <td className="px-5 py-4 text-sm font-semibold text-slate-700">
        {getOrganizerName(promotion)}
      </td>

      <td className="px-5 py-4">
        <p className="max-w-xs truncate font-semibold text-slate-900">
          {getEventName(promotion)}
        </p>
      </td>

      <td className="px-5 py-4">
        <p className="font-black text-slate-950">
          {getDiscountLabel(promotion)}
        </p>
        {getMaximumDiscount(promotion) && (
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Max{" "}
            {formatCurrency(
              getMaximumDiscount(promotion) || 0
            )}
          </p>
        )}
      </td>

      <td className="px-5 py-4">
        <p className="font-bold text-slate-900">
          {promotion.usedCount}
          {getUsageLimit(promotion)
            ? `/${getUsageLimit(promotion)}`
            : ""}{" "}
          used
        </p>
        {promotion.firstNTickets ? (
          <p className="mt-1 text-xs font-semibold text-slate-500">
            First {promotion.firstNTickets} tickets
          </p>
        ) : null}
      </td>

      <td className="px-5 py-4 text-xs font-semibold text-slate-600">
        <p>{formatEventDate(promotion.validFrom)}</p>
        <p className="mt-1">
          to {formatEventDate(promotion.validUntil)}
        </p>
      </td>

      <td className="px-5 py-4">
        <StatusBadge status={status} />
      </td>

      <td className="px-5 py-4">
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => onDetails(promotion)}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 transition hover:border-orange-300 hover:text-orange-600"
          >
            <Eye size={15} />
            Details
          </button>

          <button
            type="button"
            onClick={() =>
              onAction({
                type: "status",
                promotion,
                status: nextStatus,
              })
            }
            className="inline-flex h-9 items-center justify-center rounded-xl bg-orange-50 px-3 text-xs font-black text-orange-600 transition hover:bg-orange-100"
          >
            {status === "active"
              ? "Deactivate"
              : "Activate"}
          </button>

          <button
            type="button"
            onClick={() =>
              onAction({
                type: "delete",
                promotion,
              })
            }
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-500 transition hover:bg-red-100"
            aria-label={`Delete ${getPromotionName(
              promotion
            )}`}
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
  status: AdminPromotionStatus;
}) {
  const className =
    status === "active"
      ? "bg-emerald-50 text-emerald-600"
      : status === "expired"
        ? "bg-amber-50 text-amber-600"
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
        <BadgePercent size={30} />
      </div>

      <h3 className="mt-5 text-lg font-black text-slate-950">
        No promotions found
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

function PromotionDetailsModal({
  promotion,
  onClose,
}: {
  promotion: AdminPromotion;
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
              Promotion details
            </p>
            <h3 className="mt-2 text-xl font-black text-slate-950">
              {getPromotionName(promotion)}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
            aria-label="Close promotion details"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <DetailItem
            label="Mode"
            value={promotion.promotionMode || "coupon"}
          />
          <DetailItem
            label="Code"
            value={promotion.code || "Automatic offer"}
          />
          <DetailItem
            label="Event"
            value={getEventName(promotion)}
          />
          <DetailItem
            label="Organizer"
            value={getOrganizerName(promotion)}
          />
          <DetailItem
            label="Discount"
            value={getDiscountLabel(promotion)}
          />
          <DetailItem
            label="Minimum booking"
            value={formatCurrency(
              getMinimumAmount(promotion) || 0
            )}
          />
          <DetailItem
            label="Maximum discount"
            value={
              getMaximumDiscount(promotion)
                ? formatCurrency(
                    getMaximumDiscount(promotion) || 0
                  )
                : "No cap"
            }
          />
          <DetailItem
            label="Usage"
            value={`${promotion.usedCount}${
              getUsageLimit(promotion)
                ? `/${getUsageLimit(promotion)}`
                : ""
            } used`}
          />
          <DetailItem
            label="Per-user limit"
            value={
              promotion.perUserUsageLimit
                ? String(promotion.perUserUsageLimit)
                : "No limit"
            }
          />
          <DetailItem
            label="First-N offer"
            value={
              promotion.firstNTickets
                ? `${promotion.discountedTicketsUsed || 0} used, ${promotion.discountedTicketsReserved || 0} reserved of ${promotion.firstNTickets}`
                : "Not limited"
            }
          />
          <DetailItem
            label="Valid from"
            value={formatEventDate(promotion.validFrom)}
          />
          <DetailItem
            label="Valid until"
            value={formatEventDate(promotion.validUntil)}
          />
        </div>
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
  action: PendingPromotionAction;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const isDelete = action.type === "delete";
  const promotion = action.promotion;
  const actionLabel = isDelete
    ? "Delete promotion"
    : action.status === "active"
      ? "Activate promotion"
      : "Deactivate promotion";

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
              {actionLabel}?
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              {isDelete
                ? "Unused promotions can be permanently deleted. Promotions with usage history are blocked and should be deactivated instead."
                : "This updates the promotion availability used by the booking flow."}
            </p>

            <p className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-900">
              {getPromotionName(promotion)}
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
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
