import { Document, Types } from "mongoose";
import {
  IPromotionSnapshot,
} from "./coupon.interface";

export interface IBooking extends Document {
  user: Types.ObjectId;
  event: Types.ObjectId;
  quantity: number;
  ticketCount?: number;
  totalAmount: number;
  coupon?: Types.ObjectId;
  couponCode?: string;
  originalAmount?: number;
  subtotalAmount?: number;
  discountAmount?: number;
  finalAmount?: number;
  appliedPromotion?: IPromotionSnapshot;
  promotionReservation?: Types.ObjectId;
  status: "pending" | "confirmed" | "cancelled";
  paymentStatus:
    | "unpaid"
    | "pending"
    | "verifying"
    | "paid"
    | "failed"
    | "refunded";
  amountPaid: number;
  adminCommissionRate: number;
  adminCommissionAmount: number;
  organizerEarnings: number;
  commissionCalculatedAt?: Date;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  paidAt?: Date;
  bookingCode: string;
  createdAt: Date;
  updatedAt: Date;
}