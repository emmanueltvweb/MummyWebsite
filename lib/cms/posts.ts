import "server-only"

import { makeExcerpt, readingMinutes, sanitizeRichText, uniqueSlug } from "./html"

/** The author-written excerpt, or one generated from the content. */
export const postExcerpt = (post: Pick<Post, "excerpt" | "content">) => post.excerpt || makeExcerpt(post.content)
import type { PostInput } from "./schemas"
import { posts, users } from "./store"
import type { Paginated, Post, PostStatus } from "./types"

/**
 * Scheduled posts whose time has come are promoted lazily whenever posts are read,
 * so no background worker/cron is needed.
 */
export async function promoteDuePosts(): Promise<void> {
  const now = Date.now()
  const all = await posts.all()
  const due = all.filter((p) => p.status === "scheduled" && p.scheduledAt && new Date(p.scheduledAt).getTime() <= now)
  if (!due.length) return
  const dueIds = new Set(due.map((p) => p.id))
  await posts.mutate((items) =>
    items.map((p) =>
      dueIds.has(p.id) && p.status === "scheduled"
        ? { ...p, status: "published" as const, publishedAt: p.scheduledAt, updatedAt: new Date().toISOString() }
        : p
    )
  )
}

export async function allPosts(): Promise<Post[]> {
  await promoteDuePosts()
  return posts.all()
}

export interface PostQuery {
  search?: string
  status?: PostStatus | "all"
  categoryId?: string
  authorId?: string
  tag?: string
  from?: string
  to?: string
  sort?: "newest" | "oldest" | "views" | "title"
  page?: number
  pageSize?: number
}

export function filterPosts(items: Post[], query: PostQuery): Post[] {
  const search = query.search?.trim().toLowerCase()
  const from = query.from ? new Date(query.from).getTime() : null
  const to = query.to ? new Date(query.to).getTime() + 86_399_999 : null

  const filtered = items.filter((post) => {
    if (query.status && query.status !== "all" && post.status !== query.status) return false
    if (query.categoryId && !post.categoryIds.includes(query.categoryId)) return false
    if (query.authorId && post.authorId !== query.authorId) return false
    if (query.tag && !post.tags.map((t) => t.toLowerCase()).includes(query.tag.toLowerCase())) return false
    const date = new Date(post.publishedAt ?? post.createdAt).getTime()
    if (from && date < from) return false
    if (to && date > to) return false
    if (search) {
      const haystack = `${post.title} ${post.excerpt} ${post.tags.join(" ")} ${post.authorName}`.toLowerCase()
      if (!haystack.includes(search)) return false
    }
    return true
  })

  const sortDate = (p: Post) => new Date(p.publishedAt ?? p.createdAt).getTime()
  switch (query.sort) {
    case "oldest":
      return filtered.sort((a, b) => sortDate(a) - sortDate(b))
    case "views":
      return filtered.sort((a, b) => b.views - a.views)
    case "title":
      return filtered.sort((a, b) => a.title.localeCompare(b.title))
    default:
      return filtered.sort((a, b) => sortDate(b) - sortDate(a))
  }
}

export function paginate<T>(items: T[], page = 1, pageSize = 12): Paginated<T> {
  const size = Math.min(Math.max(pageSize, 1), 100)
  const pageCount = Math.max(1, Math.ceil(items.length / size))
  const current = Math.min(Math.max(page, 1), pageCount)
  return {
    items: items.slice((current - 1) * size, current * size),
    total: items.length,
    page: current,
    pageSize: size,
    pageCount,
  }
}

/** Maps validated input to a persisted post shape, deriving slug/excerpt/reading time/publish dates. */
export async function buildPost(
  input: PostInput,
  author: { id: string; name: string },
  existing?: Post
): Promise<Omit<Post, "id" | "createdAt" | "updatedAt">> {
  const content = sanitizeRichText(input.content)
  const others = (await posts.all()).filter((p) => p.id !== existing?.id).map((p) => p.slug)
  const slug = uniqueSlug(input.slug || existing?.slug || input.title, others)

  let publishedAt = existing?.publishedAt ?? null
  if (input.status === "published" && !publishedAt) publishedAt = new Date().toISOString()
  if (input.status === "draft") publishedAt = null

  return {
    title: input.title,
    slug,
    excerpt: input.excerpt,
    content,
    featuredImage: input.featuredImage,
    featuredImageAlt: input.featuredImageAlt,
    categoryIds: [...new Set(input.categoryIds)],
    tags: [...new Set(input.tags.map((t) => t.trim()))],
    authorId: author.id,
    authorName: author.name,
    status: input.status,
    publishedAt,
    scheduledAt: input.status === "scheduled" ? input.scheduledAt ?? null : null,
    seoTitle: input.seoTitle,
    seoDescription: input.seoDescription,
    metaKeywords: input.metaKeywords,
    views: existing?.views ?? 0,
    readingMinutes: readingMinutes(content),
  }
}

/**
 * Works out who the post should be attributed to: editors may pick any active user,
 * otherwise the existing author is kept (or the current user for new posts).
 */
export async function resolveAuthor(
  requestedId: string | undefined,
  user: { id: string; name: string; permissions: Set<string> },
  existing?: Post
): Promise<{ id: string; name: string }> {
  if (requestedId && user.permissions.has("blog.edit_any") && requestedId !== existing?.authorId) {
    const target = await users.get(requestedId)
    if (target && target.status === "active") return { id: target.id, name: target.name }
  }
  if (existing) return { id: existing.authorId, name: existing.authorName }
  return { id: user.id, name: user.name }
}

export function isPubliclyVisible(post: Post) {
  return post.status === "published"
}
