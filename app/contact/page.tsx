import { Metadata } from "next"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { ContactSection } from "@/components/sections/contact-section"

export const metadata: Metadata = {
  title: "Contact - Pastor Evelyn Joshua",
  description: "Get in touch with the ministry. Send us a message or find our contact details.",
  keywords: "Contact, Pastor Evelyn Joshua, SCOAN, Emmanuel TV",
  openGraph: {
    title: "Contact - Pastor Evelyn Joshua",
    description: "Get in touch with the ministry. Send us a message or find our contact details.",
    type: "website",
  },
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <ContactSection />
      </main>
      <Footer />
    </div>
  )
}