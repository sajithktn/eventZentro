"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { RefreshCw, Search, X } from "lucide-react";
import { approveAdminOrganizerApplication, getAdminOrganizerApplicationById, getAdminOrganizerApplications, rejectAdminOrganizerApplication, type AdminOrganizerApplication, type AdminOrganizerApplicationStatus, type AdminPagination } from "@/services/admin.service";
import { DEFAULT_PAGE_SIZE } from "@/utils/pagination";

import { ApplicationDetailsModal } from "./ApplicationDetailsModal";
import { ApplicationCard, ApplicationRow, EmptyState, LoadingState, PaginationControls } from "./ApplicationList";
import { fieldClassName, initialPagination, statusFilters } from "./constants";
import { ConfirmationModal } from "./RequestConfirmationModal";
import { PendingRequestAction } from "./types";
import { getErrorMessage } from "./utils";

export default function AdminOrganizerRequestsPage() {
    const [applications, setApplications] = useState<AdminOrganizerApplication[]>([]);
    const [pagination, setPagination] = useState<AdminPagination>(initialPagination);
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState<AdminOrganizerApplicationStatus | "all">("all");
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [detailsApplicationId, setDetailsApplicationId,] = useState<string | null>(null);
    const [details, setDetails] = useState<AdminOrganizerApplication | null>(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [detailsError, setDetailsError] = useState("");
    const [pendingAction, setPendingAction] = useState<PendingRequestAction | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [rejectionReason, setRejectionReason,] = useState("");
    const requestParams = useMemo(() => ({
        page,
        limit: DEFAULT_PAGE_SIZE,
        search: search || undefined,
        status: status !== "all" ? status : undefined,
    }), [page, search, status]);
    const loadApplications = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            const response = await getAdminOrganizerApplications(requestParams);
            setApplications(response.applications ||
                response.data ||
                []);
            setPagination(response.pagination ||
                initialPagination);
        }
        catch (loadError) {
            const message = getErrorMessage(loadError, "Unable to load organizer requests.");
            setApplications([]);
            setPagination(initialPagination);
            setError(message);
            toast.error(message);
        }
        finally {
            setLoading(false);
        }
    }, [requestParams]);
    useEffect(() => {
        let isActive = true;
        void Promise.resolve().then(async () => {
            if (!isActive) {
                return;
            }
            await loadApplications();
        });
        return () => {
            isActive = false;
        };
    }, [loadApplications]);
    const loadApplicationDetails = useCallback(async (applicationId: string) => {
        try {
            setDetailsApplicationId(applicationId);
            setDetails(null);
            setDetailsError("");
            setDetailsLoading(true);
            const response = await getAdminOrganizerApplicationById(applicationId);
            setDetails(response.application);
        }
        catch (detailsLoadError) {
            setDetailsError(getErrorMessage(detailsLoadError, "Unable to load request details."));
        }
        finally {
            setDetailsLoading(false);
        }
    }, []);
    const applySearch = () => {
        setPage(1);
        setSearch(searchInput.trim());
    };
    const resetFilters = () => {
        setSearchInput("");
        setSearch("");
        setStatus("all");
        setPage(1);
    };
    const openAction = (action: PendingRequestAction) => {
        setPendingAction(action);
        setRejectionReason("");
    };
    const closeAction = () => {
        if (actionLoading) {
            return;
        }
        setPendingAction(null);
        setRejectionReason("");
    };
    const applyUpdatedApplication = (application: AdminOrganizerApplication) => {
        setApplications((currentApplications) => {
            const matchesCurrentStatus = status === "all" ||
                application.status === status;
            if (!matchesCurrentStatus) {
                return currentApplications.filter((currentApplication) => currentApplication._id !==
                    application._id);
            }
            return currentApplications.map((currentApplication) => currentApplication._id ===
                application._id
                ? application
                : currentApplication);
        });
        if (details?._id === application._id) {
            setDetails(application);
        }
    };
    const executeAction = async () => {
        if (!pendingAction) {
            return;
        }
        try {
            setActionLoading(true);
            const response = pendingAction.type === "approve"
                ? await approveAdminOrganizerApplication(pendingAction.application._id)
                : await rejectAdminOrganizerApplication(pendingAction.application._id, rejectionReason.trim() ||
                    undefined);
            toast.success(response.message);
            applyUpdatedApplication(response.application);
            setPendingAction(null);
            setRejectionReason("");
            if (applications.length === 1 &&
                page > 1 &&
                status !== "all" &&
                response.application.status !== status) {
                setPage((currentPage) => Math.max(currentPage - 1, 1));
            }
            else {
                await loadApplications();
            }
        }
        catch (actionError) {
            toast.error(getErrorMessage(actionError, "Unable to update this organizer request."));
        }
        finally {
            setActionLoading(false);
        }
    };
    const hasActiveFilters = Boolean(search) || status !== "all";
    return (<div className="mx-auto max-w-7xl">
      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-500">
              Organizer onboarding
            </p>

            <h2 className="mt-2 text-2xl font-black text-slate-950">
              Organizer Requests
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Review submitted organizer applications, inspect applicant
              details and approve or reject pending requests.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-700">
              {pagination.totalItems.toLocaleString("en-IN")}{" "}
              requests
            </span>

            <button type="button" onClick={loadApplications} disabled={loading} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60">
              <RefreshCw size={17} className={loading
            ? "animate-spin"
            : ""}/>
              Refresh
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_190px_auto]">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>

            <input type="text" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} onKeyDown={(event) => {
            if (event.key === "Enter") {
                applySearch();
            }
        }} placeholder="Search applicant, email or organization..." className="h-12 w-full rounded-xl border-2 border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"/>
          </div>

          <select value={status} onChange={(event) => {
            setStatus(event.target
                .value as AdminOrganizerApplicationStatus | "all");
            setPage(1);
        }} className={fieldClassName}>
            {statusFilters.map((filterStatus) => (<option key={filterStatus} value={filterStatus}>
                  {filterStatus === "all"
                ? "All statuses"
                : filterStatus}
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

          <button type="button" onClick={loadApplications} className="w-fit text-sm font-black text-red-700 underline underline-offset-4">
            Try again
          </button>
        </section>)}

      <section className="mt-5 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
        {loading ? (<LoadingState />) : applications.length === 0 ? (<EmptyState />) : (<>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1120px] text-left">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                  <tr>
                    <th className="px-5 py-4">
                      Applicant
                    </th>
                    <th className="px-5 py-4">
                      Organization
                    </th>
                    <th className="px-5 py-4">
                      Category
                    </th>
                    <th className="px-5 py-4">
                      Location
                    </th>
                    <th className="px-5 py-4">
                      Submitted
                    </th>
                    <th className="px-5 py-4">
                      Status
                    </th>
                    <th className="px-5 py-4 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {applications.map((application) => (<ApplicationRow key={application._id} application={application} onDetails={loadApplicationDetails} onAction={openAction}/>))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-4 p-4 lg:hidden">
              {applications.map((application) => (<ApplicationCard key={application._id} application={application} onDetails={loadApplicationDetails} onAction={openAction}/>))}
            </div>
          </>)}

        {!loading &&
            applications.length > 0 && (<PaginationControls pagination={pagination} onPageChange={setPage}/>)}
      </section>

      {detailsApplicationId && (<ApplicationDetailsModal application={details} loading={detailsLoading} error={detailsError} onRetry={() => loadApplicationDetails(detailsApplicationId)} onClose={() => {
                setDetailsApplicationId(null);
                setDetails(null);
                setDetailsError("");
            }} onAction={openAction}/>)}

      {pendingAction && (<ConfirmationModal action={pendingAction} loading={actionLoading} rejectionReason={rejectionReason} onRejectionReasonChange={setRejectionReason} onCancel={closeAction} onConfirm={executeAction}/>)}
    </div>);
}
