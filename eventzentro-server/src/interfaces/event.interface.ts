import { Document, Types } from "mongoose";
import {
  PromotionDiscountType,
  PromotionMode,
} from "./coupon.interface";

export interface EventBestPromotion {
  id: string;
  name: string;
  code?: string;
  promotionMode: PromotionMode;
  discountType: PromotionDiscountType;
  discountValue: number;
  displayText: string;
  remainingOfferTickets?: number;
}

export interface IEvent extends Document {
  title: string;
  description: string;
  category: string;

  city: string;
  venue: string;

  eventDate: Date;
  startTime: string;
  endTime: string;

  ticketPrice: number;
  totalTickets: number;
  availableTickets: number;

  bannerImage?: string;
  bannerImagePublicId?: string;

  organizer: Types.ObjectId;

  status:
    | "draft"
    | "published"
    | "cancelled"
    | "completed";

  isFeatured: boolean;
  bestPromotion?: EventBestPromotion | null;

  createdAt: Date;
  updatedAt: Date;
}
