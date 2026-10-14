import { audit } from "@/lib/server/audit"
import { notFound, parseBody, route } from "@/lib/server/api"
import { assertCanEditPost, assertCanSetStatus } from "@/lib/cms/permissions"
import { buildPost, promoteDuePosts, resolveAuthor } from "@/lib/cms/posts"
import { postInput } from "@/lib/cms/schemas"
import { comments, posts } from "@/lib/cms/store"

type Params = { id: string }

export const GET = route<Params>({ permission: "blog.view" }, async ({ params }) => {
  await promoteDuePosts()
  const post = await posts.get(params.id)
  if (!post) throw notFound("Post")
  return post
})

export const PUT = route<Params>({ permission: ["blog.create", "blog.edit_any"] }, async ({ request, params, user, ip }) => {
  const existing = await posts.get(params.id)
  if (!existing) throw notFound("Post")
  assertCanEditPost(user!, existing)
  const input = await parseBody(request, postInput)
  if (input.status !== existing.status) assertCanSetStatus(user!, input.status)
  const updated = await posts.update(existing.id, await buildPost(input, await resolveAuthor(input.authorId, user!, existing), existing))
  const change = input.status !== existing.status ? ` (${existing.status} → ${input.status})` : ""
  await audit(user, "post.update", "post", `Updated post “${updated!.title}”${change}`, { entityId: existing.id, ip })
  return updated
})

export const DELETE = route<Params>({ permission: "blog.delete" }, async ({ params, user, ip }) => {
  const existing = await posts.get(params.id)
  if (!existing) throw notFound("Post")
  await posts.remove(existing.id)
  await comments.mutate((items) => items.filter((c) => c.postId !== existing.id))
  await audit(user, "post.delete", "post", `Deleted post “${existing.title}”`, { entityId: existing.id, ip })
  return { deleted: 1 }
})
