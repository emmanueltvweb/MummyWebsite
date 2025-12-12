"use client"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { HeroSection } from "@/components/sections/hero-section"
import { FeaturedSermonSection } from "@/components/sections/featured-sermon-section"
import { ServicesSection } from "@/components/sections/services-section"
import { AboutSection } from "@/components/sections/about-pst-evelyn-joshua"
import { TestimonialsSection } from "@/components/sections/testimonials-section"
import { CtaSection } from "@/components/sections/cta-section"
import { ContactSection } from "@/components/sections/contact-section"
import { NewsletterSection } from "@/components/sections/newsletter-section"
import SplashCursor from "@/components/SplashCursor"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <SplashCursor />
      <Header />

      <main>
        <HeroSection />
        
        {/* Featured Sermon Section - Added to Home Page */}
        <FeaturedSermonSection />
      
  
      
      
        <NewsletterSection />
        
      </main>

      <Footer />
    </div>
  )
}
