import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guards";
import { deleteImage, replaceProjectImage } from "@/lib/cloudinary";

export const runtime = "nodejs";

type RouteParams = {
  params: {
    id: string;
  };
};

export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: params.id },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: project });
  } catch (error) {
    console.error("Failed to fetch project", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const adminResult = await requireAdmin();
  if (!adminResult.ok) {
    return adminResult.response;
  }

  try {
    const existing = await prisma.project.findUnique({
      where: { id: params.id },
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
    const image = formData.get("image");

    let imageUrl = existing.imageUrl;
    let imagePublicId = existing.imagePublicId;

    if (image instanceof File) {
      if (!image.type.startsWith("image/")) {
        return NextResponse.json(
          { error: "Image must be of type image/*" },
          { status: 400 },
        );
      }

      const maxSizeBytes = 5 * 1024 * 1024;
      if (image.size > maxSizeBytes) {
        return NextResponse.json(
          { error: "Image file is too large (max 5MB)" },
          { status: 400 },
        );
      }

      const buffer = Buffer.from(await image.arrayBuffer());
      const uploaded = await replaceProjectImage(existing.imagePublicId, buffer);

      imageUrl = uploaded.secureUrl;
      imagePublicId = uploaded.publicId;
    }

    const updated = await prisma.project.update({
      where: { id: params.id },
      data: {
        title:
          typeof title === "string" && title.length > 0
            ? title
            : existing.title,
        description:
          typeof description === "string"
            ? description
            : existing.description,
        category:
          typeof category === "string" ? category : existing.category,
        featured:
          typeof featured === "string"
            ? featured === "true"
            : existing.featured,
        imageUrl,
        imagePublicId,
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("Failed to update project", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const adminResult = await requireAdmin();
  if (!adminResult.ok) {
    return adminResult.response;
  }

  try {
    const existing = await prisma.project.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 },
      );
    }

    await prisma.project.delete({
      where: { id: params.id },
    });

    if (existing.imagePublicId) {
      try {
        await deleteImage(existing.imagePublicId);
      } catch (error) {
        console.error("Failed to delete project image in Cloudinary", error);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete project", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 },
    );
  }
}

