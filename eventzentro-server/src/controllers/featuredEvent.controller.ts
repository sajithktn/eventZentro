import { Request, Response } from "express";

import {
  approveFeaturedEventRequestService,
  cancelOrganizerFeaturedRequestService,
  createFeaturedEventPaymentOrderService,
  createFeaturedEventRequestService,
  FeaturedEventServiceError,
  getAdminFeaturedRequestsService,
  getEligibleFeaturedEventsForOrganizerService,
  getFeaturedEventSettingsService,
  getOrganizerFeaturedRequestsService,
  getPublicFeaturedEventsService,
  rejectFeaturedEventRequestService,
  updateAdminFeaturedRequestService,
  updateFeaturedEventSettingsService,
  verifyFeaturedEventPaymentService,
} from "../services/featuredEvent.service";
import {
  parsePaginationQuery,
} from "../utils/pagination";
import {
  getAuthenticatedUserId,
  RequestUserError,
} from "../utils/requestUser";

const sendFeaturedEventError = (
  res: Response,
  error: unknown,
  fallbackMessage: string,
  fallbackStatusCode = 500
) => {
  if (error instanceof RequestUserError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
    return;
  }

  if (error instanceof FeaturedEventServiceError) {
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
    throw new FeaturedEventServiceError(
      `Invalid ${label}.`,
      400
    );
  }

  return value;
};

const getQueryString = (value: unknown) => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmedValue = value.trim();

  return trimmedValue || undefined;
};

export const getPublicFeaturedEvents = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const result =
      await getPublicFeaturedEventsService();

    res.status(200).json(result);
  } catch (error) {
    sendFeaturedEventError(
      res,
      error,
      "Failed to fetch featured events."
    );
  }
};

export const getFeaturedEventSettings = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const settings =
      await getFeaturedEventSettingsService();

    res.status(200).json({
      success: true,
      message:
        "Featured event settings fetched successfully.",
      settings,
    });
  } catch (error) {
    sendFeaturedEventError(
      res,
      error,
      "Failed to fetch featured event settings."
    );
  }
};

export const updateFeaturedEventSettings = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const settings =
      await updateFeaturedEventSettingsService(req.body);

    res.status(200).json({
      success: true,
      message:
        "Featured event settings updated successfully.",
      settings,
    });
  } catch (error) {
    sendFeaturedEventError(
      res,
      error,
      "Failed to update featured event settings."
    );
  }
};

export const getEligibleFeaturedEventsForOrganizer =
  async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const events =
        await getEligibleFeaturedEventsForOrganizerService(
          getAuthenticatedUserId(req)
        );

      res.status(200).json({
        success: true,
        message:
          "Eligible featured events fetched successfully.",
        count: events.length,
        data: events,
        events,
      });
    } catch (error) {
      sendFeaturedEventError(
        res,
        error,
        "Failed to fetch eligible events."
      );
    }
  };

export const createFeaturedEventRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result =
      await createFeaturedEventRequestService(
        getAuthenticatedUserId(req),
        req.body
      );

    res.status(201).json({
      success: true,
      message:
        result.paymentRequired
          ? "Featured event request created. Complete payment to continue."
          : "Featured event request submitted for admin review.",
      ...result,
    });
  } catch (error) {
    sendFeaturedEventError(
      res,
      error,
      "Failed to create featured event request.",
      400
    );
  }
};

export const getOrganizerFeaturedRequests = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result =
      await getOrganizerFeaturedRequestsService(
        getAuthenticatedUserId(req),
        parsePaginationQuery(req.query)
      );

    res.status(200).json(result);
  } catch (error) {
    sendFeaturedEventError(
      res,
      error,
      "Failed to fetch featured event requests."
    );
  }
};

export const createFeaturedEventPaymentOrder = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result =
      await createFeaturedEventPaymentOrderService(
        getAuthenticatedUserId(req),
        getRouteParam(
          req.params.requestId,
          "featured request ID"
        )
      );

    res.status(200).json({
      success: true,
      message:
        !result.order
          ? "No payment is required for this featured promotion."
          : "Featured promotion payment order created successfully.",
      ...result,
    });
  } catch (error) {
    sendFeaturedEventError(
      res,
      error,
      "Failed to create featured promotion payment order.",
      400
    );
  }
};

export const verifyFeaturedEventPayment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result =
      await verifyFeaturedEventPaymentService(
        getAuthenticatedUserId(req),
        req.body
      );

    res.status(200).json(result);
  } catch (error) {
    sendFeaturedEventError(
      res,
      error,
      "Featured promotion payment verification failed.",
      400
    );
  }
};

export const cancelOrganizerFeaturedRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result =
      await cancelOrganizerFeaturedRequestService(
        getAuthenticatedUserId(req),
        getRouteParam(
          req.params.requestId,
          "featured request ID"
        )
      );

    res.status(200).json(result);
  } catch (error) {
    sendFeaturedEventError(
      res,
      error,
      "Failed to cancel featured event request.",
      400
    );
  }
};

export const getAdminFeaturedRequests = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const parsedQuery =
      parsePaginationQuery(req.query);

    const result =
      await getAdminFeaturedRequestsService({
        ...parsedQuery,
        paymentStatus: getQueryString(
          req.query.paymentStatus
        ),
        activeState: getQueryString(
          req.query.activeState
        ),
      });

    res.status(200).json(result);
  } catch (error) {
    sendFeaturedEventError(
      res,
      error,
      "Failed to fetch admin featured event requests."
    );
  }
};

export const approveFeaturedEventRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const request =
      await approveFeaturedEventRequestService(
        getAuthenticatedUserId(req),
        getRouteParam(
          req.params.requestId,
          "featured request ID"
        ),
        req.body
      );

    res.status(200).json({
      success: true,
      message:
        request.status === "payment_pending"
          ? "Featured event request approved and slot reserved for payment."
          : "Featured event request approved successfully.",
      request,
    });
  } catch (error) {
    sendFeaturedEventError(
      res,
      error,
      "Failed to approve featured event request.",
      400
    );
  }
};

export const rejectFeaturedEventRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const request =
      await rejectFeaturedEventRequestService(
        getAuthenticatedUserId(req),
        getRouteParam(
          req.params.requestId,
          "featured request ID"
        ),
        req.body
      );

    res.status(200).json({
      success: true,
      message:
        "Featured event request rejected successfully.",
      request,
    });
  } catch (error) {
    sendFeaturedEventError(
      res,
      error,
      "Failed to reject featured event request.",
      400
    );
  }
};

export const updateAdminFeaturedRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const request =
      await updateAdminFeaturedRequestService(
        getRouteParam(
          req.params.requestId,
          "featured request ID"
        ),
        req.body
      );

    res.status(200).json({
      success: true,
      message:
        "Featured event request updated successfully.",
      request,
    });
  } catch (error) {
    sendFeaturedEventError(
      res,
      error,
      "Failed to update featured event request.",
      400
    );
  }
};
