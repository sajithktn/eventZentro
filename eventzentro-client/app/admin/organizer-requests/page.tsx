"use client";

import type { ReactNode } from "react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Image from "next/image";
import axios from "axios";
import { toast } from "sonner";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Globe2,
  LoaderCircle,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  ShieldAlert,
  UserCheck,
  X,
  XCircle,
} from "lucide-react";

import {
  approveAdminOrganizerApplication,
  getAdminOrganizerApplicationById,
  getAdminOrganizerApplications,
  rejectAdminOrganizerApplication,
  type AdminOrganizerApplication,
  type AdminOrganizerApplicationStatus,
  type AdminOrganizerApplicationUser,
  type AdminPagination,
} from "@/services/admin.service";
import {
  DEFAULT_PAGE_SIZE,
} from "@/utils/pagination";

const statusFilters: Array<
  AdminOrganizerApplicationStatus | "all"
> = ["all", "pending", "approved", "rejected"];

const initialPagination: AdminPagination = {
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  itemsPerPage: DEFAULT_PAGE_SIZE,
  hasNextPage: false,
  hasPreviousPage: false,
};

const fieldClassName =
  "h-12 rounded-xl border-2 border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100";

type PendingRequestAction =
  | {
      type: "approve";
      application: AdminOrganizerApplication;
    }
  | {
      type: "reject";
      application: AdminOrganizerApplication;
    };

const getErrorMessage = (
  error: unknown,
  fallback: string
) => {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;

    return typeof message === "string"
      ? message
      : fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};

const getApplicationUser = (
  application: AdminOrganizerApplication
) => {
  if (
    !application.user ||
    typeof application.user === "string"
  ) {
    return null;
  }

  return application.user;
};

const getFullName = (
  user?: AdminOrganizerApplicationUser | null
) => {
  if (!user) {
    return "Unknown applicant";
  }

  return (
    [
      user.firstName,
      user.lastName,
    ]
      .filter(Boolean)
      .join(" ") ||
    user.email ||
    "Unknown applicant"
  );
};

const getApplicantEmail = (
  application: AdminOrganizerApplication
) => {
  const user = getApplicationUser(application);

  return user?.email || "Email unavailable";
};

const getReviewerName = (
  application: AdminOrganizerApplication
) => {
  if (
    !application.reviewedBy ||
    typeof application.reviewedBy === "string"
  ) {
    return "Not reviewed";
  }

  return getFullName(application.reviewedBy);
};

const formatDateTime = (
  value?: string
) => {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const getOptionalValue = (
  value?: string
) => {
  return value?.trim() || "Not provided";
};

const getStatusClasses = (
  status: AdminOrganizerApplicationStatus
) => {
  if (status === "approved") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "rejected") {
    return "bg-red-50 text-red-700";
  }

  return "bg-amber-50 text-amber-700";
};

export default function AdminOrganizerRequestsPage() {
  const [applications, setApplications] =
    useState<AdminOrganizerApplication[]>([]);

  const [pagination, setPagination] =
    useState<AdminPagination>(initialPagination);

  const [searchInput, setSearchInput] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState<
      AdminOrganizerApplicationStatus | "all"
    >("all");

  const [page, setPage] = useState(1);
  const [loading, setLoading] =
    useState(true);
  const [error, setError] = useState("");

  const [
    detailsApplicationId,
    setDetailsApplicationId,
  ] = useState<string | null>(null);

  const [details, setDetails] =
    useState<AdminOrganizerApplication | null>(
      null
    );

  const [detailsLoading, setDetailsLoading] =
    useState(false);

  const [detailsError, setDetailsError] =
    useState("");

  const [pendingAction, setPendingAction] =
    useState<PendingRequestAction | null>(
      null
    );

  const [actionLoading, setActionLoading] =
    useState(false);

  const [
    rejectionReason,
    setRejectionReason,
  ] = useState("");

  const requestParams = useMemo(
    () => ({
      page,
      limit: DEFAULT_PAGE_SIZE,
      search: search || undefined,
      status:
        status !== "all" ? status : undefined,
    }),
    [page, search, status]
  );

  const loadApplications = useCallback(
    async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await getAdminOrganizerApplications(
            requestParams
          );

        setApplications(
          response.applications ||
            response.data ||
            []
        );

        setPagination(
          response.pagination ||
            initialPagination
        );
      } catch (loadError) {
        const message = getErrorMessage(
          loadError,
          "Unable to load organizer requests."
        );

        setApplications([]);
        setPagination(initialPagination);
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [requestParams]
  );

  useEffect(() => {
    let isActive = true;

    void Promise.resolve().then(
      async () => {
        if (!isActive) {
          return;
        }

        await loadApplications();
      }
    );

    return () => {
      isActive = false;
    };
  }, [loadApplications]);

  const loadApplicationDetails =
    useCallback(
      async (applicationId: string) => {
        try {
          setDetailsApplicationId(
            applicationId
          );

          setDetails(null);
          setDetailsError("");
          setDetailsLoading(true);

          const response =
            await getAdminOrganizerApplicationById(
              applicationId
            );

          setDetails(response.application);
        } catch (detailsLoadError) {
          setDetailsError(
            getErrorMessage(
              detailsLoadError,
              "Unable to load request details."
            )
          );
        } finally {
          setDetailsLoading(false);
        }
      },
      []
    );

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

  const openAction = (
    action: PendingRequestAction
  ) => {
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

  const applyUpdatedApplication = (
    application: AdminOrganizerApplication
  ) => {
    setApplications((currentApplications) => {
      const matchesCurrentStatus =
        status === "all" ||
        application.status === status;

      if (!matchesCurrentStatus) {
        return currentApplications.filter(
          (currentApplication) =>
            currentApplication._id !==
            application._id
        );
      }

      return currentApplications.map(
        (currentApplication) =>
          currentApplication._id ===
          application._id
            ? application
            : currentApplication
      );
    });

    if (
      details?._id === application._id
    ) {
      setDetails(application);
    }
  };

  const executeAction = async () => {
    if (!pendingAction) {
      return;
    }

    try {
      setActionLoading(true);

      const response =
        pendingAction.type === "approve"
          ? await approveAdminOrganizerApplication(
              pendingAction.application._id
            )
          : await rejectAdminOrganizerApplication(
              pendingAction.application._id,
              rejectionReason.trim() ||
                undefined
            );

      toast.success(response.message);

      applyUpdatedApplication(
        response.application
      );

      setPendingAction(null);
      setRejectionReason("");

      if (
        applications.length === 1 &&
        page > 1 &&
        status !== "all" &&
        response.application.status !== status
      ) {
        setPage((currentPage) =>
          Math.max(currentPage - 1, 1)
        );
      } else {
        await loadApplications();
      }
    } catch (actionError) {
      toast.error(
        getErrorMessage(
          actionError,
          "Unable to update this organizer request."
        )
      );
    } finally {
      setActionLoading(false);
    }
  };

  const hasActiveFilters =
    Boolean(search) || status !== "all";

  return (
    <div className="mx-auto max-w-7xl">
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
              {pagination.totalItems.toLocaleString(
                "en-IN"
              )}{" "}
              requests
            </span>

            <button
              type="button"
              onClick={loadApplications}
              disabled={loading}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={17}
                className={
                  loading
                    ? "animate-spin"
                    : ""
                }
              />
              Refresh
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_190px_auto]">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={searchInput}
              onChange={(event) =>
                setSearchInput(
                  event.target.value
                )
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  applySearch();
                }
              }}
              placeholder="Search applicant, email or organization..."
              className="h-12 w-full rounded-xl border-2 border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
            />
          </div>

          <select
            value={status}
            onChange={(event) => {
              setStatus(
                event.target
                  .value as
                  | AdminOrganizerApplicationStatus
                  | "all"
              );

              setPage(1);
            }}
            className={fieldClassName}
          >
            {statusFilters.map(
              (filterStatus) => (
                <option
                  key={filterStatus}
                  value={filterStatus}
                >
                  {filterStatus === "all"
                    ? "All statuses"
                    : filterStatus}
                </option>
              )
            )}
          </select>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={applySearch}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-orange-600"
            >
              <Search size={16} />
              Search
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600 transition hover:border-orange-300 hover:text-orange-600"
              >
                <X size={16} />
                Clear
              </button>
            )}
          </div>
        </div>
      </section>

      {error && (
        <section className="mt-5 flex flex-col justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 sm:flex-row sm:items-center">
          <p className="text-sm font-bold text-red-600">
            {error}
          </p>

          <button
            type="button"
            onClick={loadApplications}
            className="w-fit text-sm font-black text-red-700 underline underline-offset-4"
          >
            Try again
          </button>
        </section>
      )}

      <section className="mt-5 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <LoadingState />
        ) : applications.length === 0 ? (
          <EmptyState />
        ) : (
          <>
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
                  {applications.map(
                    (application) => (
                      <ApplicationRow
                        key={application._id}
                        application={application}
                        onDetails={
                          loadApplicationDetails
                        }
                        onAction={openAction}
                      />
                    )
                  )}
                </tbody>
              </table>
            </div>

            <div className="grid gap-4 p-4 lg:hidden">
              {applications.map(
                (application) => (
                  <ApplicationCard
                    key={application._id}
                    application={application}
                    onDetails={
                      loadApplicationDetails
                    }
                    onAction={openAction}
                  />
                )
              )}
            </div>
          </>
        )}

        {!loading &&
          applications.length > 0 && (
            <PaginationControls
              pagination={pagination}
              onPageChange={setPage}
            />
          )}
      </section>

      {detailsApplicationId && (
        <ApplicationDetailsModal
          application={details}
          loading={detailsLoading}
          error={detailsError}
          onRetry={() =>
            loadApplicationDetails(
              detailsApplicationId
            )
          }
          onClose={() => {
            setDetailsApplicationId(null);
            setDetails(null);
            setDetailsError("");
          }}
          onAction={openAction}
        />
      )}

      {pendingAction && (
        <ConfirmationModal
          action={pendingAction}
          loading={actionLoading}
          rejectionReason={
            rejectionReason
          }
          onRejectionReasonChange={
            setRejectionReason
          }
          onCancel={closeAction}
          onConfirm={executeAction}
        />
      )}
    </div>
  );
}

function ApplicationRow({
  application,
  onDetails,
  onAction,
}: {
  application: AdminOrganizerApplication;
  onDetails: (applicationId: string) => void;
  onAction: (action: PendingRequestAction) => void;
}) {
  const user = getApplicationUser(application);

  return (
    <tr className="align-top transition hover:bg-orange-50/40">
      <td className="px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <ApplicantAvatar
            user={user}
          />

          <div className="min-w-0">
            <p className="truncate font-black text-slate-950">
              {getFullName(user)}
            </p>

            <p className="mt-1 flex items-center gap-1.5 truncate text-xs font-semibold text-slate-500">
              <Mail size={13} />
              {getApplicantEmail(
                application
              )}
            </p>

            <p className="mt-1 flex items-center gap-1.5 truncate text-xs font-semibold text-slate-500">
              <Phone size={13} />
              {application.phone}
            </p>
          </div>
        </div>
      </td>

      <td className="px-5 py-4">
        <p className="max-w-xs truncate font-black text-slate-950">
          {application.organizerName}
        </p>
      </td>

      <td className="px-5 py-4 text-sm font-bold text-slate-700">
        {application.category}
      </td>

      <td className="px-5 py-4 text-sm font-bold text-slate-700">
        <span className="inline-flex items-center gap-2">
          <MapPin
            size={15}
            className="text-orange-500"
          />
          {application.location}
        </span>
      </td>

      <td className="px-5 py-4 text-xs font-semibold text-slate-600">
        {formatDateTime(application.createdAt)}
      </td>

      <td className="px-5 py-4">
        <StatusBadge status={application.status} />
      </td>

      <td className="px-5 py-4">
        <ApplicationActions
          application={application}
          onDetails={onDetails}
          onAction={onAction}
          align="end"
        />
      </td>
    </tr>
  );
}

function ApplicationCard({
  application,
  onDetails,
  onAction,
}: {
  application: AdminOrganizerApplication;
  onDetails: (applicationId: string) => void;
  onAction: (action: PendingRequestAction) => void;
}) {
  const user = getApplicationUser(application);

  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start gap-3">
        <ApplicantAvatar user={user} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="truncate text-base font-black text-slate-950">
              {getFullName(user)}
            </h3>

            <StatusBadge
              status={application.status}
            />
          </div>

          <p className="mt-1 truncate text-sm font-medium text-slate-600">
            {getApplicantEmail(application)}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3 text-sm">
        <MobileDetail
          label="Organization"
          value={application.organizerName}
        />

        <MobileDetail
          label="Category"
          value={application.category}
        />

        <MobileDetail
          label="Location"
          value={application.location}
        />

        <MobileDetail
          label="Submitted"
          value={formatDateTime(
            application.createdAt
          )}
        />
      </div>

      <ApplicationActions
        application={application}
        onDetails={onDetails}
        onAction={onAction}
        align="start"
      />
    </article>
  );
}

function ApplicantAvatar({
  user,
}: {
  user?: AdminOrganizerApplicationUser | null;
}) {
  const name = getFullName(user);

  if (user?.profileImage) {
    return (
      <Image
        src={user.profileImage}
        alt={name}
        width={44}
        height={44}
        unoptimized
        className="h-11 w-11 shrink-0 rounded-full object-cover"
      />
    );
  }

  const initials =
    name
      .split(" ")
      .filter(Boolean)
      .map((part) => part.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-black text-white">
      {initials}
    </span>
  );
}

function ApplicationActions({
  application,
  onDetails,
  onAction,
  align,
}: {
  application: AdminOrganizerApplication;
  onDetails: (applicationId: string) => void;
  onAction: (action: PendingRequestAction) => void;
  align: "start" | "end";
}) {
  return (
    <div
      className={`mt-4 flex flex-wrap gap-2 lg:mt-0 ${
        align === "end"
          ? "justify-end"
          : "justify-start"
      }`}
    >
      <button
        type="button"
        onClick={() =>
          onDetails(application._id)
        }
        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 transition hover:border-orange-300 hover:text-orange-600"
      >
        <Eye size={15} />
        Details
      </button>

      {application.status === "pending" && (
        <>
          <button
            type="button"
            onClick={() =>
              onAction({
                type: "approve",
                application,
              })
            }
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-emerald-50 px-3 text-xs font-black text-emerald-700 transition hover:bg-emerald-100"
          >
            <CheckCircle2 size={15} />
            Approve
          </button>

          <button
            type="button"
            onClick={() =>
              onAction({
                type: "reject",
                application,
              })
            }
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-red-50 px-3 text-xs font-black text-red-600 transition hover:bg-red-100"
          >
            <XCircle size={15} />
            Reject
          </button>
        </>
      )}
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: AdminOrganizerApplicationStatus;
}) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1.5 text-xs font-black capitalize ${getStatusClasses(
        status
      )}`}
    >
      {status}
    </span>
  );
}

function MobileDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-bold text-slate-500">
        {label}
      </span>
      <span className="text-right font-black text-slate-900">
        {value}
      </span>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-80 items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-orange-100 border-t-orange-500" />

        <p className="mt-4 text-sm font-semibold text-slate-500">
          Loading organizer requests...
        </p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="px-6 py-20 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
        <UserCheck size={30} />
      </div>

      <h3 className="mt-5 text-lg font-black text-slate-950">
        No organizer requests found
      </h3>

      <p className="mt-2 text-sm text-slate-500">
        Try changing the search term or selected status.
      </p>
    </div>
  );
}

function PaginationControls({
  pagination,
  onPageChange,
}: {
  pagination: AdminPagination;
  onPageChange: (updater: (page: number) => number) => void;
}) {
  return (
    <div className="flex flex-col justify-between gap-4 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center">
      <p className="text-sm font-semibold text-slate-600">
        Page {pagination.currentPage} of{" "}
        {pagination.totalPages}
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={
            !pagination.hasPreviousPage
          }
          onClick={() =>
            onPageChange((current) =>
              Math.max(current - 1, 1)
            )
          }
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-orange-300 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={17} />
          Previous
        </button>

        <button
          type="button"
          disabled={!pagination.hasNextPage}
          onClick={() =>
            onPageChange(
              (current) => current + 1
            )
          }
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
          <ChevronRight size={17} />
        </button>
      </div>
    </div>
  );
}

function ApplicationDetailsModal({
  application,
  loading,
  error,
  onRetry,
  onClose,
  onAction,
}: {
  application: AdminOrganizerApplication | null;
  loading: boolean;
  error: string;
  onRetry: () => void;
  onClose: () => void;
  onAction: (action: PendingRequestAction) => void;
}) {
  const user = application
    ? getApplicationUser(application)
    : null;

  return (
    <ModalShell onClose={onClose}>
      <div className="max-h-[88vh] w-full max-w-5xl overflow-hidden rounded-[24px] bg-white shadow-2xl">
        <ModalHeader
          title="Organizer Request Details"
          description="Submitted application and applicant account information"
          onClose={onClose}
        />

        <div className="max-h-[calc(88vh-88px)] overflow-y-auto p-6">
          {loading ? (
            <div className="flex min-h-80 items-center justify-center">
              <LoaderCircle
                size={32}
                className="animate-spin text-orange-500"
              />
            </div>
          ) : error ? (
            <div className="py-16 text-center">
              <AlertCircle
                size={34}
                className="mx-auto text-red-500"
              />

              <p className="mt-4 font-black text-red-700">
                {error}
              </p>

              <button
                type="button"
                onClick={onRetry}
                className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-black text-white transition hover:bg-red-700"
              >
                <RefreshCw size={17} />
                Retry
              </button>
            </div>
          ) : application ? (
            <div>
              <section className="flex flex-col justify-between gap-5 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center">
                <div className="flex min-w-0 items-center gap-4">
                  <ApplicantAvatar user={user} />

                  <div className="min-w-0">
                    <h3 className="truncate text-xl font-black text-slate-950">
                      {getFullName(user)}
                    </h3>

                    <p className="mt-1 truncate text-sm font-semibold text-slate-500">
                      {getApplicantEmail(
                        application
                      )}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <StatusBadge
                        status={
                          application.status
                        }
                      />

                      <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black capitalize text-blue-700">
                        {user?.role ||
                          "unknown role"}
                      </span>
                    </div>
                  </div>
                </div>

                {application.status ===
                  "pending" && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onAction({
                          type: "approve",
                          application,
                        })
                      }
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-black text-white transition hover:bg-emerald-700"
                    >
                      <CheckCircle2
                        size={17}
                      />
                      Approve
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onAction({
                          type: "reject",
                          application,
                        })
                      }
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-black text-white transition hover:bg-red-700"
                    >
                      <XCircle size={17} />
                      Reject
                    </button>
                  </div>
                )}
              </section>

              <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                <section className="rounded-2xl border border-slate-200 p-5">
                  <h3 className="font-black text-slate-950">
                    Submitted Organizer Details
                  </h3>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <DetailItem
                      icon={<Building2 size={17} />}
                      label="Organization or company"
                      value={
                        application.organizerName
                      }
                    />

                    <DetailItem
                      icon={<Building2 size={17} />}
                      label="Organizer category"
                      value={application.category}
                    />

                    <DetailItem
                      icon={<Phone size={17} />}
                      label="Phone"
                      value={application.phone}
                    />

                    <DetailItem
                      icon={<MapPin size={17} />}
                      label="Location"
                      value={application.location}
                    />
                  </div>

                  <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                      About the organizer
                    </p>

                    <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-700">
                      {application.description}
                    </p>
                  </div>
                </section>

                <section className="rounded-2xl border border-slate-200 p-5">
                  <h3 className="font-black text-slate-950">
                    Applicant Account
                  </h3>

                  <div className="mt-4 grid gap-4">
                    <DetailItem
                      icon={<UserCheck size={17} />}
                      label="User name"
                      value={getFullName(user)}
                    />

                    <DetailItem
                      icon={<Mail size={17} />}
                      label="Email"
                      value={getApplicantEmail(
                        application
                      )}
                    />

                    <DetailItem
                      icon={<ShieldAlert size={17} />}
                      label="Current role"
                      value={
                        user?.role ||
                        "Unknown role"
                      }
                    />

                    <DetailItem
                      icon={<ShieldAlert size={17} />}
                      label="Account status"
                      value={
                        user?.isDeleted
                          ? "Deleted"
                          : user?.isBlocked
                            ? "Blocked"
                            : "Active"
                      }
                    />
                  </div>
                </section>
              </div>

              <section className="mt-5 rounded-2xl border border-slate-200 p-5">
                <h3 className="font-black text-slate-950">
                  Online Presence and Profile Image
                </h3>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <LinkDetail
                    label="Website"
                    value={application.website}
                  />

                  <LinkDetail
                    label="Instagram"
                    value={
                      application.instagram
                    }
                  />

                  <LinkDetail
                    label="LinkedIn"
                    value={application.linkedin}
                  />

                  <LinkDetail
                    label="Profile image or logo URL"
                    value={
                      application.profileImage
                    }
                  />
                </div>

                {application.profileImage && (
                  <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                    <Image
                      src={application.profileImage}
                      alt={`${application.organizerName} profile image`}
                      width={900}
                      height={320}
                      unoptimized
                      className="h-56 w-full object-cover"
                    />
                  </div>
                )}
              </section>

              <section className="mt-5 rounded-2xl border border-slate-200 p-5">
                <h3 className="font-black text-slate-950">
                  Review Information
                </h3>

                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <DetailItem
                    icon={<UserCheck size={17} />}
                    label="Status"
                    value={application.status}
                  />

                  <DetailItem
                    icon={<RefreshCw size={17} />}
                    label="Submitted"
                    value={formatDateTime(
                      application.createdAt
                    )}
                  />

                  <DetailItem
                    icon={<CheckCircle2 size={17} />}
                    label="Reviewed by"
                    value={getReviewerName(
                      application
                    )}
                  />

                  <DetailItem
                    icon={<CheckCircle2 size={17} />}
                    label="Reviewed at"
                    value={formatDateTime(
                      application.reviewedAt
                    )}
                  />
                </div>

                {application.status ===
                  "rejected" && (
                  <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-red-500">
                      Rejection reason
                    </p>

                    <p className="mt-2 whitespace-pre-line text-sm font-bold text-red-700">
                      {getOptionalValue(
                        application.rejectionReason
                      )}
                    </p>
                  </div>
                )}
              </section>
            </div>
          ) : null}
        </div>
      </div>
    </ModalShell>
  );
}

function DetailItem({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0 text-orange-500">
          {icon}
        </span>

        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
            {label}
          </p>

          <p className="mt-2 break-words text-sm font-bold text-slate-900">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function LinkDetail({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  const cleanValue = value?.trim();

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="flex items-start gap-3">
        <Globe2
          size={17}
          className="mt-0.5 shrink-0 text-orange-500"
        />

        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
            {label}
          </p>

          {cleanValue ? (
            <a
              href={cleanValue}
              target="_blank"
              rel="noreferrer"
              className="mt-2 block break-all text-sm font-bold text-orange-600 underline underline-offset-4"
            >
              {cleanValue}
            </a>
          ) : (
            <p className="mt-2 text-sm font-bold text-slate-900">
              Not provided
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function ConfirmationModal({
  action,
  loading,
  rejectionReason,
  onRejectionReasonChange,
  onCancel,
  onConfirm,
}: {
  action: PendingRequestAction;
  loading: boolean;
  rejectionReason: string;
  onRejectionReasonChange: (
    value: string
  ) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const isReject = action.type === "reject";

  return (
    <ModalShell onClose={onCancel}>
      <div className="w-full max-w-lg rounded-[24px] bg-white p-6 shadow-2xl">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
            isReject
              ? "bg-red-50 text-red-600"
              : "bg-emerald-50 text-emerald-600"
          }`}
        >
          {isReject ? (
            <XCircle size={23} />
          ) : (
            <CheckCircle2 size={23} />
          )}
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

        {isReject && (
          <label className="mt-4 block">
            <span className="text-sm font-bold text-slate-700">
              Rejection reason
            </span>

            <textarea
              value={rejectionReason}
              rows={4}
              maxLength={1000}
              placeholder="Optional note for the application record"
              onChange={(event) =>
                onRejectionReasonChange(
                  event.target.value
                )
              }
              className="mt-2 w-full resize-none rounded-xl border-2 border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
            />
          </label>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 transition hover:border-orange-300 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-black text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
              isReject
                ? "bg-red-600 hover:bg-red-700"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            {loading && (
              <LoaderCircle
                size={17}
                className="animate-spin"
              />
            )}

            {isReject
              ? "Reject Request"
              : "Approve Request"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function ModalHeader({
  title,
  description,
  onClose,
}: {
  title: string;
  description: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
      <div>
        <h2 className="text-xl font-black text-slate-950">
          {title}
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          {description}
        </p>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-100"
      >
        <X size={18} />
      </button>
    </div>
  );
}

function ModalShell({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        className="flex w-full justify-center"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        {children}
      </div>
    </div>
  );
}
