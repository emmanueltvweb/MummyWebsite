"use client"

import type React from "react"

import { Container } from "@/components/layout/container"
import { useInView } from "@/hooks/use-in-view"
import { useState } from "react"
import { Mail, Phone, MapPin, Send } from "lucide-react"

export function ContactSection() {
  const { ref, isInView } = useInView({ threshold: 0.2 })
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormState((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setSubmitStatus("success")
    setFormState({ name: "", email: "", subject: "", message: "" })

    setTimeout(() => setSubmitStatus("idle"), 3000)
    setIsSubmitting(false)
  }

  return (
    <section id="contact" ref={ref} className="py-20 md:py-32 bg-muted">
      <Container>
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-primary mb-4">
            Get In <span className="gold-accent">Touch</span>
          </h2>
          <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
            Have questions or want to learn more about our ministry? We'd love to hear from you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {/* Contact Info Cards */}
          {[
            {
              icon: Mail,
              title: "Email",
              value: "info@scoan.org",
              delay: 0,
            },
            {
              icon: Phone,
              title: "Phone",
              value: "+234 (0) 8068220995",
              delay: 150,
            },
            {
              icon: MapPin,
              title: "Location",
              value: "The Synagogue, Church Of All Nations Headquarters is located at: 1, Prophet T.B Joshua Street, Ikotun-Egbe, Lagos, Nigeria",
              delay: 300,
            },
          ].map(({ icon: Icon, title, value, delay }, index) => (
            <div
              key={index}
              className="p-6 rounded-xl bg-background border border-border hover:border-accent transition-all duration-300 text-center hover-lift"
              style={{
                animation: isInView ? `slideInLeft 0.6s ease-out forwards ${delay}ms` : "none",
                opacity: isInView ? 1 : 0,
              }}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-accent/20 to-accent/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Icon className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold text-primary mb-2">{title}</h3>
              <p className="text-foreground/70">{value}</p>
            </div>
          ))}
        </div>

        {/* Contact Form */}
        <div
          className={`max-w-2xl mx-auto p-8 rounded-xl bg-background border border-border transition-all duration-1000 ${
            isInView ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-primary mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formState.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder-foreground/40 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                  placeholder="Your name"
                />
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-primary mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formState.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder-foreground/40 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                  placeholder="example@email.com"
                />
              </div>
            </div>

            {/* Subject Field */}
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-primary mb-2">
                Subject
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formState.subject}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder-foreground/40 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                placeholder="What is this about?"
              />
            </div>

            {/* Message Field */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-primary mb-2">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                value={formState.message}
                onChange={handleChange}
                required
                rows={5}
                className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder-foreground/40 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all resize-none"
                placeholder="Tell us more..."
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full px-8 py-4 rounded-lg font-semibold text-lg flex items-center justify-center gap-2 transition-all duration-300 ${
                submitStatus === "success"
                  ? "bg-green-600 text-white"
                  : "bg-accent text-accent-foreground hover:shadow-lg hover:shadow-accent/30 hover:-translate-y-1 disabled:opacity-70"
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Sending...
                </>
              ) : submitStatus === "success" ? (
                <>
                  <span>Message Sent Successfully!</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Send Message
                </>
              )}
            </button>
          </form>
        </div>
      </Container>
    </section>
  )
}
