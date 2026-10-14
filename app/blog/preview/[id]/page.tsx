import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { Eye } from "lucide-react"

import { BlogArticle } from "@/components/blog/blog-article"
import { Footer } from "@/components/layout/footer"
import { Header } from "@/components/layout/header"
import { can, getSessionUser } from "@/lib/server/auth"
import { categories, posts } from "@/lib/cms/store"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Preview", robots: { index: false, follow: false } }

/** Signed-in staff can preview any post (drafts, scheduled, archived) exactly as it will look. */
export default async function PreviewPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getSessionUser()
  if (!user) redirect(`/admin/login?next=${encodeURIComponent(`/admin/posts/${id}`)}`)
  const post = await posts.get(id)
  if (!post) notFound()
  if (!can(user, "blog.view") || (!can(user, "blog.edit_any") && post.authorId !== user.id)) notFound()

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-x-0 bottom-4 z-[60] mx-auto flex w-fit items-center gap-3 rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground shadow-2xl">
        <Eye className="size-4 text-accent" />
        <span>
          Preview · <strong className="capitalize">{post.status}</strong>
        </span>
        <a href={`/admin/posts/${post.id}`} className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
          Back to editor
        </a>
      </div>
      <Header />
      <main>
        <BlogArticle post={post} categories={await categories.all()} />
      </main>
      <Footer />
    </div>
  )
}
