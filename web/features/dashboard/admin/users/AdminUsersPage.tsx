"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, RefreshCw, Search, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { useAppSelector } from "@/store/hooks";
import { blockAdminUser, deleteAdminUser, getAdminUserDetails, getAdminUsers, restoreAdminUser, unblockAdminUser, updateAdminUserRole, verifyAdminUser, type AdminPagination, type AdminUser, type AdminUserDetailsResponse, type AdminUsersParams } from "@/services/admin.service";

import { emptyPagination } from "./constants";
import { PendingAction } from "./types";
import { TableHeading, UserMobileCard, UserTableRow, UsersLoading } from "./UserList";
import { ConfirmationModal, ManageUserModal, UserDetailsModal } from "./UserModals";
import { getErrorMessage } from "./utils";

export default function AdminUsersPage() {
    const currentAdmin = useAppSelector((state) => state.auth.user);
    const currentAdminId = currentAdmin?._id ||
        currentAdmin?.id ||
        "";
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [pagination, setPagination,] = useState<AdminPagination>(emptyPagination);
    const [search, setSearch] = useState("");
    const [role, setRole,] = useState<AdminUsersParams["role"]>("all");
    const [status, setStatus,] = useState<AdminUsersParams["status"]>("all");
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [manageUser, setManageUser,] = useState<AdminUser | null>(null);
    const [selectedRole, setSelectedRole,] = useState<"user" | "organizer">("user");
    const [pendingAction, setPendingAction,] = useState<PendingAction | null>(null);
    const [isActionLoading, setIsActionLoading,] = useState(false);
    const [details, setDetails,] = useState<AdminUserDetailsResponse | null>(null);
    const [detailsUserId, setDetailsUserId,] = useState<string | null>(null);
    const [detailsLoading, setDetailsLoading,] = useState(false);
    const [detailsError, setDetailsError,] = useState("");
    const loadUsers = useCallback(async () => {
        try {
            setIsLoading(true);
            setError("");
            const response = await getAdminUsers({
                search: search.trim() ||
                    undefined,
                role,
                status,
                page,
                limit: 10,
            });
            if (!response.success) {
                throw new Error(response.message ||
                    "Unable to load users.");
            }
            setUsers(response.users || []);
            setPagination(response.pagination ||
                emptyPagination);
        }
        catch (error) {
            setUsers([]);
            setError(getErrorMessage(error, "Unable to load users."));
        }
        finally {
            setIsLoading(false);
        }
    }, [
        page,
        role,
        search,
        status,
    ]);
    useEffect(() => {
        const timeout = window.setTimeout(() => {
            loadUsers();
        }, 350);
        return () => {
            window.clearTimeout(timeout);
        };
    }, [loadUsers]);
    const loadUserDetails = useCallback(async (userId: string) => {
        try {
            setDetailsUserId(userId);
            setDetailsLoading(true);
            setDetailsError("");
            setDetails(null);
            const response = await getAdminUserDetails(userId);
            setDetails(response);
        }
        catch (error) {
            setDetailsError(getErrorMessage(error, "Unable to load user details."));
        }
        finally {
            setDetailsLoading(false);
        }
    }, []);
    const handleSearchChange = (value: string) => {
        setSearch(value);
        setPage(1);
    };
    const handleRoleChange = (value: AdminUsersParams["role"]) => {
        setRole(value);
        setPage(1);
    };
    const handleStatusChange = (value: AdminUsersParams["status"]) => {
        setStatus(value);
        setPage(1);
    };
    const openManageUser = (user: AdminUser) => {
        setManageUser(user);
        setSelectedRole(user.role === "organizer"
            ? "organizer"
            : "user");
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
    const requestAction = (action: PendingAction) => {
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
                        await blockAdminUser(pendingAction.user._id);
                    break;
                case "unblock":
                    response =
                        await unblockAdminUser(pendingAction.user._id);
                    break;
                case "verify":
                    response =
                        await verifyAdminUser(pendingAction.user._id);
                    break;
                case "delete":
                    response =
                        await deleteAdminUser(pendingAction.user._id);
                    break;
                case "restore":
                    response =
                        await restoreAdminUser(pendingAction.user._id);
                    break;
                case "role":
                    if (!pendingAction.nextRole) {
                        throw new Error("Select a valid role.");
                    }
                    response =
                        await updateAdminUserRole(pendingAction.user._id, pendingAction.nextRole);
                    break;
            }
            toast.success(response.message);
            setManageUser(response.user);
            setSelectedRole(response.user.role ===
                "organizer"
                ? "organizer"
                : "user");
            setPendingAction(null);
            await loadUsers();
            if (detailsUserId ===
                response.user._id) {
                await loadUserDetails(response.user._id);
            }
            if (pendingAction.type ===
                "delete" ||
                pendingAction.type ===
                    "restore") {
                setManageUser(null);
            }
        }
        catch (error) {
            toast.error(getErrorMessage(error, "Unable to update this user."));
        }
        finally {
            setIsActionLoading(false);
        }
    };
    return (<div className="mx-auto max-w-7xl">
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
              {pagination.totalItems.toLocaleString("en-IN")}{" "}
              accounts
            </span>

            <button type="button" onClick={loadUsers} disabled={isLoading} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60">
              <RefreshCw size={17} className={isLoading
            ? "animate-spin"
            : ""}/>

              Refresh
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-[1fr_190px_190px]">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>

            <input type="text" value={search} placeholder="Search name or email..." onChange={(event) => handleSearchChange(event.target.value)} className="h-12 w-full rounded-xl border-2 border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"/>
          </div>

          <select value={role} onChange={(event) => handleRoleChange(event.target
            .value as AdminUsersParams["role"])} className="h-12 rounded-xl border-2 border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100">
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

          <select value={status} onChange={(event) => handleStatusChange(event.target
            .value as AdminUsersParams["status"])} className="h-12 rounded-xl border-2 border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100">
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

      {error && (<section className="mt-5 flex flex-col justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 sm:flex-row sm:items-center">
          <p className="text-sm font-bold text-red-600">
            {error}
          </p>

          <button type="button" onClick={loadUsers} className="w-fit text-sm font-black text-red-700 underline underline-offset-4">
            Try again
          </button>
        </section>)}

      <section className="mt-5 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
        {isLoading ? (<UsersLoading />) : users.length === 0 ? (<div className="px-6 py-20 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
              <UsersRound size={30}/>
            </div>

            <h3 className="mt-5 text-lg font-black text-slate-950">
              No users found
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Try changing the search
              term or selected filters.
            </p>
          </div>) : (<>
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
                  {users.map((user) => (<UserTableRow key={user._id} user={user} currentAdminId={currentAdminId} onView={() => loadUserDetails(user._id)} onManage={() => openManageUser(user)}/>))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 md:hidden">
              {users.map((user) => (<UserMobileCard key={user._id} user={user} currentAdminId={currentAdminId} onView={() => loadUserDetails(user._id)} onManage={() => openManageUser(user)}/>))}
            </div>
          </>)}

        {!isLoading &&
            users.length > 0 && (<div className="flex flex-col justify-between gap-4 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center">
              <p className="text-sm font-semibold text-slate-600">
                Page{" "}
                {pagination.currentPage} of{" "}
                {pagination.totalPages}
              </p>

              <div className="flex items-center gap-2">
                <button type="button" disabled={!pagination.hasPreviousPage} onClick={() => setPage((current) => Math.max(current - 1, 1))} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-orange-300 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-40">
                  <ChevronLeft size={17}/>

                  Previous
                </button>

                <button type="button" disabled={!pagination.hasNextPage} onClick={() => setPage((current) => current + 1)} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-40">
                  Next

                  <ChevronRight size={17}/>
                </button>
              </div>
            </div>)}
      </section>

      {manageUser && (<ManageUserModal user={manageUser} currentAdminId={currentAdminId} selectedRole={selectedRole} onSelectedRoleChange={setSelectedRole} onClose={closeManageUser} onRequestAction={requestAction}/>)}

      {detailsUserId && (<UserDetailsModal data={details} loading={detailsLoading} error={detailsError} onRetry={() => loadUserDetails(detailsUserId)} onClose={closeDetails}/>)}

      {pendingAction && (<ConfirmationModal action={pendingAction} loading={isActionLoading} onCancel={() => {
                if (!isActionLoading) {
                    setPendingAction(null);
                }
            }} onConfirm={executeAction}/>)}
    </div>);
}
