"use client";

import { LoaderCircle, ShieldAlert } from "lucide-react";

import { PendingEventAction } from "./types";

export function ConfirmationModal({ action, loading, onCancel, onConfirm, }: {
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
    return (<div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" onMouseDown={onCancel}>
      <div className="w-full max-w-lg rounded-[24px] bg-white p-6 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-500">
            <ShieldAlert size={24}/>
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
          <button type="button" onClick={onCancel} disabled={loading} className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 transition hover:border-orange-300 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-60">
            Cancel
          </button>

          <button type="button" onClick={onConfirm} disabled={loading} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60">
            {loading && (<LoaderCircle size={17} className="animate-spin"/>)}
            {isDelete ? "Delete event" : "Confirm"}
          </button>
        </div>
      </div>
    </div>);
}
