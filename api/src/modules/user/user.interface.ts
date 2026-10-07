import { Document, Types } from "mongoose";

export enum UserRole {
  USER = "user",
  ORGANIZER = "organizer",
  ADMIN = "admin",
}

export enum AuthProvider {
  LOCAL = "local",
  GOOGLE = "google",
  GITHUB = "github",
}

export interface IAddress {
  country?: string;
  state?: string;
  city?: string;
  zipCode?: string;
}

export interface IUserSocialLinks {
  website?: string;
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  twitter?: string;
}

export interface IUser extends Document {
  _id: Types.ObjectId;

  firstName: string;
  lastName?: string;
  email: string;
  password?: string;

  role: UserRole;
  provider: AuthProvider;

  isVerified: boolean;
  isBlocked: boolean;
  isDeleted: boolean;

  profileImage?: string;
  bio?: string;
  address?: IAddress;

  organizerName?: string;
  companyName?: string;
  organizerCategory?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  twitter?: string;
  socialLinks?: IUserSocialLinks;

  verificationOTP?: string;
  verificationOTPExpiry?: Date;

  
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  passwordChangedAt?: Date;

  refreshToken?: string;
  lastLogin?: Date;

  googleId?: string;
  githubId?: string;

  favoriteCategories?: string[];
  interestedEvents?: Types.ObjectId[];

  createdAt: Date;
  updatedAt: Date;
}
