"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  CheckCircle2,
  Eye,
  LoaderCircle,
  Megaphone,
  RefreshCw,
  Search,
  Settings2,
  X,
} from "lucide-react";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";

import Loader from "@/components/common/Loader";
import Pagination from "@/components/common/Pagination";
import {
  approveFeaturedEventRequest,
  getAdminFeaturedEventRequests,
  getAdminFeaturedEventSettings,
  rejectFeaturedEventRequest,
  updateAdminFeaturedEventRequest,
  updateAdminFeaturedEventSettings,
} from "@/services/featuredEvent.service";
import type {
  FeaturedEventPaymentStatus,
  FeaturedEventRequest,
  FeaturedEventRequestStatus,
  FeaturedEventSettings,
} from "@/types/featuredEvent";
import type { PaginationMetadata } from "@/types/pagination";
import {
  formatCurrency,
  formatEventDate,
} from "@/utils/event";
import {
  createUrlWithQueryParams,
  DEFAULT_PAGE_SIZE,
  getPageFromSearchParams,
} from "@/utils/pagination";

const paginationTargetId =
  "admin-featured-events-results";

const fieldClassName =
  "h-12 rounded-xl border-2 border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100";

const statusOptions: Array<
  FeaturedEventRequestStatus | "all"
> = [
  "all",
  "pending",
  "payment_pending",
  "paid",
  "approved",
  "rejected",
  "expired",
  "cancelled",
];

const paymentOptions: Array<
  FeaturedEventPaymentStatus | "all"
> = [
  "all",
  "unpaid",
  "pending",
  "paid",
  "failed",
  "refunded",
];

const activeOptions = [
  "all",
  "active",
  "inactive",
  "expired",
] as const;

type ActiveState = (typeof activeOptions)[number];

const statusClasses: Record<
  FeaturedEventRequestStatus,
  string
> = {
  pending: "bg-sky-50 text-sky-700",
  payment_pending: "bg-amber-50 text-amber-700",
  paid: "bg-blue-50 text-blue-700",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
  expired: "bg-slate-100 text-slate-600",
  cancelled: "bg-zinc-100 text-zinc-600",
};

const paymentClasses: Record<
  FeaturedEventPaymentStatus,
  string
> = {
  unpaid: "bg-amber-50 text-amber-700",
  pending: "bg-blue-50 text-blue-700",
  paid: "bg-emerald-50 text-emerald-700",
  failed: "bg-red-50 text-red-700",
  refunded: "bg-slate-100 text-slate-600",
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

  return error instanceof Error
    ? error.message
    : fallback;
};

const getRequestEvent = (
  request: FeaturedEventRequest
) =>
  request.event && typeof request.event !== "string"
    ? request.event
    : null;

const getOrganizerName = (
  request: FeaturedEventRequest
) => {
  if (
    !request.organizer ||
    typeof request.organizer === "string"
  ) {
    return "Unknown organizer";
  }

  return (
    [
      request.organizer.firstName,
      request.organizer.lastName,
    ]
      .filter(Boolean)
      .join(" ") ||
    request.organizer.email ||
    "Unknown organizer"
  );
};

const formatDateInput = (value?: string) => {
  if (!value) {
    return "";
  }

  return new Date(value).toISOString().slice(0, 10);
};

function AdminFeaturedEventsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const resultsRef =
    useRef<HTMLDivElement>(null);
  const previousPageRef = useRef(1);

  const currentPage =
    getPageFromSearchParams(searchParams);
  const search = searchParams.get("search") || "";
  const status =
    searchParams.get("status") || "all";
  const paymentStatus =
    searchParams.get("paymentStatus") || "all";
  const activeState =
    (searchParams.get("activeState") ||
      "all") as ActiveState;

  const [settings, setSettings] =
    useState<FeaturedEventSettings | null>(
      null
    );
  const [settingsDraft, setSettingsDraft] =
    useState({
      promotionFee: 0,
      isPromotionEnabled: true,
      maximumFeaturedEventsOnHomepage: 3,
      defaultPromotionDurationDays: "",
      requirePaymentBeforeApproval: true,
    });
  const [requests, setRequests] = useState<
    FeaturedEventRequest[]
  >([]);
  const [pagination, setPagination] =
    useState<PaginationMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [settingsLoading, setSettingsLoading] =
    useState(false);
  const [actionRequestId, setActionRequestId] =
    useState<string | null>(null);
  const [details, setDetails] =
    useState<FeaturedEventRequest | null>(null);
  const [refreshNonce, setRefreshNonce] =
    useState(0);

  const requestParams = useMemo(
    () => ({
      page: currentPage,
      limit: DEFAULT_PAGE_SIZE,
      search: search || undefined,
      status:
        status !== "all"
          ? (status as FeaturedEventRequestStatus)
          : undefined,
      paymentStatus:
        paymentStatus !== "all"
          ? (paymentStatus as FeaturedEventPaymentStatus)
          : undefined,
      activeState:
        activeState !== "all"
          ? activeState
          : undefined,
      sort: "newest",
    }),
    [
      activeState,
      currentPage,
      paymentStatus,
      search,
      status,
    ]
  );

  useEffect(() => {
    let isActive = true;

    void Promise.resolve().then(async () => {
      try {
        setLoading(true);

        const [settingsResponse, requestsResponse] =
          await Promise.all([
            getAdminFeaturedEventSettings(),
            getAdminFeaturedEventRequests(
              requestParams
            ),
          ]);

        if (!isActive) {
          return;
        }

        setSettings(settingsResponse.settings);
        setSettingsDraft({
          promotionFee:
            settingsResponse.settings.promotionFee,
          isPromotionEnabled:
            settingsResponse.settings
              .isPromotionEnabled,
          maximumFeaturedEventsOnHomepage:
            settingsResponse.settings
              .maximumFeaturedEventsOnHomepage,
          defaultPromotionDurationDays:
            settingsResponse.settings
              .defaultPromotionDurationDays
              ? String(
                  settingsResponse.settings
                    .defaultPromotionDurationDays
                )
              : "",
          requirePaymentBeforeApproval:
            settingsResponse.settings
              .requirePaymentBeforeApproval,
        });
        setRequests(
          requestsResponse.data ||
            requestsResponse.requests ||
            []
        );
        setPagination(requestsResponse.pagination);
      } catch (error) {
        if (!isActive) {
          return;
        }

        toast.error(
          getErrorMessage(
            error,
            "Unable to load featured event requests."
          )
        );
        setRequests([]);
        setPagination(null);
      } finally {
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
    if (
      previousPageRef.current !==
      currentPage
    ) {
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

  const updateFilters = (
    updates: Record<
      string,
      string | undefined
    >
  ) => {
    router.replace(
      createUrlWithQueryParams(
        pathname,
        searchParams,
        updates,
        true
      ),
      {
        scroll: false,
      }
    );
  };

  const handleSettingsSave = async () => {
    try {
      setSettingsLoading(true);

      const response =
        await updateAdminFeaturedEventSettings({
          promotionFee: Number(
            settingsDraft.promotionFee
          ),
          isPromotionEnabled:
            settingsDraft.isPromotionEnabled,
          maximumFeaturedEventsOnHomepage: Number(
            settingsDraft.maximumFeaturedEventsOnHomepage
          ),
          defaultPromotionDurationDays:
            settingsDraft
              .defaultPromotionDurationDays
              ? Number(
                  settingsDraft
                    .defaultPromotionDurationDays
                )
              : undefined,
          requirePaymentBeforeApproval:
            settingsDraft
              .requirePaymentBeforeApproval,
        });

      setSettings(response.settings);
      toast.success(response.message);
    } catch (error) {
      toast.error(
        getErrorMessage(
          error,
          "Unable to update featured event settings."
        )
      );
    } finally {
      setSettingsLoading(false);
    }
  };

  const approveRequest = async (
    request: FeaturedEventRequest
  ) => {
    const confirmed = window.confirm(
      "Approve this featured event request and reserve the selected promotion period?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionRequestId(request._id);

      const response =
        await approveFeaturedEventRequest(
          request._id,
          {
            approvedStartDate:
              formatDateInput(
                request.requestedStartDate
              ),
            approvedEndDate:
              formatDateInput(
                request.requestedEndDate
              ),
          }
        );

      toast.success(response.message);
      refresh();
    } catch (error) {
      toast.error(
        getErrorMessage(
          error,
          "Unable to approve request."
        )
      );
    } finally {
      setActionRequestId(null);
    }
  };

  const rejectRequest = async (
    request: FeaturedEventRequest
  ) => {
    const rejectionReason = window.prompt(
      "Enter rejection reason"
    );

    if (!rejectionReason?.trim()) {
      return;
    }

    try {
      setActionRequestId(request._id);

      const response =
        await rejectFeaturedEventRequest(
          request._id,
          rejectionReason.trim()
        );

      toast.success(response.message);
      refresh();
    } catch (error) {
      toast.error(
        getErrorMessage(
          error,
          "Unable to reject request."
        )
      );
    } finally {
      setActionRequestId(null);
    }
  };

  const toggleActive = async (
    request: FeaturedEventRequest
  ) => {
    try {
      setActionRequestId(request._id);

      const response =
        await updateAdminFeaturedEventRequest(
          request._id,
          {
            isActive: !request.isActive,
          }
        );

      toast.success(response.message);
      refresh();
    } catch (error) {
      toast.error(
        getErrorMessage(
          error,
          "Unable to update active status."
        )
      );
    } finally {
      setActionRequestId(null);
    }
  };

  const hasFilters =
    Boolean(search) ||
    status !== "all" ||
    paymentStatus !== "all" ||
    activeState !== "all";

  return (
    <div className="mx-auto max-w-7xl">
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
          <input
            type="number"
            min="0"
            value={settingsDraft.promotionFee}
            onChange={(event) =>
              setSettingsDraft((draft) => ({
                ...draft,
                promotionFee: Number(
                  event.target.value
                ),
              }))
            }
            className={fieldClassName}
            aria-label="Promotion fee"
          />

          <input
            type="number"
            min="1"
            max="12"
            value={
              settingsDraft.maximumFeaturedEventsOnHomepage
            }
            onChange={(event) =>
              setSettingsDraft((draft) => ({
                ...draft,
                maximumFeaturedEventsOnHomepage:
                  Number(event.target.value),
              }))
            }
            className={fieldClassName}
            aria-label="Maximum featured events"
          />

          <input
            type="number"
            min="1"
            max="365"
            value={
              settingsDraft.defaultPromotionDurationDays
            }
            onChange={(event) =>
              setSettingsDraft((draft) => ({
                ...draft,
                defaultPromotionDurationDays:
                  event.target.value,
              }))
            }
            placeholder="Default days"
            className={fieldClassName}
            aria-label="Default promotion duration"
          />

          <label className="flex h-12 items-center gap-3 rounded-xl border-2 border-slate-200 px-4 text-sm font-bold text-slate-700">
            <input
              type="checkbox"
              checked={
                settingsDraft.isPromotionEnabled
              }
              onChange={(event) =>
                setSettingsDraft((draft) => ({
                  ...draft,
                  isPromotionEnabled:
                    event.target.checked,
                }))
              }
              className="h-4 w-4 accent-orange-500"
            />
            Enabled
          </label>

          <label className="flex h-12 items-center gap-3 rounded-xl border-2 border-slate-200 px-4 text-sm font-bold text-slate-700">
            <input
              type="checkbox"
              checked={
                settingsDraft
                  .requirePaymentBeforeApproval
              }
              onChange={(event) =>
                setSettingsDraft((draft) => ({
                  ...draft,
                  requirePaymentBeforeApproval:
                    event.target.checked,
                }))
              }
              className="h-4 w-4 accent-orange-500"
            />
            Require payment before activation
          </label>

          <button
            type="button"
            onClick={handleSettingsSave}
            disabled={settingsLoading}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {settingsLoading ? (
              <LoaderCircle
                size={17}
                className="animate-spin"
              />
            ) : (
              <Settings2 size={17} />
            )}
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

          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={
                loading ? "animate-spin" : ""
              }
            />
            Refresh
          </button>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_180px_180px_170px_auto]">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                updateFilters({
                  search: event.target.value,
                })
              }
              placeholder="Search event or organizer..."
              className="h-12 w-full rounded-xl border-2 border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
            />
          </div>

          <select
            value={status}
            onChange={(event) =>
              updateFilters({
                status:
                  event.target.value === "all"
                    ? undefined
                    : event.target.value,
              })
            }
            className={fieldClassName}
          >
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option === "all"
                  ? "All statuses"
                  : option.replace("_", " ")}
              </option>
            ))}
          </select>

          <select
            value={paymentStatus}
            onChange={(event) =>
              updateFilters({
                paymentStatus:
                  event.target.value === "all"
                    ? undefined
                    : event.target.value,
              })
            }
            className={fieldClassName}
          >
            {paymentOptions.map((option) => (
              <option key={option} value={option}>
                {option === "all"
                  ? "All payments"
                  : option}
              </option>
            ))}
          </select>

          <select
            value={activeState}
            onChange={(event) =>
              updateFilters({
                activeState:
                  event.target.value === "all"
                    ? undefined
                    : event.target.value,
              })
            }
            className={fieldClassName}
          >
            {activeOptions.map((option) => (
              <option key={option} value={option}>
                {option === "all"
                  ? "All states"
                  : option}
              </option>
            ))}
          </select>

          {hasFilters && (
            <button
              type="button"
              onClick={() =>
                updateFilters({
                  search: undefined,
                  status: undefined,
                  paymentStatus: undefined,
                  activeState: undefined,
                })
              }
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600 transition hover:border-orange-300 hover:text-orange-600"
            >
              <X size={16} />
              Clear
            </button>
          )}
        </div>
      </section>

      <section className="mt-5 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
        <div
          id={paginationTargetId}
          ref={resultsRef}
        />

        {loading ? (
          <div className="flex min-h-80 items-center justify-center">
            <Loader text="Loading featured requests..." />
          </div>
        ) : requests.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto">
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
                {requests.map((request) => (
                  <RequestRow
                    key={request._id}
                    request={request}
                    actionLoading={
                      actionRequestId === request._id
                    }
                    onApprove={approveRequest}
                    onReject={rejectRequest}
                    onToggleActive={toggleActive}
                    onDetails={setDetails}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {pagination && (
        <Pagination
          pagination={pagination}
          resultLabel="featured requests"
          className="mt-8"
          scrollTargetId={paginationTargetId}
        />
      )}

      {details && (
        <RequestDetailsModal
          request={details}
          onClose={() => setDetails(null)}
          onSaved={(request) => {
            setDetails(request);
            refresh();
          }}
        />
      )}
    </div>
  );
}

function RequestRow({
  request,
  actionLoading,
  onApprove,
  onReject,
  onToggleActive,
  onDetails,
}: {
  request: FeaturedEventRequest;
  actionLoading: boolean;
  onApprove: (
    request: FeaturedEventRequest
  ) => void;
  onReject: (
    request: FeaturedEventRequest
  ) => void;
  onToggleActive: (
    request: FeaturedEventRequest
  ) => void;
  onDetails: (
    request: FeaturedEventRequest
  ) => void;
}) {
  const event = getRequestEvent(request);
  const canApprove = request.status === "pending";
  const canReject = [
    "pending",
    "payment_pending",
    "paid",
  ].includes(request.status);

  return (
    <tr className="align-top transition hover:bg-orange-50/40">
      <td className="px-5 py-4">
        <p className="max-w-56 truncate font-black text-slate-950">
          {event?.title || "Deleted event"}
        </p>
        <p className="mt-1 text-xs font-semibold text-slate-500">
          {event?.venue || "Venue unavailable"}
        </p>
      </td>

      <td className="px-5 py-4 text-sm font-semibold text-slate-700">
        {getOrganizerName(request)}
      </td>

      <td className="px-5 py-4 text-xs font-semibold text-slate-600">
        <p className="mb-1 text-[11px] font-black uppercase tracking-wide text-slate-400">
          {request.approvedStartDate &&
          request.approvedEndDate
            ? "Approved"
            : "Requested"}
        </p>
        <p>
          {formatEventDate(
            request.approvedStartDate ||
              request.requestedStartDate
          )}
        </p>
        <p className="mt-1">
          to{" "}
          {formatEventDate(
            request.approvedEndDate ||
              request.requestedEndDate
          )}
        </p>
      </td>

      <td className="px-5 py-4 font-black text-slate-950">
        {formatCurrency(request.promotionFee)}
      </td>

      <td className="px-5 py-4">
        <Badge
          label={request.paymentStatus}
          className={
            paymentClasses[request.paymentStatus]
          }
        />
      </td>

      <td className="px-5 py-4">
        <Badge
          label={request.status}
          className={statusClasses[request.status]}
        />
      </td>

      <td className="px-5 py-4">
        <span
          className={`inline-flex rounded-full px-3 py-1.5 text-xs font-black ${
            request.isActive
              ? "bg-emerald-50 text-emerald-700"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {request.isActive ? "Active" : "Inactive"}
        </span>
      </td>

      <td className="px-5 py-4">
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => onDetails(request)}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 transition hover:border-orange-300 hover:text-orange-600"
          >
            <Eye size={15} />
            Details
          </button>

          {request.status === "approved" && (
            <button
              type="button"
              onClick={() =>
                onToggleActive(request)
              }
              disabled={actionLoading}
              className="inline-flex h-9 min-w-24 items-center justify-center rounded-xl bg-orange-50 px-3 text-xs font-black text-orange-600 transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {actionLoading ? (
                <LoaderCircle
                  size={15}
                  className="animate-spin"
                />
              ) : request.isActive ? (
                "Deactivate"
              ) : (
                "Activate"
              )}
            </button>
          )}

          {canApprove && (
            <button
              type="button"
              onClick={() => onApprove(request)}
              disabled={actionLoading}
              className="inline-flex h-9 min-w-20 items-center justify-center rounded-xl bg-emerald-600 px-3 text-xs font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Approve
            </button>
          )}

          {canReject && (
            <button
              type="button"
              onClick={() => onReject(request)}
              disabled={actionLoading}
              className="inline-flex h-9 min-w-20 items-center justify-center rounded-xl border border-red-100 bg-red-50 px-3 text-xs font-black text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Reject
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

function RequestDetailsModal({
  request,
  onClose,
  onSaved,
}: {
  request: FeaturedEventRequest;
  onClose: () => void;
  onSaved: (
    request: FeaturedEventRequest
  ) => void;
}) {
  const [startDate, setStartDate] = useState(
    formatDateInput(
      request.approvedStartDate ||
        request.requestedStartDate
    )
  );
  const [endDate, setEndDate] = useState(
    formatDateInput(
      request.approvedEndDate ||
        request.requestedEndDate
    )
  );
  const [adminNote, setAdminNote] = useState(
    request.adminNote || ""
  );
  const [isActive, setIsActive] = useState(
    request.isActive
  );
  const [saving, setSaving] = useState(false);
  const event = getRequestEvent(request);
  const canEditPeriod = [
    "pending",
    "approved",
  ].includes(request.status);

  const save = async () => {
    try {
      setSaving(true);

      const response =
        request.status === "pending"
          ? await approveFeaturedEventRequest(
              request._id,
              {
                approvedStartDate: startDate,
                approvedEndDate: endDate,
                adminNote,
              }
            )
          : await updateAdminFeaturedEventRequest(
              request._id,
              {
                approvedStartDate: startDate,
                approvedEndDate: endDate,
                adminNote,
                isActive,
              }
            );

      toast.success(response.message);
      onSaved(response.request);
    } catch (error) {
      toast.error(
        getErrorMessage(
          error,
          "Unable to update featured request."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        className="max-h-[86vh] w-full max-w-2xl overflow-y-auto rounded-[24px] bg-white p-6 shadow-2xl"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-500">
              Featured request details
            </p>
            <h3 className="mt-2 text-xl font-black text-slate-950">
              {event?.title || "Deleted event"}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
            aria-label="Close details"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <DetailItem
            label="Organizer"
            value={getOrganizerName(request)}
          />
          <DetailItem
            label="Fee"
            value={formatCurrency(
              request.promotionFee
            )}
          />
          <DetailItem
            label="Payment"
            value={request.paymentStatus}
          />
          <DetailItem
            label="Status"
            value={request.status.replace("_", " ")}
          />
          <DetailItem
            label="Razorpay order"
            value={request.razorpayOrderId || "None"}
          />
          <DetailItem
            label="Razorpay payment"
            value={
              request.razorpayPaymentId || "None"
            }
          />
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-bold text-slate-700">
              Approved start date
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(event) =>
                setStartDate(event.target.value)
              }
              disabled={!canEditPeriod}
              className={`${fieldClassName} mt-2 w-full`}
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold text-slate-700">
              Approved end date
            </span>
            <input
              type="date"
              value={endDate}
              onChange={(event) =>
                setEndDate(event.target.value)
              }
              disabled={!canEditPeriod}
              className={`${fieldClassName} mt-2 w-full`}
            />
          </label>
        </div>

        <label className="mt-5 block">
          <span className="text-sm font-bold text-slate-700">
            Admin note
          </span>
          <textarea
            value={adminNote}
            onChange={(event) =>
              setAdminNote(event.target.value)
            }
            disabled={!canEditPeriod}
            className="mt-2 min-h-24 w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
          />
        </label>

        {request.rejectionReason && (
          <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-red-500">
              Rejection reason
            </p>
            <p className="mt-2 text-sm font-semibold text-red-700">
              {request.rejectionReason}
            </p>
          </div>
        )}

        <label className="mt-5 flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(event) =>
              setIsActive(event.target.checked)
            }
            disabled={request.status !== "approved"}
            className="h-4 w-4 accent-orange-500"
          />
          Show during approved date range
        </label>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 transition hover:border-orange-300 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Close
          </button>

          {canEditPeriod && (
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <LoaderCircle
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <CheckCircle2 size={17} />
              )}
              {request.status === "pending"
                ? "Approve period"
                : "Save changes"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function Badge({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1.5 text-xs font-black capitalize ${className}`}
    >
      {label.replace("_", " ")}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="px-6 py-20 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
        <Megaphone size={30} />
      </div>

      <h3 className="mt-5 text-lg font-black text-slate-950">
        No featured requests found
      </h3>

      <p className="mt-2 text-sm text-slate-500">
        Try changing the search term or selected
        filters.
      </p>
    </div>
  );
}

export default function AdminFeaturedEventsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex min-h-80 max-w-7xl items-center justify-center rounded-[24px] border border-slate-200 bg-white shadow-sm">
          <Loader text="Loading featured requests..." />
        </div>
      }
    >
      <AdminFeaturedEventsContent />
    </Suspense>
  );
}
