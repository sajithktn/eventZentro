"use client";

import type { Event } from "@/types/event";

import { EditProfileForm, OrganizerUser } from "./types";

export const getFullName = (firstName?: string, lastName?: string) => {
    return ([firstName, lastName]
        .filter(Boolean)
        .join(" ") || "Organizer");
};

export const getInitials = (name: string) => {
    return name
        .split(" ")
        .filter(Boolean)
        .map((part) => part.charAt(0))
        .join("")
        .slice(0, 2)
        .toUpperCase();
};

export const getLocation = (user: OrganizerUser) => {
    const location = [
        user.address?.city,
        user.address?.state,
        user.address?.country,
    ]
        .filter(Boolean)
        .join(", ");
    return location || "Location not added";
};

export const getEditFormValues = (user: OrganizerUser): EditProfileForm => {
    return {
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        organizerName: user.organizerName || "",
        companyName: user.companyName || "",
        organizerCategory: user.organizerCategory || "",
        profileImage: user.profileImage || "",
        bio: user.bio || "",
        website: user.website ||
            user.socialLinks?.website ||
            "",
        instagram: user.instagram ||
            user.socialLinks?.instagram ||
            "",
        facebook: user.facebook ||
            user.socialLinks?.facebook ||
            "",
        linkedin: user.linkedin ||
            user.socialLinks?.linkedin ||
            "",
        twitter: user.twitter ||
            user.socialLinks?.twitter ||
            "",
        country: user.address?.country || "",
        state: user.address?.state || "",
        city: user.address?.city || "",
        zipCode: user.address?.zipCode || "",
    };
};

export const normalizeExternalLink = (value: string) => {
    if (value.startsWith("http://") ||
        value.startsWith("https://")) {
        return value;
    }
    return `https://${value}`;
};

export const getEventTimestamp = (event: Event) => {
    const timestamp = new Date(event.eventDate).getTime();
    return Number.isNaN(timestamp)
        ? 0
        : timestamp;
};
