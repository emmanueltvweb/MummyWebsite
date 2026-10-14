import type { Metadata } from "next"
import Link from "next/link"
import { format } from "date-fns"
import { ArrowRight, BookOpen, ChevronLeft, ChevronRight, Clock } from "lucide-react"

import { Container } from "@/components/layout/container"
import { Footer } from "@/components/layout/footer"
import { Header } from "@/components/layout/header"
import { Reveal } from "@/components/ui/reveal"
import { optimizeCloudinaryUrl } from "@/lib/cloudinary/optimize"
import { postCoverImage } from "@/lib/cms/cover"
import { allPosts, filterPosts, paginate, postExcerpt } from "@/lib/cms/posts"
import { categories as categoryStore, settings } from "@/lib/cms/store"
import { getPageContent } from "@/lib/content/page-store"
import type { Category, Post } from "@/lib/cms/types"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Blog - Pastor Evelyn Joshua",
  description: "Articles, reflections and ministry updates from Pastor Evelyn Joshua.",
  alternates: { canonical: "/blog" },
}

function PostCard({ post, categories, priority }: { post: Post; categories: Map<string, Category>; priority?: boolean }) {
  const category = post.categoryIds.map((id) => categories.get(id)).find(Boolean)
  const cover = postCoverImage(post)
  return (
    <article className={`group flex h-full overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl flex-col`}>
      <Link href={`/blog/${post.slug}`} className="relative block aspect-[16/10] overflow-hidden bg-muted" tabIndex={-1} aria-hidden>
        {cover ? (
          <>
            <img
              src={optimizeCloudinaryUrl(cover, { width: 800, height: 500, crop: "fill", gravity: "north" })}
              alt=""
              loading={priority ? "eager" : "lazy"}
              className="absolute inset-0 size-full object-cover object-top transition duration-700 group-hover:scale-105"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" aria-hidden />
          </>
        ) : (
          <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/15 to-accent/25">
            <BookOpen className="size-12 text-primary/30" />
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-6">
        {category && (
          <span className="mb-3 w-fit rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase" style={{ background: `${category.color}1a`, color: category.color }}>
            {category.name}
          </span>
        )}
        <h2 className="line-clamp-2 text-xl font-bold tracking-tight text-primary">
          <Link href={`/blog/${post.slug}`} className="hover:text-accent">
            {post.title}
          </Link>
        </h2>
        <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-foreground/70">{postExcerpt(post)}</p>
        <div className="mt-5 flex items-center justify-between text-sm text-foreground/60">
          <span>
            {format(new Date(post.publishedAt ?? post.createdAt), "d MMM yyyy")} · <Clock className="inline size-3.5" /> {post.readingMinutes} min
          </span>
          <Link href={`/blog/${post.slug}`} className="inline-flex items-center gap-1 font-semibold text-primary group-hover:text-accent" aria-label={`Read ${post.title}`}>
            Read <ArrowRight className="size-4 transition group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </article>
  )
}

export default async function BlogPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams
  const [posts, categoryList, site, heading] = await Promise.all([allPosts(), categoryStore.all(), settings.get(), getPageContent("blog")])
  const activeCategory = categoryList.find((c) => c.slug === sp.category)
  const published = posts.filter((p) => p.status === "published")
  const filtered = filterPosts(published, { categoryId: activeCategory?.id, tag: sp.tag, search: sp.q, sort: "newest" })
  const page = paginate(filtered, Number(sp.page || 1), site.blog.postsPerPage)
  const byId = new Map(categoryList.map((c) => [c.id, c]))
  const usedCategories = categoryList.filter((c) => published.some((p) => p.categoryIds.includes(c.id)))

  const link = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams()
    const merged = { category: sp.category, tag: sp.tag, q: sp.q, ...updates }
    for (const [k, v] of Object.entries(merged)) if (v) params.set(k, v)
    const qs = params.toString()
    return `/blog${qs ? `?${qs}` : ""}`
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-28 pb-20 md:pt-36">
        <Container>
          <header className="mx-auto max-w-2xl text-center">
            {heading.label && <Reveal as="p" variant="fade" className="text-sm font-semibold tracking-[0.2em] text-accent uppercase">{heading.label}</Reveal>}
            <Reveal as="h1" variant="up" delay={120} className="mt-3 text-4xl font-bold tracking-tight text-primary md:text-5xl">
              {heading.title} {heading.titleHighlight && <span className="text-accent">{heading.titleHighlight}</span>}
            </Reveal>
            {heading.subtitle && <Reveal as="p" variant="up" delay={220} className="mt-4 text-lg text-foreground/70">{heading.subtitle}</Reveal>}
          </header>

          <Reveal as="form" variant="up" delay={320} action="/blog" className="mx-auto mt-8 flex max-w-md gap-2" role="search">
            <input type="search" name="q" defaultValue={sp.q} placeholder="Search articles…" aria-label="Search articles" className="h-11 flex-1 rounded-full border border-border bg-card px-5 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" />
            <button type="submit" className="h-11 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground">Search</button>
          </Reveal>

          {usedCategories.length > 0 && (
            <Reveal as="nav" variant="up" delay={400} aria-label="Categories" className="mt-8 flex flex-wrap justify-center gap-2">
              <Link href={link({ category: undefined, page: undefined })} className={`rounded-full px-4 py-2 text-sm font-medium transition ${!activeCategory ? "bg-accent text-accent-foreground shadow-md" : "bg-muted text-foreground/70 hover:bg-accent/20"}`}>
                All
              </Link>
              {usedCategories.map((c) => (
                <Link key={c.id} href={link({ category: c.slug, page: undefined })} className={`rounded-full px-4 py-2 text-sm font-medium transition ${activeCategory?.id === c.id ? "bg-accent text-accent-foreground shadow-md" : "bg-muted text-foreground/70 hover:bg-accent/20"}`}>
                  {c.name}
                </Link>
              ))}
            </Reveal>
          )}

          {(sp.tag || sp.q) && (
            <p className="mt-6 text-center text-sm text-foreground/60">
              {sp.tag && <>Tagged <strong>#{sp.tag}</strong> </>}
              {sp.q && <>Results for <strong>“{sp.q}”</strong> </>}· <Link href="/blog" className="font-semibold text-primary underline">Clear</Link>
            </p>
          )}

          {page.items.length === 0 ? (
            <Reveal variant="zoom" className="mx-auto mt-16 max-w-md rounded-3xl border border-dashed border-border p-12 text-center">
              <BookOpen className="mx-auto size-10 text-accent" />
              <h2 className="mt-4 text-xl font-semibold text-primary">No articles yet</h2>
              <p className="mt-2 text-foreground/60">{published.length ? "Nothing matches your search — try another term." : "New articles are on their way. Please check back soon."}</p>
            </Reveal>
          ) : (
            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {page.items.map((post, i) => (
                // Cards rise in as they scroll into view, staggered across each row.
                <Reveal key={post.id} variant="up" delay={(i % 3) * 120}>
                  <PostCard post={post} categories={byId} priority={i < 3} />
                </Reveal>
              ))}
            </div>
          )}

          {page.pageCount > 1 && (
            <nav aria-label="Pagination" className="mt-14 flex items-center justify-center gap-2">
              {page.page > 1 && (
                <Link href={link({ page: String(page.page - 1) })} className="flex size-10 items-center justify-center rounded-full border border-border hover:bg-muted" aria-label="Previous page">
                  <ChevronLeft className="size-4" />
                </Link>
              )}
              {Array.from({ length: page.pageCount }, (_, i) => i + 1).map((n) => (
                <Link key={n} href={link({ page: String(n) })} aria-current={n === page.page ? "page" : undefined} className={`flex size-10 items-center justify-center rounded-full text-sm font-semibold ${n === page.page ? "bg-primary text-primary-foreground" : "border border-border hover:bg-muted"}`}>
                  {n}
                </Link>
              ))}
              {page.page < page.pageCount && (
                <Link href={link({ page: String(page.page + 1) })} className="flex size-10 items-center justify-center rounded-full border border-border hover:bg-muted" aria-label="Next page">
                  <ChevronRight className="size-4" />
                </Link>
              )}
            </nav>
          )}
        </Container>
      </main>
      <Footer />
    </div>
  )
}
