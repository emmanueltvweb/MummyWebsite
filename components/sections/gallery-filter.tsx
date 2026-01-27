"use client"

import { useState, useEffect } from "react"

interface GalleryFilterProps {
  activeCategory: string
  onCategoryChange: (category: string) => void
}

const categories = [
  "SCOAN HQ",
  "Ghana",
  "Kenya",
  "Lagos",
  "South Africa",
  "Argentina",
  "Spain",
]

export function GalleryFilter({ activeCategory, onCategoryChange }: GalleryFilterProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 640)
      setIsTablet(window.innerWidth >= 640 && window.innerWidth < 1024)
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent, category: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onCategoryChange(category)
      if (isMobile) setShowDropdown(false)
    }
  }

  const handleDropdownToggle = () => {
    setShowDropdown(!showDropdown)
  }

  const handleDropdownKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleDropdownToggle()
    } else if (e.key === 'Escape') {
      setShowDropdown(false)
    }
  }

  // Mobile dropdown view
  if (isMobile) {
    return (
      <div className="mb-8 sm:mb-12 category-filter-mobile" role="navigation" aria-label="Gallery category filters">
        <div className="relative">
          <button
            onClick={handleDropdownToggle}
            onKeyDown={handleDropdownKeyDown}
            className="w-full category-button-mobile rounded-full font-medium bg-card border-2 border-primary/30 text-primary/80 hover:border-accent hover:text-accent transition-all duration-300 flex items-center justify-between touch-target-min category-button-touch"
            aria-expanded={showDropdown}
            aria-haspopup="listbox"
            aria-label="Select category"
          >
            <span className="truncate">{activeCategory}</span>
            <svg
              className={`w-4 h-4 transition-transform duration-200 flex-shrink-0 ${showDropdown ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg category-dropdown-shadow z-50 max-h-60 overflow-y-auto">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => {
                    onCategoryChange(category)
                    setShowDropdown(false)
                  }}
                  onKeyDown={(e) => handleKeyDown(e, category)}
                  className={`w-full px-4 py-3 text-left text-sm font-medium transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg touch-target-min category-button-touch ${
                    activeCategory === category
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-muted"
                  }`}
                  role="option"
                  aria-selected={activeCategory === category}
                  aria-label={`Select ${category}`}
                >
                  {category}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Tablet view with horizontal scrolling
  if (isTablet) {
    return (
      <div className="mb-10 sm:mb-14 category-filter-tablet" role="navigation" aria-label="Gallery category filters">
        <div className="relative">
          <div
            className="flex gap-2 overflow-x-auto scrollbar-hide px-4 sm:px-6 lg:px-8"
            role="tablist"
            aria-label="Gallery categories"
          >
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => onCategoryChange(category)}
                onKeyDown={(e) => handleKeyDown(e, category)}
                className={`category-button-tablet rounded-full font-medium whitespace-nowrap transition-all duration-300 flex-shrink-0 category-button-touch ${
                  activeCategory === category
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "border-2 border-primary/30 text-primary/80 hover:border-accent hover:text-accent"
                }`}
                role="tab"
                aria-selected={activeCategory === category}
                aria-label={`Filter by ${category}`}
                tabIndex={0}
              > 
                {category}
              </button>
            ))}
          </div>
          
          {/* Scroll indicators */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none" />
        </div>
      </div>
    )
  }

  // Desktop view with justified layout
  return (
    <div className="mb-12 sm:mb-16 category-filter-desktop" role="navigation" aria-label="Gallery category filters">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="flex flex-wrap justify-center gap-2 sm:gap-3"
          role="tablist"
          aria-label="Gallery categories"
        >
          {categories.map((category) => (
            <button
                key={category}
                onClick={() => onCategoryChange(category)}
                onKeyDown={(e) => handleKeyDown(e, category)}
                className={`category-button-desktop rounded-full font-medium whitespace-nowrap transition-all duration-300 category-button-touch ${
                  activeCategory === category
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "border-2 border-primary/30 text-primary/80 hover:border-accent hover:text-accent"
                }`}
                role="tab"
                aria-selected={activeCategory === category}
                aria-label={`Filter by ${category}`}
                tabIndex={0}
              >
              {category}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
