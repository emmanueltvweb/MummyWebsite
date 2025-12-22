"use client"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { HeroSection } from "@/components/sections/hero-section"
import { ServicesSection } from "@/components/sections/services-section"
import { AboutSection } from "@/components/sections/about-pst-evelyn-joshua"
import { TestimonialsSection } from "@/components/sections/testimonials-section"
import { CtaSection } from "@/components/sections/cta-section"
import { ContactSection } from "@/components/sections/contact-section"
import { NewsletterSection } from "@/components/sections/newsletter-section"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        <HeroSection />
      
        {/* <ServicesSection />
        <TestimonialsSection /> */}
      
        {/* <CtaSection /> */}
        <NewsletterSection />
        
      </main>

      <Footer />
    </div>
  )
}
