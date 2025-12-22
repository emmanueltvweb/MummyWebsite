import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { ChurchLocation } from "@/components/visit/church-location"
import { ImageCarousel } from "@/components/visit/image-carousel"
import { EnhancedMap } from "@/components/visit/enhanced-map"

export default function VisitPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-primary/10 to-accent/10 py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Visit The SCOAN
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Experience the presence of God at The Synagogue, Church Of All Nations. 
              We welcome you to join us for worship, prayer, and fellowship.
            </p>
          </div>
        </section>

        {/* Church Location Section */}
        <ChurchLocation />

        {/* Image Carousel Section */}
        <section className="py-16 bg-background">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-foreground text-center mb-12">
              Church Gallery
            </h2>
            <ImageCarousel />
          </div>
        </section>

        {/* Enhanced Map Section */}
        <EnhancedMap />
      </main>

      <Footer />
    </div>
  )
}