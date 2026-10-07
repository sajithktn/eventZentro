"use client";

import { BadgePercent, IndianRupee, ShieldCheck, Ticket, UserRound, Copy } from "lucide-react";

import { formatCurrency, formatEventDate, getOrganizerName } from "@/utils/event";
import type { EventDetailsState } from "./useEventDetailsState";

interface EventDetailsContentProps {
  event: NonNullable<EventDetailsState["event"]>;
  state: EventDetailsState;
}

export function EventDetailsContent({ event, state }: EventDetailsContentProps) {
  const {
    availableTickets,
    copyCoupon,
    handleApplyCoupon,
    isEventCompleted,
    promotions,
    soldPercent,
    soldTickets,
    ticketPrice,
    totalTickets,
  } = state;

  return (
    <div className="space-y-6">
      <div className="rounded-[26px] border border-orange-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-3">
          <span className="h-7 w-1.5 rounded-full bg-gradient-to-b from-orange-400 to-red-500" />
          <h2 className="text-2xl font-black text-slate-900">About this event</h2>
        </div>
        <p className="mt-5 whitespace-pre-line text-sm leading-7 text-slate-600 sm:text-base">
          {event.description}
        </p>
      </div>

      <div className="rounded-[26px] border border-orange-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
              <BadgePercent size={22} />
            </span>
            <div>
              <h2 className="text-2xl font-black text-slate-900">
                Offers available
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Automatic offers and public coupon codes for this event.
              </p>
            </div>
          </div>
        </div>

        {promotions.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center text-sm font-semibold text-slate-500">
            No public offers are active right now.
          </div>
        ) : (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {promotions.map((promotion) => (
              <article
                key={promotion.id}
                className="rounded-2xl border border-orange-100 bg-orange-50/50 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black text-slate-900">{promotion.name}</p>
                    <p className="mt-1 text-sm font-bold text-orange-600">
                      {promotion.displayText}
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-[11px] font-black uppercase tracking-wide text-slate-600">
                    {promotion.promotionMode === "coupon" ? "Coupon" : "Automatic"}
                  </span>
                </div>

                {promotion.code && (
                  <div className="mt-4 flex items-center gap-2">
                    <code className="rounded-xl border border-orange-200 bg-white px-3 py-2 text-sm font-black tracking-wide text-slate-900">
                      {promotion.code}
                    </code>
                    <button
                      type="button"
                      onClick={() => copyCoupon(promotion.code || "")}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-orange-200 bg-white text-orange-600 transition hover:bg-orange-100"
                      aria-label={`Copy ${promotion.code}`}
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleApplyCoupon(promotion.code)}
                      disabled={isEventCompleted}
                      className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-black text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                    >
                      Apply
                    </button>
                  </div>
                )}

                <div className="mt-4 space-y-1 text-xs font-semibold text-slate-500">
                  {promotion.minimumBookingAmount !== undefined && (
                    <p>Minimum booking {formatCurrency(promotion.minimumBookingAmount)}</p>
                  )}
                  {promotion.maximumDiscountAmount !== undefined && (
                    <p>Maximum discount {formatCurrency(promotion.maximumDiscountAmount)}</p>
                  )}
                  {promotion.remainingOfferTickets !== undefined && (
                    <p>Only {promotion.remainingOfferTickets} offer tickets left</p>
                  )}
                  <p>Valid until {formatEventDate(promotion.validUntil)}</p>
                </div>

                {promotion.terms.length > 0 && (
                  <ul className="mt-3 space-y-1 text-xs text-slate-500">
                    {promotion.terms.slice(0, 3).map((term) => (
                      <li key={term}>{term}</li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={<Ticket size={21} />} label="Tickets remaining" value={availableTickets} />
        <StatCard
          icon={<IndianRupee size={21} />}
          label="Ticket price"
          value={ticketPrice === 0 ? "Free" : formatCurrency(ticketPrice)}
          tone="yellow"
        />
        <StatCard
          icon={<UserRound size={21} />}
          label="Event organizer"
          value={getOrganizerName(event)}
          tone="red"
        />
      </div>

      {totalTickets > 0 && (
        <div className="rounded-[26px] border border-orange-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-bold text-slate-900">Ticket availability</p>
              <p className="mt-1 text-sm text-slate-500">
                {soldTickets} of {totalTickets} tickets sold
              </p>
            </div>
            <p className="text-xl font-black text-orange-500">{soldPercent}%</p>
          </div>
          <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-orange-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 transition-all duration-700"
              style={{ width: `${soldPercent}%` }}
            />
          </div>
        </div>
      )}

      <div className="rounded-[26px] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-orange-50 p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Secure ticket booking</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Your ticket will be available on the My Tickets page after
              successful confirmation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone = "orange",
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  tone?: "orange" | "red" | "yellow";
}) {
  const colors = {
    orange: "border-orange-100 from-orange-50 text-orange-600",
    red: "border-red-100 from-red-50 text-red-600",
    yellow: "border-yellow-100 from-yellow-50 text-yellow-600",
  };

  return (
    <div className={`rounded-[22px] border bg-gradient-to-br to-white p-5 shadow-sm ${colors[tone]}`}>
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-current/10">
        {icon}
      </div>
      <p className="mt-4 text-sm text-slate-500">{label}</p>
      <p className="mt-1 line-clamp-1 text-2xl font-black text-slate-900">
        {value}
      </p>
    </div>
  );
}
