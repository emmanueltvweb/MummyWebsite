import { Metadata } from "next"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { AboutSection } from "@/components/sections/about-pst-evelyn-joshua"
import SplashCursor from "@/components/SplashCursor"

export const metadata: Metadata = {
  title: "About - Pastor Evelyn Joshua",
  description: "Learn about Pastor Evelyn Onyisi Joshua and the mission of The Synagogue Church of All Nations",
  keywords: "Pastor Evelyn Joshua, Dunamis, SCOAN, Emmanuel TV, Christian ministry",
  openGraph: {
    title: "About - Pastor Evelyn Joshua",
    description: "Learn about Pastor Evelyn Onyisi Joshua and the mission of The Synagogue Church of All Nations",
    type: "website",
  },
}

export default function PastorEvelynJoshuaPage() {
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