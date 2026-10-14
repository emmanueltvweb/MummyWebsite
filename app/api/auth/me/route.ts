import { IDLE_TIMEOUT_MS, roleName, toPublicUser } from "@/lib/server/auth"
import { notFound, route } from "@/lib/server/api"
import { users } from "@/lib/cms/store"
import type { CurrentUser } from "@/lib/cms/types"

/** The signed-in user, their role, effective permissions and session timing. */
export const GET = route({}, async ({ user }): Promise<CurrentUser> => {
  const record = await users.get(user!.id)
  if (!record) throw notFound("User")
  return {
    ...toPublicUser(record),
    roleName: await roleName(record.role),
    permissions: [...user!.permissions],
    session: {
      id: user!.sessionId,
      remember: user!.session.remember,
      expiresAt: user!.session.expiresAt,
      idleTimeoutMs: user!.session.remember ? null : IDLE_TIMEOUT_MS,
    },
  }
})
