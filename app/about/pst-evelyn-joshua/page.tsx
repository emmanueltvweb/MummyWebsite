import { Metadata } from "next"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { AboutCarousel } from "@/components/sections/about-carousel"
import { getAboutPageContent } from "@/lib/content/page-store"
import SplashCursor from "@/components/SplashCursor"

export const metadata: Metadata = {
  title: "About - Pastor Evelyn Joshua",
  description: "Learn about Pastor Evelyn Onyisi Joshua and the mission of The Synagogue Church of All Nations",
  keywords: "Pastor Evelyn Joshua, SCOAN, Emmanuel TV, Christian ministry",
  openGraph: {
    title: "About - Pastor Evelyn Joshua",
    description: "Learn about Pastor Evelyn Onyisi Joshua and the mission of The Synagogue Church of All Nations",
    type: "website",
  },
}

// Content is edited in Admin → Pages.
export const dynamic = "force-dynamic"

export default async function PastorEvelynJoshuaPage() {
  const content = await getAboutPageContent("pst-evelyn-joshua")

  return (
    <div className="min-h-screen bg-background">
      <SplashCursor />
      <Header />
      <main>
        <AboutCarousel content={content} sectionId="about" label="About Pastor Evelyn Joshua" variant="boxed" />
      </main>
      <Footer />
    </div>
  )
}