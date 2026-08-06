import { Request, Response } from "express";

import {
  uploadImageToCloudinary,
} from "../services/cloudinary.service";

export const uploadEventImage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: "Please select an image to upload.",
      });
      return;
    }

    const uploadedImage =
      await uploadImageToCloudinary(
        req.file.buffer,
        "eventzentro/events"
      );

    res.status(201).json({
      success: true,
      message: "Image uploaded successfully.",
      image: {
        url: uploadedImage.url,
        publicId: uploadedImage.publicId,
      },
    });
  } catch (error) {
    console.error(
      "Cloudinary image upload error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to upload image.",
    });
  }
};