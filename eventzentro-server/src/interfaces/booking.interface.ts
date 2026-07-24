import { Document, Types } from "mongoose";

export interface IBooking extends Document {
  user: Types.ObjectId;
  event: Types.ObjectId;
  quantity: number;
  totalAmount: number;
  status: "confirmed" | "cancelled";
  bookingCode: string;
  createdAt: Date;
  updatedAt: Date;
}
