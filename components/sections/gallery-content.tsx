"use client"

import { useState } from "react"

import { useSiteContent } from "@/components/content/site-content-provider"
import { defaultGalleryData } from "@/lib/content/gallery-defaults"
import { GalleryFilter } from "@/components/sections/gallery-filter"
import { GalleryGrid } from "@/components/sections/gallery-grid-enhanced"
import { CategoryDescriptions } from "@/components/sections/gallery-descriptions"
import { Reveal } from "@/components/ui/reveal"
import { cn } from "@/lib/utils"

export function GalleryContent() {
  const { gallery, content } = useSiteContent()
  const galleryData = gallery ?? defaultGalleryData
  // Categories come from the saved gallery (Admin → Pages → Gallery), so new ones show up
  // automatically. Empty categories are hidden until they have at least one image.
  const categories = Object.keys(galleryData).filter((c) => (galleryData[c]?.length ?? 0) > 0)
  const [selected, setSelected] = useState<string | null>(null)
  const activeCategory = selected && categories.includes(selected) ? selected : categories[0] ?? ""

  const categoryItems = galleryData[activeCategory] || []
  // Subcategories (e.g. years) in their saved order, plus any found only on images.
  // Only those with at least one image are offered to visitors.
  const saved = content.gallery.categorySubcategories?.[activeCategory] ?? []
  const found = categoryItems.map((i) => i.subcategory).filter((s): s is string => !!s && !saved.includes(s))
  const subcategories = [...saved, ...Array.from(new Set(found))].filter((s) => categoryItems.some((i) => i.subcategory === s))

  const [selectedSub, setSelectedSub] = useState<string | null>(null) // null = All
  const activeSub = selectedSub && subcategories.includes(selectedSub) ? selectedSub : null
  const items = activeSub ? categoryItems.filter((i) => i.subcategory === activeSub) : categoryItems

  const chooseCategory = (category: string) => {
    setSelected(category)
    setSelectedSub(null)
  }

  return (
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div
        className="absolute inset-0 z-0 gallery-background opacity-30"
        style={{
          backgroundImage: `url('/bg.jpg')`
        }}
      >
        <div className="absolute inset-0 " />
        <div className="absolute inset-0 " />
        <div className="absolute inset-0 " />
      </div>

      <div className="relative z-10">
        <Reveal variant="up">
          <GalleryFilter categories={categories} activeCategory={activeCategory} onCategoryChange={chooseCategory} />
        </Reveal>

        {subcategories.length > 0 && (
          <div
            key={activeCategory}
            className="about-in-up -mt-4 mb-8 flex flex-wrap items-center justify-center gap-2 sm:-mt-6 sm:mb-10"
            role="group"
            aria-label={`${activeCategory} subcategories`}
          >
            {[null, ...subcategories].map((sub) => {
              const active = activeSub === sub
              const count = sub ? categoryItems.filter((i) => i.subcategory === sub).length : categoryItems.length
              return (
                <button
                  key={sub ?? "__all"}
                  type="button"
                  onClick={() => setSelectedSub(sub)}
                  aria-pressed={active}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-semibold transition-all duration-300",
                    active
                      ? "border-primary bg-primary text-primary-foreground shadow-md"
                      : "border-border bg-background/80 text-foreground/70 backdrop-blur hover:border-accent hover:text-foreground"
                  )}
                >
                  {sub ?? "All"}
                  <span className={cn("rounded-full px-1.5 text-[11px] tabular-nums", active ? "bg-white/20" : "bg-muted text-foreground/60")}>{count}</span>
                </button>
              )
            })}
          </div>
        )}

        <Reveal variant="zoom" delay={120}>
          {/* Keyed by category + subcategory so the grid restarts when either changes. */}
          <GalleryGrid galleryItems={items} activeCategory={`${activeCategory}::${activeSub ?? "all"}`} />
        </Reveal>
        <Reveal variant="up">
          <div key={`${activeCategory}::${activeSub ?? "all"}`} className="about-in-up">
            <CategoryDescriptions activeCategory={activeCategory} activeSubcategory={activeSub} />
          </div>
        </Reveal>
      </div>
    </div>
  )
}
