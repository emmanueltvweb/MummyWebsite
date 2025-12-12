import { Metadata } from "next"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { FeaturedSermonSection } from "@/components/sections/featured-sermon-section"
import { AudioPlaylistSection } from "@/components/sections/audio-playlist-section"
import { VideoGallery } from "@/components/video-gallery"
import SplashCursor from "@/components/SplashCursor"

export const metadata: Metadata = {
  title: "Sermons | Evelyn Joshua Ministry",
  description: "Listen to powerful sermons, teachings, and devotional messages from Pastor Evelyn Joshua and guest speakers.",
}

export default function SermonPage() {
  return (
    <div className="min-h-screen bg-background">
      <SplashCursor />
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="relative 'bg-gradient-to-br' from-primary/5 via-transparent to-accent/5 pt-20 pb-12 sm:pt-32 sm:pb-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-sm font-semibold text-primary/80 tracking-widest uppercase mb-4">
              Messages
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-primary mb-6">
              Sermons & <span className="text-accent">Teachings</span>
            </h1>
            <p className="text-lg sm:text-xl text-foreground/70 max-w-2xl mx-auto">
              Discover powerful messages that will inspire, encourage, and strengthen your faith journey.
            </p>
          </div>
        </section>

        {/* Featured Sermon Section */}
        <FeaturedSermonSection />
        
        {/* Video Gallery Section - Additional Sermons */}
        <section className="py-16 bg-gradient-to-b from-background to-muted/20">
          <VideoGallery
            title="More Sermons"
            subtitle="Discover powerful messages that will transform your life"
            className=""
          />
        </section>
        
        {/* Audio Playlist Section */}
        <AudioPlaylistSection />
      </main>

      <Footer />
    </div>
  )
}