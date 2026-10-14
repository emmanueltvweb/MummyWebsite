import { audit } from "@/lib/server/audit"
import { ApiError, notFound, parseBody, route } from "@/lib/server/api"
import { revokeUserSessions, toPublicUser } from "@/lib/server/auth"
import { assertCanManageAccount, assertKeepsASuperAdmin } from "@/lib/server/user-guards"
import { userStatusInput } from "@/lib/cms/schemas"
import { users } from "@/lib/cms/store"

/** Suspend (signs the user out everywhere and blocks sign-in) or reactivate an account. */
export const POST = route<{ id: string }>({ permission: "users.manage" }, async ({ request, params, user, ip }) => {
  const existing = await users.get(params.id)
  if (!existing) throw notFound("User")
  if (existing.id === user!.id) throw new ApiError(409, "You can't suspend your own account", "SELF_CHANGE")
  assertCanManageAccount(user!, existing)
  const { status, reason } = await parseBody(request, userStatusInput)
  await assertKeepsASuperAdmin(existing, { status })

  const updated = await users.update(
    existing.id,
    status === "suspended"
      ? { status, suspendedAt: new Date().toISOString(), suspendedReason: reason }
      : { status, suspendedAt: undefined, suspendedReason: undefined }
  )
  if (status === "suspended") await revokeUserSessions(existing.id)
  await audit(
    user,
    status === "suspended" ? "user.suspend" : "user.reactivate",
    "user",
    status === "suspended" ? `Suspended ${existing.email}${reason ? `: ${reason}` : ""}` : `Reactivated ${existing.email}`,
    { entityId: existing.id, ip }
  )
  return toPublicUser(updated!)
})
