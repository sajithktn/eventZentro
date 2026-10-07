"use client";

import Image from "next/image";
import { CheckCircle2, ChevronLeft, ChevronRight, Eye, Mail, MapPin, Phone, UserCheck, XCircle } from "lucide-react";
import { type AdminOrganizerApplication, type AdminOrganizerApplicationStatus, type AdminOrganizerApplicationUser, type AdminPagination } from "@/services/admin.service";

import { PendingRequestAction } from "./types";
import { formatDateTime, getApplicantEmail, getApplicationUser, getFullName, getStatusClasses } from "./utils";

export function ApplicationRow({ application, onDetails, onAction, }: {
    application: AdminOrganizerApplication;
    onDetails: (applicationId: string) => void;
    onAction: (action: PendingRequestAction) => void;
}) {
    const user = getApplicationUser(application);
    return (<tr className="align-top transition hover:bg-orange-50/40">
      <td className="px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <ApplicantAvatar user={user}/>

          <div className="min-w-0">
            <p className="truncate font-black text-slate-950">
              {getFullName(user)}
            </p>

            <p className="mt-1 flex items-center gap-1.5 truncate text-xs font-semibold text-slate-500">
              <Mail size={13}/>
              {getApplicantEmail(application)}
            </p>

            <p className="mt-1 flex items-center gap-1.5 truncate text-xs font-semibold text-slate-500">
              <Phone size={13}/>
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
          <MapPin size={15} className="text-orange-500"/>
          {application.location}
        </span>
      </td>

      <td className="px-5 py-4 text-xs font-semibold text-slate-600">
        {formatDateTime(application.createdAt)}
      </td>

      <td className="px-5 py-4">
        <StatusBadge status={application.status}/>
      </td>

      <td className="px-5 py-4">
        <ApplicationActions application={application} onDetails={onDetails} onAction={onAction} align="end"/>
      </td>
    </tr>);
}

export function ApplicationCard({ application, onDetails, onAction, }: {
    application: AdminOrganizerApplication;
    onDetails: (applicationId: string) => void;
    onAction: (action: PendingRequestAction) => void;
}) {
    const user = getApplicationUser(application);
    return (<article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start gap-3">
        <ApplicantAvatar user={user}/>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="truncate text-base font-black text-slate-950">
              {getFullName(user)}
            </h3>

            <StatusBadge status={application.status}/>
          </div>

          <p className="mt-1 truncate text-sm font-medium text-slate-600">
            {getApplicantEmail(application)}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3 text-sm">
        <MobileDetail label="Organization" value={application.organizerName}/>

        <MobileDetail label="Category" value={application.category}/>

        <MobileDetail label="Location" value={application.location}/>

        <MobileDetail label="Submitted" value={formatDateTime(application.createdAt)}/>
      </div>

      <ApplicationActions application={application} onDetails={onDetails} onAction={onAction} align="start"/>
    </article>);
}

export function ApplicantAvatar({ user, }: {
    user?: AdminOrganizerApplicationUser | null;
}) {
    const name = getFullName(user);
    if (user?.profileImage) {
        return (<Image src={user.profileImage} alt={name} width={44} height={44} unoptimized className="h-11 w-11 shrink-0 rounded-full object-cover"/>);
    }
    const initials = name
        .split(" ")
        .filter(Boolean)
        .map((part) => part.charAt(0))
        .join("")
        .slice(0, 2)
        .toUpperCase() || "U";
    return (<span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-black text-white">
      {initials}
    </span>);
}

export function ApplicationActions({ application, onDetails, onAction, align, }: {
    application: AdminOrganizerApplication;
    onDetails: (applicationId: string) => void;
    onAction: (action: PendingRequestAction) => void;
    align: "start" | "end";
}) {
    return (<div className={`mt-4 flex flex-wrap gap-2 lg:mt-0 ${align === "end"
            ? "justify-end"
            : "justify-start"}`}>
      <button type="button" onClick={() => onDetails(application._id)} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 transition hover:border-orange-300 hover:text-orange-600">
        <Eye size={15}/>
        Details
      </button>

      {application.status === "pending" && (<>
          <button type="button" onClick={() => onAction({
                type: "approve",
                application,
            })} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-emerald-50 px-3 text-xs font-black text-emerald-700 transition hover:bg-emerald-100">
            <CheckCircle2 size={15}/>
            Approve
          </button>

          <button type="button" onClick={() => onAction({
                type: "reject",
                application,
            })} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-red-50 px-3 text-xs font-black text-red-600 transition hover:bg-red-100">
            <XCircle size={15}/>
            Reject
          </button>
        </>)}
    </div>);
}

export function StatusBadge({ status, }: {
    status: AdminOrganizerApplicationStatus;
}) {
    return (<span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-black capitalize ${getStatusClasses(status)}`}>
      {status}
    </span>);
}

export function MobileDetail({ label, value, }: {
    label: string;
    value: string;
}) {
    return (<div className="flex items-center justify-between gap-3">
      <span className="font-bold text-slate-500">
        {label}
      </span>
      <span className="text-right font-black text-slate-900">
        {value}
      </span>
    </div>);
}

export function LoadingState() {
    return (<div className="flex min-h-80 items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-orange-100 border-t-orange-500"/>

        <p className="mt-4 text-sm font-semibold text-slate-500">
          Loading organizer requests...
        </p>
      </div>
    </div>);
}

export function EmptyState() {
    return (<div className="px-6 py-20 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
        <UserCheck size={30}/>
      </div>

      <h3 className="mt-5 text-lg font-black text-slate-950">
        No organizer requests found
      </h3>

      <p className="mt-2 text-sm text-slate-500">
        Try changing the search term or selected status.
      </p>
    </div>);
}

export function PaginationControls({ pagination, onPageChange, }: {
    pagination: AdminPagination;
    onPageChange: (updater: (page: number) => number) => void;
}) {
    return (<div className="flex flex-col justify-between gap-4 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center">
      <p className="text-sm font-semibold text-slate-600">
        Page {pagination.currentPage} of{" "}
        {pagination.totalPages}
      </p>

      <div className="flex items-center gap-2">
        <button type="button" disabled={!pagination.hasPreviousPage} onClick={() => onPageChange((current) => Math.max(current - 1, 1))} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-orange-300 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-40">
          <ChevronLeft size={17}/>
          Previous
        </button>

        <button type="button" disabled={!pagination.hasNextPage} onClick={() => onPageChange((current) => current + 1)} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-40">
          Next
          <ChevronRight size={17}/>
        </button>
      </div>
    </div>);
}
