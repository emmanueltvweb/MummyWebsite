import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { FeaturedSermonSection } from "@/components/sections/featured-sermon-section"
import { VideoGallery } from "@/components/video-gallery"
import SplashCursor from "@/components/SplashCursor"

/**
 * Sermon Page with Integrated Video Gallery
 * 
 * This page demonstrates the integration of the VideoGallery component
 * below the Featured Sermon section, maintaining visual consistency
 * with the existing design system.
 */
export default function SermonPage() {
  return (
    <div className="min-h-screen bg-background">
      <SplashCursor />
      <Header />

      <main>
        {/* Featured Sermon Section */}
        <FeaturedSermonSection />

        {/* Video Gallery Section - Added Below Featured Sermon */}
        <section className="py-16 bg-gradient-to-b from-background to-muted/20">
          <VideoGallery
            title="More Sermons"
            subtitle="Discover powerful messages that will transform your life"
            className=""
          />
        </section>
      </main>

      <Footer />
    </div>
  )
}