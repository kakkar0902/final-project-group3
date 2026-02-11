import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guards";
import { uploadImage } from "@/lib/cloudinary";

export const runtime = "nodejs";

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

    if (featuredParam !== null) {
      where.featured = featuredParam === "true";
    }

    const projects = await prisma.project.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: projects });
  } catch (error) {
    console.error("Failed to fetch projects", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const adminResult = await requireAdmin();
  if (!adminResult.ok) {
    return adminResult.response;
  }

  try {
    const formData = await req.formData();

    const title = formData.get("title");
    const description = formData.get("description");
    const category = formData.get("category");
    const featured = formData.get("featured");
    const image = formData.get("image");

    if (!title || typeof title !== "string") {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 },
      );
    }

    let imageUrl: string | null = null;
    let imagePublicId: string | null = null;

    if (image instanceof File) {
      if (!image.type.startsWith("image/")) {
        return NextResponse.json(
          { error: "Image must be of type image/*" },
          { status: 400 },
        );
      }

      // 5MB default limit
      const maxSizeBytes = 5 * 1024 * 1024;
      if (image.size > maxSizeBytes) {
        return NextResponse.json(
          { error: "Image file is too large (max 5MB)" },
          { status: 400 },
        );
      }

      const buffer = Buffer.from(await image.arrayBuffer());
      const uploaded = await uploadImage(buffer);
      imageUrl = uploaded.secureUrl;
      imagePublicId = uploaded.publicId;
    }

    const project = await prisma.project.create({
      data: {
        title,
        description: description && typeof description === "string"
          ? description
          : null,
        category: category && typeof category === "string" ? category : null,
        featured:
          typeof featured === "string" ? featured === "true" : false,
        imageUrl,
        imagePublicId,
      },
    });

    return NextResponse.json({ data: project }, { status: 201 });
  } catch (error) {
    console.error("Failed to create project", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 },
    );
  }
}

