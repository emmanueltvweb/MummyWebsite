import { route } from "@/lib/server/api"
import { rateLimit } from "@/lib/server/rate-limit"
import { posts } from "@/lib/cms/store"

/** Counts a page view – at most once per visitor per post every 30 minutes. */
export const POST = route<{ slug: string }>({ auth: false }, async ({ params, ip, user }) => {
  const post = await posts.find((p) => p.slug === params.slug && p.status === "published")
  if (!post || user) return { counted: false } // don't count admins previewing
  if (!rateLimit(`view:${post.id}:${ip}`, 1, 30 * 60_000).ok) return { counted: false }
  await posts.update(post.id, { views: post.views + 1 })
  return { counted: true }
})
