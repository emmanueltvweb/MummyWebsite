import { Metadata } from "next"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { AboutTBJoshuaSection } from "@/components/sections/about-tb-joshua"
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

export default function TBJoshuaPage() {
  return (
    <div className="min-h-screen bg-background">
      <SplashCursor />
      <Header />
      <main>
        <AboutTBJoshuaSection />
      </main>
      <Footer />
    </div>
  )
}