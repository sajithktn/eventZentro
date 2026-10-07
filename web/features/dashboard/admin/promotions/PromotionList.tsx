"use client";

import { BadgePercent, ChevronLeft, ChevronRight, Eye, Trash2 } from "lucide-react";
import { type AdminPagination, type AdminPromotion, type AdminPromotionStatus } from "@/services/admin.service";
import { formatCurrency, formatEventDate } from "@/utils/event";

import { PendingPromotionAction } from "./types";
import { getDiscountLabel, getEventName, getMaximumDiscount, getOrganizerName, getPromotionName, getPromotionStatus, getUsageLimit } from "./utils";

export function PromotionRow({ promotion, onDetails, onAction, }: {
    promotion: AdminPromotion;
    onDetails: (promotion: AdminPromotion) => void;
    onAction: (action: PendingPromotionAction) => void;
}) {
    const status = getPromotionStatus(promotion);
    const nextStatus = status === "active" ? "inactive" : "active";
    return (<tr className="align-top transition hover:bg-orange-50/40">
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
        {getMaximumDiscount(promotion) && (<p className="mt-1 text-xs font-semibold text-slate-500">
            Max{" "}
            {formatCurrency(getMaximumDiscount(promotion) || 0)}
          </p>)}
      </td>

      <td className="px-5 py-4">
        <p className="font-bold text-slate-900">
          {promotion.usedCount}
          {getUsageLimit(promotion)
            ? `/${getUsageLimit(promotion)}`
            : ""}{" "}
          used
        </p>
        {promotion.firstNTickets ? (<p className="mt-1 text-xs font-semibold text-slate-500">
            First {promotion.firstNTickets} tickets
          </p>) : null}
      </td>

      <td className="px-5 py-4 text-xs font-semibold text-slate-600">
        <p>{formatEventDate(promotion.validFrom)}</p>
        <p className="mt-1">
          to {formatEventDate(promotion.validUntil)}
        </p>
      </td>

      <td className="px-5 py-4">
        <StatusBadge status={status}/>
      </td>

      <td className="px-5 py-4">
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" onClick={() => onDetails(promotion)} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 transition hover:border-orange-300 hover:text-orange-600">
            <Eye size={15}/>
            Details
          </button>

          <button type="button" onClick={() => onAction({
            type: "status",
            promotion,
            status: nextStatus,
        })} className="inline-flex h-9 items-center justify-center rounded-xl bg-orange-50 px-3 text-xs font-black text-orange-600 transition hover:bg-orange-100">
            {status === "active"
            ? "Deactivate"
            : "Activate"}
          </button>

          <button type="button" onClick={() => onAction({
            type: "delete",
            promotion,
        })} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-500 transition hover:bg-red-100" aria-label={`Delete ${getPromotionName(promotion)}`}>
            <Trash2 size={15}/>
          </button>
        </div>
      </td>
    </tr>);
}

export function StatusBadge({ status, }: {
    status: AdminPromotionStatus;
}) {
    const className = status === "active"
        ? "bg-emerald-50 text-emerald-600"
        : status === "expired"
            ? "bg-amber-50 text-amber-600"
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
        <BadgePercent size={30}/>
      </div>

      <h3 className="mt-5 text-lg font-black text-slate-950">
        No promotions found
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
