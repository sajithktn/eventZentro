import mongoose, { Schema } from "mongoose";

import {
  IUser,
  UserRole,
  AuthProvider,
} from "../interfaces/user.interface";

const userSchema = new Schema<IUser>(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      trim: true,
      default: "",
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      minlength: 6,
      select: false,
    },

    profileImage: {
      type: String,
      default: "",
    },

    bio: {
      type: String,
      default: "",
      maxlength: 1000,
    },

    organizerName: {
      type: String,
      trim: true,
      default: "",
      maxlength: 120,
    },

    companyName: {
      type: String,
      trim: true,
      default: "",
      maxlength: 120,
    },

    organizerCategory: {
      type: String,
      trim: true,
      default: "",
      maxlength: 80,
    },

    website: {
      type: String,
      trim: true,
      default: "",
      maxlength: 200,
    },

    instagram: {
      type: String,
      trim: true,
      default: "",
      maxlength: 200,
    },

    facebook: {
      type: String,
      trim: true,
      default: "",
      maxlength: 200,
    },

    linkedin: {
      type: String,
      trim: true,
      default: "",
      maxlength: 200,
    },

    twitter: {
      type: String,
      trim: true,
      default: "",
      maxlength: 200,
    },

    socialLinks: {
      website: {
        type: String,
        trim: true,
        default: "",
        maxlength: 200,
      },

      instagram: {
        type: String,
        trim: true,
        default: "",
        maxlength: 200,
      },

      facebook: {
        type: String,
        trim: true,
        default: "",
        maxlength: 200,
      },

      linkedin: {
        type: String,
        trim: true,
        default: "",
        maxlength: 200,
      },

      twitter: {
        type: String,
        trim: true,
        default: "",
        maxlength: 200,
      },
    },

    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    verificationOTP: {
      type: String,
    },

    verificationOTPExpiry: {
      type: Date,
    },

    passwordResetToken: {
      type: String,
    },

    passwordResetExpires: {
      type: Date,
    },

    refreshToken: {
      type: String,
      select: false,
    },

    passwordChangedAt: {
      type: Date,
    },

    isBlocked: {
      type: Boolean,
      default: false,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    lastLogin: {
      type: Date,
    },

    provider: {
      type: String,
      enum: Object.values(AuthProvider),
      default: AuthProvider.LOCAL,
    },

    googleId: {
      type: String,
    },

    githubId: {
      type: String,
    },

    address: {
      country: {
        type: String,
        trim: true,
      },

      state: {
        type: String,
        trim: true,
      },

      city: {
        type: String,
        trim: true,
      },

      zipCode: {
        type: String,
        trim: true,
      },
    },

    favoriteCategories: [
      {
        type: String,
        trim: true,
      },
    ],

    interestedEvents: [
      {
        type: Schema.Types.ObjectId,
        ref: "Event",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model<IUser>("User", userSchema);

export default User;
