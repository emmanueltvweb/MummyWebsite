import { Metadata } from "next"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { AboutPstEvelynJoshua } from "@/components/sections/about-pst-evelyn-joshua"
import SplashCursor from "@/components/SplashCursor"

export const metadata: Metadata = {
  title: "Pastor Evelyn Joshua - Dunamis International Gospel Centre",
  description: "Learn about Pastor Evelyn Onyisi Joshua's life, ministry, and leadership at Dunamis International Gospel Centre",
  keywords: "Pastor Evelyn Joshua, Dunamis, Christian ministry, leadership, SCOAN",
  openGraph: {
    title: "Pastor Evelyn Joshua - Dunamis International Gospel Centre",
    description: "Learn about Pastor Evelyn Onyisi Joshua's life, ministry, and leadership at Dunamis International Gospel Centre",
    type: "website",
  },
}

export default function PstEvelynJoshuaPage() {
  return (
    <div className="min-h-screen bg-background">
      <SplashCursor />
      <Header />
      <main>
        <AboutPstEvelynJoshua />
      </main>
      <Footer />
    </div>
  )
}