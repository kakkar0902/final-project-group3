import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * Result type returned by admin guard helpers. When `ok` is `false`, `response`
 * contains the HTTP response that should be returned from the route handler.
 */
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

/** Optional context for auth() so it can read cookies from the request (e.g. when called from API routes). */
type AuthContext = { params?: Promise<Record<string, string>> | Record<string, string> };

/**
 * Parse the session token from the request Cookie header, supporting both
 * `next-auth.session-token` and `__Secure-next-auth.session-token` cookie names.
 */
function getSessionTokenFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;
  const match = cookieHeader.match(
    /(?:^|;)\s*(?:next-auth\.session-token|__Secure-next-auth\.session-token)=([^;]+)/,
  );
  return match ? decodeURIComponent(match[1].trim()) : null;
}

/**
 * Call `auth()` with the given request/context (when provided) so it reads the
 * session cookie from the incoming request, falling back to `auth()` with no
 * arguments when called outside of a route handler.
 */
const getSession = async (
  request?: Request,
  ctx?: AuthContext,
): Promise<Session | null> => {
  if (request != null) {
    return (await (auth as (req: Request, ctx?: AuthContext) => Promise<Session | null>)(request, ctx)) as Session | null;
  }
  return (await auth()) as Session | null;
};

/**
 * Guard helper for collection endpoints (e.g. POST /api/projects).
 *
 * Verifies that the incoming request belongs to an authenticated admin user.
 * On success returns `{ ok: true, session }`, otherwise `{ ok: false, response }`
 * with an appropriate 401/403 response.
 */
export async function requireAdmin(
  request?: Request,
  ctx?: AuthContext,
): Promise<RequireAdminResult> {
  const session = await getSession(request, ctx);

  if (!session) {
    // console.error("[requireAdmin] 401: no session (missing or invalid cookie)");
    return {
      ok: false,
      session: null,
      response: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      ),
    };
  }

  if (session.user?.isAdmin === true) {
    return {
      ok: true,
      session,
      response: null,
    };
  }

  const userId = (session.user as { id?: string } | undefined)?.id;
  if (userId) {
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    });
    if (dbUser?.isAdmin) {
      return {
        ok: true,
        session,
        response: null,
      };
    }
  }

  if (request) {
    const sessionToken = getSessionTokenFromRequest(request);
    if (sessionToken) {
      const dbSession = await prisma.session.findUnique({
        where: { sessionToken },
        select: {
          expires: true,
          user: { select: { isAdmin: true } },
        },
      });
      if (dbSession && dbSession.expires > new Date() && dbSession.user?.isAdmin) {
        return {
          ok: true,
          session,
          response: null,
        };
      }
    }
  }

  // console.error("[requireAdmin] 403: session exists but user is not admin", {
  //   email: session.user?.email ?? "(no email)",
  //   isAdmin: session.user?.isAdmin,
  //   userId: userId ?? "(no id)",
  // });
  return {
    ok: false,
    session: null,
    response: NextResponse.json(
      { error: "Forbidden" },
      { status: 403 },
    ),
  };
}

/**
 * Result type used by `verifyAdmin`, which only exposes whether the current user
 * is an admin (and a ready-made HTTP response when not).
 */
export type VerifyAdminResult =
  | { ok: true; user: { isAdmin: true } }
  | { ok: false; response: NextResponse };

/**
 * Guard helper for item endpoints (e.g. PATCH/DELETE /api/projects/[id]).
 *
 * Validates the request by checking the session and verifying `isAdmin` directly
 * from the database, using either the session's email or the session token.
 */
export async function verifyAdmin(
  request?: Request,
  ctx?: AuthContext,
): Promise<VerifyAdminResult> {
  const session = await getSession(request, ctx);

  if (!session) {
    // console.error("[verifyAdmin] 401: no session");
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (session.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { isAdmin: true },
    });
    if (user?.isAdmin) {
      // Email-based lookup confirms admin; no need to consult session token.
      return { ok: true, user: { isAdmin: true } };
    }
    // If the email-based lookup does not confirm admin, fall through and
    // give the session-token-based lookup a chance before deciding.
  }

  if (request) {
    const sessionToken = getSessionTokenFromRequest(request);
    if (sessionToken) {
      const dbSession = await prisma.session.findUnique({
        where: { sessionToken },
        select: {
          expires: true,
          user: { select: { isAdmin: true } },
        },
      });
      if (dbSession && dbSession.expires > new Date()) {
        if (dbSession.user?.isAdmin) {
          return { ok: true, user: { isAdmin: true } };
        }
        // valid (non-expired) session but user is not admin → 403
        return {
          ok: false,
          response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
        };
      }
      // expired or missing session will fall through to the final 401 handler
    }
  }

  // console.error("[verifyAdmin] 401: no email and no valid session token", {
  //   hasSession: !!session,
  //   hasEmail: !!session?.user?.email,
  // });
  return {
    ok: false,
    response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
  };
}

