import { notify } from "@/lib/server/audit"
import { ApiError, notFound, parseBody, route } from "@/lib/server/api"
import { commentInput } from "@/lib/cms/schemas"
import { comments, posts, settings } from "@/lib/cms/store"

type Params = { slug: string }

async function getPublishedPost(slug: string) {
  const post = await posts.find((p) => p.slug === slug && p.status === "published")
  if (!post) throw notFound("Post")
  return post
}

export const GET = route<Params>({ auth: false }, async ({ params }) => {
  const post = await getPublishedPost(params.slug)
  return (await comments.all())
    .filter((c) => c.postId === post.id && c.status === "approved")
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((c) => ({ id: c.id, authorName: c.authorName, content: c.content, createdAt: c.createdAt }))
})

export const POST = route<Params>(
  { auth: false, rateLimit: { limit: 5, windowMs: 10 * 60_000, key: "blog-comment" } },
  async ({ request, params, ip }) => {
    const { blog } = await settings.get()
    if (!blog.commentsEnabled) throw new ApiError(403, "Comments are closed", "COMMENTS_DISABLED")

    const post = await getPublishedPost(params.slug)
    const input = await parseBody(request, commentInput)
    // Honeypot filled in → silently accept and discard.
    if (input.website) return { status: "pending" }

    const looksSpammy = (input.content.match(/https?:\/\//g) ?? []).length > 2
    const status = looksSpammy ? "spam" : blog.requireCommentApproval ? "pending" : "approved"

    await comments.insert({
      postId: post.id,
      authorName: input.authorName,
      authorEmail: input.authorEmail,
      content: input.content,
      status,
      ip,
    })
    if (status !== "spam") {
      await notify({
        type: "comment",
        title: status === "pending" ? "Comment awaiting approval" : "New comment",
        body: `${input.authorName} commented on “${post.title}”.`,
        href: "/admin/comments?status=pending",
      })
    }
    return { status }
  }
)
