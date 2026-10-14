"use client"

import { createElement, useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"

export type RevealVariant = "up" | "left" | "right" | "zoom" | "fade"

type RevealProps = React.AllHTMLAttributes<HTMLElement> & {
  /** Element to render (default: div). */
  as?: "div" | "section" | "header" | "span" | "p" | "h1" | "h2" | "h3" | "li" | "ul" | "nav" | "form" | "article"
  /** How the element enters: rise up, slide in from a side, zoom, or just fade. */
  variant?: RevealVariant
  /** Delay in ms, to stagger several items. */
  delay?: number
}

/**
 * Animates its content in the first time it scrolls into view (styles: "Scroll reveal" in
 * globals.css). Respects "reduce motion" and shows content immediately when JS is unavailable.
 * Don't put it on an element that has its own transform (e.g. hover lift) — wrap it instead.
 */
export function Reveal({ as = "div", variant = "up", delay = 0, className, style, children, ...rest }: RevealProps) {
  const ref = useRef<HTMLElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      setShown(true)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          observer.disconnect()
        }
      },
      // Trigger as soon as any part is ~8% up from the bottom of the screen. (No ratio threshold:
      // very tall content, like a long article, could otherwise never reach it and stay hidden.)
      { threshold: 0, rootMargin: "0px 0px -8% 0px" }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return createElement(
    as,
    {
      ref,
      className: cn(shown ? `reveal-in reveal-${variant}` : "reveal-pending", className),
      style: delay ? { ...style, animationDelay: `${delay}ms` } : style,
      ...rest,
    },
    children
  )
}
