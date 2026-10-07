"use client";

import axios from "axios";
import { type AdminUser } from "@/services/admin.service";

import { PendingAction } from "./types";

export const getErrorMessage = (error: unknown, fallback: string) => {
    if (axios.isAxiosError(error)) {
        return (error.response?.data?.message ||
            fallback);
    }
    if (error instanceof Error) {
        return error.message;
    }
    return fallback;
};

export const getFullName = (user: AdminUser) => {
    return ([
        user.firstName,
        user.lastName,
    ]
        .filter(Boolean)
        .join(" ") || "Unnamed user");
};

export const getInitials = (user: AdminUser) => {
    const initials = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`
        .trim()
        .toUpperCase();
    return (initials ||
        user.email?.[0]?.toUpperCase() ||
        "U");
};

export const formatDate = (date?: string) => {
    if (!date) {
        return "Not available";
    }
    return new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

export const formatDateTime = (date?: string) => {
    if (!date) {
        return "Never";
    }
    return new Date(date).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

export const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(amount);
};

export const getRoleStyles = (role: AdminUser["role"]) => {
    if (role === "admin") {
        return "bg-purple-50 text-purple-700";
    }
    if (role === "organizer") {
        return "bg-orange-50 text-orange-700";
    }
    return "bg-blue-50 text-blue-700";
};

export const getProviderStyles = (provider?: AdminUser["provider"]) => {
    if (provider === "google") {
        return "bg-red-50 text-red-600";
    }
    if (provider === "github") {
        return "bg-slate-200 text-slate-700";
    }
    return "bg-emerald-50 text-emerald-700";
};

export const getActionContent = (action: PendingAction) => {
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
