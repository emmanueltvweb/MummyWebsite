"use client"

import { Container } from "@/components/layout/container"
import { useInView } from "@/hooks/use-in-view"
import { Heart } from "lucide-react"

export function CtaSection() {
  const { ref, isInView } = useInView({ threshold: 0.3 })

  return (
    <section
      ref={ref}
      className="py-20 md:py-32 bg-gradient-to-r from-primary via-primary/95 to-primary text-primary-foreground relative overflow-hidden"
    >
      {/* Decorative Elements */}
      <div className="absolute top-10 right-20 w-40 h-40 bg-accent/10 rounded-full blur-3xl opacity-20" />
      <div className="absolute bottom-0 left-10 w-60 h-60 bg-secondary/10 rounded-full blur-3xl opacity-20" />

      <Container className="relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <div className={`transition-all duration-1000 ${isInView ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
            <div className="flex justify-center mb-6">
              <Heart className="w-12 h-12 text-accent animate-pulse-gentle" />
            </div>

            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Join Our <span className="text-accent">Community?</span>
            </h2>

            <p className="text-lg text-primary-foreground/80 mb-8 leading-relaxed">
              Whether you're seeking spiritual guidance, community connection, or a place to serve, we welcome you with
              open hearts. Take the first step on your faith journey today.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <button className="px-8 py-4 bg-accent text-accent-foreground rounded-lg font-semibold text-lg hover:shadow-xl hover:shadow-accent/40 transition-all hover:-translate-y-1">
                Start Your Journey
              </button>

              <button className="px-8 py-4 border-2 border-primary-foreground text-primary-foreground rounded-lg font-semibold text-lg hover:bg-primary-foreground/10 transition-all">
                Schedule a Meeting
              </button>
            </div>

            <p className="text-sm text-primary-foreground/70">
              Have questions? Contact us at <span className="text-accent font-semibold">info@pastorministry.com</span>{" "}
              or call <span className="text-accent font-semibold">(555) 123-4567</span>
            </p>
          </div>
        </div>
      </Container>
    </section>
  )
}
