import { audit } from "@/lib/server/audit"
import { ApiError, notFound, route } from "@/lib/server/api"
import { sessions } from "@/lib/cms/store"

/** Signs out one of the current user's other sessions. */
export const DELETE = route<{ id: string }>({}, async ({ params, user, ip }) => {
  const session = await sessions.get(params.id)
  if (!session || session.userId !== user!.id) throw notFound("Session")
  if (session.id === user!.sessionId) throw new ApiError(400, "Use “Sign out” to end your current session", "CURRENT_SESSION")
  await sessions.update(session.id, { revokedAt: new Date().toISOString() })
  await audit(user, "auth.session_revoked", "user", `${user!.name} signed out a device`, { entityId: user!.id, ip })
  return { revoked: 1 }
})
