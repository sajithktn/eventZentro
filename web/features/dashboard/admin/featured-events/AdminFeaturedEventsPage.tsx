"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { LoaderCircle, RefreshCw, Search, Settings2, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Loader from "@/components/ui/Loader";
import Pagination from "@/components/ui/Pagination";
import { approveFeaturedEventRequest, getAdminFeaturedEventRequests, getAdminFeaturedEventSettings, rejectFeaturedEventRequest, updateAdminFeaturedEventRequest, updateAdminFeaturedEventSettings } from "@/services/featuredEvent.service";
import type { FeaturedEventPaymentStatus, FeaturedEventRequest, FeaturedEventRequestStatus, FeaturedEventSettings } from "@/types/featuredEvent";
import type { PaginationMetadata } from "@/types/pagination";
import { formatCurrency } from "@/utils/event";
import { createUrlWithQueryParams, DEFAULT_PAGE_SIZE, getPageFromSearchParams } from "@/utils/pagination";

import { ActiveState, activeOptions, fieldClassName, paginationTargetId, paymentOptions, statusOptions } from "./constants";
import { RequestDetailsModal } from "./RequestDetailsModal";
import { EmptyState, RequestRow } from "./RequestList";
import { formatDateInput, getErrorMessage } from "./utils";

export function AdminFeaturedEventsContent() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const resultsRef = useRef<HTMLDivElement>(null);
    const previousPageRef = useRef(1);
    const currentPage = getPageFromSearchParams(searchParams);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";
    const paymentStatus = searchParams.get("paymentStatus") || "all";
    const activeState = (searchParams.get("activeState") ||
        "all") as ActiveState;
    const [settings, setSettings] = useState<FeaturedEventSettings | null>(null);
    const [settingsDraft, setSettingsDraft] = useState({
        promotionFee: 0,
        isPromotionEnabled: true,
        maximumFeaturedEventsOnHomepage: 3,
        defaultPromotionDurationDays: "",
        requirePaymentBeforeApproval: true,
    });
    const [requests, setRequests] = useState<FeaturedEventRequest[]>([]);
    const [pagination, setPagination] = useState<PaginationMetadata | null>(null);
    const [loading, setLoading] = useState(true);
    const [settingsLoading, setSettingsLoading] = useState(false);
    const [actionRequestId, setActionRequestId] = useState<string | null>(null);
    const [details, setDetails] = useState<FeaturedEventRequest | null>(null);
    const [refreshNonce, setRefreshNonce] = useState(0);
    const requestParams = useMemo(() => ({
        page: currentPage,
        limit: DEFAULT_PAGE_SIZE,
        search: search || undefined,
        status: status !== "all"
            ? (status as FeaturedEventRequestStatus)
            : undefined,
        paymentStatus: paymentStatus !== "all"
            ? (paymentStatus as FeaturedEventPaymentStatus)
            : undefined,
        activeState: activeState !== "all"
            ? activeState
            : undefined,
        sort: "newest",
    }), [
        activeState,
        currentPage,
        paymentStatus,
        search,
        status,
    ]);
    useEffect(() => {
        let isActive = true;
        void Promise.resolve().then(async () => {
            try {
                setLoading(true);
                const [settingsResponse, requestsResponse] = await Promise.all([
                    getAdminFeaturedEventSettings(),
                    getAdminFeaturedEventRequests(requestParams),
                ]);
                if (!isActive) {
                    return;
                }
                setSettings(settingsResponse.settings);
                setSettingsDraft({
                    promotionFee: settingsResponse.settings.promotionFee,
                    isPromotionEnabled: settingsResponse.settings
                        .isPromotionEnabled,
                    maximumFeaturedEventsOnHomepage: settingsResponse.settings
                        .maximumFeaturedEventsOnHomepage,
                    defaultPromotionDurationDays: settingsResponse.settings
                        .defaultPromotionDurationDays
                        ? String(settingsResponse.settings
                            .defaultPromotionDurationDays)
                        : "",
                    requirePaymentBeforeApproval: settingsResponse.settings
                        .requirePaymentBeforeApproval,
                });
                setRequests(requestsResponse.data ||
                    requestsResponse.requests ||
                    []);
                setPagination(requestsResponse.pagination);
            }
            catch (error) {
                if (!isActive) {
                    return;
                }
                toast.error(getErrorMessage(error, "Unable to load featured event requests."));
                setRequests([]);
                setPagination(null);
            }
            finally {
                if (isActive) {
                    setLoading(false);
                }
            }
        });
        return () => {
            isActive = false;
        };
    }, [requestParams, refreshNonce]);
    useEffect(() => {
        if (previousPageRef.current !==
            currentPage) {
            resultsRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }
        previousPageRef.current = currentPage;
    }, [currentPage]);
    const refresh = () => {
        setRefreshNonce((value) => value + 1);
    };
    const updateFilters = (updates: Record<string, string | undefined>) => {
        router.replace(createUrlWithQueryParams(pathname, searchParams, updates, true), {
            scroll: false,
        });
    };
    const handleSettingsSave = async () => {
        try {
            setSettingsLoading(true);
            const response = await updateAdminFeaturedEventSettings({
                promotionFee: Number(settingsDraft.promotionFee),
                isPromotionEnabled: settingsDraft.isPromotionEnabled,
                maximumFeaturedEventsOnHomepage: Number(settingsDraft.maximumFeaturedEventsOnHomepage),
                defaultPromotionDurationDays: settingsDraft
                    .defaultPromotionDurationDays
                    ? Number(settingsDraft
                        .defaultPromotionDurationDays)
                    : undefined,
                requirePaymentBeforeApproval: settingsDraft
                    .requirePaymentBeforeApproval,
            });
            setSettings(response.settings);
            toast.success(response.message);
        }
        catch (error) {
            toast.error(getErrorMessage(error, "Unable to update featured event settings."));
        }
        finally {
            setSettingsLoading(false);
        }
    };
    const approveRequest = async (request: FeaturedEventRequest) => {
        const confirmed = window.confirm("Approve this featured event request and reserve the selected promotion period?");
        if (!confirmed) {
            return;
        }
        try {
            setActionRequestId(request._id);
            const response = await approveFeaturedEventRequest(request._id, {
                approvedStartDate: formatDateInput(request.requestedStartDate),
                approvedEndDate: formatDateInput(request.requestedEndDate),
            });
            toast.success(response.message);
            refresh();
        }
        catch (error) {
            toast.error(getErrorMessage(error, "Unable to approve request."));
        }
        finally {
            setActionRequestId(null);
        }
    };
    const rejectRequest = async (request: FeaturedEventRequest) => {
        const rejectionReason = window.prompt("Enter rejection reason");
        if (!rejectionReason?.trim()) {
            return;
        }
        try {
            setActionRequestId(request._id);
            const response = await rejectFeaturedEventRequest(request._id, rejectionReason.trim());
            toast.success(response.message);
            refresh();
        }
        catch (error) {
            toast.error(getErrorMessage(error, "Unable to reject request."));
        }
        finally {
            setActionRequestId(null);
        }
    };
    const toggleActive = async (request: FeaturedEventRequest) => {
        try {
            setActionRequestId(request._id);
            const response = await updateAdminFeaturedEventRequest(request._id, {
                isActive: !request.isActive,
            });
            toast.success(response.message);
            refresh();
        }
        catch (error) {
            toast.error(getErrorMessage(error, "Unable to update active status."));
        }
        finally {
            setActionRequestId(null);
        }
    };
    const hasFilters = Boolean(search) ||
        status !== "all" ||
        paymentStatus !== "all" ||
        activeState !== "all";
    return (<div className="mx-auto max-w-7xl">
      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-500">
              Homepage placement
            </p>

            <h2 className="mt-2 text-2xl font-black text-slate-950">
              Featured Event Settings
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Configure the fee and display limit for
              paid homepage hero promotion.
            </p>
          </div>

          <span className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-700">
            {settings
            ? formatCurrency(settings.promotionFee)
            : "Loading"}{" "}
            fee
          </span>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-[160px_160px_180px_190px_1fr_auto]">
          <input type="number" min="0" value={settingsDraft.promotionFee} onChange={(event) => setSettingsDraft((draft) => ({
            ...draft,
            promotionFee: Number(event.target.value),
        }))} className={fieldClassName} aria-label="Promotion fee"/>

          <input type="number" min="1" max="12" value={settingsDraft.maximumFeaturedEventsOnHomepage} onChange={(event) => setSettingsDraft((draft) => ({
            ...draft,
            maximumFeaturedEventsOnHomepage: Number(event.target.value),
        }))} className={fieldClassName} aria-label="Maximum featured events"/>

          <input type="number" min="1" max="365" value={settingsDraft.defaultPromotionDurationDays} onChange={(event) => setSettingsDraft((draft) => ({
            ...draft,
            defaultPromotionDurationDays: event.target.value,
        }))} placeholder="Default days" className={fieldClassName} aria-label="Default promotion duration"/>

          <label className="flex h-12 items-center gap-3 rounded-xl border-2 border-slate-200 px-4 text-sm font-bold text-slate-700">
            <input type="checkbox" checked={settingsDraft.isPromotionEnabled} onChange={(event) => setSettingsDraft((draft) => ({
            ...draft,
            isPromotionEnabled: event.target.checked,
        }))} className="h-4 w-4 accent-orange-500"/>
            Enabled
          </label>

          <label className="flex h-12 items-center gap-3 rounded-xl border-2 border-slate-200 px-4 text-sm font-bold text-slate-700">
            <input type="checkbox" checked={settingsDraft
            .requirePaymentBeforeApproval} onChange={(event) => setSettingsDraft((draft) => ({
            ...draft,
            requirePaymentBeforeApproval: event.target.checked,
        }))} className="h-4 w-4 accent-orange-500"/>
            Require payment before activation
          </label>

          <button type="button" onClick={handleSettingsSave} disabled={settingsLoading} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60">
            {settingsLoading ? (<LoaderCircle size={17} className="animate-spin"/>) : (<Settings2 size={17}/>)}
            Save
          </button>
        </div>
      </section>

      <section className="mt-5 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-500">
              Admin review
            </p>

            <h2 className="mt-2 text-2xl font-black text-slate-950">
              Featured Event Requests
            </h2>
          </div>

          <button type="button" onClick={refresh} disabled={loading} className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60">
            <RefreshCw size={17} className={loading ? "animate-spin" : ""}/>
            Refresh
          </button>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_180px_180px_170px_auto]">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>

            <input type="text" value={search} onChange={(event) => updateFilters({
            search: event.target.value,
        })} placeholder="Search event or organizer..." className="h-12 w-full rounded-xl border-2 border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"/>
          </div>

          <select value={status} onChange={(event) => updateFilters({
            status: event.target.value === "all"
                ? undefined
                : event.target.value,
        })} className={fieldClassName}>
            {statusOptions.map((option) => (<option key={option} value={option}>
                {option === "all"
                ? "All statuses"
                : option.replace("_", " ")}
              </option>))}
          </select>

          <select value={paymentStatus} onChange={(event) => updateFilters({
            paymentStatus: event.target.value === "all"
                ? undefined
                : event.target.value,
        })} className={fieldClassName}>
            {paymentOptions.map((option) => (<option key={option} value={option}>
                {option === "all"
                ? "All payments"
                : option}
              </option>))}
          </select>

          <select value={activeState} onChange={(event) => updateFilters({
            activeState: event.target.value === "all"
                ? undefined
                : event.target.value,
        })} className={fieldClassName}>
            {activeOptions.map((option) => (<option key={option} value={option}>
                {option === "all"
                ? "All states"
                : option}
              </option>))}
          </select>

          {hasFilters && (<button type="button" onClick={() => updateFilters({
                search: undefined,
                status: undefined,
                paymentStatus: undefined,
                activeState: undefined,
            })} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600 transition hover:border-orange-300 hover:text-orange-600">
              <X size={16}/>
              Clear
            </button>)}
        </div>
      </section>

      <section className="mt-5 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
        <div id={paginationTargetId} ref={resultsRef}/>

        {loading ? (<div className="flex min-h-80 items-center justify-center">
            <Loader text="Loading featured requests..."/>
          </div>) : requests.length === 0 ? (<EmptyState />) : (<div className="overflow-x-auto">
            <table className="w-full min-w-[1220px] text-left">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th className="px-5 py-4">Event</th>
                  <th className="px-5 py-4">
                    Organizer
                  </th>
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
                    Active
                  </th>
                  <th className="px-5 py-4 text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {requests.map((request) => (<RequestRow key={request._id} request={request} actionLoading={actionRequestId === request._id} onApprove={approveRequest} onReject={rejectRequest} onToggleActive={toggleActive} onDetails={setDetails}/>))}
              </tbody>
            </table>
          </div>)}
      </section>

      {pagination && (<Pagination pagination={pagination} resultLabel="featured requests" className="mt-8" scrollTargetId={paginationTargetId}/>)}

      {details && (<RequestDetailsModal request={details} onClose={() => setDetails(null)} onSaved={(request) => {
                setDetails(request);
                refresh();
            }}/>)}
    </div>);
}

export default function AdminFeaturedEventsPage() {
    return (<Suspense fallback={<div className="mx-auto flex min-h-80 max-w-7xl items-center justify-center rounded-[24px] border border-slate-200 bg-white shadow-sm">
          <Loader text="Loading featured requests..."/>
        </div>}>
      <AdminFeaturedEventsContent />
    </Suspense>);
}
