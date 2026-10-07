"use client";

import type { ReactNode } from "react";
import { Eye, Mail, Settings2 } from "lucide-react";
import { type AdminUser } from "@/services/admin.service";

import { ProviderBadge, RoleBadge, StatusBadge, VerificationBadge } from "./UserBadges";
import { formatDate, getFullName, getInitials } from "./utils";

export interface UserComponentProps {
    user: AdminUser;
}

export interface UserRowProps extends UserComponentProps {
    currentAdminId: string;
    onView: () => void;
    onManage: () => void;
}

export function UserAvatar({ user, }: UserComponentProps) {
    const fullName = getFullName(user);
    if (user.profileImage) {
        return (<img src={user.profileImage} alt={fullName} className="h-11 w-11 shrink-0 rounded-full border border-slate-200 object-cover"/>);
    }
    return (<span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-500 text-xs font-black text-white">
      {getInitials(user)}
    </span>);
}

export function UserTableRow({ user, currentAdminId, onView, onManage, }: UserRowProps) {
    const protectedAccount = user.role === "admin" ||
        user._id === currentAdminId;
    return (<tr className="transition hover:bg-orange-50/40">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <UserAvatar user={user}/>

          <div className="min-w-0">
            <p className="font-black text-slate-950">
              {getFullName(user)}
            </p>

            <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <Mail size={13}/>
              {user.email}
            </p>
          </div>
        </div>
      </td>

      <td className="px-5 py-4">
        <RoleBadge role={user.role}/>
      </td>

      <td className="px-5 py-4">
        <ProviderBadge provider={user.provider}/>
      </td>

      <td className="px-5 py-4">
        <VerificationBadge isVerified={user.isVerified}/>
      </td>

      <td className="px-5 py-4">
        <StatusBadge user={user}/>
      </td>

      <td className="px-5 py-4 text-sm font-semibold text-slate-600">
        {formatDate(user.createdAt)}
      </td>

      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          <button type="button" onClick={onView} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 transition hover:border-orange-300 hover:text-orange-600">
            <Eye size={15}/>
            View
          </button>

          <button type="button" onClick={onManage} disabled={protectedAccount} title={protectedAccount
            ? "Admin accounts are protected"
            : "Manage user"} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-slate-950 px-3 text-xs font-black text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500">
            <Settings2 size={15}/>
            Manage
          </button>
        </div>
      </td>
    </tr>);
}

export function UserMobileCard({ user, currentAdminId, onView, onManage, }: UserRowProps) {
    const protectedAccount = user.role === "admin" ||
        user._id === currentAdminId;
    return (<article className="p-5">
      <div className="flex items-start gap-3">
        <UserAvatar user={user}/>

        <div className="min-w-0 flex-1">
          <p className="font-black text-slate-950">
            {getFullName(user)}
          </p>

          <p className="mt-1 truncate text-xs font-medium text-slate-500">
            {user.email}
          </p>
        </div>

        <StatusBadge user={user}/>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <RoleBadge role={user.role}/>

        <ProviderBadge provider={user.provider}/>

        <VerificationBadge isVerified={user.isVerified}/>
      </div>

      <p className="mt-4 text-xs font-semibold text-slate-500">
        Joined{" "}
        {formatDate(user.createdAt)}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" onClick={onView} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-700">
          <Eye size={16}/>
          View
        </button>

        <button type="button" onClick={onManage} disabled={protectedAccount} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500">
          <Settings2 size={16}/>
          Manage
        </button>
      </div>
    </article>);
}

export interface TableHeadingProps {
    children: ReactNode;
}

export function TableHeading({ children, }: TableHeadingProps) {
    return (<th className="px-5 py-4 text-left text-xs font-black uppercase tracking-[0.12em] text-slate-500">
      {children}
    </th>);
}

export function UsersLoading() {
    return (<div className="space-y-3 p-5">
      {Array.from({
            length: 6,
        }).map((_, index) => (<div key={index} className="flex animate-pulse items-center gap-4 rounded-xl border border-slate-100 p-4">
          <div className="h-11 w-11 rounded-full bg-slate-200"/>

          <div className="flex-1">
            <div className="h-4 w-40 rounded bg-slate-200"/>

            <div className="mt-2 h-3 w-56 rounded bg-slate-100"/>
          </div>

          <div className="hidden h-8 w-24 rounded-full bg-slate-100 sm:block"/>
        </div>))}
    </div>);
}
