import mongoose, { Schema } from "mongoose";

import { IOrganizerApplication } from "../interfaces/organizerApplication.interface";

const organizerApplicationSchema =
  new Schema<IOrganizerApplication>(
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
      },

      organizerName: {
        type: String,
        required: true,
        trim: true,
      },

      category: {
        type: String,
        required: true,
        trim: true,
      },

      description: {
        type: String,
        required: true,
        trim: true,
      },

      phone: {
        type: String,
        required: true,
        trim: true,
      },

      location: {
        type: String,
        required: true,
        trim: true,
      },

      website: {
        type: String,
        trim: true,
        default: "",
      },

      instagram: {
        type: String,
        trim: true,
        default: "",
      },

      linkedin: {
        type: String,
        trim: true,
        default: "",
      },

      profileImage: {
        type: String,
        trim: true,
        default: "",
      },

      status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
        required: true,
      },

      rejectionReason: {
        type: String,
        trim: true,
        default: "",
      },

      reviewedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },

      reviewedAt: {
        type: Date,
      },
    },
    {
      timestamps: true,
    }
  );

const OrganizerApplication =
  mongoose.model<IOrganizerApplication>(
    "OrganizerApplication",
    organizerApplicationSchema
  );

export default OrganizerApplication;
