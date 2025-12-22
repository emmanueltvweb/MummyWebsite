"use client"

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface DropdownItem {
  label: string
  href: string
  description?: string
}

interface NavDropdownProps {
  items: DropdownItem[]
  triggerLabel: string
  className?: string
}

export function NavDropdown({ items, triggerLabel, className = "" }: NavDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  // Check if any dropdown item is active
  useEffect(() => {
    const active = items.some(item => pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href)))
    setIsActive(active)
  }, [pathname, items])

  // Handle hover events
  const handleMouseEnter = () => {
    setIsOpen(true)
  }

  const handleMouseLeave = () => {
    setIsOpen(false)
  }

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault()
        setIsOpen(!isOpen)
        break
      case 'Escape':
        setIsOpen(false)
        break
      case 'ArrowDown':
        event.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
        } else {
          // Focus first item
          const firstItem = dropdownRef.current?.querySelector('a')
          firstItem?.focus()
        }
        break
      case 'ArrowUp':
        event.preventDefault()
        if (isOpen) {
          // Focus last item
          const items = dropdownRef.current?.querySelectorAll('a')
          items?.[items.length - 1]?.focus()
        }
        break
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div
      ref={dropdownRef}
      className={`relative ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Trigger Button */}
      <button
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
          isActive
            ? 'bg-accent text-accent-foreground'
            : 'text-foreground hover:bg-accent/50 hover:text-accent-foreground'
        }`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        onKeyDown={handleKeyDown}
        onClick={() => setIsOpen(!isOpen)}
      >
        {triggerLabel}
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      <div
        className={`absolute top-full left-0 mt-1 w-64 bg-background border border-border rounded-lg shadow-lg z-50 transition-all duration-200 origin-top ${
          isOpen
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
        }`}
        role="menu"
        aria-orientation="vertical"
        aria-labelledby="about-menu"
      >
        <div className="py-2">
          {items.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-4 py-3 text-sm text-foreground hover:bg-accent/50 hover:text-accent-foreground transition-colors focus:bg-accent/50 focus:text-accent-foreground focus:outline-none"
              role="menuitem"
              onClick={() => setIsOpen(false)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault()
                  const next = e.currentTarget.parentElement?.querySelectorAll('a')[index + 1]
                  next?.focus()
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault()
                  const prev = e.currentTarget.parentElement?.querySelectorAll('a')[index - 1]
                  prev?.focus()
                }
              }}
            >
              <div className="font-medium">{item.label}</div>
              {item.description && (
                <div className="text-xs text-muted-foreground mt-1">{item.description}</div>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}