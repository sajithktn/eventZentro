"use client";

import { BadgeCheck, Ban, ShieldCheck, Trash2, UserCog, UserRound } from "lucide-react";
import { type AdminUser, type AdminUserRole } from "@/services/admin.service";

import { getProviderStyles, getRoleStyles } from "./utils";

export interface RoleBadgeProps {
    role: AdminUserRole;
}

export function RoleBadge({ role, }: RoleBadgeProps) {
    const Icon = role === "admin"
        ? ShieldCheck
        : role === "organizer"
            ? UserCog
            : UserRound;
    return (<span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black capitalize ${getRoleStyles(role)}`}>
      <Icon size={13}/>
      {role}
    </span>);
}

export interface ProviderBadgeProps {
    provider?: AdminUser["provider"];
}

export function ProviderBadge({ provider, }: ProviderBadgeProps) {
    return (<span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-black capitalize ${getProviderStyles(provider)}`}>
      {provider || "local"}
    </span>);
}

export interface VerificationBadgeProps {
    isVerified: boolean;
}

export function VerificationBadge({ isVerified, }: VerificationBadgeProps) {
    return (<span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black ${isVerified
            ? "bg-emerald-50 text-emerald-700"
            : "bg-amber-50 text-amber-700"}`}>
      <BadgeCheck size={13}/>

      {isVerified
            ? "Verified"
            : "Not verified"}
    </span>);
}

export interface StatusBadgeProps {
    user: AdminUser;
}

export function StatusBadge({ user, }: StatusBadgeProps) {
    if (user.isDeleted) {
        return (<span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600">
        <Trash2 size={13}/>
        Deleted
      </span>);
    }
    return (<span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black ${user.isBlocked
            ? "bg-red-50 text-red-700"
            : "bg-emerald-50 text-emerald-700"}`}>
      {user.isBlocked ? (<Ban size={13}/>) : (<ShieldCheck size={13}/>)}

      {user.isBlocked
            ? "Blocked"
            : "Active"}
    </span>);
}
