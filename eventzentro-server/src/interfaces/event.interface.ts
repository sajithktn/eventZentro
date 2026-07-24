import { Document, Types } from "mongoose";

export interface IEvent extends Document {
  title: string;
  description: string;
  category: string;
  venue: string;

  eventDate: Date;
  startTime: string;
  endTime: string;

  ticketPrice: number;
  totalTickets: number;
  availableTickets: number;

  bannerImage?: string;

  organizer: Types.ObjectId;

  status: "draft" | "published" | "cancelled";

  isFeatured: boolean;

  createdAt: Date;
  updatedAt: Date;
}