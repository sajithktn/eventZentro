import { Document } from "mongoose";

export enum UserRole {
    USER = "user",
    ORGANIZER = "organizer",
    ADMIN = "admin",
}

export interface IAddress {
    country?: string;
    state?: string;
    city?: string;
    zipCode?: string;
}

export interface IUser extends Document {
    firstName: string;
    lastName: string;
    userName: string;

    email: string;
    phone: string;
    password: string;

    profileImage?: string;
    bio?: string;

    role: string;

    isVerified: boolean;

    verificationOTP?: string;
    verificationOTPExpiry?: Date;

    refreshToken?: string;

    passwordChangedAt?: Date;

    isBlocked: boolean;
    isDeleted: boolean;

    lastLogin?: Date;

    googleId?: string;
    githubId?: string;

    address?: IAddress;

    favoriteCategories?: string[];
    interestedEvents?: string[];

    createdAt: Date;
    updatedAt: Date;

}