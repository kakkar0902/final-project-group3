import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/lib/auth";

export type RequireAdminResult =
  | {
      ok: true;
      session: Session;
      response: null;
    }
  | {
      ok: false;
      session: null;
      response: NextResponse;
    };

export async function requireAdmin(): Promise<RequireAdminResult> {
  // Narrow the overloaded `auth` helper to its session-returning signature.
  const session = (await auth()) as Session | null;

  if (!session?.user?.isAdmin) {
    return {
      ok: false,
      session: null,
      response: NextResponse.json(
        { error: "You must be an admin to perform this action." },
        { status: 403 },
      ),
    };
  }

  return {
    ok: true,
    session,
    response: null,
  };
}

