import cloudinary from "../config/cloudinary";

export interface CloudinaryImageResult {
  url: string;
  publicId: string;
}

export const uploadImageToCloudinary = (
  fileBuffer: Buffer,
  folder = "eventzentro/events"
): Promise<CloudinaryImageResult> => {
  return new Promise((resolve, reject) => {
    const uploadStream =
      cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "image",
        },
        (error, result) => {
          if (error) {
            reject(error);
            return;
          }

          if (!result) {
            reject(
              new Error(
                "Cloudinary image upload failed."
              )
            );
            return;
          }

          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        }
      );

    uploadStream.end(fileBuffer);
  });
};

export const deleteImageFromCloudinary =
  async (publicId: string): Promise<void> => {
    if (!publicId) {
      return;
    }

    await cloudinary.uploader.destroy(
      publicId,
      {
        resource_type: "image",
        invalidate: true,
      }
    );
  };