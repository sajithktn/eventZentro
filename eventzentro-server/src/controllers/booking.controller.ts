import { Request, Response } from "express";
import {
  createBookingService,
  getMyBookingsService,
  getOrganizerBookingsService,
} from "../services/booking.service";
import { parsePaginationQuery } from "../utils/pagination";

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

    const { eventId, quantity } = req.body;

    const result = await createBookingService(
      eventId,
      req.user._id.toString(),
      Number(quantity)
    );

    res.status(201).json({
      success: true,
      message: "Ticket booked successfully.",
      booking: result.booking,
      event: result.event,
    });
  } catch (error) {
    const err = error as Error;

    res.status(400).json({
      success: false,
      message: err.message || "Failed to book tickets.",
    });
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
      req.user._id.toString(),
      parsePaginationQuery(req.query)
    );

    res.status(200).json({
      ...result,
      count: result.data.length,
      bookings: result.data,
    });
  } catch (error) {
    const err = error as Error;

    res.status(500).json({
      success: false,
      message: err.message || "Failed to fetch bookings.",
    });
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
      req.user._id.toString(),
      req.user.role === "admin",
      parsePaginationQuery(req.query)
    );

    res.status(200).json({
      ...result,
      count: result.data.length,
      bookings: result.data,
    });
  } catch (error) {
    const err = error as Error;

    res.status(500).json({
      success: false,
      message: err.message || "Failed to fetch organizer bookings.",
    });
  }
};
