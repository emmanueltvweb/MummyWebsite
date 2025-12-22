import { Metadata } from "next"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { AboutSCOANSection } from "@/components/sections/about-scoan"
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

export default function SCOANPage() {
  return (
    <div className="min-h-screen bg-background">
      <SplashCursor />
      <Header />
      <main>
        <AboutSCOANSection />
      </main>
      <Footer />
    </div>
  )
}