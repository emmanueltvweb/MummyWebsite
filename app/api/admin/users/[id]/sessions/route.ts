import { audit } from "@/lib/server/audit"
import { notFound, route } from "@/lib/server/api"
import { revokeUserSessions } from "@/lib/server/auth"
import { assertCanManageAccount } from "@/lib/server/user-guards"
import { users } from "@/lib/cms/store"

/** Force sign-out: ends every session for the user on every device. */
export const DELETE = route<{ id: string }>({ permission: "users.manage" }, async ({ params, user, ip }) => {
  const existing = await users.get(params.id)
  if (!existing) throw notFound("User")
  assertCanManageAccount(user!, existing)
  const revoked = await revokeUserSessions(existing.id, existing.id === user!.id ? user!.sessionId : undefined)
  await audit(user, "user.sessions_revoked", "user", `Signed ${existing.email} out of ${revoked} session(s)`, { entityId: existing.id, ip })
  return { revoked }
})
