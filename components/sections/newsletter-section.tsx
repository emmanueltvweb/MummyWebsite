"use client"

import type React from "react"

import { Container } from "@/components/layout/container"
import { useInView } from "@/hooks/use-in-view"
import { useState } from "react"
import { Mail } from "lucide-react"

export function NewsletterSection() {
  const { ref, isInView } = useInView({ threshold: 0.3 })
  const [email, setEmail] = useState("")
  const [subscribeStatus, setSubscribeStatus] = useState<"idle" | "success" | "error">("idle")

  const handleSubscribe = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // Simulate subscription
    await new Promise((resolve) => setTimeout(resolve, 800))
    setSubscribeStatus("success")
    setEmail("")
    setTimeout(() => setSubscribeStatus("idle"), 3000)
  }

  return (
    <section ref={ref} className="py-16 md:py-24 bg-gradient-to-r from-secondary/20 via-accent/10 to-secondary/20">
      <Container>
        <div
          className={`max-w-2xl mx-auto text-center transition-all duration-1000 ${
            isInView ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
            Stay Connected with Our <span className="gold-accent">Ministry</span>
          </h2>
          <p className="text-foreground/70 mb-8">
            Subscribe to receive updates on events, teachings, and community service opportunities.
          </p>

          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="flex-1 px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder-foreground/40 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
            />
            <button
              type="submit"
              className={`px-8 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                subscribeStatus === "success"
                  ? "bg-green-600 text-white"
                  : "bg-accent text-accent-foreground hover:shadow-lg hover:shadow-accent/30"
              }`}
            >
              {subscribeStatus === "success" ? (
                "Subscribed!"
              ) : (
                <>
                  <Mail className="w-5 h-5" />
                  Subscribe
                </>
              )}
            </button>
          </form>
        </div>
      </Container>
    </section>
  )
}
