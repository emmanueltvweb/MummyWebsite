import Link from "next/link"
import { format } from "date-fns"
import { ArrowLeft, CalendarDays, Clock, Tag } from "lucide-react"

import { Container } from "@/components/layout/container"
import { Reveal } from "@/components/ui/reveal"
import { sanitizeRichText } from "@/lib/cms/html"
import type { Category, Post } from "@/lib/cms/types"

export function BlogArticle({ post, categories, children }: { post: Post; categories: Category[]; children?: React.ReactNode }) {
  const date = post.publishedAt ?? post.scheduledAt ?? post.updatedAt
  const postCategories = categories.filter((c) => post.categoryIds.includes(c.id))

  return (
    <article className="pt-28 pb-20 md:pt-32">
      <Container className="max-w-3xl">
        <Link href="/blog" className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-primary/70 transition hover:text-primary">
          <ArrowLeft className="size-4" /> All articles
        </Link>

        {postCategories.length > 0 && (
          <Reveal variant="fade" className="mb-4 flex flex-wrap gap-2">
            {postCategories.map((c) => (
              <Link key={c.id} href={`/blog?category=${c.slug}`} className="rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase" style={{ background: `${c.color}1a`, color: c.color }}>
                {c.name}
              </Link>
            ))}
          </Reveal>
        )}

        <Reveal as="h1" variant="up" delay={100} className="text-3xl leading-tight font-bold tracking-tight text-primary sm:text-4xl md:text-5xl">{post.title}</Reveal>
        {post.excerpt && <Reveal as="p" variant="up" delay={200} className="mt-5 text-lg leading-relaxed text-foreground/70">{post.excerpt}</Reveal>}

        <Reveal variant="up" delay={300} className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-border pb-6 text-sm text-foreground/60">
          <span className="font-semibold text-foreground">{post.authorName}</span>
          <span className="flex items-center gap-1.5"><CalendarDays className="size-4" /> <time dateTime={date}>{format(new Date(date), "d MMMM yyyy")}</time></span>
          <span className="flex items-center gap-1.5"><Clock className="size-4" /> {post.readingMinutes} min read</span>
        </Reveal>
      </Container>

      {/* The featured image is only used on the blog list cards and for social sharing — not inside the post. */}
      <Container className="mt-10 max-w-3xl">
        <Reveal variant="up" delay={400}>
          <div className="rich-content text-foreground/90" dangerouslySetInnerHTML={{ __html: sanitizeRichText(post.content) }} />
        </Reveal>

        {post.tags.length > 0 && (
          <Reveal variant="up" className="mt-12 flex flex-wrap items-center gap-2 border-t border-border pt-6">
            <Tag className="size-4 text-foreground/50" aria-hidden />
            {post.tags.map((tag) => (
              <Link key={tag} href={`/blog?tag=${encodeURIComponent(tag)}`} className="rounded-full bg-muted px-3 py-1 text-sm text-foreground/70 transition hover:bg-accent/20">
                #{tag}
              </Link>
            ))}
          </Reveal>
        )}

        {children}
      </Container>
    </article>
  )
}
