import {
  NextFunction,
  Request,
  Response,
} from "express";
import multer, {
  FileFilterCallback,
} from "multer";

const storage = multer.memoryStorage();

const imageFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  callback: FileFilterCallback
) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    callback(
      new Error(
        "Only JPG, PNG, and WEBP images are allowed."
      )
    );
    return;
  }

  callback(null, true);
};

const upload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

export const uploadSingleImage =
  upload.single("image");

export const handleSingleImageUpload = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  uploadSingleImage(req, res, (error: unknown) => {
    if (!error) {
      next();
      return;
    }

    if (
      error instanceof multer.MulterError &&
      error.code === "LIMIT_FILE_SIZE"
    ) {
      res.status(400).json({
        success: false,
        message:
          "Image size must be 5 MB or smaller.",
      });
      return;
    }

    res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to process image upload.",
    });
  });
};

export default upload;
