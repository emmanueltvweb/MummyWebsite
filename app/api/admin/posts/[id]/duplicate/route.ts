import { audit } from "@/lib/server/audit"
import { notFound, route } from "@/lib/server/api"
import { uniqueSlug } from "@/lib/cms/html"
import { posts } from "@/lib/cms/store"

export const POST = route<{ id: string }>({ permission: "blog.create" }, async ({ params, user, ip }) => {
  const source = await posts.get(params.id)
  if (!source) throw notFound("Post")
  const slugs = (await posts.all()).map((p) => p.slug)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, createdAt, updatedAt, ...rest } = source
  const copy = await posts.insert({
    ...rest,
    title: `${source.title} (Copy)`,
    slug: uniqueSlug(`${source.slug}-copy`, slugs),
    status: "draft",
    publishedAt: null,
    scheduledAt: null,
    views: 0,
    authorId: user!.id,
    authorName: user!.name,
  })
  await audit(user, "post.duplicate", "post", `Duplicated “${source.title}”`, { entityId: copy.id, ip })
  return copy
})
