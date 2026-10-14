"use client"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { GalleryHeader } from "@/components/sections/gallery-header"
import { GalleryContent } from "@/components/sections/gallery-content"
import { useSiteContent } from "@/components/content/site-content-provider"
import SplashCursor from "@/components/SplashCursor"

export default function GalleryPageClient() {
  const { content } = useSiteContent()
  const { gallery } = content

  return (
    <div className="min-h-screen bg-background">
      <SplashCursor />
      <Header />
      
      <main>
        <GalleryHeader 
          title={gallery.title}
          subtitle={gallery.subtitle}
          label={gallery.label}
        />
        
        <GalleryContent />
      </main>

      <Footer />
    </div>
  )
}
