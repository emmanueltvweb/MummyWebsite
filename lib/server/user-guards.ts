import "server-only"

import { SUPER_ADMIN_ROLE } from "@/lib/cms/rbac"
import { roles, users } from "@/lib/cms/store"
import type { AdminUser } from "@/lib/cms/types"
import { ApiError } from "./api"
import { isSuperAdmin, type SessionUser } from "./auth"

/** Only a Super Admin may create, change or remove Super Admin accounts. */
export function assertCanManageAccount(actor: SessionUser, target: Pick<AdminUser, "role">) {
  if (target.role === SUPER_ADMIN_ROLE && !isSuperAdmin(actor)) {
    throw new ApiError(403, "Only a Super Admin can change a Super Admin account", "FORBIDDEN")
  }
}

export async function assertAssignableRole(actor: SessionUser, roleId: string) {
  if (!(await roles.get(roleId))) throw new ApiError(400, "That role doesn't exist", "UNKNOWN_ROLE")
  if (roleId === SUPER_ADMIN_ROLE && !isSuperAdmin(actor)) {
    throw new ApiError(403, "Only a Super Admin can grant the Super Admin role", "FORBIDDEN")
  }
}

/** Prevents locking everyone out: there must always be at least one active Super Admin. */
export async function assertKeepsASuperAdmin(target: AdminUser, next: Partial<AdminUser> | null) {
  if (target.role !== SUPER_ADMIN_ROLE || target.status !== "active") return
  const losing = next === null || (next.role !== undefined && next.role !== SUPER_ADMIN_ROLE) || next.status === "suspended"
  if (!losing) return
  const others = (await users.all()).filter((u) => u.id !== target.id && u.role === SUPER_ADMIN_ROLE && u.status === "active")
  if (!others.length) {
    throw new ApiError(409, "There must always be at least one active Super Admin", "LAST_SUPER_ADMIN")
  }
}
