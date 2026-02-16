/**
 * @module api/auth/[...nextauth]/route
 * @description NextAuth.js authentication route handlers.
 * Exports GET and POST handlers for authentication operations.
 */
import { handlers } from "@/lib/auth";

/**
 * NextAuth.js route handlers for authentication.
 * - GET: Handles auth-related GET requests (e.g., CSRF token, session)
 * - POST: Handles auth-related POST requests (e.g., sign in, sign out)
 */
export const { GET, POST } = handlers;