import { audit } from "@/lib/server/audit"
import { hashPassword, revokeUserSessions, verifyPassword } from "@/lib/server/auth"
import { ApiError, notFound, parseBody, route } from "@/lib/server/api"
import { users } from "@/lib/cms/store"
import { passwordChangeInput } from "@/lib/cms/schemas"

export const POST = route(
  { rateLimit: { limit: 10, windowMs: 10 * 60_000, key: "auth-password" } },
  async ({ request, user, ip }) => {
    const { currentPassword, newPassword } = await parseBody(request, passwordChangeInput)
    const record = await users.get(user!.id)
    if (!record) throw notFound("User")
    if (!(await verifyPassword(currentPassword, record.passwordHash))) {
      throw new ApiError(400, "Your current password is incorrect", "INVALID_PASSWORD")
    }
    if (currentPassword === newPassword) {
      throw new ApiError(400, "Choose a password you haven't used before", "SAME_PASSWORD")
    }
    await users.update(record.id, { passwordHash: await hashPassword(newPassword), mustChangePassword: false })
    // Keep this device signed in; sign out everywhere else.
    const revoked = await revokeUserSessions(record.id, user!.sessionId)
    await audit(user, "auth.password", "user", `${record.name} changed their password (${revoked} other session(s) signed out)`, {
      entityId: record.id,
      ip,
    })
    return { changed: true, revoked }
  }
)
