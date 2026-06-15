"use client"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { HeroSection } from "@/components/sections/hero-section-editable"
import { ContactSection } from "@/components/sections/contact-section"
import { NewsletterSection } from "@/components/sections/newsletter-section"
import { InlineEditWrapper } from "@/components/inline-edit"
import { useState, useEffect } from "react"
import { toast } from "sonner"

interface HomePageData {
  heroTitle?: string
  heroSubtitle?: string
  heroPhrases?: string[]
  heroDescription?: string
  aboutTitle?: string
  aboutContent?: string
  sermonTitle?: string
  sermonContent?: string
}

export default function Home() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [homeData, setHomeData] = useState<HomePageData>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is admin (in production, this would come from auth context/session)
    // For now, we'll enable admin mode by default to demonstrate the functionality
    setIsAdmin(true)

    // Fetch current home page content
    fetchHomeContent()
  }, [])

  const fetchHomeContent = async () => {
    try {
      const response = await fetch('/api/home-content')
      const result = await response.json()
      
      if (result.success) {
        setHomeData(result.data)
      } else {
        console.error('Failed to fetch home content:', result.error)
      }
    } catch (error) {
      console.error('Error fetching home content:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const response = await fetch('/api/home-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: homeData
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Home page updated successfully!')
        return result.data
      } else {
        throw new Error(result.error || 'Failed to save changes')
      }
    } catch (error) {
      console.error('Error saving home content:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save changes')
      throw error
    }
  }

  const handleError = (error: Error) => {
    console.error('Inline edit error:', error)
    toast.error(`Edit error: ${error.message}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading home page...</p>
        </div>
      </div>
    )
  }

  return (
    <InlineEditWrapper
      enabled={isAdmin}
      toolbarPosition="top"
      onSave={handleSave}
      onError={handleError}
    >
      <div className="min-h-screen bg-background">
        <Header />

        <main>
          <HeroSection isAdmin={isAdmin} initialData={homeData} />
        
          {/* <ServicesSection />
          <TestimonialsSection /> */}
        
          {/* <CtaSection /> */}
          <NewsletterSection />
          
        </main>

        <Footer />
      </div>
    </InlineEditWrapper>
  )
}