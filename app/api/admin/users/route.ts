import { audit } from "@/lib/server/audit"
import { ApiError, parseBody, route } from "@/lib/server/api"
import { ensureAuthReady, hashPassword, isSessionLive, toPublicUser } from "@/lib/server/auth"
import { assertAssignableRole } from "@/lib/server/user-guards"
import { userCreateInput } from "@/lib/cms/schemas"
import { posts, roles, sessions, users } from "@/lib/cms/store"

export const GET = route({ permission: "users.view" }, async () => {
  await ensureAuthReady()
  const [all, allPosts, roleList, sessionList] = await Promise.all([users.all(), posts.all(), roles.all(), sessions.all()])
  const roleNames = new Map(roleList.map((r) => [r.id, r.name]))
  return all
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((u) => ({
      ...toPublicUser(u),
      roleName: roleNames.get(u.role) ?? u.role,
      postCount: allPosts.filter((p) => p.authorId === u.id).length,
      activeSessions: sessionList.filter((s) => s.userId === u.id && isSessionLive(s)).length,
    }))
})

export const POST = route({ permission: "users.manage" }, async ({ request, user, ip }) => {
  const { password, ...input } = await parseBody(request, userCreateInput)
  await assertAssignableRole(user!, input.role)
  if (await users.find((u) => u.email === input.email)) {
    throw new ApiError(409, "A user with this email already exists", "CONFLICT")
  }
  const created = await users.insert({
    ...input,
    passwordHash: await hashPassword(password),
    sessionVersion: 1,
    mustChangePassword: true,
    ...(input.status === "suspended" ? { suspendedAt: new Date().toISOString() } : {}),
  })
  await audit(user, "user.create", "user", `Created ${created.role.replace(/_/g, " ")} account for ${created.email}`, { entityId: created.id, ip })
  return { ...toPublicUser(created), postCount: 0, activeSessions: 0 }
})
