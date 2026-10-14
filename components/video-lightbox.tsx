"use client"

import { useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"

export interface LightboxVideo {
  title: string
  embedUrl?: string
  videoUrl?: string
}

/** Adds the "start playing" flag that Facebook / YouTube / Vimeo embeds understand. */
export function withAutoplay(url: string) {
  try {
    const u = new URL(url)
    if (u.hostname.includes("facebook.com")) u.searchParams.set("autoplay", "true")
    else if (u.hostname.includes("youtube.com") || u.hostname.includes("youtube-nocookie.com") || u.hostname.includes("vimeo.com")) u.searchParams.set("autoplay", "1")
    return u.toString()
  } catch {
    return url
  }
}

/** Full-screen popup that shows only the video and starts it immediately. */
export function VideoLightbox({ video, onClose }: { video: LightboxVideo | null; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!video) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    closeRef.current?.focus()
    // Only one thing plays at a time on the page.
    document.querySelectorAll("audio, video").forEach((el) => (el as HTMLMediaElement).pause())

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      // Keep focus inside the popup (the close button is the only control outside the player).
      if (e.key === "Tab") {
        e.preventDefault()
        closeRef.current?.focus()
      }
    }
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = overflow
      previouslyFocused?.focus()
    }
  }, [video, onClose])

  if (!video || typeof document === "undefined") return null

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm animate-in fade-in duration-200 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={video.title}
    >
      {/* Clicking anywhere outside the video closes it. */}
      <button type="button" tabIndex={-1} aria-hidden onClick={onClose} className="absolute inset-0 cursor-default" />
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        aria-label="Close video"
        className="absolute top-4 right-4 z-10 flex size-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none sm:top-6 sm:right-6"
      >
        <X className="size-6" />
      </button>

      <div
        className="relative aspect-video w-full max-w-5xl overflow-hidden rounded-xl bg-black shadow-2xl animate-in zoom-in-95 duration-200"
        style={{ maxHeight: "calc(100vh - 6rem)", maxWidth: "min(64rem, calc((100vh - 6rem) * 16 / 9))" }}
      >
        {video.embedUrl ? (
          <iframe
            src={withAutoplay(video.embedUrl)}
            title={video.title}
            className="absolute inset-0 size-full"
            style={{ border: "none" }}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen; web-share"
            allowFullScreen
          />
        ) : video.videoUrl ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption -- sermon videos have no caption files
          <video src={video.videoUrl} title={video.title} className="absolute inset-0 size-full" controls autoPlay playsInline />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white/70">This video isn&apos;t available.</div>
        )}
      </div>
    </div>,
    document.body
  )
}
