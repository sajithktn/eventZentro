"use client";

import { X } from "lucide-react";
import { type AdminPromotion } from "@/services/admin.service";
import { formatCurrency, formatEventDate } from "@/utils/event";

import { getDiscountLabel, getEventName, getMaximumDiscount, getMinimumAmount, getOrganizerName, getPromotionName, getUsageLimit } from "./utils";

export function PromotionDetailsModal({ promotion, onClose, }: {
    promotion: AdminPromotion;
    onClose: () => void;
}) {
    return (<div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <div className="max-h-[86vh] w-full max-w-2xl overflow-y-auto rounded-[24px] bg-white p-6 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-500">
              Promotion details
            </p>
            <h3 className="mt-2 text-xl font-black text-slate-950">
              {getPromotionName(promotion)}
            </h3>
          </div>

          <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-950" aria-label="Close promotion details">
            <X size={18}/>
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <DetailItem label="Mode" value={promotion.promotionMode || "coupon"}/>
          <DetailItem label="Code" value={promotion.code || "Automatic offer"}/>
          <DetailItem label="Event" value={getEventName(promotion)}/>
          <DetailItem label="Organizer" value={getOrganizerName(promotion)}/>
          <DetailItem label="Discount" value={getDiscountLabel(promotion)}/>
          <DetailItem label="Minimum booking" value={formatCurrency(getMinimumAmount(promotion) || 0)}/>
          <DetailItem label="Maximum discount" value={getMaximumDiscount(promotion)
            ? formatCurrency(getMaximumDiscount(promotion) || 0)
            : "No cap"}/>
          <DetailItem label="Usage" value={`${promotion.usedCount}${getUsageLimit(promotion)
            ? `/${getUsageLimit(promotion)}`
            : ""} used`}/>
          <DetailItem label="Per-user limit" value={promotion.perUserUsageLimit
            ? String(promotion.perUserUsageLimit)
            : "No limit"}/>
          <DetailItem label="First-N offer" value={promotion.firstNTickets
            ? `${promotion.discountedTicketsUsed || 0} used, ${promotion.discountedTicketsReserved || 0} reserved of ${promotion.firstNTickets}`
            : "Not limited"}/>
          <DetailItem label="Valid from" value={formatEventDate(promotion.validFrom)}/>
          <DetailItem label="Valid until" value={formatEventDate(promotion.validUntil)}/>
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
