import { Request, Response } from "express";

import {
  getMyOrganizerApplicationService,
  submitOrganizerApplicationService,
} from "../services/organizerApplication.service";
import {
  getAuthenticatedUserId,
  RequestUserError,
} from "../utils/requestUser";

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
