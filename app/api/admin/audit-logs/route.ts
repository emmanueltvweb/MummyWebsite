import { route } from "@/lib/server/api"
import { paginate } from "@/lib/cms/posts"
import { auditLog } from "@/lib/cms/store"

export const GET = route({ permission: "settings.view" }, async ({ request }) => {
  const params = new URL(request.url).searchParams
  const search = params.get("search")?.toLowerCase()
  const entity = params.get("entity")
  const userId = params.get("user")

  const all = await auditLog.all()
  const filtered = all
    .filter((e) => !entity || entity === "all" || e.entityType === entity)
    .filter((e) => !userId || userId === "all" || e.userId === userId)
    .filter((e) => !search || `${e.summary} ${e.userName} ${e.action}`.toLowerCase().includes(search))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const users = [...new Map(all.map((e) => [e.userId, { id: e.userId, name: e.userName }])).values()]
  const entities = [...new Set(all.map((e) => e.entityType))].sort()

  return { ...paginate(filtered, Number(params.get("page") || 1), Number(params.get("pageSize") || 25)), users, entities }
})
