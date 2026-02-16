/**
 * @module api/tags/[id]/route
 * @description API routes for single tag operations (update, delete).
 * Admin-only endpoints for tag management.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guards";

/** Runtime configuration for this API route */
export const runtime = "nodejs";

/**
 * Route parameters for dynamic [id] routes.
 */
type RouteParams = {
  /** Promise resolving to route parameters containing the tag ID */
  params: Promise<{ id: string }>;
};

/**
 * PATCH /api/tags/[id]
 *
 * Admin-only. Updates an existing tag's name.
 * @param req - The incoming request object with JSON body `{ name: string }`
 * @param params - Route parameters containing the tag ID
 * @returns JSON response with updated tag or error (400, 404, 409)
 */
export async function PATCH(req: Request, { params }: RouteParams) {
  const adminResult = await requireAdmin();
  if (!adminResult.ok) {
    return adminResult.response;
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const name = typeof body?.name === "string" ? body.name.trim() : null;

  if (!name) {
    return NextResponse.json(
      { error: "Name is required" },
      { status: 400 }
    );
  }

  const existing = await prisma.tag.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Tag not found" }, { status: 404 });
  }

  const conflict = await prisma.tag.findFirst({
    where: { name: { equals: name, mode: "insensitive" }, id: { not: id } },
  });
  if (conflict) {
    return NextResponse.json(
      { error: "A tag with that name already exists" },
      { status: 409 }
    );
  }

  const updated = await prisma.tag.update({
    where: { id },
    data: { name },
  });

  return NextResponse.json(updated);
}

/**
 * DELETE /api/tags/[id]
 *
 * Admin-only. Deletes a tag and removes it from all associated projects.
 * @param _req - The incoming request object (unused)
 * @param params - Route parameters containing the tag ID
 * @returns JSON response with `{ success: true }` or error (404 if not found)
 */
export async function DELETE(_req: Request, { params }: RouteParams) {
  const adminResult = await requireAdmin();
  if (!adminResult.ok) {
    return adminResult.response;
  }

  const { id } = await params;

  const existing = await prisma.tag.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Tag not found" }, { status: 404 });
  }

  await prisma.projectTag.deleteMany({ where: { tagId: id } });
  await prisma.tag.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
