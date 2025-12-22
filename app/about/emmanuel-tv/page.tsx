import { Metadata } from "next"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { AboutEmmanuelTVSection } from "@/components/sections/about-emmanuel-tv"
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

export default function EmmanuelTVPage() {
  return (
    <div className="min-h-screen bg-background">
      <SplashCursor />
      <Header />
      <main>
        <AboutEmmanuelTVSection />
      </main>
      <Footer />
    </div>
  )
}