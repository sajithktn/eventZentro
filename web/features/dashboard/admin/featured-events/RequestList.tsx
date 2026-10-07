"use client";

import { Eye, LoaderCircle, Megaphone } from "lucide-react";
import type { FeaturedEventRequest } from "@/types/featuredEvent";
import { formatCurrency, formatEventDate } from "@/utils/event";

import { paymentClasses, statusClasses } from "./constants";
import { getOrganizerName, getRequestEvent } from "./utils";

export function RequestRow({ request, actionLoading, onApprove, onReject, onToggleActive, onDetails, }: {
    request: FeaturedEventRequest;
    actionLoading: boolean;
    onApprove: (request: FeaturedEventRequest) => void;
    onReject: (request: FeaturedEventRequest) => void;
    onToggleActive: (request: FeaturedEventRequest) => void;
    onDetails: (request: FeaturedEventRequest) => void;
}) {
    const event = getRequestEvent(request);
    const canApprove = request.status === "pending";
    const canReject = [
        "pending",
        "payment_pending",
        "paid",
    ].includes(request.status);
    return (<tr className="align-top transition hover:bg-orange-50/40">
      <td className="px-5 py-4">
        <p className="max-w-56 truncate font-black text-slate-950">
          {event?.title || "Deleted event"}
        </p>
        <p className="mt-1 text-xs font-semibold text-slate-500">
          {event?.venue || "Venue unavailable"}
        </p>
      </td>

      <td className="px-5 py-4 text-sm font-semibold text-slate-700">
        {getOrganizerName(request)}
      </td>

      <td className="px-5 py-4 text-xs font-semibold text-slate-600">
        <p className="mb-1 text-[11px] font-black uppercase tracking-wide text-slate-400">
          {request.approvedStartDate &&
            request.approvedEndDate
            ? "Approved"
            : "Requested"}
        </p>
        <p>
          {formatEventDate(request.approvedStartDate ||
            request.requestedStartDate)}
        </p>
        <p className="mt-1">
          to{" "}
          {formatEventDate(request.approvedEndDate ||
            request.requestedEndDate)}
        </p>
      </td>

      <td className="px-5 py-4 font-black text-slate-950">
        {formatCurrency(request.promotionFee)}
      </td>

      <td className="px-5 py-4">
        <Badge label={request.paymentStatus} className={paymentClasses[request.paymentStatus]}/>
      </td>

      <td className="px-5 py-4">
        <Badge label={request.status} className={statusClasses[request.status]}/>
      </td>

      <td className="px-5 py-4">
        <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-black ${request.isActive
            ? "bg-emerald-50 text-emerald-700"
            : "bg-slate-100 text-slate-600"}`}>
          {request.isActive ? "Active" : "Inactive"}
        </span>
      </td>

      <td className="px-5 py-4">
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" onClick={() => onDetails(request)} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 transition hover:border-orange-300 hover:text-orange-600">
            <Eye size={15}/>
            Details
          </button>

          {request.status === "approved" && (<button type="button" onClick={() => onToggleActive(request)} disabled={actionLoading} className="inline-flex h-9 min-w-24 items-center justify-center rounded-xl bg-orange-50 px-3 text-xs font-black text-orange-600 transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-60">
              {actionLoading ? (<LoaderCircle size={15} className="animate-spin"/>) : request.isActive ? ("Deactivate") : ("Activate")}
            </button>)}

          {canApprove && (<button type="button" onClick={() => onApprove(request)} disabled={actionLoading} className="inline-flex h-9 min-w-20 items-center justify-center rounded-xl bg-emerald-600 px-3 text-xs font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">
              Approve
            </button>)}

          {canReject && (<button type="button" onClick={() => onReject(request)} disabled={actionLoading} className="inline-flex h-9 min-w-20 items-center justify-center rounded-xl border border-red-100 bg-red-50 px-3 text-xs font-black text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60">
              Reject
            </button>)}
        </div>
      </td>
    </tr>);
}

export function Badge({ label, className, }: {
    label: string;
    className: string;
}) {
    return (<span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-black capitalize ${className}`}>
      {label.replace("_", " ")}
    </span>);
}

export function EmptyState() {
    return (<div className="px-6 py-20 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
        <Megaphone size={30}/>
      </div>

      <h3 className="mt-5 text-lg font-black text-slate-950">
        No featured requests found
      </h3>

      <p className="mt-2 text-sm text-slate-500">
        Try changing the search term or selected
        filters.
      </p>
    </div>);
}
