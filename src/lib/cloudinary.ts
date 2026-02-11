import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  secure: true,
  // Credentials are read from process.env.CLOUDINARY_URL by default
});

export interface UploadResult {
  publicId: string;
  secureUrl: string;
  width: number;
  height: number;
  format: string;
}

type UploadOptions = {
  transformation?: object;
  publicId?: string;
  folder?: string;
};

export async function uploadImage(
  file: string | Buffer,
  options: UploadOptions = {},
): Promise<UploadResult> {
  const { transformation, publicId, folder = "projects" } = options;

  if (typeof file === "string") {
    try {
      // Cloudinary supports regular URLs and base64 data URIs as the `file` argument.
      const result = await cloudinary.uploader.upload(file, {
        folder,
        public_id: publicId,
        transformation,
        resource_type: "image",
      });

      return {
        publicId: result.public_id,
        secureUrl: result.secure_url,
        width: result.width ?? 0,
        height: result.height ?? 0,
        format: result.format ?? "",
      };
    } catch (error) {
      console.error("Failed to upload image to Cloudinary (string source)", error);
      throw new Error("Failed to upload image to Cloudinary");
    }
  }

  return new Promise<UploadResult>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        transformation,
        resource_type: "image",
      },
      (error, result) => {
        if (error || !result) {
          console.error(
            "Failed to upload image to Cloudinary (buffer source)",
            error,
          );
          return reject(
            error ?? new Error("Failed to upload image to Cloudinary"),
          );
        }

        resolve({
          publicId: result.public_id,
          secureUrl: result.secure_url,
          width: result.width ?? 0,
          height: result.height ?? 0,
          format: result.format ?? "",
        });
      },
    );

    uploadStream.end(file);
  });
}

export async function deleteImage(publicId: string): Promise<void> {
  if (!publicId) return;

  await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
  });
}

export async function replaceProjectImage(
  oldPublicId: string | null | undefined,
  fileBuffer: Buffer,
  options: Omit<UploadOptions, "publicId"> = {},
): Promise<UploadResult> {
  if (oldPublicId) {
    try {
      await deleteImage(oldPublicId);
    } catch (error) {
      // Log and continue; we still want to upload the new image
      console.error("Failed to delete old Cloudinary image", error);
    }
  }

  return uploadImage(fileBuffer, options);
}

type OptimizeOptions = {
  width?: number;
  height?: number;
  crop?: string;
  quality?: string | number;
  format?: string;
};

export function getOptimizedImageUrl(
  publicId: string,
  options: OptimizeOptions = {},
): string {
  const { width, height, crop, quality, format } = options;

  const transformation: Record<string, unknown> = {};

  if (width !== undefined) transformation.width = width;
  if (height !== undefined) transformation.height = height;
  if (crop !== undefined) transformation.crop = crop;
  if (quality !== undefined) transformation.quality = quality;
  if (format !== undefined) transformation.fetch_format = format;

  const hasTransformation = Object.keys(transformation).length > 0;

  return cloudinary.url(publicId, {
    secure: true,
    transformation: hasTransformation ? [transformation] : undefined,
  });
}

