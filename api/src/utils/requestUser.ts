import { Request } from "express";
import { isValidObjectId, Types } from "mongoose";

export class RequestUserError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 401) {
    super(message);
    this.name = "RequestUserError";
    this.statusCode = statusCode;
  }
}

const getUserIdValue = (req: Request) => {
  return req.user?._id ?? req.user?.id;
};

const stringifyUserId = (value: unknown) => {
  if (typeof value === "string") {
    return value;
  }

  if (value instanceof Types.ObjectId) {
    return value.toString();
  }

  return undefined;
};

const validateUserId = (value: unknown) => {
  const userId = stringifyUserId(value);

  if (!userId) {
    throw new RequestUserError(
      "Unauthorized. User ID is missing."
    );
  }

  if (!isValidObjectId(userId)) {
    throw new RequestUserError(
      "Unauthorized. User ID is invalid."
    );
  }

  return userId;
};

export const getAuthenticatedUserId = (req: Request) => {
  if (!req.user) {
    throw new RequestUserError(
      "Unauthorized. User information is missing."
    );
  }

  return validateUserId(getUserIdValue(req));
};

export const getOptionalAuthenticatedUserId = (
  req: Request
) => {
  if (!req.user) {
    return undefined;
  }

  return validateUserId(getUserIdValue(req));
};
