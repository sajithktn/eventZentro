"use client";

import axios from "axios";
import { type AdminOrganizerApplication, type AdminOrganizerApplicationStatus, type AdminOrganizerApplicationUser } from "@/services/admin.service";

export const getErrorMessage = (error: unknown, fallback: string) => {
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

export const getApplicationUser = (application: AdminOrganizerApplication) => {
    if (!application.user ||
        typeof application.user === "string") {
        return null;
    }
    return application.user;
};

export const getFullName = (user?: AdminOrganizerApplicationUser | null) => {
    if (!user) {
        return "Unknown applicant";
    }
    return ([
        user.firstName,
        user.lastName,
    ]
        .filter(Boolean)
        .join(" ") ||
        user.email ||
        "Unknown applicant");
};

export const getApplicantEmail = (application: AdminOrganizerApplication) => {
    const user = getApplicationUser(application);
    return user?.email || "Email unavailable";
};

export const getReviewerName = (application: AdminOrganizerApplication) => {
    if (!application.reviewedBy ||
        typeof application.reviewedBy === "string") {
        return "Not reviewed";
    }
    return getFullName(application.reviewedBy);
};

export const formatDateTime = (value?: string) => {
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

export const getOptionalValue = (value?: string) => {
    return value?.trim() || "Not provided";
};

export const getStatusClasses = (status: AdminOrganizerApplicationStatus) => {
    if (status === "approved") {
        return "bg-emerald-50 text-emerald-700";
    }
    if (status === "rejected") {
        return "bg-red-50 text-red-700";
    }
    return "bg-amber-50 text-amber-700";
};
