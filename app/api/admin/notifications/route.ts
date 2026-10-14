import { z } from "zod"

import { parseBody, route } from "@/lib/server/api"
import { notifications } from "@/lib/cms/store"

export const GET = route({}, async () => {
  const all = (await notifications.all()).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return { items: all.slice(0, 50), unread: all.filter((n) => !n.read).length }
})

/** Mark specific notifications (or all, when `ids` is omitted) as read. */
export const PATCH = route({}, async ({ request }) => {
  const { ids } = await parseBody(request, z.object({ ids: z.array(z.string()).max(200).optional() }))
  const target = ids ? new Set(ids) : null
  await notifications.mutate((items) => items.map((n) => (!target || target.has(n.id) ? { ...n, read: true } : n)))
  return { ok: true }
})

export const DELETE = route({}, async () => {
  await notifications.mutate((items) => items.filter((n) => !n.read))
  return { ok: true }
})
