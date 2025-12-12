import { Metadata } from "next"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { AboutSection } from "@/components/sections/about-pst-evelyn-joshua"
import SplashCursor from "@/components/SplashCursor"

export const metadata: Metadata = {
  title: "About - Dunamis International Gospel Centre",
  description: "Learn about Pastor Evelyn Onyisi Joshua and the mission of Dunamis International Gospel Centre",
  keywords: "Pastor Evelyn Joshua, Dunamis, SCOAN, Emmanuel TV, Christian ministry",
  openGraph: {
    title: "About - Dunamis International Gospel Centre",
    description: "Learn about Pastor Evelyn Onyisi Joshua and the mission of Dunamis International Gospel Centre",
    type: "website",
  },
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <SplashCursor />
      <Header />
      <main>
        <AboutSection />
      </main>
      <Footer />
    </div>
  )
}