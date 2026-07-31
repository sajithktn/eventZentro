import { Request, Response } from "express";

import {
  createCouponService,
  deleteCouponService,
  getCouponByIdService,
  getOrganizerCouponsService,
  getPromotionQuoteService,
  updateCouponService,
  updateCouponStatusService,
  validateCouponForEvent,
} from "../services/coupon.service";
import { parsePaginationQuery } from "../utils/pagination";
import {
  getAuthenticatedUserId,
  getOptionalAuthenticatedUserId,
  RequestUserError,
} from "../utils/requestUser";

const getAuthenticatedUser = (req: Request) => {
  if (!req.user) {
    throw new Error("Authentication required.");
  }

  return req.user;
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

const getPromotionStatusCode = (message: string) => {
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes("not found")) {
    return 404;
  }

  if (
    normalizedMessage.includes("own") ||
    normalizedMessage.includes("access")
  ) {
    return 403;
  }

  if (normalizedMessage.includes("authentication")) {
    return 401;
  }

  return 400;
};

const sendPromotionError = (
  res: Response,
  error: unknown,
  fallbackMessage: string
) => {
  if (error instanceof RequestUserError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
    return;
  }

  const err = error as Error;
  const message = err.message || fallbackMessage;

  res.status(getPromotionStatusCode(message)).json({
    success: false,
    message,
  });
};

const getQueryString = (value: unknown) =>
  typeof value === "string" && value.trim()
    ? value.trim()
    : undefined;

export const createCoupon = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = getAuthenticatedUser(req);
    const userId = getAuthenticatedUserId(req);

    const promotion = await createCouponService(
      userId,
      user.role,
      req.body
    );

    res.status(201).json({
      success: true,
      message: "Promotion created successfully.",
      promotion,
      coupon: promotion,
    });
  } catch (error) {
    sendPromotionError(
      res,
      error,
      "Failed to create promotion."
    );
  }
};

export const getCoupons = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = getAuthenticatedUser(req);
    const userId = getAuthenticatedUserId(req);
    const query = parsePaginationQuery(req.query);

    const result = await getOrganizerCouponsService({
      organizerId: userId,
      role: user.role,
      query,
      eventId:
        getQueryString(req.query.eventId) ||
        getQueryString(req.query.event),
      status: getQueryString(req.query.status) as
        | "active"
        | "inactive"
        | "expired"
        | "exhausted"
        | undefined,
      promotionMode: getQueryString(req.query.promotionMode) as
        | "coupon"
        | "automatic"
        | undefined,
      visibility: getQueryString(req.query.visibility) as
        | "public"
        | "hidden"
        | undefined,
      organizer: getQueryString(req.query.organizer),
    });

    res.status(200).json({
      ...result,
      count: result.data.length,
      promotions: result.data,
      coupons: result.data,
    });
  } catch (error) {
    sendPromotionError(
      res,
      error,
      "Failed to fetch promotions."
    );
  }
};

export const getCouponById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = getAuthenticatedUser(req);
    const userId = getAuthenticatedUserId(req);
    const promotionId = getRouteParam(
      req.params.id,
      "promotion ID"
    );

    const promotion = await getCouponByIdService(
      promotionId,
      userId,
      user.role
    );

    res.status(200).json({
      success: true,
      promotion,
      coupon: promotion,
    });
  } catch (error) {
    sendPromotionError(
      res,
      error,
      "Failed to fetch promotion."
    );
  }
};

export const updateCoupon = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = getAuthenticatedUser(req);
    const userId = getAuthenticatedUserId(req);
    const promotionId = getRouteParam(
      req.params.id,
      "promotion ID"
    );

    const promotion = await updateCouponService(
      promotionId,
      userId,
      user.role,
      req.body
    );

    res.status(200).json({
      success: true,
      message: "Promotion updated successfully.",
      promotion,
      coupon: promotion,
    });
  } catch (error) {
    sendPromotionError(
      res,
      error,
      "Failed to update promotion."
    );
  }
};

export const updateCouponStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = getAuthenticatedUser(req);
    const userId = getAuthenticatedUserId(req);
    const promotionId = getRouteParam(
      req.params.id,
      "promotion ID"
    );

    const statusOrActive =
      typeof req.body.status === "string"
        ? req.body.status
        : Boolean(req.body.isActive);

    const promotion = await updateCouponStatusService(
      promotionId,
      userId,
      user.role,
      statusOrActive
    );

    res.status(200).json({
      success: true,
      message:
        statusOrActive === "active" || statusOrActive === true
          ? "Promotion activated successfully."
          : "Promotion deactivated successfully.",
      promotion,
      coupon: promotion,
    });
  } catch (error) {
    sendPromotionError(
      res,
      error,
      "Failed to update promotion status."
    );
  }
};

export const deleteCoupon = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = getAuthenticatedUser(req);
    const userId = getAuthenticatedUserId(req);
    const promotionId = getRouteParam(
      req.params.id,
      "promotion ID"
    );

    const result = await deleteCouponService(
      promotionId,
      userId,
      user.role
    );

    res.status(200).json({
      success: true,
      message: result.message,
      promotion: result.coupon,
      coupon: result.coupon,
    });
  } catch (error) {
    sendPromotionError(
      res,
      error,
      "Failed to delete promotion."
    );
  }
};

export const quotePromotion = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = await getPromotionQuoteService({
      eventId: req.body.eventId,
      ticketCount: req.body.ticketCount,
      couponCode:
        typeof req.body.couponCode === "string"
          ? req.body.couponCode
          : undefined,
      userId: getOptionalAuthenticatedUserId(req),
    });

    res.status(200).json(result);
  } catch (error) {
    sendPromotionError(
      res,
      error,
      "Failed to calculate promotion quote."
    );
  }
};

export const validateCoupon = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = await validateCouponForEvent(
      req.body.eventId,
      req.body.code,
      req.body.amount,
      getOptionalAuthenticatedUserId(req)
    );

    res.status(200).json({
      success: result.success,
      message: result.message,
      coupon: result.coupon,
      originalAmount: result.originalAmount,
      discountAmount: result.discountAmount,
      finalAmount: result.finalAmount,
    });
  } catch (error) {
    sendPromotionError(
      res,
      error,
      "Failed to apply coupon."
    );
  }
};
