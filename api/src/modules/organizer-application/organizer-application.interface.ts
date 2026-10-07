import { Document, Types } from "mongoose";

export type OrganizerApplicationStatus =
  | "pending"
  | "approved"
  | "rejected";

export interface IOrganizerApplication extends Document {
  user: Types.ObjectId;

  organizerName: string;
  category: string;
  description: string;
  phone: string;
  location: string;

  website?: string;
  instagram?: string;
  linkedin?: string;
  profileImage?: string;

  status: OrganizerApplicationStatus;

  rejectionReason?: string;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}
