"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { AlertCircle, Building2, CheckCircle2, Globe2, LoaderCircle, Mail, MapPin, Phone, RefreshCw, ShieldAlert, UserCheck, X, XCircle } from "lucide-react";
import { type AdminOrganizerApplication } from "@/services/admin.service";

import { ApplicantAvatar, StatusBadge } from "./ApplicationList";
import { PendingRequestAction } from "./types";
import { formatDateTime, getApplicantEmail, getApplicationUser, getFullName, getOptionalValue, getReviewerName } from "./utils";

export function ApplicationDetailsModal({ application, loading, error, onRetry, onClose, onAction, }: {
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
    return (<ModalShell onClose={onClose}>
      <div className="max-h-[88vh] w-full max-w-5xl overflow-hidden rounded-[24px] bg-white shadow-2xl">
        <ModalHeader title="Organizer Request Details" description="Submitted application and applicant account information" onClose={onClose}/>

        <div className="max-h-[calc(88vh-88px)] overflow-y-auto p-6">
          {loading ? (<div className="flex min-h-80 items-center justify-center">
              <LoaderCircle size={32} className="animate-spin text-orange-500"/>
            </div>) : error ? (<div className="py-16 text-center">
              <AlertCircle size={34} className="mx-auto text-red-500"/>

              <p className="mt-4 font-black text-red-700">
                {error}
              </p>

              <button type="button" onClick={onRetry} className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-black text-white transition hover:bg-red-700">
                <RefreshCw size={17}/>
                Retry
              </button>
            </div>) : application ? (<div>
              <section className="flex flex-col justify-between gap-5 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center">
                <div className="flex min-w-0 items-center gap-4">
                  <ApplicantAvatar user={user}/>

                  <div className="min-w-0">
                    <h3 className="truncate text-xl font-black text-slate-950">
                      {getFullName(user)}
                    </h3>

                    <p className="mt-1 truncate text-sm font-semibold text-slate-500">
                      {getApplicantEmail(application)}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <StatusBadge status={application.status}/>

                      <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black capitalize text-blue-700">
                        {user?.role ||
                "unknown role"}
                      </span>
                    </div>
                  </div>
                </div>

                {application.status ===
                "pending" && (<div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => onAction({
                    type: "approve",
                    application,
                })} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-black text-white transition hover:bg-emerald-700">
                      <CheckCircle2 size={17}/>
                      Approve
                    </button>

                    <button type="button" onClick={() => onAction({
                    type: "reject",
                    application,
                })} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-black text-white transition hover:bg-red-700">
                      <XCircle size={17}/>
                      Reject
                    </button>
                  </div>)}
              </section>

              <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                <section className="rounded-2xl border border-slate-200 p-5">
                  <h3 className="font-black text-slate-950">
                    Submitted Organizer Details
                  </h3>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <DetailItem icon={<Building2 size={17}/>} label="Organization or company" value={application.organizerName}/>

                    <DetailItem icon={<Building2 size={17}/>} label="Organizer category" value={application.category}/>

                    <DetailItem icon={<Phone size={17}/>} label="Phone" value={application.phone}/>

                    <DetailItem icon={<MapPin size={17}/>} label="Location" value={application.location}/>
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
                    <DetailItem icon={<UserCheck size={17}/>} label="User name" value={getFullName(user)}/>

                    <DetailItem icon={<Mail size={17}/>} label="Email" value={getApplicantEmail(application)}/>

                    <DetailItem icon={<ShieldAlert size={17}/>} label="Current role" value={user?.role ||
                "Unknown role"}/>

                    <DetailItem icon={<ShieldAlert size={17}/>} label="Account status" value={user?.isDeleted
                ? "Deleted"
                : user?.isBlocked
                    ? "Blocked"
                    : "Active"}/>
                  </div>
                </section>
              </div>

              <section className="mt-5 rounded-2xl border border-slate-200 p-5">
                <h3 className="font-black text-slate-950">
                  Online Presence and Profile Image
                </h3>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <LinkDetail label="Website" value={application.website}/>

                  <LinkDetail label="Instagram" value={application.instagram}/>

                  <LinkDetail label="LinkedIn" value={application.linkedin}/>

                  <LinkDetail label="Profile image or logo URL" value={application.profileImage}/>
                </div>

                {application.profileImage && (<div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                    <Image src={application.profileImage} alt={`${application.organizerName} profile image`} width={900} height={320} unoptimized className="h-56 w-full object-cover"/>
                  </div>)}
              </section>

              <section className="mt-5 rounded-2xl border border-slate-200 p-5">
                <h3 className="font-black text-slate-950">
                  Review Information
                </h3>

                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <DetailItem icon={<UserCheck size={17}/>} label="Status" value={application.status}/>

                  <DetailItem icon={<RefreshCw size={17}/>} label="Submitted" value={formatDateTime(application.createdAt)}/>

                  <DetailItem icon={<CheckCircle2 size={17}/>} label="Reviewed by" value={getReviewerName(application)}/>

                  <DetailItem icon={<CheckCircle2 size={17}/>} label="Reviewed at" value={formatDateTime(application.reviewedAt)}/>
                </div>

                {application.status ===
                "rejected" && (<div className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-red-500">
                      Rejection reason
                    </p>

                    <p className="mt-2 whitespace-pre-line text-sm font-bold text-red-700">
                      {getOptionalValue(application.rejectionReason)}
                    </p>
                  </div>)}
              </section>
            </div>) : null}
        </div>
      </div>
    </ModalShell>);
}

export function DetailItem({ icon, label, value, }: {
    icon: ReactNode;
    label: string;
    value: string;
}) {
    return (<div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
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
    </div>);
}

export function LinkDetail({ label, value, }: {
    label: string;
    value?: string;
}) {
    const cleanValue = value?.trim();
    return (<div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="flex items-start gap-3">
        <Globe2 size={17} className="mt-0.5 shrink-0 text-orange-500"/>

        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
            {label}
          </p>

          {cleanValue ? (<a href={cleanValue} target="_blank" rel="noreferrer" className="mt-2 block break-all text-sm font-bold text-orange-600 underline underline-offset-4">
              {cleanValue}
            </a>) : (<p className="mt-2 text-sm font-bold text-slate-900">
              Not provided
            </p>)}
        </div>
      </div>
    </div>);
}

export function ModalHeader({ title, description, onClose, }: {
    title: string;
    description: string;
    onClose: () => void;
}) {
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

export function ModalShell({ children, onClose, }: {
    children: ReactNode;
    onClose: () => void;
}) {
    return (<div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <div className="flex w-full justify-center" onMouseDown={(event) => event.stopPropagation()}>
        {children}
      </div>
    </div>);
}
