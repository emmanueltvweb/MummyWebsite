import { Metadata } from "next"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { AboutCarousel } from "@/components/sections/about-carousel"
import { getAboutPageContent } from "@/lib/content/page-store"
import SplashCursor from "@/components/SplashCursor"

export const metadata: Metadata = {
  title: "About - Emmanuel TV",
  description: "Learn about Emmanuel TV, the Christian television network broadcasting from The Synagogue Church of All Nations",
  keywords: "Emmanuel TV, Christian television, T.B. Joshua, SCOAN, healing ministry, Christian broadcasting",
  openGraph: {
    title: "About - Emmanuel TV",
    description: "Learn about Emmanuel TV, the Christian television network broadcasting from The Synagogue Church of All Nations",
    type: "website",
  },
}

// Content is edited in Admin → Pages.
export const dynamic = "force-dynamic"

export default async function EmmanuelTVPage() {
  const content = await getAboutPageContent("emmanuel-tv")

  return (
    <div className="min-h-screen bg-background">
      <SplashCursor />
      <Header />
      <main>
        <AboutCarousel content={content} sectionId="about-emmanuel-tv" label="About Emmanuel TV" />
      </main>
      <Footer />
    </div>
  )
}