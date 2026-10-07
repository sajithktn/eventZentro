import api from "@/lib/axios";
import type {
  BookingResponse,
  BookingsResponse,
} from "@/types/booking";
import type { PaginationQueryParams } from "@/types/pagination";

export type GetBookingsParams = PaginationQueryParams;

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt?: string | null;
  status?: string;
}

export interface CreateRazorpayOrderResponse {
  success: boolean;
  message: string;
  bookingId: string;
  order: RazorpayOrder | null;
  amountToPay: number;
  key: string;
  freeBooking?: boolean;
}

export interface VerifyRazorpayPaymentData {
  bookingId: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface VerifyRazorpayPaymentResponse {
  success: boolean;
  message: string;
  bookingId: string;
}

export const createBooking = async (
  eventId: string,
  quantity: number,
  couponCode?: string
): Promise<BookingResponse> => {
  const response = await api.post("/bookings", {
    eventId,
    quantity,
    ...(couponCode
      ? {
          couponCode: couponCode.trim().toUpperCase(),
        }
      : {}),
  });

  return response.data;
};

export const createRazorpayOrder = async (
  bookingId: string
): Promise<CreateRazorpayOrderResponse> => {
  const response = await api.post(
    "/bookings/payment/create-order",
    {
      bookingId,
    }
  );

  return response.data;
};

export const verifyRazorpayPayment = async (
  data: VerifyRazorpayPaymentData
): Promise<VerifyRazorpayPaymentResponse> => {
  const response = await api.post(
    "/bookings/payment/verify",
    data
  );

  return response.data;
};

export const cancelBooking = async (bookingId: string) => {
  const response = await api.patch(
    `/bookings/${bookingId}/cancel`
  );

  return response.data as {
    success: boolean;
    message: string;
    bookingId: string;
  };
};

export const getMyBookings = async (
  params: GetBookingsParams = {}
): Promise<BookingsResponse> => {
  const response = await api.get("/bookings/my", {
    params,
  });

  return response.data;
};

export const getOrganizerBookings = async (
  params: GetBookingsParams = {}
): Promise<BookingsResponse> => {
  const response = await api.get("/bookings/organizer", {
    params,
  });

  return response.data;
};
