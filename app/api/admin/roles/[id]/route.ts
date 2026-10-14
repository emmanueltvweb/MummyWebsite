import { z } from "zod"

import { audit } from "@/lib/server/audit"
import { ApiError, notFound, parseBody, route } from "@/lib/server/api"
import type { Permission } from "@/lib/cms/rbac"
import { roleInput } from "@/lib/cms/schemas"
import { roles, users } from "@/lib/cms/store"

type Params = { id: string }

/** Rename a role and/or change its permissions. Takes effect immediately for everyone with the role. */
export const PUT = route<Params>({ permission: "users.roles" }, async ({ request, params, user, ip }) => {
  const existing = await roles.get(params.id)
  if (!existing) throw notFound("Role")
  if (existing.locked) throw new ApiError(409, `${existing.name} always has every permission and can't be edited`, "LOCKED_ROLE")
  const input = await parseBody(request, roleInput)
  const permissions = [...new Set(input.permissions)] as Permission[]
  const updated = await roles.update(existing.id, { name: input.name, description: input.description, permissions })

  const added = permissions.filter((p) => !existing.permissions.includes(p))
  const removed = existing.permissions.filter((p) => !permissions.includes(p))
  await audit(
    user,
    "role.update",
    "role",
    `Updated role “${updated!.name}”${added.length ? ` · +${added.join(", +")}` : ""}${removed.length ? ` · −${removed.join(", −")}` : ""}`,
    { entityId: existing.id, ip }
  )
  return updated
})

/** Delete a custom role. Users who have it are moved to `reassignTo` first. */
export const DELETE = route<Params>({ permission: "users.roles" }, async ({ request, params, user, ip }) => {
  const existing = await roles.get(params.id)
  if (!existing) throw notFound("Role")
  if (existing.system) throw new ApiError(409, "Built-in roles can't be deleted", "SYSTEM_ROLE")

  const { reassignTo } = await parseBody(request, z.object({ reassignTo: z.string().max(64).optional() })).catch(() => ({ reassignTo: undefined }))
  const members = (await users.all()).filter((u) => u.role === existing.id)
  if (members.length) {
    if (!reassignTo) throw new ApiError(409, `${members.length} user(s) still have this role. Choose a role to move them to.`, "ROLE_IN_USE")
    const target = await roles.get(reassignTo)
    if (!target || target.id === existing.id) throw new ApiError(400, "Choose a valid role to move users to", "UNKNOWN_ROLE")
    if (target.locked) throw new ApiError(400, "Users can't be bulk-moved to Super Admin", "FORBIDDEN")
    const ids = new Set(members.map((m) => m.id))
    await users.mutate((items) => items.map((u) => (ids.has(u.id) ? { ...u, role: target.id, updatedAt: new Date().toISOString() } : u)))
  }
  await roles.remove(existing.id)
  await audit(user, "role.delete", "role", `Deleted role “${existing.name}”${members.length ? ` (moved ${members.length} user(s) to ${reassignTo})` : ""}`, {
    entityId: existing.id,
    ip,
  })
  return { deleted: 1, moved: members.length }
})
