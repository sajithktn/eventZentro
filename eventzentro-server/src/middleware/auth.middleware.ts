import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

import User from "../models/user.models";

interface AuthTokenPayload extends JwtPayload {
  id: string;
}

const verifyToken = (token: string): AuthTokenPayload => {
  const jwtSecret = process.env.JWT_SECRET_KEY;

  if (!jwtSecret) {
    throw new Error("JWT_SECRET_KEY is not configured");
  }

  const decoded = jwt.verify(token, jwtSecret);

  if (
    typeof decoded === "string" ||
    !decoded.id ||
    typeof decoded.id !== "string"
  ) {
    throw new Error("Invalid token payload");
  }

  return decoded as AuthTokenPayload;
};

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. No token provided.",
      });
    }

    const decoded = verifyToken(token);

    const user = await User.findOne({
      _id: decoded.id,
      isDeleted: false,
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account not found.",
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Your account has been blocked.",
      });
    }

    req.user = user;

    return next();
  } catch (error) {
    console.error("Authentication error:", error);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};

export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return next();
    }

    const decoded = verifyToken(token);

    const user = await User.findOne({
      _id: decoded.id,
      isDeleted: false,
      isBlocked: false,
    });

    if (user) {
      req.user = user;
    }

    return next();
  } catch {
    return next();
  }
};