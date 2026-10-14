"use client"

import Link from "next/link"
import { ExternalLink } from "lucide-react"

import { useSiteContent } from "@/components/content/site-content-provider"

interface CategoryDescriptionsProps {
  activeCategory: string
  /** Selected subcategory (e.g. "2024"); null/undefined = "All". */
  activeSubcategory?: string | null
}

const hasText = (d?: { title: string; description: string }) => !!d && (!!d.title.trim() || !!d.description.trim())

/**
 * Description box under the gallery. Shows the selected subcategory's own description when it
 * has one, otherwise the category's. Edited in Admin → Pages → Gallery.
 */
export function CategoryDescriptions({ activeCategory, activeSubcategory }: CategoryDescriptionsProps) {
  const { content } = useSiteContent()
  const sub = activeSubcategory ? content.gallery.subcategoryDescriptions?.[activeCategory]?.[activeSubcategory] : undefined
  const category = hasText(sub) ? sub : content.gallery.categoryDescriptions?.[activeCategory]

  if (!category || !hasText(category)) return null

  // Blank lines (or single line breaks) in the admin text start a new paragraph.
  const paragraphs = category.description
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
  const external = /^https?:\/\//i.test(category.readMoreUrl)

  return (
    <div className="mb-12 sm:mb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-card rounded-2xl p-6 sm:p-8 shadow-lg border border-border/50">
          {category.title && (
            <h3 className="text-2xl sm:text-3xl font-bold text-primary mb-4">
              {category.title}
            </h3>
          )}

          <div className="space-y-4">
            {paragraphs.map((paragraph, index) => (
              <p key={index} className="text-foreground/80 leading-relaxed text-base sm:text-lg">
                {paragraph}
              </p>
            ))}
          </div>

          {category.readMoreUrl && (
            <div className="mt-6 sm:mt-8">
              <Link
                href={category.readMoreUrl}
                target={external ? "_blank" : undefined}
                rel={external ? "noopener noreferrer" : undefined}
                className="inline-flex items-center gap-2 bg-accent text-blue  px-6 py-3 rounded-full font-medium transition-all duration-300 hover:bg-primary/90 hover:shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                Read More
                <ExternalLink size={16} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
