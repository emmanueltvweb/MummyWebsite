import { Metadata } from "next"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { AboutTBJoshua } from "@/components/sections/about-tb-joshua"
import SplashCursor from "@/components/SplashCursor"

export const metadata: Metadata = {
  title: "Prophet T.B. Joshua - Dunamis International Gospel Centre",
  description: "Discover Prophet T.B. Joshua's legacy, teachings, and impact on global ministry",
  keywords: "TB Joshua, Prophet TB Joshua, SCOAN, Emmanuel TV, Christian ministry, legacy",
  openGraph: {
    title: "Prophet T.B. Joshua - Dunamis International Gospel Centre",
    description: "Discover Prophet T.B. Joshua's legacy, teachings, and impact on global ministry",
    type: "website",
  },
}

export default function TBJoshuaPage() {
  return (
    <div className="min-h-screen bg-background">
      <SplashCursor />
      <Header />
      <main>
        <AboutTBJoshua />
      </main>
      <Footer />
    </div>
  )
}