import { audit } from "@/lib/server/audit"
import { ApiError, notFound, parseBody, route } from "@/lib/server/api"
import { hashPassword, revokeUserSessions, toPublicUser } from "@/lib/server/auth"
import { assertAssignableRole, assertCanManageAccount, assertKeepsASuperAdmin } from "@/lib/server/user-guards"
import { userUpdateInput } from "@/lib/cms/schemas"
import { users } from "@/lib/cms/store"
import type { AdminUser } from "@/lib/cms/types"

type Params = { id: string }

/** Edit a user: name, email, role, status and (optionally) set a new password. */
export const PUT = route<Params>({ permission: "users.manage" }, async ({ request, params, user, ip }) => {
  const existing = await users.get(params.id)
  if (!existing) throw notFound("User")
  assertCanManageAccount(user!, existing)
  const { password, ...input } = await parseBody(request, userUpdateInput)

  if (input.role && input.role !== existing.role) await assertAssignableRole(user!, input.role)
  if (input.email && input.email !== existing.email && (await users.find((u) => u.email === input.email))) {
    throw new ApiError(409, "A user with this email already exists", "CONFLICT")
  }
  if (existing.id === user!.id && (input.status === "suspended" || (input.role && input.role !== existing.role))) {
    throw new ApiError(409, "You can't suspend yourself or change your own role", "SELF_CHANGE")
  }
  await assertKeepsASuperAdmin(existing, input)

  const patch: Partial<AdminUser> = { ...input }
  const suspending = input.status === "suspended" && existing.status !== "suspended"
  if (suspending) patch.suspendedAt = new Date().toISOString()
  if (input.status === "active") {
    patch.suspendedAt = undefined
    patch.suspendedReason = undefined
  }
  if (password) {
    patch.passwordHash = await hashPassword(password)
    patch.mustChangePassword = true
  }

  const updated = await users.update(existing.id, patch)
  if (password || suspending) await revokeUserSessions(existing.id)

  const changes = [
    input.role && input.role !== existing.role && `role ${existing.role} → ${input.role}`,
    suspending && "suspended",
    input.status === "active" && existing.status === "suspended" && "reactivated",
    password && "password set",
  ].filter(Boolean)
  await audit(user, "user.update", "user", `Updated ${updated!.email}${changes.length ? ` (${changes.join(", ")})` : ""}`, {
    entityId: existing.id,
    ip,
  })
  return toPublicUser(updated!)
})

export const DELETE = route<Params>({ permission: "users.manage" }, async ({ params, user, ip }) => {
  const existing = await users.get(params.id)
  if (!existing) throw notFound("User")
  if (existing.id === user!.id) throw new ApiError(409, "You can't delete your own account", "SELF_DELETE")
  assertCanManageAccount(user!, existing)
  await assertKeepsASuperAdmin(existing, null)
  await revokeUserSessions(existing.id)
  await users.remove(existing.id)
  await audit(user, "user.delete", "user", `Deleted account ${existing.email}`, { entityId: existing.id, ip })
  return { deleted: 1 }
})
