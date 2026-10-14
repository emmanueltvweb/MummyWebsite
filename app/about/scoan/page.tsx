import { Metadata } from "next"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { AboutCarousel } from "@/components/sections/about-carousel"
import { getAboutPageContent } from "@/lib/content/page-store"
import SplashCursor from "@/components/SplashCursor"

export const metadata: Metadata = {
  title: "About - The SCOAN",
  description: "Learn about The Synagogue, Church of All Nations (SCOAN), the international Christian ministry founded by Prophet T.B. Joshua",
  keywords: "SCOAN, Synagogue Church of All Nations, T.B. Joshua, Lagos church, healing ministry, international ministry",
  openGraph: {
    title: "About - The SCOAN",
    description: "Learn about The Synagogue, Church of All Nations (SCOAN), the international Christian ministry founded by Prophet T.B. Joshua",
    type: "website",
  },
}

// Content is edited in Admin → Pages.
export const dynamic = "force-dynamic"

export default async function SCOANPage() {
  const content = await getAboutPageContent("scoan")

  return (
    <div className="min-h-screen bg-background">
      <SplashCursor />
      <Header />
      <main>
        <AboutCarousel content={content} sectionId="about-scoan" label="About The Synagogue, Church Of All Nations" />
      </main>
      <Footer />
    </div>
  )
}