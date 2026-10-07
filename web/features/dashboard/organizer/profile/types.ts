"use client";

import type { User } from "@/types/auth";

export type OrganizerUser = User & {
    organizerName?: string;
    companyName?: string;
    organizerCategory?: string;
    website?: string;
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    twitter?: string;
    favoriteCategories?: string[];
    socialLinks?: {
        website?: string;
        instagram?: string;
        facebook?: string;
        linkedin?: string;
        twitter?: string;
    };
};

export interface EditProfileForm {
    firstName: string;
    lastName: string;
    organizerName: string;
    companyName: string;
    organizerCategory: string;
    profileImage: string;
    bio: string;
    website: string;
    instagram: string;
    facebook: string;
    linkedin: string;
    twitter: string;
    country: string;
    state: string;
    city: string;
    zipCode: string;
}
