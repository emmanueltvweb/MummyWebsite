"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { NavDropdown } from './nav-dropdown'

export function Header() {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const aboutDropdownItems = [
    { label: "Evelyn Joshua Biography", href: "/about/pst-evelyn-joshua" },
    { label: "TB Joshua Biography", href: "/about/tb-joshua"},
    { label: "Emmanuel TV", href: "/about/emmanuel-tv" },
    { label: "The SCOAN", href: "/about/scoan" },
  ]

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Crusade/Outreach", href: "/gallery" },
    { label: "Sermon", href: "/Sermon" },
    { label: "Visit", href: "/visit" },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-accent to-accent/70 rounded-full flex items-center justify-center">
              <span className="text-foreground font-bold text-sm">Pst.</span>
            </div>
            <span className="hidden sm:inline font-bold text-primary text-lg">
              Evelyn Joshua
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === '/'
                  ? 'bg-accent text-accent-foreground'
                  : 'text-foreground hover:bg-accent/50 hover:text-accent-foreground'
              }`}
            >
              Home
            </Link>
            
            <NavDropdown
              items={aboutDropdownItems}
              triggerLabel="About"
            />
            
            {navItems.slice(1).map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-foreground hover:bg-accent/50 hover:text-accent-foreground'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center">
            <Link
              href="/contact"
              className="px-6 py-2 bg-accent text-accent-foreground rounded-lg hover:shadow-lg hover:shadow-accent/30 transition-all duration-300 hover:-translate-y-0.5"
            >
              Contact
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-md text-foreground hover:bg-accent/50"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-2">
              <Link
                href="/"
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === '/'
                    ? 'bg-accent text-accent-foreground'
                    : 'text-foreground hover:bg-accent/50 hover:text-accent-foreground'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              
              {/* About section with dropdown items */}
              <div className="px-4 py-2">
                <div className="text-sm font-medium text-foreground mb-2">About</div>
                <div className="ml-4 space-y-1">
                  {aboutDropdownItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/30 rounded-md transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.label}
                      { (
                        <span className="text-xs text-muted-foreground/70 ml-1"></span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
              
              {navItems.slice(1).map((item) => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-accent text-accent-foreground'
                        : 'text-foreground hover:bg-accent/50 hover:text-accent-foreground'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                )
              })}
              <Link
                href="/contact"
                className="mt-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:shadow-lg hover:shadow-accent/30 transition-all duration-300"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}