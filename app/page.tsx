import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { HeroSection } from "@/components/sections/hero-section"
import { HomeSlider } from "@/components/sections/home-slider"
import { NewsletterSection } from "@/components/sections/newsletter-section"
import { slides } from "@/lib/cms/store"

export const dynamic = "force-dynamic"

export default async function Home() {
  // Slides are managed in Admin → Homepage Slider; only enabled ones are shown, in the chosen order.
  const activeSlides = (await slides.all())
    .filter((slide) => slide.enabled)
    .sort((a, b) => a.order - b.order)
    .map(({ id, title, subtitle, description, buttonText, buttonUrl, backgroundImage }) => ({
      id,
      title,
      subtitle,
      description,
      buttonText,
      buttonUrl,
      backgroundImage,
    }))

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        <HeroSection />

        <HomeSlider slides={activeSlides} />

        {/* <ServicesSection />
        <TestimonialsSection /> */}

        {/* <CtaSection /> */}
        <NewsletterSection />
      </main>

      <Footer />
    </div>
  )
}
