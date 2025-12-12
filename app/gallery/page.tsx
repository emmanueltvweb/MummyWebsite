import { Metadata } from "next"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { GalleryHeader } from "@/components/sections/gallery-header"
import { GalleryContent } from "@/components/sections/gallery-content"
import SplashCursor from "@/components/SplashCursor"

export const metadata: Metadata = {
  title: "Crusade/Outreach | Gallery",
  description: "Explore our ministry gallery featuring crusades, outreach programs, and community service events.",
}

export default function GalleryPage() {
  return (
    <div className="min-h-screen bg-background">
      <SplashCursor />
      <Header />
      
      <main>
        <GalleryHeader 
          title="Crusade & Outreach" 
          subtitle="Witness the impact of our ministry through powerful images and moments captured during our crusades and community outreach programs."
          label="Gallery"
        />
        
        <GalleryContent />
      </main>

      <Footer />
    </div>
  )
}