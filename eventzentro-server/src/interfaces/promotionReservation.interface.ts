import { Document, Types } from "mongoose";

export type PromotionReservationStatus =
  | "reserved"
  | "redeemed"
  | "released"
  | "expired";

export interface IPromotionReservation extends Document {
  _id: Types.ObjectId;
  promotion: Types.ObjectId;
  booking: Types.ObjectId;
  user: Types.ObjectId;
  event: Types.ObjectId;
  ticketCount: number;
  discountAmount: number;
  status: PromotionReservationStatus;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
