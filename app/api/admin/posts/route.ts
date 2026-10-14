import { audit } from "@/lib/server/audit"
import { parseBody, route } from "@/lib/server/api"
import { assertCanSetStatus } from "@/lib/cms/permissions"
import { allPosts, buildPost, filterPosts, paginate, resolveAuthor, type PostQuery } from "@/lib/cms/posts"
import { postInput } from "@/lib/cms/schemas"
import { posts } from "@/lib/cms/store"
import type { PostStatus } from "@/lib/cms/types"

export const GET = route({ permission: "blog.view" }, async ({ request }) => {
  const params = new URL(request.url).searchParams
  const query: PostQuery = {
    search: params.get("search") || undefined,
    status: (params.get("status") as PostStatus | "all") || "all",
    categoryId: params.get("category") || undefined,
    authorId: params.get("author") || undefined,
    tag: params.get("tag") || undefined,
    from: params.get("from") || undefined,
    to: params.get("to") || undefined,
    sort: (params.get("sort") as PostQuery["sort"]) || "newest",
  }
  const all = await allPosts()
  const result = paginate(filterPosts(all, query), Number(params.get("page") || 1), Number(params.get("pageSize") || 12))

  const counts = { all: all.length, draft: 0, scheduled: 0, published: 0, archived: 0 }
  for (const post of all) counts[post.status]++
  const authors = [...new Map(all.map((p) => [p.authorId, { id: p.authorId, name: p.authorName }])).values()]

  return { ...result, counts, authors }
})

export const POST = route({ permission: "blog.create" }, async ({ request, user, ip }) => {
  const input = await parseBody(request, postInput)
  assertCanSetStatus(user!, input.status)
  const post = await posts.insert(await buildPost(input, await resolveAuthor(input.authorId, user!)))
  await audit(user, "post.create", "post", `Created post “${post.title}” (${post.status})`, { entityId: post.id, ip })
  return post
})
