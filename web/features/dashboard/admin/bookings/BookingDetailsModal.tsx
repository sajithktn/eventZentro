"use client";

import { AlertCircle, X } from "lucide-react";
import { type AdminBooking } from "@/services/admin.service";
import { formatCurrency } from "@/utils/event";

import { LoadingState } from "./BookingList";
import { getCustomerName, getEventTitle, getFinalAmount, getOriginalAmount, getTicketCount } from "./utils";

export function BookingDetailsModal({ booking, loading, error, onRetry, onClose, }: {
    booking: AdminBooking | null;
    loading: boolean;
    error: string;
    onRetry: () => void;
    onClose: () => void;
}) {
    return (<div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <div className="max-h-[86vh] w-full max-w-2xl overflow-y-auto rounded-[24px] bg-white p-6 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-500">
              Booking details
            </p>
            <h3 className="mt-2 text-xl font-black text-slate-950">
              {booking?.bookingCode || "Loading booking"}
            </h3>
          </div>

          <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-950" aria-label="Close booking details">
            <X size={18}/>
          </button>
        </div>

        {loading ? (<LoadingState label="Loading booking details..."/>) : error ? (<div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-6 text-center">
            <AlertCircle size={30} className="mx-auto text-red-500"/>
            <p className="mt-3 font-bold text-red-600">
              {error}
            </p>
            <button type="button" onClick={onRetry} className="mt-4 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-black text-white">
              Retry
            </button>
          </div>) : booking ? (<div className="mt-6 grid gap-4 sm:grid-cols-2">
            <DetailItem label="Customer" value={getCustomerName(booking)}/>
            <DetailItem label="Event" value={getEventTitle(booking)}/>
            <DetailItem label="Tickets" value={String(getTicketCount(booking))}/>
            <DetailItem label="Original amount" value={formatCurrency(getOriginalAmount(booking))}/>
            <DetailItem label="Discount" value={formatCurrency(booking.discountAmount || 0)}/>
            <DetailItem label="Final amount" value={formatCurrency(getFinalAmount(booking))}/>
            <DetailItem label="Booking status" value={booking.status}/>
            <DetailItem label="Payment status" value={booking.paymentStatus || "unpaid"}/>
            <DetailItem label="Razorpay order" value={booking.razorpayOrderId || "Not created"}/>
            <DetailItem label="Razorpay payment" value={booking.razorpayPaymentId || "Not paid"}/>
          </div>) : null}
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
