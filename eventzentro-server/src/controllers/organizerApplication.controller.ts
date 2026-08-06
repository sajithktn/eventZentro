import { Request, Response } from "express";

import {
  approveOrganizerApplicationService,
  getAdminOrganizerApplicationByIdService,
  getAdminOrganizerApplicationsService,
  getMyOrganizerApplicationService,
  OrganizerApplicationServiceError,
  rejectOrganizerApplicationService,
  submitOrganizerApplicationService,
} from "../services/organizerApplication.service";
import {
  getAuthenticatedUserId,
  RequestUserError,
} from "../utils/requestUser";
import {
  parsePaginationQuery,
} from "../utils/pagination";

const getSubmitStatusCode = (
  message: string
) => {
  if (
    message ===
    "Only normal users can submit organizer applications."
  ) {
    return 403;
  }

  return 400;
};

const sendOrganizerApplicationError = (
  res: Response,
  error: unknown,
  fallbackMessage: string
) => {
  if (
    error instanceof OrganizerApplicationServiceError
  ) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });

    return;
  }

  if (error instanceof RequestUserError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });

    return;
  }

  console.error(fallbackMessage, error);

  res.status(500).json({
    success: false,
    message: fallbackMessage,
  });
};

const getRouteParam = (
  value: string | string[] | undefined,
  label: string
) => {
  if (!value || Array.isArray(value)) {
    throw new OrganizerApplicationServiceError(
      `Invalid ${label}.`,
      400
    );
  }

  return value;
};

export const createOrganizerApplication =
  async (
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

      const result =
        await submitOrganizerApplicationService(
          req.body,
          req.user
        );

      res.status(201).json({
        success: true,
        message: result.message,
        application: result.application,
      });
    } catch (error) {
      const err = error as Error;

      res
        .status(getSubmitStatusCode(err.message))
        .json({
          success: false,
          message:
            err.message ||
            "Failed to submit organizer application.",
        });
    }
  };

export const getMyOrganizerApplication =
  async (
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

      const application =
        await getMyOrganizerApplicationService(
          getAuthenticatedUserId(req)
        );

      res.status(200).json({
        success: true,
        message:
          "Organizer application fetched successfully.",
        application,
      });
    } catch (error) {
      if (error instanceof RequestUserError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
        return;
      }

      const err = error as Error;

      res.status(500).json({
        success: false,
        message:
          err.message ||
          "Failed to fetch organizer application.",
      });
    }
  };

export const getAdminOrganizerApplications =
  async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const paginationQuery =
        parsePaginationQuery(req.query);

      const status =
        typeof req.query.status === "string"
          ? req.query.status.trim()
          : undefined;

      const result =
        await getAdminOrganizerApplicationsService({
          ...paginationQuery,
          status,
        });

      res.status(200).json(result);
    } catch (error) {
      sendOrganizerApplicationError(
        res,
        error,
        "Failed to fetch organizer applications."
      );
    }
  };

export const getAdminOrganizerApplicationById =
  async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const applicationId = getRouteParam(
        req.params.id,
        "application ID"
      );

      const result =
        await getAdminOrganizerApplicationByIdService(
          applicationId
        );

      res.status(200).json(result);
    } catch (error) {
      sendOrganizerApplicationError(
        res,
        error,
        "Failed to fetch organizer application."
      );
    }
  };

export const approveOrganizerApplication =
  async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const applicationId = getRouteParam(
        req.params.id,
        "application ID"
      );

      const result =
        await approveOrganizerApplicationService(
          applicationId,
          getAuthenticatedUserId(req)
        );

      res.status(200).json(result);
    } catch (error) {
      sendOrganizerApplicationError(
        res,
        error,
        "Failed to approve organizer application."
      );
    }
  };

export const rejectOrganizerApplication =
  async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const applicationId = getRouteParam(
        req.params.id,
        "application ID"
      );

      const result =
        await rejectOrganizerApplicationService(
          applicationId,
          getAuthenticatedUserId(req),
          req.body
        );

      res.status(200).json(result);
    } catch (error) {
      sendOrganizerApplicationError(
        res,
        error,
        "Failed to reject organizer application."
      );
    }
  };
