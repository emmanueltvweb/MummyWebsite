import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { Container } from "@/components/layout/container"
import { Footer } from "@/components/layout/footer"
import { Header } from "@/components/layout/header"
import { Reveal } from "@/components/ui/reveal"
import { optimizeCloudinaryUrl } from "@/lib/cloudinary/optimize"
import { makeExcerpt, sanitizeRichText } from "@/lib/cms/html"
import { pages } from "@/lib/cms/store"

export const dynamic = "force-dynamic"

async function getPage(slug: string) {
  return pages.find((p) => p.slug === slug && p.status === "published")
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const page = await getPage((await params).slug)
  if (!page) return { title: "Page not found" }
  return {
    title: page.seoTitle || page.title,
    description: page.seoDescription || makeExcerpt(page.content, 160),
    alternates: { canonical: `/pages/${page.slug}` },
    openGraph: { title: page.seoTitle || page.title, images: page.featuredImage ? [{ url: page.featuredImage }] : undefined },
  }
}

export default async function CmsPageView({ params }: { params: Promise<{ slug: string }> }) {
  const page = await getPage((await params).slug)
  if (!page) notFound()

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-28 pb-20 md:pt-36">
        <Container className="max-w-3xl">
          <Reveal as="h1" variant="up" className="text-4xl font-bold tracking-tight text-primary md:text-5xl">{page.title}</Reveal>
          <Reveal variant="fade" delay={150}>
            <div className="mt-4 h-1 w-16 rounded-full bg-accent" aria-hidden />
          </Reveal>
        </Container>
        {page.featuredImage && (
          <Container className="mt-10 max-w-5xl">
            <Reveal variant="zoom" delay={200}>
              <img src={optimizeCloudinaryUrl(page.featuredImage, { width: 1600 })} alt="" className="aspect-[21/9] w-full rounded-3xl object-cover shadow-xl" />
            </Reveal>
          </Container>
        )}
        <Container className="mt-10 max-w-3xl">
          <Reveal variant="up" delay={300}>
            <div className="rich-content text-foreground/90" dangerouslySetInnerHTML={{ __html: sanitizeRichText(page.content) }} />
          </Reveal>
        </Container>
      </main>
      <Footer />
    </div>
  )
}
