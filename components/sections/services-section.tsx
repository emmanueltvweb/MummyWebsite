"use client"

import { Container } from "@/components/layout/container"
import { useInView } from "@/hooks/use-in-view"
import { Heart, Users, BookOpen, HandHelping, Music, Flame } from "lucide-react"

const services = [
  {
    icon: Heart,
    title: "Spiritual Guidance",
    description: "Personal counseling and spiritual mentorship to deepen your faith journey.",
  },
  {
    icon: Users,
    title: "Community Fellowship",
    description: "Connect with believers in a welcoming environment of shared values.",
  },
  {
    icon: BookOpen,
    title: "Scripture Study",
    description: "Deep dives into biblical teachings and theological understanding.",
  },
  {
    icon: HandHelping,
    title: "Outreach Programs",
    description: "Serving others and making a positive impact in our community.",
  },
  {
    icon: Music,
    title: "Worship & Praise",
    description: "Uplifting worship experiences that nurture the soul and spirit.",
  },
  {
    icon: Flame,
    title: "Youth Ministry",
    description: "Empowering the next generation with faith and purpose.",
  },
]

export function ServicesSection() {
  const { ref, isInView } = useInView({ threshold: 0.1 })

  return (
    <section id="ministry" ref={ref} className="py-20 md:py-32 bg-background">
      <Container>
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-primary mb-4">
            Visit Our <span className="gold-accent">Branches</span> 
          </h2>
          <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
            Discover the diverse ways we serve and support our growing community through faith-based initiatives.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => {
            const Icon = service.icon
            const delay = isInView ? index * 100 : 999999

            return (
              <div
                key={index}
                className="group p-8 rounded-xl border border-border bg-card hover:border-accent transition-all duration-500 hover-lift"
                style={{
                  animation: isInView ? `slideInLeft 0.8s ease-out forwards ${delay}ms` : "none",
                  opacity: isInView ? 1 : 0,
                }}
              >
                {/* Icon Background */}
                <div className="w-14 h-14 bg-gradient-to-br from-accent/20 to-accent/10 rounded-lg flex items-center justify-center mb-4 group-hover:from-accent/30 group-hover:to-accent/20 transition-all">
                  <Icon className="w-7 h-7 text-accent group-hover:text-accent/80 transition-colors" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-primary mb-2 group-hover:text-accent transition-colors">
                  {service.title}
                </h3>
                <p className="text-foreground/70 leading-relaxed">{service.description}</p>

                {/* Accent Bar */}
                <div className="h-1 w-12 bg-gradient-to-r from-accent to-secondary rounded-full mt-4 group-hover:w-20 transition-all duration-300" />
              </div>
            )
          })}
        </div>
      </Container>
    </section>
  )
}
