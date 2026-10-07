"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { RefreshCw, Search, X } from "lucide-react";
import { deleteAdminPromotion, getAdminPromotions, updateAdminPromotionStatus, type AdminPagination, type AdminPromotion, type AdminPromotionMode, type AdminPromotionStatus } from "@/services/admin.service";
import { DEFAULT_PAGE_SIZE } from "@/utils/pagination";

import { fieldClassName, initialPagination, modeFilters, statusFilters } from "./constants";
import { ConfirmationModal } from "./PromotionConfirmationModal";
import { PromotionDetailsModal } from "./PromotionDetailsModal";
import { EmptyState, LoadingState, PaginationControls, PromotionRow } from "./PromotionList";
import { PendingPromotionAction } from "./types";
import { getErrorMessage } from "./utils";

export default function AdminPromotionsPage() {
    const [promotions, setPromotions] = useState<AdminPromotion[]>([]);
    const [pagination, setPagination] = useState<AdminPagination>(initialPagination);
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [mode, setMode] = useState<AdminPromotionMode | "all">("all");
    const [status, setStatus] = useState<AdminPromotionStatus | "all">("all");
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [details, setDetails] = useState<AdminPromotion | null>(null);
    const [pendingAction, setPendingAction] = useState<PendingPromotionAction | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const requestParams = useMemo(() => ({
        page,
        limit: DEFAULT_PAGE_SIZE,
        search: search || undefined,
        promotionMode: mode !== "all" ? mode : undefined,
        status: status !== "all" ? status : undefined,
        organizer: "all",
        sort: "newest",
    }), [mode, page, search, status]);
    const loadPromotions = async () => {
        try {
            setLoading(true);
            setError("");
            const response = await getAdminPromotions(requestParams);
            setPromotions(response.promotions);
            setPagination(response.pagination);
        }
        catch (loadError) {
            const message = getErrorMessage(loadError, "Unable to load promotions.");
            setError(message);
            toast.error(message);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        let isActive = true;
        void Promise.resolve().then(async () => {
            try {
                setLoading(true);
                setError("");
                const response = await getAdminPromotions(requestParams);
                if (!isActive) {
                    return;
                }
                setPromotions(response.promotions);
                setPagination(response.pagination);
            }
            catch (loadError) {
                if (!isActive) {
                    return;
                }
                const message = getErrorMessage(loadError, "Unable to load promotions.");
                setError(message);
                toast.error(message);
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
    }, [requestParams]);
    const applySearch = () => {
        setPage(1);
        setSearch(searchInput.trim());
    };
    const resetFilters = () => {
        setSearchInput("");
        setSearch("");
        setMode("all");
        setStatus("all");
        setPage(1);
    };
    const refetchAfterRemoval = () => {
        if (promotions.length === 1 && page > 1) {
            setPage((currentPage) => Math.max(currentPage - 1, 1));
            return;
        }
        loadPromotions();
    };
    const executeAction = async () => {
        if (!pendingAction) {
            return;
        }
        try {
            setActionLoading(true);
            if (pendingAction.type === "delete") {
                const response = await deleteAdminPromotion(pendingAction.promotion._id);
                toast.success(response.message);
                setPendingAction(null);
                setDetails(null);
                refetchAfterRemoval();
                return;
            }
            const response = await updateAdminPromotionStatus(pendingAction.promotion._id, pendingAction.status);
            toast.success(response.message);
            setPendingAction(null);
            loadPromotions();
            const updatedPromotion = response.promotion || response.coupon || null;
            if (updatedPromotion &&
                details?._id === updatedPromotion._id) {
                setDetails(updatedPromotion);
            }
        }
        catch (actionError) {
            toast.error(getErrorMessage(actionError, "Unable to update promotion."));
        }
        finally {
            setActionLoading(false);
        }
    };
    const hasActiveFilters = Boolean(search) ||
        mode !== "all" ||
        status !== "all";
    return (<div className="mx-auto max-w-7xl">
      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-500">
              Platform discounts
            </p>

            <h2 className="mt-2 text-2xl font-black text-slate-950">
              Promotion Management
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Manage coupon and automatic event offers
              backed by the existing promotion model.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-700">
              {pagination.totalItems.toLocaleString("en-IN")}{" "}
              promotions
            </span>

            <button type="button" onClick={loadPromotions} disabled={loading} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60">
              <RefreshCw size={17} className={loading ? "animate-spin" : ""}/>
              Refresh
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_170px_180px_auto]">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>

            <input type="text" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} onKeyDown={(event) => {
            if (event.key === "Enter") {
                applySearch();
            }
        }} placeholder="Search name, code or event..." className="h-12 w-full rounded-xl border-2 border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"/>
          </div>

          <select value={mode} onChange={(event) => {
            const nextMode = event.target
                .value as AdminPromotionMode | "all";
            setMode(nextMode);
            setPage(1);
        }} className={fieldClassName}>
            {modeFilters.map((option) => (<option key={option} value={option}>
                {option === "all"
                ? "All modes"
                : option}
              </option>))}
          </select>

          <select value={status} onChange={(event) => {
            const nextStatus = event.target
                .value as AdminPromotionStatus | "all";
            setStatus(nextStatus);
            setPage(1);
        }} className={fieldClassName}>
            {statusFilters.map((option) => (<option key={option} value={option}>
                {option === "all"
                ? "All statuses"
                : option}
              </option>))}
          </select>

          <div className="flex gap-2">
            <button type="button" onClick={applySearch} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-orange-600">
              <Search size={16}/>
              Search
            </button>

            {hasActiveFilters && (<button type="button" onClick={resetFilters} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600 transition hover:border-orange-300 hover:text-orange-600">
                <X size={16}/>
                Clear
              </button>)}
          </div>
        </div>
      </section>

      {error && (<section className="mt-5 flex flex-col justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 sm:flex-row sm:items-center">
          <p className="text-sm font-bold text-red-600">
            {error}
          </p>

          <button type="button" onClick={loadPromotions} className="w-fit text-sm font-black text-red-700 underline underline-offset-4">
            Try again
          </button>
        </section>)}

      <section className="mt-5 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
        {loading ? (<LoadingState label="Loading promotions..."/>) : promotions.length === 0 ? (<EmptyState />) : (<div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] text-left">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th className="px-5 py-4">Promotion</th>
                  <th className="px-5 py-4">Organizer</th>
                  <th className="px-5 py-4">Event</th>
                  <th className="px-5 py-4">Discount</th>
                  <th className="px-5 py-4">Usage</th>
                  <th className="px-5 py-4">Validity</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {promotions.map((promotion) => (<PromotionRow key={promotion._id} promotion={promotion} onDetails={setDetails} onAction={setPendingAction}/>))}
              </tbody>
            </table>
          </div>)}

        {!loading && promotions.length > 0 && (<PaginationControls pagination={pagination} onPageChange={setPage}/>)}
      </section>

      {details && (<PromotionDetailsModal promotion={details} onClose={() => setDetails(null)}/>)}

      {pendingAction && (<ConfirmationModal action={pendingAction} loading={actionLoading} onCancel={() => {
                if (!actionLoading) {
                    setPendingAction(null);
                }
            }} onConfirm={executeAction}/>)}
    </div>);
}
