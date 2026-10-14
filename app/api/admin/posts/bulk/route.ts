import { audit } from "@/lib/server/audit"
import { ApiError, parseBody, route } from "@/lib/server/api"
import { can } from "@/lib/server/auth"
import { bulkPostAction } from "@/lib/cms/schemas"
import { comments, posts } from "@/lib/cms/store"
import type { PostStatus } from "@/lib/cms/types"

const STATUS_FOR: Record<string, PostStatus> = {
  publish: "published",
  unpublish: "draft",
  draft: "draft",
  archive: "archived",
}

export const POST = route({ permission: ["blog.publish", "blog.delete"] }, async ({ request, user, ip }) => {
  const { ids, action } = await parseBody(request, bulkPostAction)
  if (!can(user, action === "delete" ? "blog.delete" : "blog.publish")) {
    throw new ApiError(403, "You don't have permission to do that.", "FORBIDDEN")
  }
  const idSet = new Set(ids)

  if (action === "delete") {
    const deleted = await posts.remove(ids)
    await comments.mutate((items) => items.filter((c) => !idSet.has(c.postId)))
    await audit(user, "post.bulk_delete", "post", `Deleted ${deleted} post(s)`, { ip })
    return { affected: deleted }
  }

  const status = STATUS_FOR[action]
  const now = new Date().toISOString()
  let affected = 0
  await posts.mutate((items) =>
    items.map((post) => {
      if (!idSet.has(post.id)) return post
      affected++
      return {
        ...post,
        status,
        scheduledAt: null,
        publishedAt: status === "published" ? post.publishedAt ?? now : status === "draft" ? null : post.publishedAt,
        updatedAt: now,
      }
    })
  )
  await audit(user, `post.bulk_${action}`, "post", `Set ${affected} post(s) to ${status}`, { ip })
  return { affected }
})
