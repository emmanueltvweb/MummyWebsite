import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { BlogArticle } from "@/components/blog/blog-article"
import { CommentsSection } from "@/components/blog/comments-section"
import { Footer } from "@/components/layout/footer"
import { Header } from "@/components/layout/header"
import { postCoverImage } from "@/lib/cms/cover"
import { allPosts, postExcerpt } from "@/lib/cms/posts"
import { categories, settings } from "@/lib/cms/store"

export const dynamic = "force-dynamic"

async function getPost(slug: string) {
  return (await allPosts()).find((p) => p.slug === slug && p.status === "published")
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const post = await getPost((await params).slug)
  if (!post) return { title: "Article not found" }
  const description = post.seoDescription || postExcerpt(post)
  return {
    title: post.seoTitle || post.title,
    description,
    keywords: post.metaKeywords.length ? post.metaKeywords : post.tags,
    authors: [{ name: post.authorName }],
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.seoTitle || post.title,
      description,
      publishedTime: post.publishedAt ?? undefined,
      modifiedTime: post.updatedAt,
      authors: [post.authorName],
      tags: post.tags,
      images: postCoverImage(post) ? [{ url: postCoverImage(post), alt: post.featuredImageAlt || post.title }] : undefined,
    },
    twitter: { card: postCoverImage(post) ? "summary_large_image" : "summary" },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const post = await getPost((await params).slug)
  if (!post) notFound()
  const [categoryList, site] = await Promise.all([categories.all(), settings.get()])

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.seoDescription || postExcerpt(post),
    image: postCoverImage(post) || undefined,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: { "@type": "Person", name: post.authorName },
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
        <BlogArticle post={post} categories={categoryList}>
          <CommentsSection slug={post.slug} enabled={site.blog.commentsEnabled} />
        </BlogArticle>
      </main>
      <Footer />
    </div>
  )
}
