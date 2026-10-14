"use client"

import { Calendar, ChevronDown, User } from 'lucide-react'
import { useState } from "react"

import { Container } from "@/components/layout/container"
import { Reveal } from "@/components/ui/reveal"
import { optimizeCloudinaryUrl } from "@/lib/cloudinary/optimize"
import type { SermonPageContent } from "@/lib/content/page-types"

/** "Sermon of the week" on the Sermon page. Content is managed in Admin → Pages → Sermon. */
export function FeaturedSermonSection({ content }: { content: SermonPageContent["featured"] }) {
  const [showFacebookVideo, setShowFacebookVideo] = useState(false)
  const [expanded, setExpanded] = useState(false)
  // "Read more" only when the summary has more than one paragraph/block.
  const hasMore = (content.summaryHtml.match(/<\/(p|ul|ol|blockquote|h[1-6]|figure|div)>/gi) ?? []).length > 1
  const canPlay = Boolean(content.videoEmbedUrl)

  const open = (url: string) => {
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <section className="py-12 sm:py-20 bg-gradient-to-b from-primary/5 to-transparent">
      <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Featured Image */}
          <Reveal variant="left" className="order-2 lg:order-1">
            <div className="relative rounded-2xl overflow-hidden shadow-xl hover-lift group">
              {!showFacebookVideo ? (
                <>
                  {content.imageUrl ? (
                    <img
                      src={optimizeCloudinaryUrl(content.imageUrl, { width: 1280 })}
                      alt={content.title || "Featured sermon"}
                      width={1280}
                      height={720}
                      className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="aspect-video w-full bg-gradient-to-br from-primary/20 to-accent/20" />
                  )}
                  {canPlay && (
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                      <button
                        onClick={() => setShowFacebookVideo(true)}
                        className="w-16 h-16 bg-accent text-accent-foreground rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300 shadow-lg"
                        aria-label="Play video"
                      >
                        <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="relative w-full bg-black aspect-video">
                  <iframe
                    width="560"
                    height="315"
                    src={content.videoEmbedUrl}
                    title="Sermon video player"
                    style={{ border: 'none', overflow: 'hidden' }}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                    className="w-full h-full"
                  />
                  <button
                    onClick={() => setShowFacebookVideo(false)}
                    className="absolute top-4 right-4 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors z-10"
                    aria-label="Close video"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </Reveal>

          {/* Sermon Details. On mobile this wrapper "dissolves" (display: contents) so its parts
              join the grid and the image/video sits between the description and the buttons. */}
          <div className="contents lg:order-2 lg:block lg:space-y-6">
            <div className="order-1 space-y-6">
            {content.badge && (
              <Reveal variant="up">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent rounded-full border border-accent/20">
                  <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider">{content.badge}</span>
                </div>
              </Reveal>
            )}

            <Reveal as="h2" variant="up" delay={120} className="text-3xl sm:text-4xl lg:text-3xl font-extrabold text-primary leading-tight">
              {content.title}
            </Reveal>

            <Reveal variant="up" delay={220} className="space-y-3 text-foreground/70">
              {content.date && (
                <div className="flex items-center gap-3">
                  <Calendar size={20} className="text-accent" />
                  <span className="text-sm sm:text-base">{content.date}</span>
                </div>
              )}
              {content.speaker && (
                <div className="flex items-center gap-3">
                  <User size={20} className="text-accent" />
                  <span className="text-sm sm:text-base">{content.speaker}</span>
                </div>
              )}
            </Reveal>

            {content.summaryHtml && (
              <Reveal variant="up" delay={320}>
                <div
                  id="sermon-summary"
                  className={`about-rich text-base sm:text-lg text-foreground/80 leading-relaxed text-justify [&>*+*]:!mt-4 ${
                    hasMore && !expanded ? '[&>*:not(:first-child)]:hidden' : ''
                  }`}
                  dangerouslySetInnerHTML={{ __html: content.summaryHtml }}
                />
                {hasMore && (
                  <button
                    type="button"
                    onClick={() => setExpanded((e) => !e)}
                    aria-expanded={expanded}
                    aria-controls="sermon-summary"
                    className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-accent hover:text-accent/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
                  >
                    {expanded ? 'Show less' : 'Read more'}
                    <ChevronDown className={`size-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
                  </button>
                )}
              </Reveal>
            )}

            {content.keyTopics.length > 0 && (
              <Reveal variant="up" delay={420} className="space-y-2">
                <h3 className="font-semibold text-primary text-sm uppercase tracking-wider">Key Topics</h3>
                <div className="flex flex-wrap gap-2">
                  {content.keyTopics.map((topic, index) => (
                    <span
                      key={`featured-${topic}-${index}`}
                      className="px-3 py-1 bg-secondary/10 text-secondary border border-secondary/20 rounded-full text-sm"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </Reveal>
            )}
            </div>

            <Reveal variant="up" delay={200} className="order-3 flex flex-col sm:flex-row gap-3 lg:pt-4">
              {content.watchNowUrl && (
                <button
                  onClick={() => open(content.watchNowUrl)}
                  className="px-8 py-3 bg-accent text-accent-foreground rounded-lg font-semibold hover:shadow-lg hover:shadow-accent/30 hover:-translate-y-0.5 transition-all duration-300"
                >
                  {content.watchNowLabel || 'Watch Now'}
                </button>
              )}
              {content.downloadAppUrl && (
                <button
                  onClick={() => open(content.downloadAppUrl)}
                  className="px-8 py-3 border-2 border-primary text-primary rounded-lg font-semibold hover:bg-primary/5 transition-all duration-300"
                >
                  {content.downloadAppLabel || 'Download App'}
                </button>
              )}
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  )
}
