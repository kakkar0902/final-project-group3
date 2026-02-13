import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guards";
import { uploadImage, deleteImage } from "@/lib/cloudinary";

export const runtime = "nodejs";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * GET /api/projects
 *
 * Returns a list of projects, optionally filtered by `category` and `featured` query parameters.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const featuredParam = searchParams.get("featured");

    const where: {
      category?: string;
      featured?: boolean;
    } = {};

    if (category) {
      where.category = category;
    }

    if (featuredParam !== null && featuredParam !== "") {
      where.featured = featuredParam === "true";
    }

    const projects = await prisma.project.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(projects);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/projects
 *
 * Admin-only. Creates a new project. Accepts either:
 * - application/json with { title, description?, category?, featured?, thumbnailIndex?, uploadedImages? }
 *   (uploadedImages = pre-uploaded to Cloudinary from client; progress is shown during that upload).
 * - multipart/form-data with title and optional image files (server uploads to Cloudinary).
 */
export async function POST(req: Request) {
  const adminResult = await requireAdmin();
  if (!adminResult.ok) {
    return adminResult.response;
  }

  const contentType = req.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");

  if (isJson) {
    return handlePostJson(req);
  }
  return handlePostFormData(req);
}

async function handlePostJson(req: Request) {
  try {
    const body = await req.json();
    const title = body?.title;
    const description = body?.description;
    const category = body?.category;
    const featured = body?.featured;
    const thumbnailIndexRaw = body?.thumbnailIndex;
    const uploadedImagesRaw = body?.uploadedImages;

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

    const uploadedImages: { secureUrl: string; publicId: string }[] = [];
    if (Array.isArray(uploadedImagesRaw)) {
      for (const item of uploadedImagesRaw) {
        if (
          item &&
          typeof item.secureUrl === "string" &&
          typeof item.publicId === "string"
        ) {
          uploadedImages.push({
            secureUrl: item.secureUrl,
            publicId: item.publicId,
          });
        }
      }
    }

    if (uploadedImages.length === 0) {
      return NextResponse.json(
        { error: "At least one image is required" },
        { status: 400 },
      );
    }

    const thumbnailIndex =
      typeof thumbnailIndexRaw === "number" && Number.isInteger(thumbnailIndexRaw)
        ? Math.min(
            Math.max(0, thumbnailIndexRaw),
            Math.max(0, uploadedImages.length - 1),
          )
        : typeof thumbnailIndexRaw === "string" && /^\d+$/.test(thumbnailIndexRaw)
          ? Math.min(
              Math.max(0, parseInt(thumbnailIndexRaw, 10)),
              Math.max(0, uploadedImages.length - 1),
            )
          : 0;
    const chosenImage = uploadedImages[thumbnailIndex] ?? uploadedImages[0] ?? null;
    const imageUrl = chosenImage?.secureUrl ?? null;
    const imagePublicId = chosenImage?.publicId ?? null;

    const project = await prisma.project.create({
      data: {
        title: titleTrimmed,
        description:
          description != null && typeof description === "string"
            ? description.trim() || null
            : null,
        category:
          category != null && typeof category === "string"
            ? category.trim() || null
            : null,
        featured: featured === true || featured === "true",
        imageUrl,
        imagePublicId,
        images: {
          create: uploadedImages.map((img, index) => ({
            imageUrl: img.secureUrl,
            imagePublicId: img.publicId,
            sortOrder: index,
          })),
        },
      },
      include: { images: { orderBy: { sortOrder: "asc" } } },
    });

    return NextResponse.json(project, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 },
    );
  }
}

async function handlePostFormData(req: Request) {
  const uploadedPublicIds: string[] = [];

  try {
    const formData = await req.formData();
    const title = formData.get("title");
    const description = formData.get("description");
    const category = formData.get("category");
    const featured = formData.get("featured");
    const thumbnailIndexRaw = formData.get("thumbnailIndex");
    const imageEntries = formData.getAll("image");

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

    if (imageFiles.length === 0) {
      return NextResponse.json(
        { error: "At least one image is required" },
        { status: 400 },
      );
    }

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
      uploadedPublicIds.push(uploaded.publicId);
      uploadedImages.push({ secureUrl: uploaded.secureUrl, publicId: uploaded.publicId });
    }

    const thumbnailIndex =
      typeof thumbnailIndexRaw === "string" && /^\d+$/.test(thumbnailIndexRaw)
        ? Math.min(
            Math.max(0, parseInt(thumbnailIndexRaw, 10)),
            Math.max(0, uploadedImages.length - 1),
          )
        : 0;
    const chosenImage = uploadedImages[thumbnailIndex] ?? uploadedImages[0] ?? null;
    const imageUrl = chosenImage?.secureUrl ?? null;
    const imagePublicId = chosenImage?.publicId ?? null;

    const project = await prisma.project.create({
      data: {
        title: titleTrimmed,
        description:
          description && typeof description === "string"
            ? description.trim() || null
            : null,
        category:
          category && typeof category === "string"
            ? category.trim() || null
            : null,
        featured: typeof featured === "string" ? featured === "true" : false,
        imageUrl,
        imagePublicId,
        images: {
          create: uploadedImages.map((img, index) => ({
            imageUrl: img.secureUrl,
            imagePublicId: img.publicId,
            sortOrder: index,
          })),
        },
      },
      include: { images: { orderBy: { sortOrder: "asc" } } },
    });

    return NextResponse.json(project, { status: 201 });
  } catch {
    for (const publicId of uploadedPublicIds) {
      try {
        await deleteImage(publicId);
      } catch {
        // best-effort cleanup
      }
    }
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 },
    );
  }
}

