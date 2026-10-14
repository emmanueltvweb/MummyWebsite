import { route } from "@/lib/server/api"
import { can } from "@/lib/server/auth"
import { categories, comments, pages, posts, slides, subscribers, users } from "@/lib/cms/store"

export interface SearchHit {
  id: string
  type: "post" | "page" | "category" | "comment" | "subscriber" | "user" | "slide"
  title: string
  subtitle: string
  href: string
}

const includes = (value: string | undefined, q: string) => !!value && value.toLowerCase().includes(q)

export const GET = route({ rateLimit: { limit: 120, windowMs: 60_000, key: "admin-search" } }, async ({ request, user }) => {
  const q = new URL(request.url).searchParams.get("q")?.trim().toLowerCase() ?? ""
  if (q.length < 2) return { hits: [] as SearchHit[] }

  const [postList, pageList, categoryList, commentList, subscriberList, userList, slideList] = await Promise.all([
    posts.all(),
    pages.all(),
    categories.all(),
    comments.all(),
    subscribers.all(),
    users.all(),
    slides.all(),
  ])

  // Only search areas the user is allowed to see.
  const allow = <T,>(permission: Parameters<typeof can>[1], items: T[]) => (can(user, permission) ? items : [])

  const hits: SearchHit[] = [
    ...allow("blog.view", postList)
      .filter((p) => includes(p.title, q) || includes(p.slug, q) || p.tags.some((t) => includes(t, q)))
      .map((p) => ({ id: p.id, type: "post" as const, title: p.title, subtitle: `Post · ${p.status}`, href: `/admin/posts/${p.id}` })),
    ...allow("website.view", pageList)
      .filter((p) => includes(p.title, q) || includes(p.slug, q))
      .map((p) => ({ id: p.id, type: "page" as const, title: p.title, subtitle: `Page · /pages/${p.slug}`, href: `/admin/pages/${p.id}` })),
    ...allow("categories.view", categoryList)
      .filter((c) => includes(c.name, q))
      .map((c) => ({ id: c.id, type: "category" as const, title: c.name, subtitle: "Category", href: "/admin/categories" })),
    ...allow("website.view", slideList)
      .filter((s) => includes(s.title, q) || includes(s.subtitle, q))
      .map((s) => ({ id: s.id, type: "slide" as const, title: s.title, subtitle: "Homepage slide", href: "/admin/slider" })),
    ...allow("comments.view", commentList)
      .filter((c) => includes(c.authorName, q) || includes(c.content, q))
      .map((c) => ({
        id: c.id,
        type: "comment" as const,
        title: c.content.slice(0, 80),
        subtitle: `Comment by ${c.authorName}`,
        href: `/admin/comments?search=${encodeURIComponent(c.authorName)}`,
      })),
    ...allow("subscribers.view", subscriberList)
      .filter((s) => includes(s.email, q) || includes(s.name, q))
      .map((s) => ({
        id: s.id,
        type: "subscriber" as const,
        title: s.email,
        subtitle: `Subscriber · ${s.status}`,
        href: `/admin/subscribers?search=${encodeURIComponent(s.email)}`,
      })),
    ...allow("users.view", userList)
      .filter((u) => includes(u.name, q) || includes(u.email, q))
      .map((u) => ({ id: u.id, type: "user" as const, title: u.name, subtitle: `User · ${u.role.replace(/_/g, " ")}`, href: "/admin/users" })),
  ]

  return { hits: hits.slice(0, 30) }
})
