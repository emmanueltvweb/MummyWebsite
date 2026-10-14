import { Metadata } from "next"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { FeaturedSermonSection } from "@/components/sections/featured-sermon-section"
import { AudioPlaylistSection } from "@/components/sections/audio-playlist-section"
import { VideoGallery } from "@/components/video-gallery"
import SplashCursor from "@/components/SplashCursor"
import { Reveal } from "@/components/ui/reveal"
import { getPageContent } from "@/lib/content/page-store"

export const metadata: Metadata = {
  title: "Sermons | Evelyn Joshua Ministry",
  description: "Listen to powerful sermons, teachings, and devotional messages from Pastor Evelyn Joshua and guest speakers.",
}

// Content is edited in Admin → Pages → Sermon.
export const dynamic = "force-dynamic"

export default async function SermonPage() {
  const { hero, featured, videos, audio } = await getPageContent("sermon")

  return (
    <div className="min-h-screen bg-background">
      <SplashCursor />
      <Header />

      <main>
        {/* Hero Section */}
        <section className="relative 'bg-gradient-to-br' from-primary/5 via-transparent to-accent/5 pt-20 pb-12 sm:pt-32 sm:pb-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            {hero.label && (
              <Reveal as="p" variant="fade" className="text-sm font-semibold text-primary/80 tracking-widest uppercase mb-4">
                {hero.label}
              </Reveal>
            )}
            <Reveal as="h1" variant="up" delay={120} className="text-4xl sm:text-5xl lg:text-6xl font-bold text-primary mb-6">
              {hero.title} {hero.titleHighlight && <span className="text-accent">{hero.titleHighlight}</span>}
            </Reveal>
            {hero.subtitle && (
              <Reveal as="p" variant="up" delay={240} className="text-lg sm:text-xl text-foreground/70 max-w-2xl mx-auto">
                {hero.subtitle}
              </Reveal>
            )}
          </div>
        </section>

        {/* Featured Sermon Section */}
        <FeaturedSermonSection content={featured} />

        {/* Video Gallery Section - Additional Sermons */}
        {videos.items.length > 0 && (
          <section className="py-16 bg-gradient-to-b from-background to-muted/20">
            <VideoGallery
              title={videos.title}
              subtitle={videos.subtitle}
              videos={videos.items.map((v) => ({ ...v, type: "facebook" as const }))}
              className=""
            />
          </section>
        )}

        {/* Audio Playlist Section */}
        {audio.tracks.length > 0 && <AudioPlaylistSection tracks={audio.tracks} />}
      </main>

      <Footer />
    </div>
  )
}
