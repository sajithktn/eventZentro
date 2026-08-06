export interface UserAddress {
  country?: string;
  state?: string;
  city?: string;
  zipCode?: string;
}

export interface UserSocialLinks {
  website?: string;
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  twitter?: string;
}

export interface User {
  _id?: string;
  id?: string;

  firstName: string;
  lastName?: string;
  email: string;

  role:
    | "user"
    | "organizer"
    | "admin";

  profileImage?: string;
  bio?: string;
  organizerName?: string;
  companyName?: string;
  organizerCategory?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  twitter?: string;
  socialLinks?: UserSocialLinks;

  provider?:
    | "local"
    | "google"
    | "github";

  isVerified?: boolean;

  address?: UserAddress;

  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: User;
}

export interface UpdateProfileData {
  firstName: string;
  lastName?: string;
  profileImage?: string;
  bio?: string;
  organizerName?: string;
  companyName?: string;
  organizerCategory?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  twitter?: string;
  socialLinks?: UserSocialLinks;
  address?: UserAddress;
}
