import { IDLE_TIMEOUT_MS } from "@/lib/server/auth"
import { route } from "@/lib/server/api"

/**
 * Activity heartbeat. The dashboard calls this while the user is actively using it, which keeps a
 * non-"remember me" session from timing out. (Plain GET requests deliberately don't count.)
 */
export const POST = route({ rateLimit: { limit: 30, windowMs: 60_000, key: "session-heartbeat" } }, async ({ user }) => ({
  expiresAt: user!.session.expiresAt,
  lastSeenAt: user!.session.lastSeenAt,
  idleTimeoutMs: user!.session.remember ? null : IDLE_TIMEOUT_MS,
}))
