"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"

import { defaultSiteContent } from "@/lib/content/defaults"
import type { GalleryData, SiteContent } from "@/lib/content/types"

interface SiteContentContextValue {
  content: SiteContent
  gallery: GalleryData | null
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

const SiteContentContext = createContext<SiteContentContextValue>({
  content: defaultSiteContent,
  gallery: null,
  isLoading: true,
  error: null,
  refresh: async () => {},
})

export function SiteContentProvider({ children }: { children: React.ReactNode }) {
  const [content, setContent] = useState<SiteContent>(defaultSiteContent)
  const [gallery, setGallery] = useState<GalleryData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [contentRes, galleryRes] = await Promise.all([
        fetch("/api/content", { cache: "no-store" }),
        fetch("/api/content/gallery", { cache: "no-store" }),
      ])

      const contentJson = await contentRes.json()
      const galleryJson = await galleryRes.json()

      if (contentJson.success && contentJson.data) {
        setContent(contentJson.data)
      }

      if (galleryJson.success && galleryJson.data) {
        setGallery(galleryJson.data)
      }
    } catch (err) {
      console.error("Failed to load site content:", err)
      setError("Failed to load site content")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return (
    <SiteContentContext.Provider value={{ content, gallery, isLoading, error, refresh }}>
      {children}
    </SiteContentContext.Provider>
  )
}

export function useSiteContent() {
  return useContext(SiteContentContext)
}
