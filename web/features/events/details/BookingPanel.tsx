"use client";

import { CheckCircle2, Minus, Plus, Tag, Ticket, UserRound, X } from "lucide-react";

import { formatCurrency } from "@/utils/event";
import type { EventDetailsState } from "./useEventDetailsState";

interface BookingPanelProps {
  state: EventDetailsState;
}

export function BookingPanel({ state }: BookingPanelProps) {
  const {
    appliedPromotion,
    automaticOfferApplied,
    automaticPromotions,
    availableTickets,
    booking,
    bookingUnavailable,
    couponError,
    couponInput,
    decreaseQuantity,
    handleApplyCoupon,
    handleBooking,
    handleRemoveDiscounts,
    increaseQuantity,
    isAuthChecked,
    isEventCompleted,
    isSoldOut,
    publicCoupons,
    quantity,
    quote,
    quoteLoading,
    setCouponError,
    setCouponInput,
    ticketPrice,
    user,
  } = state;

  return (
    <aside className="h-fit rounded-[26px] border border-orange-100 bg-white p-6 shadow-[0_25px_70px_rgba(249,115,22,0.12)] lg:sticky lg:top-24">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-orange-500">
            {isEventCompleted ? "Event completed" : "Reserve your spot"}
          </p>
          <h2 className="mt-1 text-2xl font-black text-slate-900">
            {isEventCompleted ? "Bookings closed" : "Book tickets"}
          </h2>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
          <Ticket size={23} />
        </div>
      </div>

      {isEventCompleted && (
        <p className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
          This event has ended and ticket booking is closed.
        </p>
      )}

      <div className="mt-6">
        <p className="text-sm font-semibold text-slate-700">Ticket quantity</p>
        <div className="mt-3 flex items-center justify-between rounded-2xl border border-orange-100 bg-orange-50/60 p-2">
          <button
            type="button"
            onClick={decreaseQuantity}
            disabled={quantity <= 1 || bookingUnavailable}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-orange-100 bg-white text-slate-700 shadow-sm transition hover:border-orange-300 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Decrease ticket quantity"
          >
            <Minus size={19} />
          </button>
          <div className="text-center">
            <p className="text-2xl font-black text-slate-900">{quantity}</p>
            <p className="text-xs text-slate-500">
              {quantity === 1 ? "Ticket" : "Tickets"}
            </p>
          </div>
          <button
            type="button"
            onClick={increaseQuantity}
            disabled={quantity >= availableTickets || bookingUnavailable}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-orange-100 bg-white text-slate-700 shadow-sm transition hover:border-orange-300 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Increase ticket quantity"
          >
            <Plus size={19} />
          </button>
        </div>
      </div>

      {ticketPrice > 0 && (
        <div className="mt-4 rounded-2xl border border-orange-100 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="couponCode" className="text-sm font-semibold text-slate-700">
              Coupon code
            </label>
            {quoteLoading && (
              <span className="text-xs font-semibold text-slate-400">
                Checking...
              </span>
            )}
          </div>

          <div className="mt-3 flex gap-2">
            <input
              id="couponCode"
              type="text"
              value={couponInput}
              onChange={(changeEvent) => {
                setCouponInput(changeEvent.target.value.toUpperCase());
                setCouponError("");
              }}
              disabled={quoteLoading || booking || isEventCompleted}
              placeholder="Enter coupon"
              className="min-w-0 flex-1 rounded-xl border border-orange-100 bg-orange-50/60 px-4 py-3 text-sm font-bold uppercase tracking-wide text-slate-900 outline-none transition placeholder:normal-case placeholder:font-medium placeholder:tracking-normal placeholder:text-slate-400 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => void handleApplyCoupon()}
              disabled={quoteLoading || booking || isEventCompleted || !couponInput.trim()}
              className="inline-flex min-w-24 items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
            >
              Apply
            </button>
          </div>

          {couponError && (
            <p className="mt-2 text-xs font-bold text-red-500">{couponError}</p>
          )}

          {publicCoupons.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                Public coupons
              </p>
              {publicCoupons.slice(0, 3).map((promotion) => (
                <button
                  key={promotion.id}
                  type="button"
                  onClick={() => void handleApplyCoupon(promotion.code)}
                  disabled={quoteLoading || booking || isEventCompleted}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-orange-100 bg-orange-50 px-3 py-2 text-left transition hover:border-orange-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span>
                    <span className="block text-sm font-black text-slate-900">
                      {promotion.code}
                    </span>
                    <span className="text-xs font-semibold text-orange-600">
                      {promotion.displayText}
                    </span>
                  </span>
                  <Tag size={16} className="text-orange-500" />
                </button>
              ))}
            </div>
          )}

          {appliedPromotion && (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              <span className="font-semibold">
                {appliedPromotion.name} applied
                {quote?.bestOfferApplied ? " - Best offer applied" : ""}
              </span>
              <button
                type="button"
                onClick={handleRemoveDiscounts}
                disabled={booking || isEventCompleted}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Remove discounts"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {automaticOfferApplied && (
            <p className="mt-2 text-xs font-bold text-orange-600">
              Automatic offer applied.
            </p>
          )}
        </div>
      )}

      {automaticPromotions.length > 0 && (
        <div className="mt-4 rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
          <p className="text-xs font-black uppercase tracking-wide text-orange-500">
            Available automatic offers
          </p>
          <div className="mt-3 space-y-2">
            {automaticPromotions.slice(0, 2).map((promotion) => (
              <div key={promotion.id} className="rounded-xl bg-white px-3 py-2">
                <p className="text-sm font-black text-slate-900">
                  {promotion.name}
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {promotion.displayText}
                  {promotion.remainingOfferTickets !== undefined
                    ? ` - ${promotion.remainingOfferTickets} left`
                    : ""}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <BookingSummary state={state} />

      <button
        type="button"
        disabled={
          booking ||
          quoteLoading ||
          bookingUnavailable ||
          quantity > availableTickets ||
          !isAuthChecked
        }
        onClick={handleBooking}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 px-5 py-4 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:shadow-[0_15px_35px_rgba(249,115,22,0.3)] disabled:cursor-not-allowed disabled:from-slate-300 disabled:via-slate-300 disabled:to-slate-300 disabled:text-slate-500 disabled:shadow-none"
      >
        {isEventCompleted ? (
          "Event completed"
        ) : isSoldOut ? (
          "Sold out"
        ) : booking ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            Processing...
          </>
        ) : user ? (
          <>
            <CheckCircle2 size={18} />
            Confirm booking
          </>
        ) : (
          <>
            <UserRound size={18} />
            Login to book
          </>
        )}
      </button>

      {!user && isAuthChecked && (
        <p className="mt-3 text-center text-xs text-slate-500">
          You need to sign in before booking tickets.
        </p>
      )}
    </aside>
  );
}

function BookingSummary({ state }: BookingPanelProps) {
  const {
    appliedPromotion,
    discountAmount,
    payableAmount,
    quantity,
    quoteError,
    subtotal,
    ticketPrice,
  } = state;

  return (
    <div className="mt-6 rounded-2xl border border-orange-100 bg-[#fffaf5] p-4">
      <SummaryRow label="Price per ticket" value={ticketPrice === 0 ? "Free" : formatCurrency(ticketPrice)} />
      <SummaryRow label="Quantity" value={quantity} />
      <SummaryRow label="Subtotal" value={formatCurrency(subtotal)} />
      {discountAmount > 0 && (
        <SummaryRow
          label={`Discount${appliedPromotion ? ` (${appliedPromotion.code || appliedPromotion.name})` : ""}`}
          value={`-${formatCurrency(discountAmount)}`}
          tone="emerald"
        />
      )}
      {quoteError && (
        <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-500">
          {quoteError}
        </p>
      )}
      <div className="mt-4 border-t border-orange-100 pt-4">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-900">Final payable</span>
          <span className="text-2xl font-black text-orange-600">
            {payableAmount === 0 ? "Free" : formatCurrency(payableAmount)}
          </span>
        </div>
        {appliedPromotion && (
          <p className="mt-2 text-xs font-bold text-slate-500">
            Applied promotion: {appliedPromotion.name}
          </p>
        )}
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  tone = "slate",
  value,
}: {
  label: string;
  tone?: "emerald" | "slate";
  value: React.ReactNode;
}) {
  return (
    <div className={`mt-3 flex items-center justify-between text-sm ${tone === "emerald" ? "text-emerald-600" : "text-slate-500"}`}>
      <span>{label}</span>
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  );
}
