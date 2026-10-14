import { audit } from "@/lib/server/audit"
import { notFound, route } from "@/lib/server/api"
import { generateTemporaryPassword, hashPassword, revokeUserSessions } from "@/lib/server/auth"
import { assertCanManageAccount } from "@/lib/server/user-guards"
import { users } from "@/lib/cms/store"

/**
 * Generates a one-time temporary password, signs the user out everywhere and requires them to
 * choose a new password after signing in. The temporary password is returned once and never stored.
 */
export const POST = route<{ id: string }>(
  { permission: "users.manage", rateLimit: { limit: 10, windowMs: 10 * 60_000, key: "admin-reset-password" } },
  async ({ params, user, ip }) => {
    const existing = await users.get(params.id)
    if (!existing) throw notFound("User")
    assertCanManageAccount(user!, existing)
    const temporaryPassword = generateTemporaryPassword()
    await users.update(existing.id, { passwordHash: await hashPassword(temporaryPassword), mustChangePassword: true })
    await revokeUserSessions(existing.id)
    await audit(user, "user.reset_password", "user", `Reset the password for ${existing.email}`, { entityId: existing.id, ip })
    return { temporaryPassword }
  }
)
