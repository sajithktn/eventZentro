import {
  Request,
  Response,
} from "express";

import {
  AdminServiceError,
  blockAdminUserService,
  changeAdminUserRoleService,
  getAdminDashboardService,
  getAdminOrganizersService,
  getAdminUserDetailsService,
  getAdminUsersService,
  restoreAdminUserService,
  softDeleteAdminUserService,
  unblockAdminUserService,
  verifyAdminUserService,
} from "../services/admin.service";
import {
  parsePaginationQuery,
} from "../utils/pagination";

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

  return req.user._id.toString();
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

export const getAdminUserDetails =
  async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const result =
        await getAdminUserDetailsService(
          req.params.userId
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
        req.params.userId,
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
          req.params.userId,
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
        req.params.userId,
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
          req.params.userId,
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
        req.params.userId,
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
          req.params.userId,
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