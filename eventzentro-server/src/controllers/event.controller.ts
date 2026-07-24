import { Request, Response } from "express";
import {
  createEventService,
  getAllEventsService,
  getEventByIdService,
  updateEventService,
} from "../services/event.service";
import { parsePaginationQuery } from "../utils/pagination";

export const getEventById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id || Array.isArray(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid event ID.",
      });
      return;
    }

    const event = await getEventByIdService(id);

    res.status(200).json({
      success: true,
      event,
    });
  } catch (error) {
    const err = error as Error;

    res.status(404).json({
      success: false,
      message: err.message || "Event not found.",
    });
  }
};

export const createEvent = async (
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

    const result = await createEventService(
      req.body,
      req.user._id.toString()
    );

    res.status(201).json({
      success: true,
      message: result.message,
      event: result.event,
    });
  } catch (error) {
    const err = error as Error;

    res.status(500).json({
      success: false,
      message: err.message || "Failed to create event.",
    });
  }
};

export const getAllEvents = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const query = parsePaginationQuery(req.query);

    if (query.organizer === "me" && !req.user) {
      res.status(401).json({
        success: false,
        message: "Unauthorized user.",
      });
      return;
    }

    const result = await getAllEventsService({
      query,
      organizerId:
        query.organizer === "me" &&
        req.user?.role !== "admin"
          ? req.user?._id.toString()
          : undefined,
      includeAllOrganizers:
        query.organizer === "me" &&
        req.user?.role === "admin",
    });

    res.status(200).json({
      ...result,
      count: result.data.length,
      events: result.data,
    });
  } catch (error) {
    const err = error as Error;

    res.status(500).json({
      success: false,
      message: err.message || "Failed to fetch events.",
    });
  }
};

export const updateEvent = async (
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

    const { id } = req.params;

    if (!id || Array.isArray(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid event ID.",
      });
      return;
    }

    const result = await updateEventService(
      id,
      req.user._id.toString(),
      req.user.role,
      req.body
    );

    res.status(200).json({
      success: true,
      message: result.message,
      event: result.event,
    });
  } catch (error) {
    const err = error as Error;
    const statusCode =
      err.message === "You can only edit your own events." ? 403 : 400;

    res.status(statusCode).json({
      success: false,
      message: err.message || "Failed to update event.",
    });
  }
};
