import { Metadata } from "next"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { AboutSCOAN } from "@/components/sections/about-scoan"
import SplashCursor from "@/components/SplashCursor"

export const metadata: Metadata = {
  title: "The SCOAN - Dunamis International Gospel Centre",
  description: "Learn about The Synagogue, Church Of All Nations (SCOAN) - its history, ministry, and global impact",
  keywords: "SCOAN, Synagogue Church All Nations, ministry, healing, deliverance, Christian church",
  openGraph: {
    title: "The SCOAN - Dunamis International Gospel Centre",
    description: "Learn about The Synagogue, Church Of All Nations (SCOAN) - its history, ministry, and global impact",
    type: "website",
  },
}

export default function SCOANPage() {
  return (
    <div className="min-h-screen bg-background">
      <SplashCursor />
      <Header />
      <main>
        <AboutSCOAN />
      </main>
      <Footer />
    </div>
  )
}