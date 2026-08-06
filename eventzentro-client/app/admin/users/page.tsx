"use client";

import type {
  ReactNode,
} from "react";
import {
  useCallback,
  useEffect,
  useState,
} from "react";
import axios from "axios";
import {
  BadgeCheck,
  Ban,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  Mail,
  MapPin,
  RefreshCw,
  RotateCcw,
  Search,
  Settings2,
  ShieldCheck,
  Trash2,
  UserCog,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  useAppSelector,
} from "@/redux/hooks";
import {
  blockAdminUser,
  deleteAdminUser,
  getAdminUserDetails,
  getAdminUsers,
  restoreAdminUser,
  unblockAdminUser,
  updateAdminUserRole,
  verifyAdminUser,
  type AdminPagination,
  type AdminUser,
  type AdminUserDetailsResponse,
  type AdminUserRole,
  type AdminUsersParams,
} from "@/services/admin.service";

const emptyPagination: AdminPagination = {
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  itemsPerPage: 10,
  hasNextPage: false,
  hasPreviousPage: false,
};

type ManageAction =
  | "block"
  | "unblock"
  | "verify"
  | "delete"
  | "restore"
  | "role";

interface PendingAction {
  type: ManageAction;
  user: AdminUser;
  nextRole?: "user" | "organizer";
}

const getErrorMessage = (
  error: unknown,
  fallback: string
) => {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ||
      fallback
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};

const getFullName = (
  user: AdminUser
) => {
  return (
    [
      user.firstName,
      user.lastName,
    ]
      .filter(Boolean)
      .join(" ") || "Unnamed user"
  );
};

const getInitials = (
  user: AdminUser
) => {
  const initials =
    `${user.firstName?.[0] ?? ""}${
      user.lastName?.[0] ?? ""
    }`
      .trim()
      .toUpperCase();

  return (
    initials ||
    user.email?.[0]?.toUpperCase() ||
    "U"
  );
};

const formatDate = (
  date?: string
) => {
  if (!date) {
    return "Not available";
  }

  return new Date(
    date
  ).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (
  date?: string
) => {
  if (!date) {
    return "Never";
  }

  return new Date(
    date
  ).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatCurrency = (
  amount: number
) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

const getRoleStyles = (
  role: AdminUser["role"]
) => {
  if (role === "admin") {
    return "bg-purple-50 text-purple-700";
  }

  if (role === "organizer") {
    return "bg-orange-50 text-orange-700";
  }

  return "bg-blue-50 text-blue-700";
};

const getProviderStyles = (
  provider?: AdminUser["provider"]
) => {
  if (provider === "google") {
    return "bg-red-50 text-red-600";
  }

  if (provider === "github") {
    return "bg-slate-200 text-slate-700";
  }

  return "bg-emerald-50 text-emerald-700";
};

const getActionContent = (
  action: PendingAction
) => {
  const name = getFullName(action.user);

  switch (action.type) {
    case "block":
      return {
        title: "Block user",
        description: `Block ${name}? This user will lose access to protected EventZentro features.`,
        confirmText: "Block User",
        danger: true,
      };

    case "unblock":
      return {
        title: "Unblock user",
        description: `Restore account access for ${name}?`,
        confirmText: "Unblock User",
        danger: false,
      };

    case "verify":
      return {
        title: "Verify user",
        description: `Manually mark ${name}'s email address as verified?`,
        confirmText: "Verify User",
        danger: false,
      };

    case "delete":
      return {
        title: "Delete user",
        description: `Soft delete ${name}? Their data will remain stored and the account can be restored later.`,
        confirmText: "Delete User",
        danger: true,
      };

    case "restore":
      return {
        title: "Restore user",
        description: `Restore ${name}'s deleted account?`,
        confirmText: "Restore User",
        danger: false,
      };

    case "role":
      return {
        title: "Change user role",
        description: `Change ${name}'s role to ${action.nextRole}?`,
        confirmText: "Change Role",
        danger: false,
      };
  }
};

export default function AdminUsersPage() {
  const currentAdmin =
    useAppSelector(
      (state) => state.auth.user
    );

  const currentAdminId =
    currentAdmin?._id ||
    currentAdmin?.id ||
    "";

  const [users, setUsers] = useState<
    AdminUser[]
  >([]);

  const [
    pagination,
    setPagination,
  ] = useState<AdminPagination>(
    emptyPagination
  );

  const [search, setSearch] =
    useState("");

  const [
    role,
    setRole,
  ] = useState<
    AdminUsersParams["role"]
  >("all");

  const [
    status,
    setStatus,
  ] = useState<
    AdminUsersParams["status"]
  >("all");

  const [page, setPage] =
    useState(1);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [
    manageUser,
    setManageUser,
  ] = useState<AdminUser | null>(
    null
  );

  const [
    selectedRole,
    setSelectedRole,
  ] = useState<
    "user" | "organizer"
  >("user");

  const [
    pendingAction,
    setPendingAction,
  ] = useState<PendingAction | null>(
    null
  );

  const [
    isActionLoading,
    setIsActionLoading,
  ] = useState(false);

  const [
    details,
    setDetails,
  ] =
    useState<AdminUserDetailsResponse | null>(
      null
    );

  const [
    detailsUserId,
    setDetailsUserId,
  ] = useState<string | null>(null);

  const [
    detailsLoading,
    setDetailsLoading,
  ] = useState(false);

  const [
    detailsError,
    setDetailsError,
  ] = useState("");

  const loadUsers =
    useCallback(async () => {
      try {
        setIsLoading(true);
        setError("");

        const response =
          await getAdminUsers({
            search:
              search.trim() ||
              undefined,
            role,
            status,
            page,
            limit: 10,
          });

        if (!response.success) {
          throw new Error(
            response.message ||
              "Unable to load users."
          );
        }

        setUsers(
          response.users || []
        );

        setPagination(
          response.pagination ||
            emptyPagination
        );
      } catch (error) {
        setUsers([]);

        setError(
          getErrorMessage(
            error,
            "Unable to load users."
          )
        );
      } finally {
        setIsLoading(false);
      }
    }, [
      page,
      role,
      search,
      status,
    ]);

  useEffect(() => {
    const timeout =
      window.setTimeout(() => {
        loadUsers();
      }, 350);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [loadUsers]);

  const loadUserDetails =
    useCallback(
      async (userId: string) => {
        try {
          setDetailsUserId(userId);
          setDetailsLoading(true);
          setDetailsError("");
          setDetails(null);

          const response =
            await getAdminUserDetails(
              userId
            );

          setDetails(response);
        } catch (error) {
          setDetailsError(
            getErrorMessage(
              error,
              "Unable to load user details."
            )
          );
        } finally {
          setDetailsLoading(false);
        }
      },
      []
    );

  const handleSearchChange = (
    value: string
  ) => {
    setSearch(value);
    setPage(1);
  };

  const handleRoleChange = (
    value: AdminUsersParams["role"]
  ) => {
    setRole(value);
    setPage(1);
  };

  const handleStatusChange = (
    value: AdminUsersParams["status"]
  ) => {
    setStatus(value);
    setPage(1);
  };

  const openManageUser = (
    user: AdminUser
  ) => {
    setManageUser(user);

    setSelectedRole(
      user.role === "organizer"
        ? "organizer"
        : "user"
    );
  };

  const closeManageUser = () => {
    if (isActionLoading) {
      return;
    }

    setManageUser(null);
  };

  const closeDetails = () => {
    setDetailsUserId(null);
    setDetails(null);
    setDetailsError("");
  };

  const requestAction = (
    action: PendingAction
  ) => {
    setPendingAction(action);
  };

  const executeAction = async () => {
    if (!pendingAction) {
      return;
    }

    try {
      setIsActionLoading(true);

      let response;

      switch (pendingAction.type) {
        case "block":
          response =
            await blockAdminUser(
              pendingAction.user._id
            );
          break;

        case "unblock":
          response =
            await unblockAdminUser(
              pendingAction.user._id
            );
          break;

        case "verify":
          response =
            await verifyAdminUser(
              pendingAction.user._id
            );
          break;

        case "delete":
          response =
            await deleteAdminUser(
              pendingAction.user._id
            );
          break;

        case "restore":
          response =
            await restoreAdminUser(
              pendingAction.user._id
            );
          break;

        case "role":
          if (!pendingAction.nextRole) {
            throw new Error(
              "Select a valid role."
            );
          }

          response =
            await updateAdminUserRole(
              pendingAction.user._id,
              pendingAction.nextRole
            );
          break;
      }

      toast.success(response.message);

      setManageUser(response.user);

      setSelectedRole(
        response.user.role ===
          "organizer"
          ? "organizer"
          : "user"
      );

      setPendingAction(null);

      await loadUsers();

      if (
        detailsUserId ===
        response.user._id
      ) {
        await loadUserDetails(
          response.user._id
        );
      }

      if (
        pendingAction.type ===
          "delete" ||
        pendingAction.type ===
          "restore"
      ) {
        setManageUser(null);
      }
    } catch (error) {
      toast.error(
        getErrorMessage(
          error,
          "Unable to update this user."
        )
      );
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl">
      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-500">
              Accounts
            </p>

            <h2 className="mt-2 text-2xl font-black text-slate-950">
              Manage Users
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              View user details, account
              activity, roles and access
              status.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-700">
              {pagination.totalItems.toLocaleString(
                "en-IN"
              )}{" "}
              accounts
            </span>

            <button
              type="button"
              onClick={loadUsers}
              disabled={isLoading}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={17}
                className={
                  isLoading
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-[1fr_190px_190px]">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              placeholder="Search name or email..."
              onChange={(event) =>
                handleSearchChange(
                  event.target.value
                )
              }
              className="h-12 w-full rounded-xl border-2 border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
            />
          </div>

          <select
            value={role}
            onChange={(event) =>
              handleRoleChange(
                event.target
                  .value as AdminUsersParams["role"]
              )
            }
            className="h-12 rounded-xl border-2 border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
          >
            <option value="all">
              All roles
            </option>

            <option value="user">
              Users
            </option>

            <option value="organizer">
              Organizers
            </option>

            <option value="admin">
              Administrators
            </option>
          </select>

          <select
            value={status}
            onChange={(event) =>
              handleStatusChange(
                event.target
                  .value as AdminUsersParams["status"]
              )
            }
            className="h-12 rounded-xl border-2 border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
          >
            <option value="all">
              All active accounts
            </option>

            <option value="active">
              Active
            </option>

            <option value="blocked">
              Blocked
            </option>

            <option value="deleted">
              Deleted
            </option>
          </select>
        </div>
      </section>

      {error && (
        <section className="mt-5 flex flex-col justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 sm:flex-row sm:items-center">
          <p className="text-sm font-bold text-red-600">
            {error}
          </p>

          <button
            type="button"
            onClick={loadUsers}
            className="w-fit text-sm font-black text-red-700 underline underline-offset-4"
          >
            Try again
          </button>
        </section>
      )}

      <section className="mt-5 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <UsersLoading />
        ) : users.length === 0 ? (
          <div className="px-6 py-20 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
              <UsersRound size={30} />
            </div>

            <h3 className="mt-5 text-lg font-black text-slate-950">
              No users found
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Try changing the search
              term or selected filters.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[1050px]">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <TableHeading>
                      User
                    </TableHeading>

                    <TableHeading>
                      Role
                    </TableHeading>

                    <TableHeading>
                      Provider
                    </TableHeading>

                    <TableHeading>
                      Verification
                    </TableHeading>

                    <TableHeading>
                      Status
                    </TableHeading>

                    <TableHeading>
                      Joined
                    </TableHeading>

                    <TableHeading>
                      Actions
                    </TableHeading>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {users.map((user) => (
                    <UserTableRow
                      key={user._id}
                      user={user}
                      currentAdminId={
                        currentAdminId
                      }
                      onView={() =>
                        loadUserDetails(
                          user._id
                        )
                      }
                      onManage={() =>
                        openManageUser(user)
                      }
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 md:hidden">
              {users.map((user) => (
                <UserMobileCard
                  key={user._id}
                  user={user}
                  currentAdminId={
                    currentAdminId
                  }
                  onView={() =>
                    loadUserDetails(
                      user._id
                    )
                  }
                  onManage={() =>
                    openManageUser(user)
                  }
                />
              ))}
            </div>
          </>
        )}

        {!isLoading &&
          users.length > 0 && (
            <div className="flex flex-col justify-between gap-4 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center">
              <p className="text-sm font-semibold text-slate-600">
                Page{" "}
                {pagination.currentPage} of{" "}
                {pagination.totalPages}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={
                    !pagination.hasPreviousPage
                  }
                  onClick={() =>
                    setPage((current) =>
                      Math.max(
                        current - 1,
                        1
                      )
                    )
                  }
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-orange-300 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft
                    size={17}
                  />

                  Previous
                </button>

                <button
                  type="button"
                  disabled={
                    !pagination.hasNextPage
                  }
                  onClick={() =>
                    setPage(
                      (current) =>
                        current + 1
                    )
                  }
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next

                  <ChevronRight
                    size={17}
                  />
                </button>
              </div>
            </div>
          )}
      </section>

      {manageUser && (
        <ManageUserModal
          user={manageUser}
          currentAdminId={
            currentAdminId
          }
          selectedRole={selectedRole}
          onSelectedRoleChange={
            setSelectedRole
          }
          onClose={closeManageUser}
          onRequestAction={
            requestAction
          }
        />
      )}

      {detailsUserId && (
        <UserDetailsModal
          data={details}
          loading={detailsLoading}
          error={detailsError}
          onRetry={() =>
            loadUserDetails(
              detailsUserId
            )
          }
          onClose={closeDetails}
        />
      )}

      {pendingAction && (
        <ConfirmationModal
          action={pendingAction}
          loading={isActionLoading}
          onCancel={() => {
            if (!isActionLoading) {
              setPendingAction(null);
            }
          }}
          onConfirm={executeAction}
        />
      )}
    </div>
  );
}

interface UserComponentProps {
  user: AdminUser;
}

interface UserRowProps
  extends UserComponentProps {
  currentAdminId: string;
  onView: () => void;
  onManage: () => void;
}

function UserAvatar({
  user,
}: UserComponentProps) {
  const fullName = getFullName(user);

  if (user.profileImage) {
    return (
      <img
        src={user.profileImage}
        alt={fullName}
        className="h-11 w-11 shrink-0 rounded-full border border-slate-200 object-cover"
      />
    );
  }

  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-500 text-xs font-black text-white">
      {getInitials(user)}
    </span>
  );
}

function UserTableRow({
  user,
  currentAdminId,
  onView,
  onManage,
}: UserRowProps) {
  const protectedAccount =
    user.role === "admin" ||
    user._id === currentAdminId;

  return (
    <tr className="transition hover:bg-orange-50/40">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <UserAvatar user={user} />

          <div className="min-w-0">
            <p className="font-black text-slate-950">
              {getFullName(user)}
            </p>

            <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <Mail size={13} />
              {user.email}
            </p>
          </div>
        </div>
      </td>

      <td className="px-5 py-4">
        <RoleBadge role={user.role} />
      </td>

      <td className="px-5 py-4">
        <ProviderBadge
          provider={user.provider}
        />
      </td>

      <td className="px-5 py-4">
        <VerificationBadge
          isVerified={user.isVerified}
        />
      </td>

      <td className="px-5 py-4">
        <StatusBadge user={user} />
      </td>

      <td className="px-5 py-4 text-sm font-semibold text-slate-600">
        {formatDate(user.createdAt)}
      </td>

      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onView}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 transition hover:border-orange-300 hover:text-orange-600"
          >
            <Eye size={15} />
            View
          </button>

          <button
            type="button"
            onClick={onManage}
            disabled={protectedAccount}
            title={
              protectedAccount
                ? "Admin accounts are protected"
                : "Manage user"
            }
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-slate-950 px-3 text-xs font-black text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
          >
            <Settings2 size={15} />
            Manage
          </button>
        </div>
      </td>
    </tr>
  );
}

function UserMobileCard({
  user,
  currentAdminId,
  onView,
  onManage,
}: UserRowProps) {
  const protectedAccount =
    user.role === "admin" ||
    user._id === currentAdminId;

  return (
    <article className="p-5">
      <div className="flex items-start gap-3">
        <UserAvatar user={user} />

        <div className="min-w-0 flex-1">
          <p className="font-black text-slate-950">
            {getFullName(user)}
          </p>

          <p className="mt-1 truncate text-xs font-medium text-slate-500">
            {user.email}
          </p>
        </div>

        <StatusBadge user={user} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <RoleBadge role={user.role} />

        <ProviderBadge
          provider={user.provider}
        />

        <VerificationBadge
          isVerified={user.isVerified}
        />
      </div>

      <p className="mt-4 text-xs font-semibold text-slate-500">
        Joined{" "}
        {formatDate(user.createdAt)}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onView}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-700"
        >
          <Eye size={16} />
          View
        </button>

        <button
          type="button"
          onClick={onManage}
          disabled={protectedAccount}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
        >
          <Settings2 size={16} />
          Manage
        </button>
      </div>
    </article>
  );
}

interface ManageUserModalProps {
  user: AdminUser;
  currentAdminId: string;
  selectedRole:
    | "user"
    | "organizer";
  onSelectedRoleChange: (
    role: "user" | "organizer"
  ) => void;
  onClose: () => void;
  onRequestAction: (
    action: PendingAction
  ) => void;
}

function ManageUserModal({
  user,
  currentAdminId,
  selectedRole,
  onSelectedRoleChange,
  onClose,
  onRequestAction,
}: ManageUserModalProps) {
  const protectedAccount =
    user.role === "admin" ||
    user._id === currentAdminId;

  return (
    <ModalShell onClose={onClose}>
      <div className="w-full max-w-lg rounded-[26px] bg-white shadow-2xl">
        <ModalHeader
          title="Manage User"
          description={getFullName(user)}
          onClose={onClose}
        />

        <div className="max-h-[75vh] overflow-y-auto p-6">
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <UserAvatar user={user} />

            <div className="min-w-0">
              <p className="font-black text-slate-950">
                {getFullName(user)}
              </p>

              <p className="mt-1 truncate text-sm text-slate-500">
                {user.email}
              </p>
            </div>
          </div>

          {protectedAccount ? (
            <div className="mt-5 rounded-2xl border border-purple-200 bg-purple-50 p-4">
              <p className="text-sm font-black text-purple-700">
                Protected admin account
              </p>

              <p className="mt-1 text-sm leading-6 text-purple-600">
                Admin accounts cannot be
                blocked, deleted, verified or
                assigned another role here.
              </p>
            </div>
          ) : user.isDeleted ? (
            <div className="mt-5">
              <button
                type="button"
                onClick={() =>
                  onRequestAction({
                    type: "restore",
                    user,
                  })
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-700"
              >
                <RotateCcw size={18} />
                Restore User
              </button>
            </div>
          ) : (
            <div className="mt-5 space-y-5">
              <section className="rounded-2xl border border-slate-200 p-4">
                <h3 className="font-black text-slate-950">
                  Access status
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Block or restore this
                  user&apos;s account access.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    onRequestAction({
                      type: user.isBlocked
                        ? "unblock"
                        : "block",
                      user,
                    })
                  }
                  className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black text-white transition ${
                    user.isBlocked
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {user.isBlocked ? (
                    <ShieldCheck
                      size={18}
                    />
                  ) : (
                    <Ban size={18} />
                  )}

                  {user.isBlocked
                    ? "Unblock User"
                    : "Block User"}
                </button>
              </section>

              {!user.isVerified && (
                <section className="rounded-2xl border border-slate-200 p-4">
                  <h3 className="font-black text-slate-950">
                    Email verification
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Manually verify this
                    user&apos;s email address.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      onRequestAction({
                        type: "verify",
                        user,
                      })
                    }
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white transition hover:bg-blue-700"
                  >
                    <BadgeCheck
                      size={18}
                    />
                    Verify Email
                  </button>
                </section>
              )}

              <section className="rounded-2xl border border-slate-200 p-4">
                <h3 className="font-black text-slate-950">
                  Change role
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Promote a user to
                  organizer or return an
                  organizer to user.
                </p>

                <select
                  value={selectedRole}
                  onChange={(event) =>
                    onSelectedRoleChange(
                      event.target.value as
                        | "user"
                        | "organizer"
                    )
                  }
                  className="mt-4 h-12 w-full rounded-xl border-2 border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                >
                  <option value="user">
                    User
                  </option>

                  <option value="organizer">
                    Organizer
                  </option>
                </select>

                <button
                  type="button"
                  disabled={
                    selectedRole === user.role
                  }
                  onClick={() =>
                    onRequestAction({
                      type: "role",
                      user,
                      nextRole:
                        selectedRole,
                    })
                  }
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                >
                  <UserCog size={18} />
                  Update Role
                </button>
              </section>

              <section className="rounded-2xl border border-red-200 bg-red-50 p-4">
                <h3 className="font-black text-red-700">
                  Delete account
                </h3>

                <p className="mt-1 text-sm leading-6 text-red-600">
                  This is a soft deletion.
                  The account can be restored
                  later.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    onRequestAction({
                      type: "delete",
                      user,
                    })
                  }
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-black text-white transition hover:bg-red-700"
                >
                  <Trash2 size={18} />
                  Delete User
                </button>
              </section>
            </div>
          )}
        </div>
      </div>
    </ModalShell>
  );
}

interface UserDetailsModalProps {
  data: AdminUserDetailsResponse | null;
  loading: boolean;
  error: string;
  onRetry: () => void;
  onClose: () => void;
}

function UserDetailsModal({
  data,
  loading,
  error,
  onRetry,
  onClose,
}: UserDetailsModalProps) {
  return (
    <ModalShell onClose={onClose}>
      <div className="w-full max-w-4xl rounded-[26px] bg-white shadow-2xl">
        <ModalHeader
          title="User Details"
          description="Profile and booking activity"
          onClose={onClose}
        />

        <div className="max-h-[78vh] overflow-y-auto p-6">
          {loading ? (
            <div className="flex min-h-72 items-center justify-center">
              <Loader2
                size={32}
                className="animate-spin text-orange-500"
              />
            </div>
          ) : error ? (
            <div className="py-16 text-center">
              <p className="font-bold text-red-600">
                {error}
              </p>

              <button
                type="button"
                onClick={onRetry}
                className="mt-4 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white"
              >
                Try again
              </button>
            </div>
          ) : data ? (
            <div>
              <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center">
                <UserAvatar
                  user={data.user}
                />

                <div className="min-w-0 flex-1">
                  <h3 className="text-xl font-black text-slate-950">
                    {getFullName(
                      data.user
                    )}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    {data.user.email}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <RoleBadge
                      role={
                        data.user.role
                      }
                    />

                    <StatusBadge
                      user={data.user}
                    />

                    <VerificationBadge
                      isVerified={
                        data.user
                          .isVerified
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <DetailStat
                  label="Total bookings"
                  value={data.summary.totalBookings.toString()}
                />

                <DetailStat
                  label="Confirmed"
                  value={data.summary.confirmedBookings.toString()}
                />

                <DetailStat
                  label="Cancelled"
                  value={data.summary.cancelledBookings.toString()}
                />

                <DetailStat
                  label="Total spent"
                  value={formatCurrency(
                    data.summary.totalSpent
                  )}
                />
              </div>

              <section className="mt-5 rounded-2xl border border-slate-200 p-5">
                <h3 className="font-black text-slate-950">
                  Account Information
                </h3>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <DetailItem
                    label="Provider"
                    value={
                      data.user
                        .provider ||
                      "local"
                    }
                  />

                  <DetailItem
                    label="Joined"
                    value={formatDate(
                      data.user
                        .createdAt
                    )}
                  />

                  <DetailItem
                    label="Last login"
                    value={formatDateTime(
                      data.user
                        .lastLogin
                    )}
                  />

                  <DetailItem
                    label="Location"
                    value={
                      [
                        data.user
                          .address?.city,
                        data.user
                          .address?.state,
                        data.user
                          .address
                          ?.country,
                      ]
                        .filter(Boolean)
                        .join(", ") ||
                      "Not added"
                    }
                  />
                </div>

                {data.user.bio && (
                  <div className="mt-4 rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                      Bio
                    </p>

                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">
                      {data.user.bio}
                    </p>
                  </div>
                )}
              </section>

              <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
                <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                  <h3 className="font-black text-slate-950">
                    Recent Bookings
                  </h3>
                </div>

                {data.bookings.length ===
                0 ? (
                  <div className="px-6 py-12 text-center">
                    <CalendarDays
                      size={30}
                      className="mx-auto text-slate-300"
                    />

                    <p className="mt-3 text-sm font-semibold text-slate-500">
                      This user has no
                      bookings.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {data.bookings.map(
                      (booking) => (
                        <div
                          key={
                            booking._id
                          }
                          className="flex flex-col justify-between gap-3 px-5 py-4 sm:flex-row sm:items-center"
                        >
                          <div>
                            <p className="font-black text-slate-900">
                              {booking
                                .event
                                ?.title ||
                                "Deleted event"}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {
                                booking.bookingCode
                              }{" "}
                              •{" "}
                              {formatDate(
                                booking.createdAt
                              )}
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-sm font-black text-slate-900">
                              {formatCurrency(
                                booking.totalAmount
                              )}
                            </span>

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-black ${
                                booking.status ===
                                "confirmed"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-red-50 text-red-700"
                              }`}
                            >
                              {
                                booking.status
                              }
                            </span>
                          </div>
                        </div>
                      )
                    )}
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

interface ConfirmationModalProps {
  action: PendingAction;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

function ConfirmationModal({
  action,
  loading,
  onCancel,
  onConfirm,
}: ConfirmationModalProps) {
  const content =
    getActionContent(action);

  return (
    <ModalShell onClose={onCancel}>
      <div className="w-full max-w-md rounded-[24px] bg-white p-6 shadow-2xl">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
            content.danger
              ? "bg-red-50 text-red-600"
              : "bg-orange-50 text-orange-600"
          }`}
        >
          {content.danger ? (
            <Ban size={23} />
          ) : (
            <CheckCircle2
              size={23}
            />
          )}
        </div>

        <h2 className="mt-5 text-xl font-black text-slate-950">
          {content.title}
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          {content.description}
        </p>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl border-2 border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-black text-white disabled:opacity-60 ${
              content.danger
                ? "bg-red-600 hover:bg-red-700"
                : "bg-slate-950 hover:bg-orange-600"
            }`}
          >
            {loading && (
              <Loader2
                size={17}
                className="animate-spin"
              />
            )}

            {content.confirmText}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

interface ModalShellProps {
  children: ReactNode;
  onClose: () => void;
}

function ModalShell({
  children,
  onClose,
}: ModalShellProps) {
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

interface ModalHeaderProps {
  title: string;
  description: string;
  onClose: () => void;
}

function ModalHeader({
  title,
  description,
  onClose,
}: ModalHeaderProps) {
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

interface DetailStatProps {
  label: string;
  value: string;
}

function DetailStat({
  label,
  value,
}: DetailStatProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-bold text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-xl font-black text-slate-950">
        {value}
      </p>
    </div>
  );
}

interface DetailItemProps {
  label: string;
  value: string;
}

function DetailItem({
  label,
  value,
}: DetailItemProps) {
  return (
    <div className="flex items-start gap-3">
      <MapPin
        size={17}
        className="mt-0.5 shrink-0 text-orange-500"
      />

      <div>
        <p className="text-xs font-semibold text-slate-500">
          {label}
        </p>

        <p className="mt-1 text-sm font-bold capitalize text-slate-900">
          {value}
        </p>
      </div>
    </div>
  );
}

interface RoleBadgeProps {
  role: AdminUserRole;
}

function RoleBadge({
  role,
}: RoleBadgeProps) {
  const Icon =
    role === "admin"
      ? ShieldCheck
      : role === "organizer"
        ? UserCog
        : UserRound;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black capitalize ${getRoleStyles(
        role
      )}`}
    >
      <Icon size={13} />
      {role}
    </span>
  );
}

interface ProviderBadgeProps {
  provider?: AdminUser["provider"];
}

function ProviderBadge({
  provider,
}: ProviderBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1.5 text-xs font-black capitalize ${getProviderStyles(
        provider
      )}`}
    >
      {provider || "local"}
    </span>
  );
}

interface VerificationBadgeProps {
  isVerified: boolean;
}

function VerificationBadge({
  isVerified,
}: VerificationBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black ${
        isVerified
          ? "bg-emerald-50 text-emerald-700"
          : "bg-amber-50 text-amber-700"
      }`}
    >
      <BadgeCheck size={13} />

      {isVerified
        ? "Verified"
        : "Not verified"}
    </span>
  );
}

interface StatusBadgeProps {
  user: AdminUser;
}

function StatusBadge({
  user,
}: StatusBadgeProps) {
  if (user.isDeleted) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600">
        <Trash2 size={13} />
        Deleted
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black ${
        user.isBlocked
          ? "bg-red-50 text-red-700"
          : "bg-emerald-50 text-emerald-700"
      }`}
    >
      {user.isBlocked ? (
        <Ban size={13} />
      ) : (
        <ShieldCheck size={13} />
      )}

      {user.isBlocked
        ? "Blocked"
        : "Active"}
    </span>
  );
}

interface TableHeadingProps {
  children: ReactNode;
}

function TableHeading({
  children,
}: TableHeadingProps) {
  return (
    <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-[0.12em] text-slate-500">
      {children}
    </th>
  );
}

function UsersLoading() {
  return (
    <div className="space-y-3 p-5">
      {Array.from({
        length: 6,
      }).map((_, index) => (
        <div
          key={index}
          className="flex animate-pulse items-center gap-4 rounded-xl border border-slate-100 p-4"
        >
          <div className="h-11 w-11 rounded-full bg-slate-200" />

          <div className="flex-1">
            <div className="h-4 w-40 rounded bg-slate-200" />

            <div className="mt-2 h-3 w-56 rounded bg-slate-100" />
          </div>

          <div className="hidden h-8 w-24 rounded-full bg-slate-100 sm:block" />
        </div>
      ))}
    </div>
  );
}