"use client";

import type { ReactNode } from "react";
import { BadgeCheck, Ban, CalendarDays, CheckCircle2, Loader2, MapPin, RotateCcw, ShieldCheck, Trash2, UserCog, X } from "lucide-react";
import { type AdminUser, type AdminUserDetailsResponse } from "@/services/admin.service";

import { PendingAction } from "./types";
import { RoleBadge, StatusBadge, VerificationBadge } from "./UserBadges";
import { UserAvatar } from "./UserList";
import { formatCurrency, formatDate, formatDateTime, getActionContent, getFullName } from "./utils";

export interface ManageUserModalProps {
    user: AdminUser;
    currentAdminId: string;
    selectedRole: "user" | "organizer";
    onSelectedRoleChange: (role: "user" | "organizer") => void;
    onClose: () => void;
    onRequestAction: (action: PendingAction) => void;
}

export function ManageUserModal({ user, currentAdminId, selectedRole, onSelectedRoleChange, onClose, onRequestAction, }: ManageUserModalProps) {
    const protectedAccount = user.role === "admin" ||
        user._id === currentAdminId;
    return (<ModalShell onClose={onClose}>
      <div className="w-full max-w-lg rounded-[26px] bg-white shadow-2xl">
        <ModalHeader title="Manage User" description={getFullName(user)} onClose={onClose}/>

        <div className="max-h-[75vh] overflow-y-auto p-6">
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <UserAvatar user={user}/>

            <div className="min-w-0">
              <p className="font-black text-slate-950">
                {getFullName(user)}
              </p>

              <p className="mt-1 truncate text-sm text-slate-500">
                {user.email}
              </p>
            </div>
          </div>

          {protectedAccount ? (<div className="mt-5 rounded-2xl border border-purple-200 bg-purple-50 p-4">
              <p className="text-sm font-black text-purple-700">
                Protected admin account
              </p>

              <p className="mt-1 text-sm leading-6 text-purple-600">
                Admin accounts cannot be
                blocked, deleted, verified or
                assigned another role here.
              </p>
            </div>) : user.isDeleted ? (<div className="mt-5">
              <button type="button" onClick={() => onRequestAction({
                type: "restore",
                user,
            })} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-700">
                <RotateCcw size={18}/>
                Restore User
              </button>
            </div>) : (<div className="mt-5 space-y-5">
              <section className="rounded-2xl border border-slate-200 p-4">
                <h3 className="font-black text-slate-950">
                  Access status
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Block or restore this
                  user&apos;s account access.
                </p>

                <button type="button" onClick={() => onRequestAction({
                type: user.isBlocked
                    ? "unblock"
                    : "block",
                user,
            })} className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black text-white transition ${user.isBlocked
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-red-600 hover:bg-red-700"}`}>
                  {user.isBlocked ? (<ShieldCheck size={18}/>) : (<Ban size={18}/>)}

                  {user.isBlocked
                ? "Unblock User"
                : "Block User"}
                </button>
              </section>

              {!user.isVerified && (<section className="rounded-2xl border border-slate-200 p-4">
                  <h3 className="font-black text-slate-950">
                    Email verification
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Manually verify this
                    user&apos;s email address.
                  </p>

                  <button type="button" onClick={() => onRequestAction({
                    type: "verify",
                    user,
                })} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white transition hover:bg-blue-700">
                    <BadgeCheck size={18}/>
                    Verify Email
                  </button>
                </section>)}

              <section className="rounded-2xl border border-slate-200 p-4">
                <h3 className="font-black text-slate-950">
                  Change role
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Promote a user to
                  organizer or return an
                  organizer to user.
                </p>

                <select value={selectedRole} onChange={(event) => onSelectedRoleChange(event.target.value as "user" | "organizer")} className="mt-4 h-12 w-full rounded-xl border-2 border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100">
                  <option value="user">
                    User
                  </option>

                  <option value="organizer">
                    Organizer
                  </option>
                </select>

                <button type="button" disabled={selectedRole === user.role} onClick={() => onRequestAction({
                type: "role",
                user,
                nextRole: selectedRole,
            })} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500">
                  <UserCog size={18}/>
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

                <button type="button" onClick={() => onRequestAction({
                type: "delete",
                user,
            })} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-black text-white transition hover:bg-red-700">
                  <Trash2 size={18}/>
                  Delete User
                </button>
              </section>
            </div>)}
        </div>
      </div>
    </ModalShell>);
}

export interface UserDetailsModalProps {
    data: AdminUserDetailsResponse | null;
    loading: boolean;
    error: string;
    onRetry: () => void;
    onClose: () => void;
}

export function UserDetailsModal({ data, loading, error, onRetry, onClose, }: UserDetailsModalProps) {
    return (<ModalShell onClose={onClose}>
      <div className="w-full max-w-4xl rounded-[26px] bg-white shadow-2xl">
        <ModalHeader title="User Details" description="Profile and booking activity" onClose={onClose}/>

        <div className="max-h-[78vh] overflow-y-auto p-6">
          {loading ? (<div className="flex min-h-72 items-center justify-center">
              <Loader2 size={32} className="animate-spin text-orange-500"/>
            </div>) : error ? (<div className="py-16 text-center">
              <p className="font-bold text-red-600">
                {error}
              </p>

              <button type="button" onClick={onRetry} className="mt-4 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white">
                Try again
              </button>
            </div>) : data ? (<div>
              <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center">
                <UserAvatar user={data.user}/>

                <div className="min-w-0 flex-1">
                  <h3 className="text-xl font-black text-slate-950">
                    {getFullName(data.user)}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    {data.user.email}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <RoleBadge role={data.user.role}/>

                    <StatusBadge user={data.user}/>

                    <VerificationBadge isVerified={data.user
                .isVerified}/>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <DetailStat label="Total bookings" value={data.summary.totalBookings.toString()}/>

                <DetailStat label="Confirmed" value={data.summary.confirmedBookings.toString()}/>

                <DetailStat label="Cancelled" value={data.summary.cancelledBookings.toString()}/>

                <DetailStat label="Total spent" value={formatCurrency(data.summary.totalSpent)}/>
              </div>

              <section className="mt-5 rounded-2xl border border-slate-200 p-5">
                <h3 className="font-black text-slate-950">
                  Account Information
                </h3>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <DetailItem label="Provider" value={data.user
                .provider ||
                "local"}/>

                  <DetailItem label="Joined" value={formatDate(data.user
                .createdAt)}/>

                  <DetailItem label="Last login" value={formatDateTime(data.user
                .lastLogin)}/>

                  <DetailItem label="Location" value={[
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
                "Not added"}/>
                </div>

                {data.user.bio && (<div className="mt-4 rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                      Bio
                    </p>

                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">
                      {data.user.bio}
                    </p>
                  </div>)}
              </section>

              <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
                <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                  <h3 className="font-black text-slate-950">
                    Recent Bookings
                  </h3>
                </div>

                {data.bookings.length ===
                0 ? (<div className="px-6 py-12 text-center">
                    <CalendarDays size={30} className="mx-auto text-slate-300"/>

                    <p className="mt-3 text-sm font-semibold text-slate-500">
                      This user has no
                      bookings.
                    </p>
                  </div>) : (<div className="divide-y divide-slate-100">
                    {data.bookings.map((booking) => (<div key={booking._id} className="flex flex-col justify-between gap-3 px-5 py-4 sm:flex-row sm:items-center">
                          <div>
                            <p className="font-black text-slate-900">
                              {booking
                        .event
                        ?.title ||
                        "Deleted event"}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {booking.bookingCode}{" "}
                              •{" "}
                              {formatDate(booking.createdAt)}
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-sm font-black text-slate-900">
                              {formatCurrency(booking.totalAmount)}
                            </span>

                            <span className={`rounded-full px-3 py-1 text-xs font-black ${booking.status ===
                        "confirmed"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-red-50 text-red-700"}`}>
                              {booking.status}
                            </span>
                          </div>
                        </div>))}
                  </div>)}
              </section>
            </div>) : null}
        </div>
      </div>
    </ModalShell>);
}

export interface ConfirmationModalProps {
    action: PendingAction;
    loading: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}

export function ConfirmationModal({ action, loading, onCancel, onConfirm, }: ConfirmationModalProps) {
    const content = getActionContent(action);
    return (<ModalShell onClose={onCancel}>
      <div className="w-full max-w-md rounded-[24px] bg-white p-6 shadow-2xl">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${content.danger
            ? "bg-red-50 text-red-600"
            : "bg-orange-50 text-orange-600"}`}>
          {content.danger ? (<Ban size={23}/>) : (<CheckCircle2 size={23}/>)}
        </div>

        <h2 className="mt-5 text-xl font-black text-slate-950">
          {content.title}
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          {content.description}
        </p>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} disabled={loading} className="rounded-xl border-2 border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 disabled:opacity-50">
            Cancel
          </button>

          <button type="button" onClick={onConfirm} disabled={loading} className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-black text-white disabled:opacity-60 ${content.danger
            ? "bg-red-600 hover:bg-red-700"
            : "bg-slate-950 hover:bg-orange-600"}`}>
            {loading && (<Loader2 size={17} className="animate-spin"/>)}

            {content.confirmText}
          </button>
        </div>
      </div>
    </ModalShell>);
}

export interface ModalShellProps {
    children: ReactNode;
    onClose: () => void;
}

export function ModalShell({ children, onClose, }: ModalShellProps) {
    return (<div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <div className="flex w-full justify-center" onMouseDown={(event) => event.stopPropagation()}>
        {children}
      </div>
    </div>);
}

export interface ModalHeaderProps {
    title: string;
    description: string;
    onClose: () => void;
}

export function ModalHeader({ title, description, onClose, }: ModalHeaderProps) {
    return (<div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
      <div>
        <h2 className="text-xl font-black text-slate-950">
          {title}
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          {description}
        </p>
      </div>

      <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-100">
        <X size={18}/>
      </button>
    </div>);
}

export interface DetailStatProps {
    label: string;
    value: string;
}

export function DetailStat({ label, value, }: DetailStatProps) {
    return (<div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-bold text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-xl font-black text-slate-950">
        {value}
      </p>
    </div>);
}

export interface DetailItemProps {
    label: string;
    value: string;
}

export function DetailItem({ label, value, }: DetailItemProps) {
    return (<div className="flex items-start gap-3">
      <MapPin size={17} className="mt-0.5 shrink-0 text-orange-500"/>

      <div>
        <p className="text-xs font-semibold text-slate-500">
          {label}
        </p>

        <p className="mt-1 text-sm font-bold capitalize text-slate-900">
          {value}
        </p>
      </div>
    </div>);
}
