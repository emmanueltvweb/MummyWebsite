"use client"

import { Container } from "@/components/layout/container"
import { useInView } from "@/hooks/use-in-view"
import { Star } from "lucide-react"

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Community Member",
    text: "This ministry has transformed my spiritual journey. The guidance and community support have been invaluable.",
    rating: 5,
  },
  {
    name: "Michael Chen",
    role: "Volunteer",
    text: "Being part of this faith community has given me purpose and meaningful connections with others.",
    rating: 5,
  },
  {
    name: "Emma Williams",
    role: "Youth Group Participant",
    text: "The youth ministry programs helped me discover my faith during an important time in my life.",
    rating: 5,
  },
]

export function TestimonialsSection() {
  const { ref, isInView } = useInView({ threshold: 0.15 })

  return (
    <section ref={ref} className="py-20 md:py-32 bg-gradient-to-b from-muted via-background to-muted">
      <Container>
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-primary mb-4">
            Stories from Our <span className="gold-accent">Community</span>
          </h2>
          <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
            Hear from members who have experienced spiritual growth and meaningful connections through our ministry.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="p-8 rounded-xl bg-card border border-border hover:border-accent transition-all duration-500 hover-lift"
              style={{
                animation: isInView ? `slideInLeft 0.8s ease-out forwards` : "none",
                animationDelay: `${index * 150}ms`,
                opacity: isInView ? 1 : 0,
              }}
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-foreground/80 mb-6 leading-relaxed italic">"{testimonial.text}"</p>

              {/* Author */}
              <div>
                <p className="font-semibold text-primary">{testimonial.name}</p>
                <p className="text-sm text-foreground/60">{testimonial.role}</p>
              </div>

              {/* Accent Line */}
              <div className="h-1 w-8 bg-gradient-to-r from-accent to-secondary rounded-full mt-4" />
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}
