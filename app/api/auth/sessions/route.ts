import { audit } from "@/lib/server/audit"
import { isSessionLive, revokeUserSessions } from "@/lib/server/auth"
import { route } from "@/lib/server/api"
import { sessions } from "@/lib/cms/store"

/** The current user's active sessions (devices). */
export const GET = route({}, async ({ user }) =>
  (await sessions.all())
    .filter((s) => s.userId === user!.id && isSessionLive(s))
    .sort((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt))
    .map((s) => ({
      id: s.id,
      current: s.id === user!.sessionId,
      remember: s.remember,
      ip: s.ip,
      userAgent: s.userAgent,
      createdAt: s.createdAt,
      lastSeenAt: s.lastSeenAt,
      expiresAt: s.expiresAt,
    }))
)

/** Signs the current user out everywhere except this device. */
export const DELETE = route({}, async ({ user, ip }) => {
  const revoked = await revokeUserSessions(user!.id, user!.sessionId)
  await audit(user, "auth.sessions_revoked", "user", `${user!.name} signed out ${revoked} other session(s)`, { entityId: user!.id, ip })
  return { revoked }
})
