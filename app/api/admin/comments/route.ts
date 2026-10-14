import { audit } from "@/lib/server/audit"
import { parseBody, route } from "@/lib/server/api"
import { paginate } from "@/lib/cms/posts"
import { commentModeration } from "@/lib/cms/schemas"
import { comments, posts } from "@/lib/cms/store"
import type { CommentStatus } from "@/lib/cms/types"

export const GET = route({ permission: "comments.view" }, async ({ request }) => {
  const params = new URL(request.url).searchParams
  const status = params.get("status") as CommentStatus | "all" | null
  const search = params.get("search")?.toLowerCase()
  const [all, allPosts] = await Promise.all([comments.all(), posts.all()])
  const postsById = new Map(allPosts.map((p) => [p.id, { title: p.title, slug: p.slug }]))

  const filtered = all
    .filter((c) => !status || status === "all" || c.status === status)
    .filter((c) => !search || `${c.authorName} ${c.authorEmail} ${c.content}`.toLowerCase().includes(search))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .map(({ ip, ...c }) => ({ ...c, post: postsById.get(c.postId) ?? null }))

  const counts = { all: all.length, pending: 0, approved: 0, spam: 0 }
  for (const c of all) counts[c.status]++

  return { ...paginate(filtered, Number(params.get("page") || 1), Number(params.get("pageSize") || 15)), counts }
})

export const POST = route({ permission: "comments.moderate" }, async ({ request, user, ip }) => {
  const { ids, action } = await parseBody(request, commentModeration)
  const idSet = new Set(ids)
  if (action === "delete") {
    const deleted = await comments.remove(ids)
    await audit(user, "comment.delete", "comment", `Deleted ${deleted} comment(s)`, { ip })
    return { affected: deleted }
  }
  const status: CommentStatus = action === "approve" ? "approved" : action
  const now = new Date().toISOString()
  let affected = 0
  await comments.mutate((items) =>
    items.map((c) => {
      if (!idSet.has(c.id)) return c
      affected++
      return { ...c, status, updatedAt: now }
    })
  )
  await audit(user, `comment.${action}`, "comment", `Marked ${affected} comment(s) as ${status}`, { ip })
  return { affected }
})
