"use client";

import { CalendarDays, LoaderCircle, Megaphone, RefreshCw, Search, X } from "lucide-react";
import Loader from "@/components/ui/Loader";
import Pagination from "@/components/ui/Pagination";
import { formatCurrency, formatEventDate } from "@/utils/event";
import { Badge } from "./Badge";
import { fieldClassName, paginationTargetId, paymentClasses, statusClasses, statusOptions } from "./constants";
import { getEventName, getRequestEvent } from "./utils";
import type { OrganizerFeaturedEventsState } from "./useOrganizerFeaturedEventsState";

interface OrganizerFeaturedEventsViewProps {
  state: OrganizerFeaturedEventsState;
}

export function OrganizerFeaturedEventsView({ state }: OrganizerFeaturedEventsViewProps) {
  const {
    actionRequestId,
    endDate,
    events,
    formLoading,
    handleCancel,
    handleSubmit,
    hasFilters,
    loadData,
    loading,
    openPayment,
    pagination,
    requests,
    resultsRef,
    search,
    selectedEventId,
    setEndDate,
    setSelectedEventId,
    setStartDate,
    settings,
    startDate,
    status,
    updateFilters,
  } = state;

  return (
    <main className="min-h-screen bg-[#fffaf5] px-4 pb-16 pt-6 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <section className="relative overflow-hidden rounded-[30px] border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-rose-50 px-6 py-8 shadow-sm sm:px-8">
            <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-600">
                  Featured placement
                </p>

                <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                  Paid Event Promotion
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                  Request homepage hero placement for your
                  published upcoming events and track
                  approval, payment and active status.
                </p>
              </div>

              <button type="button" onClick={loadData} disabled={loading} className="inline-flex w-fit items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60">
                <RefreshCw size={17} className={loading ? "animate-spin" : ""}/>
                Refresh
              </button>
            </div>
          </section>

          <section className="mt-8 grid gap-6 lg:grid-cols-[390px_1fr]">
            <form onSubmit={handleSubmit} className="rounded-[24px] border border-orange-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                  <Megaphone size={22}/>
                </span>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-500">
                    New request
                  </p>

                  <h2 className="text-xl font-black text-slate-950">
                    Feature an event
                  </h2>
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-orange-50 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-orange-500">
                  Promotional fee
                </p>

                <p className="mt-1 text-2xl font-black text-slate-950">
                  {settings
          ? formatCurrency(settings.promotionFee)
          : "Loading..."}
                </p>

                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {settings?.requirePaymentBeforeApproval
          ? "Payment becomes available after admin approval reserves a slot."
          : "Admin approval can activate the promotion without payment."}
                </p>
              </div>

              <label className="mt-5 block">
                <span className="text-sm font-bold text-slate-700">
                  Event
                </span>

                <select value={selectedEventId} onChange={(changeEvent) => setSelectedEventId(changeEvent.target.value)} className={`${fieldClassName} mt-2`} disabled={!settings?.isPromotionEnabled}>
                  <option value="">
                    Select event
                  </option>

                  {events.map((item) => (<option key={item._id} value={item._id}>
                      {item.title}
                    </option>))}
                </select>
              </label>

              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">
                    Start date
                  </span>

                  <input type="date" value={startDate} onChange={(changeEvent) => setStartDate(changeEvent.target.value)} className={`${fieldClassName} mt-2`} disabled={!settings?.isPromotionEnabled}/>
                </label>

                <label className="block">
                  <span className="text-sm font-bold text-slate-700">
                    End date
                  </span>

                  <input type="date" value={endDate} onChange={(changeEvent) => setEndDate(changeEvent.target.value)} className={`${fieldClassName} mt-2`} disabled={!settings?.isPromotionEnabled}/>
                </label>
              </div>

              {!settings?.isPromotionEnabled && (<p className="mt-4 rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-600">
                  Featured promotion is currently disabled.
                </p>)}

              <button type="submit" disabled={formLoading ||
          loading ||
          !settings?.isPromotionEnabled ||
          events.length === 0} className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 px-4 text-sm font-black text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60">
                {formLoading && (<LoaderCircle size={17} className="animate-spin"/>)}
                Submit request
              </button>
            </form>

            <section className="rounded-[24px] border border-orange-100 bg-white shadow-sm">
              <div className="border-b border-orange-100 p-5">
                <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-500">
                      Request history
                    </p>

                    <h2 className="text-2xl font-black text-slate-950">
                      Featured Requests
                    </h2>
                  </div>

                  {hasFilters && (<button type="button" onClick={() => updateFilters({
              search: undefined,
              status: undefined,
          })} className="inline-flex w-fit items-center gap-2 rounded-xl bg-orange-50 px-4 py-2.5 text-sm font-bold text-orange-600 transition hover:bg-orange-100">
                      <X size={16}/>
                      Clear
                    </button>)}
                </div>

                <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_220px]">
                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 shadow-sm transition focus-within:border-orange-400 focus-within:ring-4 focus-within:ring-orange-100">
                    <Search size={18} className="shrink-0 text-slate-400"/>

                    <input type="text" value={search} onChange={(changeEvent) => updateFilters({
          search: changeEvent.target.value,
      })} placeholder="Search event title, category or venue" className="w-full bg-transparent py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"/>
                  </div>

                  <select value={status} onChange={(changeEvent) => updateFilters({
          status: changeEvent.target
              .value === "all"
              ? undefined
              : changeEvent.target.value,
      })} className={fieldClassName}>
                    {statusOptions.map((option) => (<option key={option} value={option}>
                        {option === "all"
              ? "All statuses"
              : option.replace("_", " ")}
                      </option>))}
                  </select>
                </div>
              </div>

              <div id={paginationTargetId} ref={resultsRef}/>

              {loading ? (<div className="flex min-h-80 items-center justify-center">
                  <Loader text="Loading featured requests..."/>
                </div>) : requests.length === 0 ? (<div className="px-6 py-16 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                    <CalendarDays size={28}/>
                  </div>

                  <h3 className="mt-5 text-xl font-black text-slate-900">
                    No featured requests found
                  </h3>

                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                    Submit a request for one of your
                    published upcoming events.
                  </p>
                </div>) : (<div className="overflow-x-auto">
                  <table className="w-full min-w-[1040px] text-left text-sm">
                    <thead className="bg-orange-50/70 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-5 py-4">Event</th>
                        <th className="px-5 py-4">
                          Promotion period
                        </th>
                        <th className="px-5 py-4">Fee</th>
                        <th className="px-5 py-4">
                          Payment
                        </th>
                        <th className="px-5 py-4">
                          Status
                        </th>
                        <th className="px-5 py-4">
                          Admin note
                        </th>
                        <th className="px-5 py-4 text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-orange-50">
                      {requests.map((request) => {
              const event = getRequestEvent(request);
              const actionLoading = actionRequestId ===
                  request._id;
              const canPay = request.status ===
                  "payment_pending" &&
                  request.paymentStatus !==
                      "paid";
              const canCancel = request.paymentStatus !==
                  "paid" &&
                  [
                      "pending",
                      "payment_pending",
                  ].includes(request.status);
              return (<tr key={request._id} className="align-top text-slate-700 transition hover:bg-orange-50/40">
                            <td className="px-5 py-4">
                              <p className="max-w-56 truncate font-black text-slate-900">
                                {getEventName(request)}
                              </p>

                              <p className="mt-1 text-xs font-semibold text-slate-500">
                                {event?.venue ||
                      "Venue unavailable"}
                              </p>
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

                            <td className="px-5 py-4 font-black text-slate-900">
                              {formatCurrency(request.promotionFee)}
                            </td>

                            <td className="px-5 py-4">
                              <Badge label={request.paymentStatus} className={paymentClasses[request.paymentStatus]}/>
                            </td>

                            <td className="px-5 py-4">
                              <Badge label={request.status} className={statusClasses[request.status]}/>
                            </td>

                            <td className="px-5 py-4">
                              <p className="max-w-64 text-xs font-semibold leading-5 text-slate-500">
                                {request.status ===
                      "rejected"
                      ? request.rejectionReason ||
                          "Rejected"
                      : request.adminNote ||
                          "No note"}
                              </p>
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex justify-end gap-2">
                                {canPay && (<button type="button" onClick={() => openPayment(request)} disabled={actionLoading} className="inline-flex h-10 min-w-20 items-center justify-center rounded-xl bg-slate-950 px-3 text-xs font-black text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60">
                                    Pay
                                  </button>)}

                                {canCancel && (<button type="button" onClick={() => handleCancel(request)} disabled={actionLoading} className="inline-flex h-10 min-w-24 items-center justify-center rounded-xl border border-red-100 bg-red-50 px-3 text-xs font-black text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60">
                                    {actionLoading ? (<LoaderCircle size={15} className="animate-spin"/>) : ("Cancel")}
                                  </button>)}
                              </div>
                            </td>
                          </tr>);
          })}
                    </tbody>
                  </table>
                </div>)}
            </section>
          </section>

          {pagination && (<Pagination pagination={pagination} resultLabel="featured requests" className="mt-8" scrollTargetId={paginationTargetId}/>)}
        </div>
      </main>
  );
}
