"use client"

import { useEffect, useRef, useState } from "react"

interface UseInViewProps {
  threshold?: number | number[]
  rootMargin?: string
}

export function useInView({ threshold = 0.1, rootMargin = "0px" }: UseInViewProps) {
  const ref = useRef<HTMLElement>(null)
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold, rootMargin },
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [threshold, rootMargin])

  return { ref, isInView }
}
