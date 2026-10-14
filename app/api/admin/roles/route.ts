import { audit } from "@/lib/server/audit"
import { parseBody, route } from "@/lib/server/api"
import { ensureAuthReady } from "@/lib/server/auth"
import { PERMISSION_MODULES, type Permission } from "@/lib/cms/rbac"
import { roleInput } from "@/lib/cms/schemas"
import { roles, users } from "@/lib/cms/store"

export const GET = route({ permission: "users.view" }, async () => {
  await ensureAuthReady()
  const [roleList, userList] = await Promise.all([roles.all(), users.all()])
  return {
    roles: roleList
      .map((r) => ({ ...r, userCount: userList.filter((u) => u.role === r.id).length }))
      .sort((a, b) => Number(b.system) - Number(a.system) || b.permissions.length - a.permissions.length),
    modules: PERMISSION_MODULES,
  }
})

function roleIdFrom(name: string, taken: Set<string>) {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 40) || "role"
  let id = base
  for (let i = 2; taken.has(id); i++) id = `${base}_${i}`
  return id
}

export const POST = route({ permission: "users.roles" }, async ({ request, user, ip }) => {
  const input = await parseBody(request, roleInput)
  const existing = await roles.all()
  const role = await roles.insert({
    id: roleIdFrom(input.name, new Set(existing.map((r) => r.id))),
    name: input.name,
    description: input.description,
    permissions: [...new Set(input.permissions)] as Permission[],
    system: false,
  })
  await audit(user, "role.create", "role", `Created custom role “${role.name}” with ${role.permissions.length} permission(s)`, {
    entityId: role.id,
    ip,
  })
  return { ...role, userCount: 0 }
})
