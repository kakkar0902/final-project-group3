/**
 * @module api/projects/years/route
 * @description API route for fetching distinct project years.
 * Public endpoint used for the date filter on the projects page.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/** Runtime configuration for this API route */
export const runtime = "nodejs";

/**
 * GET /api/projects/years
 *
 * Returns distinct years from project createdAt dates, sorted descending.
 * Public endpoint used for the date filter dropdown on /projects.
 * @returns JSON array of years (e.g., `[2026, 2025, 2024]`)
 */
export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      select: { createdAt: true },
      orderBy: { createdAt: "desc" },
    });

    const years = [...new Set(projects.map((p) => p.createdAt.getFullYear()))].sort(
      (a, b) => b - a,
    );

    return NextResponse.json(years);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch years" },
      { status: 500 },
    );
  }
}
