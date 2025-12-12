"use client"

import { useEffect, useState } from "react"

interface GalleryHeaderProps {
  title: string
  subtitle: string
  label: string
}

export function GalleryHeader({ title, subtitle, label }: GalleryHeaderProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <div className="bg-background pt-20 pb-12 sm:pt-32 sm:pb-16" role="banner">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Label */}
        <p 
          className={`text-sm font-semibold text-primary/80 tracking-widest uppercase mb-4 transition-all duration-700 ${
            isVisible ? "opacity-100" : "opacity-0"
          }`}
          aria-label="Gallery section label"
        >
          {label}
        </p>

        {/* Title */}
        <h1 
          className={`text-4xl sm:text-5xl lg:text-6xl font-bold text-primary mb-6 transition-all duration-700 delay-100 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          {title}
        </h1>

        {/* Subtitle */}
        <p 
          className={`text-lg sm:text-xl text-foreground/70 max-w-2xl mx-auto transition-all duration-700 delay-200 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          {subtitle}
        </p>
      </div>
    </div>
  )
}
