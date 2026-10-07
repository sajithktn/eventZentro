"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, LoaderCircle, X } from "lucide-react";
import { approveFeaturedEventRequest, updateAdminFeaturedEventRequest } from "@/services/featuredEvent.service";
import type { FeaturedEventRequest } from "@/types/featuredEvent";
import { formatCurrency } from "@/utils/event";

import { fieldClassName } from "./constants";
import { formatDateInput, getErrorMessage, getOrganizerName, getRequestEvent } from "./utils";

export function RequestDetailsModal({ request, onClose, onSaved, }: {
    request: FeaturedEventRequest;
    onClose: () => void;
    onSaved: (request: FeaturedEventRequest) => void;
}) {
    const [startDate, setStartDate] = useState(formatDateInput(request.approvedStartDate ||
        request.requestedStartDate));
    const [endDate, setEndDate] = useState(formatDateInput(request.approvedEndDate ||
        request.requestedEndDate));
    const [adminNote, setAdminNote] = useState(request.adminNote || "");
    const [isActive, setIsActive] = useState(request.isActive);
    const [saving, setSaving] = useState(false);
    const event = getRequestEvent(request);
    const canEditPeriod = [
        "pending",
        "approved",
    ].includes(request.status);
    const save = async () => {
        try {
            setSaving(true);
            const response = request.status === "pending"
                ? await approveFeaturedEventRequest(request._id, {
                    approvedStartDate: startDate,
                    approvedEndDate: endDate,
                    adminNote,
                })
                : await updateAdminFeaturedEventRequest(request._id, {
                    approvedStartDate: startDate,
                    approvedEndDate: endDate,
                    adminNote,
                    isActive,
                });
            toast.success(response.message);
            onSaved(response.request);
        }
        catch (error) {
            toast.error(getErrorMessage(error, "Unable to update featured request."));
        }
        finally {
            setSaving(false);
        }
    };
    return (<div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <div className="max-h-[86vh] w-full max-w-2xl overflow-y-auto rounded-[24px] bg-white p-6 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-500">
              Featured request details
            </p>
            <h3 className="mt-2 text-xl font-black text-slate-950">
              {event?.title || "Deleted event"}
            </h3>
          </div>

          <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-950" aria-label="Close details">
            <X size={18}/>
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <DetailItem label="Organizer" value={getOrganizerName(request)}/>
          <DetailItem label="Fee" value={formatCurrency(request.promotionFee)}/>
          <DetailItem label="Payment" value={request.paymentStatus}/>
          <DetailItem label="Status" value={request.status.replace("_", " ")}/>
          <DetailItem label="Razorpay order" value={request.razorpayOrderId || "None"}/>
          <DetailItem label="Razorpay payment" value={request.razorpayPaymentId || "None"}/>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-bold text-slate-700">
              Approved start date
            </span>
            <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} disabled={!canEditPeriod} className={`${fieldClassName} mt-2 w-full`}/>
          </label>

          <label className="block">
            <span className="text-sm font-bold text-slate-700">
              Approved end date
            </span>
            <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} disabled={!canEditPeriod} className={`${fieldClassName} mt-2 w-full`}/>
          </label>
        </div>

        <label className="mt-5 block">
          <span className="text-sm font-bold text-slate-700">
            Admin note
          </span>
          <textarea value={adminNote} onChange={(event) => setAdminNote(event.target.value)} disabled={!canEditPeriod} className="mt-2 min-h-24 w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"/>
        </label>

        {request.rejectionReason && (<div className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-red-500">
              Rejection reason
            </p>
            <p className="mt-2 text-sm font-semibold text-red-700">
              {request.rejectionReason}
            </p>
          </div>)}

        <label className="mt-5 flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700">
          <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} disabled={request.status !== "approved"} className="h-4 w-4 accent-orange-500"/>
          Show during approved date range
        </label>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} disabled={saving} className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 transition hover:border-orange-300 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-60">
            Close
          </button>

          {canEditPeriod && (<button type="button" onClick={save} disabled={saving} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60">
              {saving ? (<LoaderCircle size={17} className="animate-spin"/>) : (<CheckCircle2 size={17}/>)}
              {request.status === "pending"
                ? "Approve period"
                : "Save changes"}
            </button>)}
        </div>
      </div>
    </div>);
}

export function DetailItem({ label, value, }: {
    label: string;
    value: string;
}) {
    return (<div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-bold text-slate-900">
        {value}
      </p>
    </div>);
}
