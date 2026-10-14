import { Metadata } from "next"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { AboutCarousel } from "@/components/sections/about-carousel"
import { getAboutPageContent } from "@/lib/content/page-store"
import SplashCursor from "@/components/SplashCursor"

export const metadata: Metadata = {
  title: "About - Prophet T.B. Joshua",
  description: "Learn about Prophet Temitope Balogun Joshua, founder of The Synagogue Church of All Nations and Emmanuel TV",
  keywords: "T.B. Joshua, Prophet T.B. Joshua, SCOAN, Emmanuel TV, Nigerian prophet, healing ministry",
  openGraph: {
    title: "About - Prophet T.B. Joshua",
    description: "Learn about Prophet Temitope Balogun Joshua, founder of The Synagogue Church of All Nations and Emmanuel TV",
    type: "website",
  },
}

// Content is edited in Admin → Pages.
export const dynamic = "force-dynamic"

export default async function TBJoshuaPage() {
  const content = await getAboutPageContent("tb-joshua")

  return (
    <div className="min-h-screen bg-background">
      <SplashCursor />
      <Header />
      <main>
        <AboutCarousel content={content} sectionId="about-tb-joshua" label="About Prophet T.B. Joshua" />
      </main>
      <Footer />
    </div>
  )
}