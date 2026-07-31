import { Request, Response } from "express";
import jwt from "jsonwebtoken";

import {
  registerUserService,
  loginUserService,
  verifyEmailService,
  forgotPasswordService,
  resetPasswordService,
  resendOTPService,
} from "../services/auth.service";
import User from "../models/user.models";

const setAuthCookie = (
  res: Response,
  user: {
    _id: unknown;
    role: string;
  }
) => {
  const token = jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET_KEY!,
    {
      expiresIn: "7d",
    }
  );

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return token;
};

const getCleanString = (value: unknown) => {
  return typeof value === "string"
    ? value.trim()
    : "";
};

const getCleanOptionalString = (
  primaryValue: unknown,
  fallbackValue?: unknown
) => {
  const primary = getCleanString(primaryValue);

  return primary || getCleanString(fallbackValue);
};

export const register = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = await registerUserService(
      req.body
    );

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: user,
    });
  } catch (error) {
    const err = error as Error;

    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

export const verifyEmail = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = await verifyEmailService(
      req.body
    );

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    const err = error as Error;

    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

export const login = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { user, token } =
      await loginUserService(req.body);

    res
      .cookie("token", token, {
        httpOnly: true,
        secure:
          process.env.NODE_ENV ===
          "production",
        sameSite: "strict",
        maxAge:
          7 * 24 * 60 * 60 * 1000,
      })
      .status(200)
      .json({
        success: true,
        message: "Login Successful",
        user,
      });
  } catch (error) {
    const err = error as Error;

    res.status(401).json({
      success: false,
      message: err.message,
    });
  }
};

export const googleCallback = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = req.user as {
      _id: unknown;
      role: string;
    };

    setAuthCookie(res, user);

    res.redirect("http://localhost:3000");
  } catch (error) {
    const err = error as Error;

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result =
      await forgotPasswordService(
        req.body
      );

    res.status(200).json(result);
  } catch (error) {
    const err = error as Error;

    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

export const resetPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result =
      await resetPasswordService(req.body);

    res.status(200).json(result);
  } catch (error) {
    const err = error as Error;

    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

export const getCurrentUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    const err = error as Error;

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const resendOTP = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result =
      await resendOTPService(req.body);

    res.status(200).json(result);
  } catch (error) {
    const err = error as Error;

    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

export const logout = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    res.cookie("token", "", {
      httpOnly: true,
      secure:
        process.env.NODE_ENV ===
        "production",
      sameSite: "strict",
      expires: new Date(0),
    });

    res.status(200).json({
      success: true,
      message:
        "Logged out successfully",
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
};

export const updateProfile = async (
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

    const firstName = getCleanString(
      req.body.firstName
    );

    const lastName = getCleanString(
      req.body.lastName
    );

    const profileImage = getCleanString(
      req.body.profileImage
    );

    const bio = getCleanString(
      req.body.bio
    );

    const address =
      typeof req.body.address ===
        "object" &&
      req.body.address !== null
        ? req.body.address
        : {};

    const socialLinks =
      typeof req.body.socialLinks ===
        "object" &&
      req.body.socialLinks !== null
        ? req.body.socialLinks
        : {};

    const organizerName = getCleanString(
      req.body.organizerName
    );

    const companyName = getCleanString(
      req.body.companyName
    );

    const organizerCategory = getCleanString(
      req.body.organizerCategory
    );

    const website = getCleanOptionalString(
      req.body.website,
      socialLinks.website
    );

    const instagram = getCleanOptionalString(
      req.body.instagram,
      socialLinks.instagram
    );

    const facebook = getCleanOptionalString(
      req.body.facebook,
      socialLinks.facebook
    );

    const linkedin = getCleanOptionalString(
      req.body.linkedin,
      socialLinks.linkedin
    );

    const twitter = getCleanOptionalString(
      req.body.twitter,
      socialLinks.twitter
    );

    if (!firstName) {
      res.status(400).json({
        success: false,
        message:
          "First name is required.",
      });

      return;
    }

    if (bio.length > 1000) {
      res.status(400).json({
        success: false,
        message:
          "Bio cannot exceed 1000 characters.",
      });

      return;
    }

    const updatedUser =
      await User.findByIdAndUpdate(
        req.user._id,
        {
          $set: {
            firstName,
            lastName,
            profileImage,
            bio,
            organizerName,
            companyName,
            organizerCategory,
            website,
            instagram,
            facebook,
            linkedin,
            twitter,

            address: {
              country: getCleanString(
                address.country
              ),

              state: getCleanString(
                address.state
              ),

              city: getCleanString(
                address.city
              ),

              zipCode: getCleanString(
                address.zipCode
              ),
            },

            socialLinks: {
              website,
              instagram,
              facebook,
              linkedin,
              twitter,
            },
          },
        },
        {
          new: true,
          runValidators: true,
        }
      ).select(
        "-password -refreshToken"
      );

    if (!updatedUser) {
      res.status(404).json({
        success: false,
        message: "User not found.",
      });

      return;
    }

    res.status(200).json({
      success: true,
      message:
        "Profile updated successfully.",
      user: updatedUser,
    });
  } catch (error) {
    const err = error as Error;

    res.status(500).json({
      success: false,
      message:
        err.message ||
        "Failed to update profile.",
    });
  }
};
