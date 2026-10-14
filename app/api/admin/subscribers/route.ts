import { z } from "zod"

import { audit } from "@/lib/server/audit"
import { parseBody, route } from "@/lib/server/api"
import { paginate } from "@/lib/cms/posts"
import { subscribers } from "@/lib/cms/store"

export const GET = route({ permission: "subscribers.view" }, async ({ request }) => {
  const params = new URL(request.url).searchParams
  const search = params.get("search")?.toLowerCase()
  const status = params.get("status")
  const all = await subscribers.all()

  const filtered = all
    .filter((s) => !status || status === "all" || s.status === status)
    .filter((s) => !search || `${s.email} ${s.name ?? ""}`.toLowerCase().includes(search))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .map(({ token, ...s }) => s)

  if (params.get("format") === "csv") {
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`
    const rows = [
      "email,name,status,source,subscribed_at",
      ...filtered.map((s) => [s.email, s.name ?? "", s.status, s.source, s.createdAt].map(escape).join(",")),
    ]
    return new Response(rows.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="subscribers-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  }

  const counts = { all: all.length, subscribed: 0, unsubscribed: 0 }
  for (const s of all) counts[s.status]++
  return { ...paginate(filtered, Number(params.get("page") || 1), Number(params.get("pageSize") || 20)), counts }
})

export const DELETE = route({ permission: "subscribers.manage" }, async ({ request, user, ip }) => {
  const { ids } = await parseBody(request, z.object({ ids: z.array(z.string()).min(1).max(1000) }))
  const deleted = await subscribers.remove(ids)
  await audit(user, "subscriber.delete", "subscriber", `Removed ${deleted} subscriber(s)`, { ip })
  return { affected: deleted }
})
