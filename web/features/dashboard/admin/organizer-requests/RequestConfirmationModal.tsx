"use client";

import { CheckCircle2, LoaderCircle, XCircle } from "lucide-react";

import { ModalShell } from "./ApplicationDetailsModal";
import { PendingRequestAction } from "./types";

export function ConfirmationModal({ action, loading, rejectionReason, onRejectionReasonChange, onCancel, onConfirm, }: {
    action: PendingRequestAction;
    loading: boolean;
    rejectionReason: string;
    onRejectionReasonChange: (value: string) => void;
    onCancel: () => void;
    onConfirm: () => void;
}) {
    const isReject = action.type === "reject";
    return (<ModalShell onClose={onCancel}>
      <div className="w-full max-w-lg rounded-[24px] bg-white p-6 shadow-2xl">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${isReject
            ? "bg-red-50 text-red-600"
            : "bg-emerald-50 text-emerald-600"}`}>
          {isReject ? (<XCircle size={23}/>) : (<CheckCircle2 size={23}/>)}
        </div>

        <h2 className="mt-5 text-xl font-black text-slate-950">
          {isReject
            ? "Reject organizer request?"
            : "Approve organizer request?"}
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          {isReject
            ? "This will mark the application as rejected and will not change the applicant role."
            : "This will approve the application and promote the existing applicant account to organizer."}
        </p>

        <p className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-900">
          {action.application.organizerName}
        </p>

        {isReject && (<label className="mt-4 block">
            <span className="text-sm font-bold text-slate-700">
              Rejection reason
            </span>

            <textarea value={rejectionReason} rows={4} maxLength={1000} placeholder="Optional note for the application record" onChange={(event) => onRejectionReasonChange(event.target.value)} className="mt-2 w-full resize-none rounded-xl border-2 border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"/>
          </label>)}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} disabled={loading} className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 transition hover:border-orange-300 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-60">
            Cancel
          </button>

          <button type="button" onClick={onConfirm} disabled={loading} className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-black text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${isReject
            ? "bg-red-600 hover:bg-red-700"
            : "bg-emerald-600 hover:bg-emerald-700"}`}>
            {loading && (<LoaderCircle size={17} className="animate-spin"/>)}

            {isReject
            ? "Reject Request"
            : "Approve Request"}
          </button>
        </div>
      </div>
    </ModalShell>);
}
