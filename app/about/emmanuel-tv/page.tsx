import { Metadata } from "next"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { AboutEmmanuelTV } from "@/components/sections/about-emmanuel-tv"
import SplashCursor from "@/components/SplashCursor"

export const metadata: Metadata = {
  title: "Emmanuel TV - Dunamis International Gospel Centre",
  description: "Explore Emmanuel TV's global ministry, programming, and impact on Christian broadcasting",
  keywords: "Emmanuel TV, Christian television, ministry, broadcasting, global ministry",
  openGraph: {
    title: "Emmanuel TV - Dunamis International Gospel Centre",
    description: "Explore Emmanuel TV's global ministry, programming, and impact on Christian broadcasting",
    type: "website",
  },
}

export default function EmmanuelTVPage() {
  return (
    <div className="min-h-screen bg-background">
      <SplashCursor />
      <Header />
      <main>
        <AboutEmmanuelTV />
      </main>
      <Footer />
    </div>
  )
}