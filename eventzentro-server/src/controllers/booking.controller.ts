import { Request, Response } from "express";
import {
  cancelPendingBookingService,
  createBookingService,
  createPaymentBooking,
  getMyBookingsService,
  getOrganizerBookingsService,
  verifyPaymentRazorpay,
} from "../services/booking.service";
import { parsePaginationQuery } from "../utils/pagination";
import {
  getAuthenticatedUserId,
  RequestUserError,
} from "../utils/requestUser";

const sendBookingError = (
  res: Response,
  error: unknown,
  fallbackMessage: string,
  fallbackStatusCode: number
) => {
  if (error instanceof RequestUserError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
    return;
  }

  const err = error as Error;

  res.status(fallbackStatusCode).json({
    success: false,
    message: err.message || fallbackMessage,
  });
};

const getRouteParam = (
  value: string | string[] | undefined,
  label: string
) => {
  if (!value || Array.isArray(value)) {
    throw new Error(`Invalid ${label}.`);
  }

  return value;
};

export const createBooking = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Please login to book tickets.",
      });
      return;
    }

    const { eventId, quantity, couponCode } = req.body;
    const userId = getAuthenticatedUserId(req);

    const result = await createBookingService(
      eventId,
      userId,
      Number(quantity),
      typeof couponCode === "string" ? couponCode : undefined
    );

    res.status(201).json({
      success: true,
      message: "Booking created successfully.",
      booking: result.booking,
      event: result.event,
    });
  } catch (error) {
    sendBookingError(
      res,
      error,
      "Failed to book tickets.",
      400
    );
  }
};

export const cancelPendingBooking = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Please login to cancel this booking.",
      });
      return;
    }

    const result = await cancelPendingBookingService(
      getRouteParam(req.params.id, "booking ID"),
      getAuthenticatedUserId(req)
    );

    res.status(200).json(result);
  } catch (error) {
    sendBookingError(
      res,
      error,
      "Failed to cancel booking.",
      400
    );
  }
};

export const createRazorpayOrder = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Please login to continue payment.",
      });
      return;
    }

    const { bookingId } = req.body;

    const result = await createPaymentBooking(
      bookingId,
      getAuthenticatedUserId(req)
    );

    res.status(200).json({
      success: true,
      message: "Razorpay order created successfully.",
      ...result,
    });
  } catch (error) {
    sendBookingError(
      res,
      error,
      "Failed to create Razorpay order.",
      400
    );
  }
};

export const verifyRazorpayPayment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Please login to verify payment.",
      });
      return;
    }

    const result = await verifyPaymentRazorpay(
      getAuthenticatedUserId(req),
      req.body
    );

    res.status(200).json(result);
  } catch (error) {
    sendBookingError(
      res,
      error,
      "Payment verification failed.",
      400
    );
  }
};

export const getMyBookings = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Unauthorized user.",
      });
      return;
    }

    const result = await getMyBookingsService(
      getAuthenticatedUserId(req),
      parsePaginationQuery(req.query)
    );

    res.status(200).json({
      ...result,
      count: result.data.length,
      bookings: result.data,
    });
  } catch (error) {
    sendBookingError(
      res,
      error,
      "Failed to fetch bookings.",
      500
    );
  }
};

export const getOrganizerBookings = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Unauthorized user.",
      });
      return;
    }

    const result = await getOrganizerBookingsService(
      getAuthenticatedUserId(req),
      req.user.role === "admin",
      parsePaginationQuery(req.query)
    );

    res.status(200).json({
      ...result,
      count: result.data.length,
      bookings: result.data,
    });
  } catch (error) {
    sendBookingError(
      res,
      error,
      "Failed to fetch organizer bookings.",
      500
    );
  }
};
