import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guards";
import { getSignedUploadParams } from "@/lib/cloudinary";

export const runtime = "nodejs";

/**
 * GET /api/cloudinary-config
 *
 * Admin-only. Returns signed upload parameters for client-side uploads. The
 * browser uploads directly to Cloudinary with these params (and the file), so
 * the progress bar reflects real upload progress. Only your server can
 * generate valid signatures.
 */
export async function GET() {
  const adminResult = await requireAdmin();
  if (!adminResult.ok) {
    return adminResult.response;
  }

  try {
    const params = getSignedUploadParams();
    return NextResponse.json(params);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Cloudinary not configured";
    return NextResponse.json(
      { error: message },
      { status: 503 },
    );
  }
}
