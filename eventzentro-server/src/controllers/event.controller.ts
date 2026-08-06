import { Request, Response } from "express";
import {
  createEventService,
  deleteEventService,
  EventServiceError,
  getAllEventsService,
  getEventByIdService,
  getEventLocationsService,
  getOrganizerDashboardService,
  getOrganizerEventByIdService,
  updateEventService,
} from "../services/event.service";
import {
  getPublicPromotionsForEventService,
} from "../services/coupon.service";
import { parsePaginationQuery } from "../utils/pagination";
import {
  getAuthenticatedUserId,
  RequestUserError,
} from "../utils/requestUser";

const sendEventError = (
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

  const statusCode =
    error instanceof EventServiceError
      ? error.statusCode
      : fallbackStatusCode;

  res.status(statusCode).json({
    success: false,
    message: err.message || fallbackMessage,
  });
};

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
    sendEventError(
      res,
      error,
      "Event not found.",
      404
    );
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
      getAuthenticatedUserId(req)
    );

    res.status(201).json({
      success: true,
      message: result.message,
      event: result.event,
    });
  } catch (error) {
    sendEventError(
      res,
      error,
      "Failed to create event.",
      500
    );
  }
};

export const getAllEvents = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const parsedQuery = parsePaginationQuery(req.query);

    const query = {
      ...parsedQuery,
      status: "published",
    };

    const result = await getAllEventsService({
      query,
      onlyUpcoming: true,
    });

    res.status(200).json({
      ...result,
      count: result.data.length,
      events: result.data,
    });
  } catch (error) {
    sendEventError(
      res,
      error,
      "Failed to fetch events.",
      500
    );
  }
};

export const getOrganizerEvents = async (
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

    const result = await getAllEventsService({
      query: parsePaginationQuery(req.query),
      organizerId: getAuthenticatedUserId(req),
    });

    res.status(200).json({
      ...result,
      count: result.data.length,
      events: result.data,
    });
  } catch (error) {
    sendEventError(
      res,
      error,
      "Failed to fetch organizer events.",
      500
    );
  }
};

export const getOrganizerDashboard = async (
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

    const result = await getOrganizerDashboardService(
      getAuthenticatedUserId(req)
    );

    res.status(200).json(result);
  } catch (error) {
    sendEventError(
      res,
      error,
      "Failed to fetch organizer dashboard.",
      500
    );
  }
};

export const getOrganizerEventById = async (
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

    const event =
      await getOrganizerEventByIdService(
        id,
        getAuthenticatedUserId(req),
        req.user.role
      );

    res.status(200).json({
      success: true,
      event,
    });
  } catch (error) {
    sendEventError(
      res,
      error,
      "Failed to fetch event.",
      500
    );
  }
};

export const getEventLocations = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const locations =
      await getEventLocationsService();

    res.status(200).json({
      success: true,
      message:
        "Event locations fetched successfully.",
      count: locations.length,
      locations,
    });
  } catch (error) {
    const err = error as Error;

    res.status(500).json({
      success: false,
      message:
        err.message ||
        "Failed to fetch event locations.",
    });
  }
};

export const getEventPromotions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { eventId } = req.params;

    if (!eventId || Array.isArray(eventId)) {
      res.status(400).json({
        success: false,
        message: "Invalid event ID.",
      });
      return;
    }

    const promotions =
      await getPublicPromotionsForEventService(eventId);

    res.status(200).json({
      success: true,
      message: "Event promotions fetched successfully.",
      count: promotions.length,
      promotions,
    });
  } catch (error) {
    const err = error as Error;

    res.status(400).json({
      success: false,
      message:
        err.message ||
        "Failed to fetch event promotions.",
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
      getAuthenticatedUserId(req),
      req.user.role,
      req.body
    );

    res.status(200).json({
      success: true,
      message: result.message,
      event: result.event,
    });
  } catch (error) {
    sendEventError(
      res,
      error,
      "Failed to update event.",
      400
    );
  }
};

export const deleteEvent = async (
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

    const result = await deleteEventService(
      id,
      getAuthenticatedUserId(req),
      req.user.role
    );

    res.status(200).json(result);
  } catch (error) {
    sendEventError(
      res,
      error,
      "Failed to delete event.",
      400
    );
  }
};
