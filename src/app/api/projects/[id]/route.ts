import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdmin } from "@/lib/auth-guards";
import { deleteImage, uploadImage } from "@/lib/cloudinary";

export const runtime = "nodejs";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/projects/[id]
 *
 * Public endpoint that returns a single project by id, or 404 if it does not exist.
 */
export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const project = await prisma.project.findUnique({
      where: { id },
      include: { images: { orderBy: { sortOrder: "asc" } } },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(project);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/projects/[id]
 *
 * Admin-only endpoint that updates an existing project using multipart/form-data.
 * Supports optional `title`, `description`, `category`, `featured`, `image` (replace),
 * and `removeImage` (delete existing image without replacement), and returns the updated project.
 */
export async function PATCH(req: Request, { params }: RouteParams) {
  const { id } = await params;
  const adminResult = await verifyAdmin();
  if (!adminResult.ok) {
    return adminResult.response;
  }

  const newUploadedPublicIds: string[] = [];

  try {
    const existing = await prisma.project.findUnique({
      where: { id },
      include: { images: { orderBy: { sortOrder: "asc" } } },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 },
      );
    }

    const formData = await req.formData();
    const title = formData.get("title");
    const description = formData.get("description");
    const category = formData.get("category");
    const featured = formData.get("featured");
    const imageEntries = formData.getAll("image");
    const removeImage = formData.get("removeImage");
    const thumbnailIndexRaw = formData.get("thumbnailIndex");

    if (!title || typeof title !== "string") {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 },
      );
    }
    const titleTrimmed = title.trim();
    if (!titleTrimmed) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 },
      );
    }

    const imageFiles = imageEntries.filter(
      (entry): entry is File => entry instanceof File && entry.size > 0,
    );

    const imageUrl: string | null = existing.imageUrl;
    const imagePublicId: string | null = existing.imagePublicId;

    if (removeImage === "true") {
      // Remove all images, then optionally add new ones - must have new images
      if (imageFiles.length === 0) {
        return NextResponse.json(
          { error: "At least one image is required. Add new images before removing all." },
          { status: 400 },
        );
      }
      const publicIdsToDelete = new Set(existing.images.map((i) => i.imagePublicId));
      if (existing.imagePublicId) publicIdsToDelete.add(existing.imagePublicId);
      for (const publicId of publicIdsToDelete) {
        try {
          await deleteImage(publicId);
        } catch {
          return NextResponse.json(
            { error: "Failed to delete existing image" },
            { status: 500 },
          );
        }
      }
      await prisma.projectImage.deleteMany({ where: { projectId: id } });

      if (imageFiles.length > 0) {
        const uploadedImages: { secureUrl: string; publicId: string }[] = [];
        for (const image of imageFiles) {
          if (!ALLOWED_IMAGE_TYPES.has(image.type)) {
            return NextResponse.json(
              {
                error:
                  "Invalid image type. Allowed: image/jpeg, image/jpg, image/png, image/webp, image/gif",
              },
              { status: 400 },
            );
          }
          if (image.size > MAX_IMAGE_SIZE_BYTES) {
            return NextResponse.json(
              { error: "Image file is too large (max 10MB)" },
              { status: 400 },
            );
          }
          const buffer = Buffer.from(await image.arrayBuffer());
          const uploaded = await uploadImage(buffer);
          newUploadedPublicIds.push(uploaded.publicId);
          uploadedImages.push({ secureUrl: uploaded.secureUrl, publicId: uploaded.publicId });
        }
        const first = uploadedImages[0];
        await prisma.project.update({
          where: { id },
          data: {
            title: titleTrimmed,
            description:
              typeof description === "string"
                ? (description.trim() || null)
                : existing.description,
            category:
              typeof category === "string"
                ? (category.trim() || null)
                : existing.category,
            featured:
              typeof featured === "string"
                ? featured === "true"
                : existing.featured,
            imageUrl: first.secureUrl,
            imagePublicId: first.publicId,
            images: {
              create: uploadedImages.map((img, index) => ({
                imageUrl: img.secureUrl,
                imagePublicId: img.publicId,
                sortOrder: index,
              })),
            },
          },
        });
      } else {
        await prisma.project.update({
          where: { id },
          data: {
            title: titleTrimmed,
            description:
              typeof description === "string"
                ? (description.trim() || null)
                : existing.description,
            category:
              typeof category === "string"
                ? (category.trim() || null)
                : existing.category,
            featured:
              typeof featured === "string"
              ? featured === "true"
              : existing.featured,
            imageUrl: null,
            imagePublicId: null,
          },
        });
      }
    } else if (imageFiles.length > 0) {
      // Append new images to existing
      const uploadedImages: { secureUrl: string; publicId: string }[] = [];
      for (const image of imageFiles) {
        if (!ALLOWED_IMAGE_TYPES.has(image.type)) {
          return NextResponse.json(
            {
              error:
                "Invalid image type. Allowed: image/jpeg, image/jpg, image/png, image/webp, image/gif",
            },
            { status: 400 },
          );
        }
        if (image.size > MAX_IMAGE_SIZE_BYTES) {
          return NextResponse.json(
            { error: "Image file is too large (max 10MB)" },
            { status: 400 },
          );
        }
        const buffer = Buffer.from(await image.arrayBuffer());
        const uploaded = await uploadImage(buffer);
        newUploadedPublicIds.push(uploaded.publicId);
        uploadedImages.push({ secureUrl: uploaded.secureUrl, publicId: uploaded.publicId });
      }
      const nextOrder = existing.images.length;
      await prisma.project.update({
        where: { id },
        data: {
          title: titleTrimmed,
          description:
            typeof description === "string"
              ? (description.trim() || null)
              : existing.description,
          category:
            typeof category === "string"
              ? (category.trim() || null)
              : existing.category,
          featured:
            typeof featured === "string"
              ? featured === "true"
              : existing.featured,
          imageUrl: imageUrl ?? uploadedImages[0]?.secureUrl ?? null,
          imagePublicId: imagePublicId ?? uploadedImages[0]?.publicId ?? null,
          images: {
            create: uploadedImages.map((img, index) => ({
              imageUrl: img.secureUrl,
              imagePublicId: img.publicId,
              sortOrder: nextOrder + index,
            })),
          },
        },
      });
    } else {
      // No image change: update text/featured only
      await prisma.project.update({
        where: { id },
        data: {
          title: titleTrimmed,
          description:
            typeof description === "string"
              ? (description.trim() || null)
              : existing.description,
          category:
            typeof category === "string"
              ? (category.trim() || null)
              : existing.category,
          featured:
            typeof featured === "string"
              ? featured === "true"
              : existing.featured,
        },
      });
    }

    let updated = await prisma.project.findUnique({
      where: { id },
      include: { images: { orderBy: { sortOrder: "asc" } } },
    });

    if (
      updated?.images &&
      updated.images.length > 0 &&
      typeof thumbnailIndexRaw === "string" &&
      /^\d+$/.test(thumbnailIndexRaw)
    ) {
      const idx = Math.min(
        Math.max(0, parseInt(thumbnailIndexRaw, 10)),
        updated.images.length - 1,
      );
      const img = updated.images[idx];
      if (img) {
        await prisma.project.update({
          where: { id },
          data: { imageUrl: img.imageUrl, imagePublicId: img.imagePublicId },
        });
        updated = await prisma.project.findUnique({
          where: { id },
          include: { images: { orderBy: { sortOrder: "asc" } } },
        });
      }
    }

    return NextResponse.json(updated);
  } catch {
    for (const publicId of newUploadedPublicIds) {
      try {
        await deleteImage(publicId);
      } catch {
        // ignore
      }
    }
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/projects/[id]
 *
 * Admin-only endpoint that deletes a project and, if present, its associated Cloudinary image.
 * Returns `{ success: true }` when deletion succeeds, or 404 if the project is not found.
 */
export async function DELETE(req: Request, { params }: RouteParams) {
  const { id } = await params;
  const adminResult = await verifyAdmin();
  if (!adminResult.ok) {
    return adminResult.response;
  }

  try {
    const existing = await prisma.project.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 },
      );
    }

    const publicIdsToDelete = new Set<string>(existing.images.map((i) => i.imagePublicId));
    if (existing.imagePublicId) publicIdsToDelete.add(existing.imagePublicId);
    for (const publicId of publicIdsToDelete) {
      try {
        await deleteImage(publicId);
      } catch {
        return NextResponse.json(
          { error: "Failed to delete project image" },
          { status: 500 },
        );
      }
    }

    await prisma.project.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 },
    );
  }
}

