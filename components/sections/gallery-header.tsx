"use client"

import { Reveal } from "@/components/ui/reveal"

interface GalleryHeaderProps {
  title: string
  subtitle: string
  label: string
}

export function GalleryHeader({ title, subtitle, label }: GalleryHeaderProps) {
  return (
    <div className="bg-background pt-20 pb-12 sm:pt-32 sm:pb-16" role="banner">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Label */}
        <Reveal
          as="p"
          variant="fade"
          className="text-sm font-semibold text-primary/80 tracking-widest uppercase mb-4"
          aria-label="Gallery section label"
        >
          {label}
        </Reveal>

        {/* Title */}
        <Reveal as="h1" variant="up" delay={120} className="text-4xl sm:text-5xl lg:text-6xl font-bold text-primary mb-6">
          {title}
        </Reveal>

        {/* Subtitle */}
        <Reveal as="p" variant="up" delay={240} className="text-lg sm:text-xl text-foreground/70 max-w-2xl mx-auto">
          {subtitle}
        </Reveal>
      </div>
    </div>
  )
}
