import {
  Request,
  Response,
} from "express";

import {
  AdminServiceError,
  blockAdminUserService,
  changeAdminUserRoleService,
  deleteAdminEventService,
  deleteAdminPromotionService,
  getAdminBookingByIdService,
  getAdminBookingsService,
  getAdminDashboardService,
  getAdminEventByIdService,
  getAdminEventsService,
  getAdminOrganizersService,
  getAdminPromotionsService,
  getAdminUserDetailsService,
  getAdminUsersService,
  restoreAdminUserService,
  softDeleteAdminUserService,
  updateAdminBookingStatusService,
  updateAdminEventStatusService,
  updateAdminPromotionStatusService,
  unblockAdminUserService,
  verifyAdminUserService,
  createAdminCategoryService,
  deleteAdminCategoryService,
  getAdminCategoriesService,
  updateAdminCategoryService,
  updateAdminCategoryStatusService,
} from "../services/admin.service";
import {
  getAdminCommissionSettingService,
  updateAdminCommissionSettingService,
} from "../services/commission.service";
import {
  parsePaginationQuery,
} from "../utils/pagination";
import {
  getAuthenticatedUserId,
  RequestUserError,
} from "../utils/requestUser";

const sendAdminError = (
  res: Response,
  error: unknown,
  fallbackMessage: string
) => {
  if (error instanceof AdminServiceError) {
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

const getAuthenticatedAdminId = (
  req: Request
) => {
  if (!req.user) {
    throw new AdminServiceError(
      "Admin authentication is required.",
      401
    );
  }

  return getAuthenticatedUserId(req);
};

const getRouteParam = (
  value: string | string[] | undefined,
  label: string
) => {
  if (!value || Array.isArray(value)) {
    throw new AdminServiceError(`Invalid ${label}.`, 400);
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

export const getAdminDashboard = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const statistics =
      await getAdminDashboardService();

    res.status(200).json({
      success: true,
      message:
        "Admin dashboard loaded successfully.",

      admin: {
        id: req.user?._id,
        firstName:
          req.user?.firstName,
        lastName:
          req.user?.lastName,
        email: req.user?.email,
        role: req.user?.role,
      },

      statistics,
    });
  } catch (error) {
    sendAdminError(
      res,
      error,
      "Unable to load the admin dashboard."
    );
  }
};

export const getAdminCommission = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const commission =
      await getAdminCommissionSettingService();

    res.status(200).json({
      success: true,
      message:
        "Commission settings fetched successfully.",
      commission,
    });
  } catch (error) {
    sendAdminError(
      res,
      error,
      "Unable to load commission settings."
    );
  }
};

export const updateAdminCommission = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const commission =
      await updateAdminCommissionSettingService({
        commissionPercentage:
          req.body.commissionPercentage,
        isActive: req.body.isActive,
      });

    res.status(200).json({
      success: true,
      message:
        "Commission settings updated successfully.",
      commission,
    });
  } catch (error) {
    sendAdminError(
      res,
      error,
      "Unable to update commission settings."
    );
  }
};

export const getAdminUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const paginationQuery =
      parsePaginationQuery(req.query);

    const role =
      typeof req.query.role === "string"
        ? req.query.role
        : undefined;

    const result =
      await getAdminUsersService({
        ...paginationQuery,
        role,
      });

    res.status(200).json(result);
  } catch (error) {
    sendAdminError(
      res,
      error,
      "Unable to load users."
    );
  }
};

export const getAdminOrganizers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const paginationQuery =
      parsePaginationQuery(req.query);

    const result =
      await getAdminOrganizersService(
        paginationQuery
      );

    res.status(200).json(result);
  } catch (error) {
    sendAdminError(
      res,
      error,
      "Unable to load organizers."
    );
  }
};

export const getAdminEvents = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const paginationQuery =
      parsePaginationQuery(req.query);

    const result =
      await getAdminEventsService({
        ...paginationQuery,
        organizer: getQueryString(req.query.organizer),
      });

    res.status(200).json(result);
  } catch (error) {
    sendAdminError(
      res,
      error,
      "Unable to load admin events."
    );
  }
};

export const getAdminEventById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const event =
      await getAdminEventByIdService(
        getRouteParam(req.params.eventId, "event ID")
      );

    res.status(200).json({
      success: true,
      message: "Admin event fetched successfully.",
      event,
    });
  } catch (error) {
    sendAdminError(
      res,
      error,
      "Unable to load admin event."
    );
  }
};

export const updateAdminEventStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const status =
      typeof req.body.status === "string"
        ? req.body.status
        : "";

    const event =
      await updateAdminEventStatusService(
        getRouteParam(req.params.eventId, "event ID"),
        status
      );

    res.status(200).json({
      success: true,
      message: "Event status updated successfully.",
      event,
    });
  } catch (error) {
    sendAdminError(
      res,
      error,
      "Unable to update event status."
    );
  }
};

export const deleteAdminEvent = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result =
      await deleteAdminEventService(
        getRouteParam(req.params.eventId, "event ID")
      );

    res.status(200).json(result);
  } catch (error) {
    sendAdminError(
      res,
      error,
      "Unable to delete event."
    );
  }
};

export const getAdminBookings = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const paginationQuery =
      parsePaginationQuery(req.query);

    const result =
      await getAdminBookingsService({
        ...paginationQuery,
        eventId: getQueryString(req.query.eventId),
        userId: getQueryString(req.query.userId),
        paymentStatus: getQueryString(
          req.query.paymentStatus
        ),
      });

    res.status(200).json(result);
  } catch (error) {
    sendAdminError(
      res,
      error,
      "Unable to load admin bookings."
    );
  }
};

export const getAdminBookingById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const booking =
      await getAdminBookingByIdService(
        getRouteParam(
          req.params.bookingId,
          "booking ID"
        )
      );

    res.status(200).json({
      success: true,
      message: "Admin booking fetched successfully.",
      booking,
    });
  } catch (error) {
    sendAdminError(
      res,
      error,
      "Unable to load admin booking."
    );
  }
};

export const updateAdminBookingStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const status =
      typeof req.body.status === "string"
        ? req.body.status
        : "";

    const result =
      await updateAdminBookingStatusService(
        getRouteParam(
          req.params.bookingId,
          "booking ID"
        ),
        status
      );

    res.status(200).json({
      success: true,
      message: result.message,
      booking: result.booking,
    });
  } catch (error) {
    sendAdminError(
      res,
      error,
      "Unable to update booking status."
    );
  }
};

export const getAdminPromotions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const paginationQuery =
      parsePaginationQuery(req.query);

    const result =
      await getAdminPromotionsService({
        ...paginationQuery,
        eventId: getQueryString(req.query.eventId),
        organizer: getQueryString(req.query.organizer),
        promotionMode: getQueryString(
          req.query.promotionMode
        ),
      });

    res.status(200).json(result);
  } catch (error) {
    sendAdminError(
      res,
      error,
      "Unable to load admin promotions."
    );
  }
};

export const updateAdminPromotionStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const status =
      typeof req.body.status === "string"
        ? req.body.status
        : "";

    const promotion =
      await updateAdminPromotionStatusService(
        getRouteParam(
          req.params.promotionId,
          "promotion ID"
        ),
        status
      );

    res.status(200).json({
      success: true,
      message:
        status.toLowerCase() === "active"
          ? "Promotion activated successfully."
          : "Promotion deactivated successfully.",
      promotion,
      coupon: promotion,
    });
  } catch (error) {
    sendAdminError(
      res,
      error,
      "Unable to update promotion status."
    );
  }
};

export const deleteAdminPromotion = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result =
      await deleteAdminPromotionService(
        getRouteParam(
          req.params.promotionId,
          "promotion ID"
        )
      );

    res.status(200).json(result);
  } catch (error) {
    sendAdminError(
      res,
      error,
      "Unable to delete promotion."
    );
  }
};

export const getAdminUserDetails =
  async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const result =
        await getAdminUserDetailsService(
          getRouteParam(req.params.userId, "user ID")
        );

      res.status(200).json({
        success: true,
        message:
          "User details fetched successfully.",
        ...result,
      });
    } catch (error) {
      sendAdminError(
        res,
        error,
        "Unable to load user details."
      );
    }
  };

export const blockAdminUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const adminId =
      getAuthenticatedAdminId(req);

    const user =
      await blockAdminUserService(
        getRouteParam(req.params.userId, "user ID"),
        adminId
      );

    res.status(200).json({
      success: true,
      message:
        "User blocked successfully.",
      user,
    });
  } catch (error) {
    sendAdminError(
      res,
      error,
      "Unable to block user."
    );
  }
};

export const unblockAdminUser =
  async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const adminId =
        getAuthenticatedAdminId(req);

      const user =
        await unblockAdminUserService(
          getRouteParam(req.params.userId, "user ID"),
          adminId
        );

      res.status(200).json({
        success: true,
        message:
          "User unblocked successfully.",
        user,
      });
    } catch (error) {
      sendAdminError(
        res,
        error,
        "Unable to unblock user."
      );
    }
  };

export const verifyAdminUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const adminId =
      getAuthenticatedAdminId(req);

    const user =
      await verifyAdminUserService(
        getRouteParam(req.params.userId, "user ID"),
        adminId
      );

    res.status(200).json({
      success: true,
      message:
        "User email verified successfully.",
      user,
    });
  } catch (error) {
    sendAdminError(
      res,
      error,
      "Unable to verify user."
    );
  }
};

export const changeAdminUserRole =
  async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const adminId =
        getAuthenticatedAdminId(req);

      const role =
        typeof req.body.role === "string"
          ? req.body.role
          : "";

      const user =
        await changeAdminUserRoleService(
          getRouteParam(req.params.userId, "user ID"),
          role,
          adminId
        );

      res.status(200).json({
        success: true,
        message:
          "User role updated successfully.",
        user,
      });
    } catch (error) {
      sendAdminError(
        res,
        error,
        "Unable to update user role."
      );
    }
  };

export const deleteAdminUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const adminId =
      getAuthenticatedAdminId(req);

    const user =
      await softDeleteAdminUserService(
        getRouteParam(req.params.userId, "user ID"),
        adminId
      );

    res.status(200).json({
      success: true,
      message:
        "User deleted successfully.",
      user,
    });
  } catch (error) {
    sendAdminError(
      res,
      error,
      "Unable to delete user."
    );
  }
};

export const restoreAdminUser =
  async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const adminId =
        getAuthenticatedAdminId(req);

      const user =
        await restoreAdminUserService(
          getRouteParam(req.params.userId, "user ID"),
          adminId
        );

      res.status(200).json({
        success: true,
        message:
          "User restored successfully.",
        user,
      });
    } catch (error) {
      sendAdminError(
        res,
        error,
        "Unable to restore user."
      );
    }
  };

  export const getAdminCategories = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const result =
      await getAdminCategoriesService();

    res.status(200).json(result);
  } catch (error) {
    sendAdminError(
      res,
      error,
      "Unable to load categories."
    );
  }
};

export const createAdminCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const category =
      await createAdminCategoryService(
        req.body.name
      );

    res.status(201).json({
      success: true,
      message:
        "Category created successfully.",
      category,
    });
  } catch (error) {
    sendAdminError(
      res,
      error,
      "Unable to create category."
    );
  }
};

export const updateAdminCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const category =
      await updateAdminCategoryService(
        getRouteParam(
          req.params.categoryId,
          "category ID"
        ),
        req.body.name
      );

    res.status(200).json({
      success: true,
      message:
        "Category updated successfully.",
      category,
    });
  } catch (error) {
    sendAdminError(
      res,
      error,
      "Unable to update category."
    );
  }
};

export const updateAdminCategoryStatus =
  async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const category =
        await updateAdminCategoryStatusService(
          getRouteParam(
            req.params.categoryId,
            "category ID"
          ),
          req.body.isActive
        );

      res.status(200).json({
        success: true,
        message: req.body.isActive
          ? "Category activated successfully."
          : "Category deactivated successfully.",
        category,
      });
    } catch (error) {
      sendAdminError(
        res,
        error,
        "Unable to update category status."
      );
    }
  };

export const deleteAdminCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result =
      await deleteAdminCategoryService(
        getRouteParam(
          req.params.categoryId,
          "category ID"
        )
      );

    res.status(200).json(result);
  } catch (error) {
    sendAdminError(
      res,
      error,
      "Unable to delete category."
    );
  }
};