import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  secure: true,
  // Credentials are read from process.env.CLOUDINARY_URL by default
});

/**
 * Parameters for a single client-side signed upload. The client sends these
 * (plus the file) to Cloudinary; only your server can generate valid signatures.
 */
export interface SignedUploadParams {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
}

/**
 * Generate signed upload parameters for client-side uploads. The client uses
 * these with the file in a POST to Cloudinary; the signature proves the upload
 * was authorized by your server. Safe to call per batch of uploads (same params
 * can be used for multiple files within a short period).
 */
export function getSignedUploadParams(): SignedUploadParams {
  const config = cloudinary.config();
  const cloudName = config?.cloud_name;
  const apiKey = config?.api_key;
  const apiSecret = config?.api_secret;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary is not configured (CLOUDINARY_URL)");
  }
  const folder = "projects";
  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign = { folder, timestamp };
  const signature = (cloudinary.utils as { api_sign_request: (params: Record<string, unknown>, secret: string) => string }).api_sign_request(
    paramsToSign,
    apiSecret,
  );
  return { cloudName, apiKey, timestamp, signature, folder };
}

/**
 * Normalized result of an image upload to Cloudinary.
 */
export interface UploadResult {
  publicId: string;
  secureUrl: string;
  width: number;
  height: number;
  format: string;
}

type UploadOptions = {
  /**
   * Optional Cloudinary transformation options applied during upload.
   */
  transformation?: object;
  /**
   * Optional explicit public ID for the asset; otherwise Cloudinary generates one.
   */
  publicId?: string;
  /**
   * Optional Cloudinary folder name; defaults to `"projects"`.
   */
  folder?: string;
};

/**
 * Upload an image to Cloudinary.
 *
 * Accepts either a base64/data-URI or URL (`string`) or a `Buffer` and returns
 * normalized upload metadata. Throws on upload failure.
 */
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

/**
 * Delete an image from Cloudinary by its public ID.
 *
 * No-op when `publicId` is falsy.
 */
export async function deleteImage(publicId: string): Promise<void> {
  if (!publicId) return;

  await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
  });
}

/**
 * Replace a project's image in Cloudinary.
 *
 * Best-effort deletes the existing image (if any) and uploads a new one, returning
 * the new upload metadata.
 */
export async function replaceProjectImage(
  oldPublicId: string | null | undefined,
  fileBuffer: Buffer,
  options: Omit<UploadOptions, "publicId"> = {},
): Promise<UploadResult> {
  // First upload the new image so we always have a valid asset to point to.
  const uploaded = await uploadImage(fileBuffer, options);

  // Best-effort delete of the old image; failures are logged but do not affect the result.
  if (oldPublicId) {
    try {
      await deleteImage(oldPublicId);
    } catch (error) {
      console.error("Failed to delete old Cloudinary image", error);
    }
  }

  return uploaded;
}

/** Matches `cloudinary://API_KEY:API_SECRET@CLOUD_NAME`. */
const CLOUDINARY_URL_REGEX = /^cloudinary:\/\/[^:]+:[^@]+@[a-zA-Z0-9_-]+$/;

/**
 * Ensure `CLOUDINARY_URL` is set and has a valid format before generating URLs.
 */
function assertCloudinaryUrlConfigured(): void {
  const url = process.env.CLOUDINARY_URL;
  if (!url || url.trim() === "") {
    throw new Error("CLOUDINARY_URL is not set");
  }
  if (!CLOUDINARY_URL_REGEX.test(url.trim())) {
    throw new Error(
      "CLOUDINARY_URL has invalid format; expected cloudinary://API_KEY:API_SECRET@CLOUD_NAME",
    );
  }
}

type OptimizeOptions = {
  /** Optional target width in pixels. */
  width?: number;
  /** Optional target height in pixels. */
  height?: number;
  /** Optional Cloudinary crop mode (e.g. `"fill"`, `"fit"`). */
  crop?: string;
  /** Optional quality setting (e.g. `"auto"` or a numeric value). */
  quality?: string | number;
  /** Optional output format (e.g. `"webp"`, `"jpg"`). */
  format?: string;
};

/**
 * Generate a secure, optimized Cloudinary URL for a given public ID.
 *
 * Applies basic transformation options (width, height, crop, quality, format)
 * and always returns an HTTPS URL.
 */
export function getOptimizedImageUrl(
  publicId: string,
  options: OptimizeOptions = {},
): string {
  assertCloudinaryUrlConfigured();

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

