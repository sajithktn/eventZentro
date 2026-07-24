import { NextFunction, Request, Response } from "express";

import { UserRole } from "../interfaces/user.interface";

export const organizerOnly = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
    return;
  }

  if (
    req.user.role !== UserRole.ORGANIZER &&
    req.user.role !== UserRole.ADMIN
  ) {
    res.status(403).json({
      success: false,
      message: "Organizer access required.",
    });
    return;
  }

  next();
};

export const adminOnly = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
    return;
  }

  if (req.user.role !== UserRole.ADMIN) {
    res.status(403).json({
      success: false,
      message: "Admin access required.",
    });
    return;
  }

  next();
};