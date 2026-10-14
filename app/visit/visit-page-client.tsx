"use client"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { ChurchLocation } from "@/components/visit/church-location"
import { ImageCarousel } from "@/components/visit/image-carousel"
import { EnhancedMap } from "@/components/visit/enhanced-map"
import { useSiteContent } from "@/components/content/site-content-provider"
import { Reveal } from "@/components/ui/reveal"

export default function VisitPageClient() {
  const { content } = useSiteContent()
  const { visit } = content

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-16">
        <section className="relative bg-gradient-to-br from-primary/10 to-accent/10 py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Reveal as="h1" variant="up" className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              {visit.heroTitle}
            </Reveal>
            <Reveal as="p" variant="up" delay={150} className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {visit.heroSubtitle}
            </Reveal>
          </div>
        </section>

        <Reveal variant="up">
          <ChurchLocation />
        </Reveal>

        <section className="py-16 bg-background">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal as="h2" variant="up" className="text-3xl font-bold text-foreground text-center mb-12">
              {visit.gallerySectionTitle}
            </Reveal>
            <Reveal variant="zoom" delay={120}>
              <ImageCarousel />
            </Reveal>
          </div>
        </section>

        <Reveal variant="up">
          <EnhancedMap />
        </Reveal>
      </main>

      <Footer />
    </div>
  )
}
