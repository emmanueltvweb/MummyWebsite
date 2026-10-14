import "server-only"

import { auditLog, notifications } from "@/lib/cms/store"
import type { Notification } from "@/lib/cms/types"
import type { SessionUser } from "./auth"
import { logger } from "./logger"

const MAX_AUDIT_ENTRIES = 5000
const MAX_NOTIFICATIONS = 200

export async function audit(
  user: Pick<SessionUser, "id" | "name"> | null,
  action: string,
  entityType: string,
  summary: string,
  options: { entityId?: string; ip?: string } = {}
) {
  try {
    await auditLog.insert({
      userId: user?.id ?? "system",
      userName: user?.name ?? "System",
      action,
      entityType,
      entityId: options.entityId,
      summary,
      ip: options.ip,
    })
    const all = await auditLog.all()
    if (all.length > MAX_AUDIT_ENTRIES) {
      await auditLog.mutate((items) => items.slice(items.length - MAX_AUDIT_ENTRIES))
    }
  } catch (error) {
    // Audit failures must never break the user's action.
    logger.error("Failed to write audit entry", { action, error })
  }
}

export async function notify(input: Pick<Notification, "type" | "title" | "body" | "href">) {
  try {
    await notifications.insert({ ...input, read: false })
    const all = await notifications.all()
    if (all.length > MAX_NOTIFICATIONS) {
      await notifications.mutate((items) => items.slice(items.length - MAX_NOTIFICATIONS))
    }
  } catch (error) {
    logger.error("Failed to create notification", { error })
  }
}
