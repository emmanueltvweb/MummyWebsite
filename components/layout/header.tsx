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
    <header className="pointer-events-none">
      {/* Centered pill container */}
      <div className="fixed left-1/2 top-4 z-50 w-[min(1100px,94%)] -translate-x-1/2 rounded-full px-4 py-2 backdrop-blur-md bg-white/70 dark:bg-slate-900/40 border border-gray-200/10 dark:border-slate-800/30 shadow-lg pointer-events-auto">
        <nav className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-accent to-accent/70 rounded-full flex items-center justify-center shadow-sm">
              <span className="text-foreground font-bold text-sm">Pst.</span>
            </div>
            <span className="hidden sm:inline font-bold text-primary text-lg">Evelyn Joshua</span>
          </Link>

          {/* Center navigation (pill-style links) */}
          <ul className="hidden md:flex items-center gap-2 px-2">
            {/* Home */}
            <li>
              <Link
                href="/"
                className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 ${
                  pathname === '/'
                    ? 'bg-accent text-accent-foreground shadow-md'
                    : 'text-foreground hover:bg-accent/20 hover:text-accent-foreground'
                }`}
              >
                Home
              </Link>
            </li>

            {/* About dropdown keep existing component but style the trigger */}
            <li>
              <NavDropdown
                items={aboutDropdownItems}
                triggerLabel="About"
                className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 ${pathname.startsWith('/about') ? 'bg-accent text-accent-foreground shadow-md' : 'text-foreground hover:bg-accent/20 hover:text-accent-foreground'}`}
              />
            </li>

            {/* Other nav items */}
            {navItems.slice(1).map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-accent text-accent-foreground shadow-md'
                        : 'text-foreground hover:bg-accent/20 hover:text-accent-foreground'
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {/* Contact CTA - pill */}
            <Link
              href="/contact"
              className="hidden md:inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-accent to-accent/80 text-accent-foreground shadow-md hover:translate-y-[-1px] transition-transform duration-150"
            >
              Contact
            </Link>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-full text-foreground hover:bg-accent/20"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </nav>

        {/* Mobile menu (popover under pill) */}
        {isMenuOpen && (
          <div className="mt-3 rounded-xl bg-white/85 dark:bg-slate-900/75 border border-gray-200/10 dark:border-slate-800/30 backdrop-blur-md p-4 shadow-lg md:hidden">
            <div className="flex flex-col gap-2">
              <Link
                href="/"
                className={`block px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === '/'
                    ? 'bg-accent text-accent-foreground'
                    : 'text-foreground hover:bg-accent/20 hover:text-accent-foreground'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>

              <div className="px-1 py-2">
                <div className="text-sm font-medium text-foreground mb-2">About</div>
                <div className="ml-2 space-y-1">
                  {aboutDropdownItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/30 rounded-md transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.label}
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
                    className={`block px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-accent text-accent-foreground'
                        : 'text-foreground hover:bg-accent/20 hover:text-accent-foreground'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                )
              })}

              <Link
                href="/contact"
                className="mt-2 block px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-accent to-accent/80 text-accent-foreground text-center"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Spacer so content doesn't hide under the fixed pill */}
      <div className="h-20" aria-hidden />
    </header>
  )
}