"use client"

import { useEffect, useRef, useState, Fragment } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { gsap } from 'gsap'

interface NavItem {
  label: string
  href: string
  dropdownItems?: DropdownItem[]
}

interface DropdownItem {
  label: string
  href: string
  description?: string
}

interface PillNavProps {
  logo?: string
  logoAlt?: string
  items: NavItem[]
  activeHref?: string
  className?: string
  ease?: string
  baseColor?: string
  pillColor?: string
  hoveredPillTextColor?: string
  pillTextColor?: string
  onMobileMenuClick?: () => void
  initialLoadAnimation?: boolean
}

/**
 * PillNav Component
 * (docstring kept)
 */
export function PillNav({
  logo,
  logoAlt = 'Logo',
  items,
  activeHref,
  className = '',
  ease = 'power3.easeOut',
  baseColor = '#fff',
  pillColor = 'accent',
  hoveredPillTextColor = '#060010',
  pillTextColor,
  onMobileMenuClick,
  initialLoadAnimation = true
}: PillNavProps) {
  const resolvedPillTextColor = pillTextColor ?? baseColor
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const dropdownCloseTimeout = useRef<number | null>(null)
  const dropdownFocusTimeout = useRef<number | null>(null)
  const [isPointerTouch, setIsPointerTouch] = useState(false)

  const dropdownRef = useRef<HTMLDivElement | null>(null) // fallback
  const circleRefs = useRef<HTMLSpanElement[]>([])
  const tlRefs = useRef<gsap.core.Timeline[]>([])
  const activeTweenRefs = useRef<gsap.core.Tween[]>([])
  const logoImgRef = useRef<HTMLImageElement>(null)
  const logoTweenRef = useRef<gsap.core.Tween | null>(null)
  const hamburgerRef = useRef<HTMLButtonElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const navItemsRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<HTMLAnchorElement>(null)
  const pathname = usePathname()

  useEffect(() => {
    // detect pointers that are likely touch (so we prefer click toggles)
    const mq = window.matchMedia('(pointer: coarse)')
    const updatePointer = () => setIsPointerTouch(mq.matches)
    updatePointer()
    mq.addEventListener?.('change', updatePointer)

    /**
     * Layout function for pill animations (kept from original)
     */
    const layout = () => {
      circleRefs.current.forEach(circle => {
        if (!circle?.parentElement) return

        const pill = circle.parentElement
        const rect = pill.getBoundingClientRect()
        const { width: w, height: h } = rect
        const R = ((w * w) / 4 + h * h) / (2 * h)
        const D = Math.ceil(2 * R) + 2
        const delta = Math.ceil(R - Math.sqrt(Math.max(0, R * R - (w * w) / 4))) + 1
        const originY = D - delta

        circle.style.width = `${D}px`
        circle.style.height = `${D}px`
        circle.style.bottom = `-${delta}px`

        gsap.set(circle, {
          xPercent: -50,
          scale: 0,
          transformOrigin: `50% ${originY}px`
        })

        const label = pill.querySelector('.pill-label') as HTMLSpanElement
        const white = pill.querySelector('.pill-label-hover') as HTMLSpanElement

        if (label) gsap.set(label, { y: 0 })
        if (white) gsap.set(white, { y: h + 12, opacity: 0 })

        const index = circleRefs.current.indexOf(circle)
        if (index === -1) return

        tlRefs.current[index]?.kill()
        const tl = gsap.timeline({ paused: true })

        tl.to(circle, { scale: 1.2, xPercent: -50, duration: 0.6, ease: 'var(--nav-transition-easing)', overwrite: 'auto' }, 0)

        if (label) {
          tl.to(label, { y: -(h + 8), duration: 0.6, ease: 'var(--nav-transition-easing)', overwrite: 'auto' }, 0)
        }

        if (white) {
          gsap.set(white, { y: Math.ceil(h + 100), opacity: 0 })
          tl.to(white, { y: 0, opacity: 1, duration: 0.6, ease: 'var(--nav-transition-easing)', overwrite: 'auto' }, 0)
        }

        tlRefs.current[index] = tl
      })
    }

    layout()
    const onResize = () => layout()
    window.addEventListener('resize', onResize)

    if (document.fonts?.ready) {
      document.fonts.ready.then(layout).catch(() => {})
    }

    const menu = mobileMenuRef.current
    if (menu) {
      gsap.set(menu, { visibility: 'hidden', opacity: 0, scaleY: 1, y: 0 })
    }

    if (initialLoadAnimation) {
      const logo = logoRef.current
      const navItems = navItemsRef.current

      if (logo) {
        gsap.set(logo, { scale: 0 })
        gsap.to(logo, {
          scale: 1,
          duration: 0.6,
          ease
        })
      }

      if (navItems) {
        gsap.set(navItems, { width: 0, overflow: 'hidden' })
        gsap.to(navItems, {
          width: 'auto',
          duration: 0.6,
          ease
        })
      }
    }

    return () => {
      window.removeEventListener('resize', onResize)
      mq.removeEventListener?.('change', updatePointer)
      if (dropdownCloseTimeout.current) {
        window.clearTimeout(dropdownCloseTimeout.current)
      }
      if (dropdownFocusTimeout.current) {
        window.clearTimeout(dropdownFocusTimeout.current)
      }
    }
  }, [items, ease, initialLoadAnimation])

  // --- Hover/GSAP handlers (unchanged)
  const handleEnter = (i: number) => {
    const tl = tlRefs.current[i]
    if (!tl) return
    activeTweenRefs.current[i]?.kill()
    activeTweenRefs.current[i] = tl.tweenTo(tl.duration(), {
      duration: 0.4,
      ease: 'var(--nav-transition-easing)',
      overwrite: 'auto'
    })
  }

  const handleLeave = (i: number) => {
    const tl = tlRefs.current[i]
    if (!tl) return
    activeTweenRefs.current[i]?.kill()
    activeTweenRefs.current[i] = tl.tweenTo(0, {
      duration: 0.3,
      ease: 'var(--nav-transition-easing)',
      overwrite: 'auto'
    })
  }

  /**
   * Dropdown open/close helpers - immediate open on hover, smooth close on leave
   * We keep each dropdown mounted for CSS transitions; we toggle via CSS (opacity/transform).
   */
  const openDropdownImmediate = (label: string) => {
    if (dropdownCloseTimeout.current) {
      window.clearTimeout(dropdownCloseTimeout.current)
      dropdownCloseTimeout.current = null
    }
    setOpenDropdown(label)
  }

  const closeDropdownSmooth = (label?: string) => {
    // smooth close: keep it open for the duration of CSS transition, then set state null
    if (dropdownCloseTimeout.current) {
      window.clearTimeout(dropdownCloseTimeout.current)
    }
    dropdownCloseTimeout.current = window.setTimeout(() => {
      setOpenDropdown(prev => (label ? (prev === label ? null : prev) : null))
      dropdownCloseTimeout.current = null
    }, 250) // must match CSS transition duration (250-300ms)
  }

  const toggleDropdown = (label: string) => {
    setOpenDropdown(prev => (prev === label ? null : label))
  }

  // keyboard handling for main nav item with dropdown
  const handleDropdownKeyDown = (e: React.KeyboardEvent, itemLabel: string) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault()
        // on touch / mobile prefer toggling; on non-touch with keyboard we open and focus first item
        if (openDropdown === itemLabel) {
          closeDropdownSmooth(itemLabel)
        } else {
          openDropdownImmediate(itemLabel)
          // focus first menu item shortly after render
          dropdownFocusTimeout.current = window.setTimeout(() => {
            const firstLink = dropdownRefs.current[itemLabel]?.querySelector('a[role="menuitem"]') as HTMLElement
            firstLink?.focus()
          }, 100)
        }
        break
      case 'Escape':
        closeDropdownSmooth(itemLabel)
        break
      case 'ArrowDown':
        e.preventDefault()
        if (openDropdown !== itemLabel) {
          openDropdownImmediate(itemLabel)
        }
        dropdownFocusTimeout.current = window.setTimeout(() => {
          const firstLink = dropdownRefs.current[itemLabel]?.querySelector('a[role="menuitem"]') as HTMLElement
          firstLink?.focus()
        }, 100)
        break
      case 'ArrowUp':
        e.preventDefault()
        if (openDropdown !== itemLabel) {
          openDropdownImmediate(itemLabel)
        }
        dropdownFocusTimeout.current = window.setTimeout(() => {
          const links = dropdownRefs.current[itemLabel]?.querySelectorAll('a[role="menuitem"]') as NodeListOf<HTMLElement>
          links[links.length - 1]?.focus()
        }, 100)
        break
    }
  }

  // keyboard handling when focused inside a dropdown item
  const handleDropdownItemKeyDown = (e: React.KeyboardEvent) => {
    const currentItem = e.currentTarget as HTMLElement
    const dropdown = currentItem.closest('[role="menu"]') as HTMLElement
    const items = Array.from(dropdown?.querySelectorAll('a[role="menuitem"]') || []) as HTMLElement[]
    const currentIndex = items.indexOf(currentItem)

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        const nextIndex = (currentIndex + 1) % items.length
        items[nextIndex]?.focus()
        break
      case 'ArrowUp':
        e.preventDefault()
        const prevIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1
        items[prevIndex]?.focus()
        break
      case 'Escape':
        // close and focus main nav item
        setOpenDropdown(null)
        const mainNavItem = document.querySelector(`[aria-expanded="true"]`) as HTMLElement
        mainNavItem?.focus()
        break
      case 'Tab':
        // close because user is tabbing out
        setOpenDropdown(null)
        break
    }
  }

  // close dropdown on outside click or Escape globally
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node
      // if click outside any dropdown and outside primary nav area, close
      const anyDropdown = Object.values(dropdownRefs.current).some(el => el && el.contains(target))
      const navRoot = navItemsRef.current
      if (!anyDropdown && navRoot && !navRoot.contains(target)) {
        setOpenDropdown(null)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenDropdown(null)
      }
    }
    document.addEventListener('click', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('click', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const handleLogoEnter = () => {
    const img = logoImgRef.current
    if (!img) return
    logoTweenRef.current?.kill()
    gsap.set(img, { rotate: 0 })
    logoTweenRef.current = gsap.to(img, {
      rotate: 360,
      duration: 0.2,
      ease,
      overwrite: 'auto'
    })
  }

  const toggleMobileMenu = () => {
    const newState = !isMobileMenuOpen
    setIsMobileMenuOpen(newState)

    const hamburger = hamburgerRef.current
    const menu = mobileMenuRef.current

    if (hamburger) {
      const lines = hamburger.querySelectorAll('.hamburger-line')
      if (newState) {
        gsap.to(lines[0], { rotation: 45, y: 3, duration: 0.4, ease: 'var(--nav-transition-easing)' })
        gsap.to(lines[1], { rotation: -45, y: -3, duration: 0.4, ease: 'var(--nav-transition-easing)' })
      } else {
        gsap.to(lines[0], { rotation: 0, y: 0, duration: 0.4, ease: 'var(--nav-transition-easing)' })
        gsap.to(lines[1], { rotation: 0, y: 0, duration: 0.4, ease: 'var(--nav-transition-easing)' })
      }
    }

    if (menu) {
      if (newState) {
        gsap.set(menu, { visibility: 'visible' })
        gsap.fromTo(
          menu,
          { opacity: 0, y: 10, scaleY: 1 },
          {
            opacity: 1,
            y: 0,
            scaleY: 1,
            duration: 0.4,
            ease: 'var(--nav-transition-easing)',
            transformOrigin: 'top center'
          }
        )
      } else {
        gsap.to(menu, {
          opacity: 0,
          y: 10,
          scaleY: 1,
          duration: 0.3,
          ease: 'var(--nav-transition-easing)',
          transformOrigin: 'top center',
          onComplete: () => {
            gsap.set(menu, { visibility: 'hidden' })
          }
        })
      }
    }

    onMobileMenuClick?.()
  }

  const isExternalLink = (href: string) =>
    href.startsWith('http://') ||
    href.startsWith('https://') ||
    href.startsWith('//') ||
    href.startsWith('mailto:') ||
    href.startsWith('tel:') ||
    href.startsWith('#')

  const isRouterLink = (href: string) => href && !isExternalLink(href)

  const cssVars = {
    ['--base']: baseColor,
    ['--pill-bg']: pillColor,
    ['--hover-text']: hoveredPillTextColor,
    ['--pill-text']: resolvedPillTextColor,
    ['--nav-h']: '44px',
    ['--logo']: '36px',
    ['--pill-pad-x']: '16px',
    ['--pill-gap']: '2px',
    ['--nav-font-family']: '"Geist", "Geist Fallback", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    ['--nav-font-size']: '0.875rem',
    ['--nav-font-weight']: '500',
    ['--nav-line-height']: '1.4',
    ['--nav-letter-spacing']: '0.01em',
    ['--nav-text-transform']: 'none',
    ['--nav-text-color']: 'var(--foreground)',
    ['--nav-hover-color']: 'var(--accent)',
    ['--nav-transition-duration']: '250ms',
    ['--nav-transition-easing']: 'cubic-bezier(0.4, 0, 0.2, 1)'
  } as React.CSSProperties

  return (
    <div className="fixed top-0 left-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border">
      <nav
        className={`max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between ${className}`}
        aria-label="Primary"
        style={cssVars}
      >
        {/* Logo */}
        <Link
          href="/"
          aria-label="Home"
          onMouseEnter={handleLogoEnter}
          role="menuitem"
          ref={logoRef}
          className="flex items-center gap-2 group"
        >
          <div 
            className="rounded-full p-2 inline-flex items-center justify-center overflow-hidden"
            style={{
              width: 'var(--nav-h)',
              height: 'var(--nav-h)',
              background: 'var(--base, #000)'
            }}
          >
            <div className="w-full h-full bg-gradient-to-br from-accent to-accent/70 rounded-full flex items-center justify-center">
              <span className="text-foreground font-bold text-lg">Pst.</span>
            </div>
          </div>
          <span 
            className="hidden sm:inline font-bold text-primary"
            style={{
              fontFamily: 'var(--nav-font-family)',
              fontSize: '1.125rem',
              lineHeight: 'var(--nav-line-height)',
              letterSpacing: 'var(--nav-letter-spacing)'
            }}
          >
            Evelyn Joshua
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div
          ref={navItemsRef}
          className="relative items-center rounded-full hidden md:flex ml-2"
          style={{
            height: 'var(--nav-h)',
            background: 'var(--base, #000)'
          }}
        >
          <ul
            role="menubar"
            className="list-none flex items-stretch m-0 p-[3px] h-full"
            style={{ gap: 'var(--pill-gap)' }}
          >
            {items.map((item, i) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
              const hasDropdown = item.dropdownItems && item.dropdownItems.length > 0

              const pillStyle = {
                background: 'var(--pill-bg, #fff)',
                color: 'var(--pill-text, var(--base, #000))',
                paddingLeft: 'var(--pill-pad-x)',
                paddingRight: 'var(--pill-pad-x)',
                fontFamily: 'var(--nav-font-family)',
                fontSize: 'var(--nav-font-size)',
                fontWeight: 'var(--nav-font-weight)',
                lineHeight: 'var(--nav-line-height)',
                letterSpacing: 'var(--nav-letter-spacing)',
                textTransform: 'none' as const,
                transition: 'color var(--nav-transition-duration) var(--nav-transition-easing)',
                textAlign: 'center' as const
              }

              const PillContent = (
                <>
                  <span
                    className="hover-circle absolute left-1/2 bottom-0 rounded-full z-[1] block pointer-events-none"
                    style={{
                      background: 'var(--base, #000)',
                      willChange: 'transform'
                    }}
                    aria-hidden="true"
                    ref={el => {
                      if (el) circleRefs.current[i] = el
                    }}
                  />
                  <span className="label-stack relative inline-block leading-[1] z-[2]">
                    <span
                      className="pill-label relative z-[2] inline-block leading-[1]"
                      style={{ willChange: 'transform' }}
                    >
                      {item.label}
                    </span>
                    <span
                      className="pill-label-hover absolute left-0 top-0 z-[3] inline-block"
                      style={{
                        color: 'var(--hover-text, #fff)',
                        willChange: 'transform, opacity'
                      }}
                      aria-hidden="true"
                    >
                      {item.label}
                    </span>
                  </span>
                  {isActive && (
                    <span
                      className="absolute left-1/2 -bottom-[6px] -translate-x-1/2 w-3 h-3 rounded-full z-[4]"
                      style={{ background: 'var(--base, #000)' }}
                      aria-hidden="true"
                    />
                  )}
                </>
              )

              const basePillClasses =
                'relative overflow-hidden inline-flex items-center justify-center h-full no-underline rounded-full box-border whitespace-nowrap cursor-pointer px-0'

              if (hasDropdown) {
                return (
                  <li key={item.href} role="none" className="flex h-full relative">
                    <div
                      className="relative"
                      onMouseEnter={() => {
                        handleEnter(i)
                        // only auto-open on hover for non-touch pointers (desktop/tablet)
                        if (!isPointerTouch) openDropdownImmediate(item.label)
                      }}
                      onMouseLeave={() => {
                        handleLeave(i)
                        // smooth close when leaving
                        if (!isPointerTouch) closeDropdownSmooth(item.label)
                      }}
                    >
                      <Link
                        role="menuitem"
                        href={item.href}
                        className={basePillClasses}
                        style={pillStyle}
                        aria-label={item.label}
                        aria-haspopup="true"
                        aria-controls={`submenu-${item.label.replace(/\s+/g, '-')}`}
                        aria-expanded={openDropdown === item.label}
                        onKeyDown={(e) => handleDropdownKeyDown(e, item.label)}
                        tabIndex={0}
                        onClick={(e) => {
                          // on touch devices, prefer click to toggle dropdown instead of navigating away
                          if (isPointerTouch) {
                            e.preventDefault()
                            toggleDropdown(item.label)
                          }
                        }}
                      >
                        {PillContent}
                        <span 
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 border-r-2 border-b-2 border-current transform transition-transform duration-200"
                          style={{
                            transform: openDropdown === item.label ? 'rotate(45deg) translateY(-50%)' : 'rotate(45deg) translateY(-50%)',
                            opacity: 0.7
                          }}
                          aria-hidden="true"
                        />
                      </Link>

                      {/* Dropdown - always mounted but toggled via CSS for smooth transitions */}
                      <div
                        id={`submenu-${item.label.replace(/\s+/g, '-')}`}
                        ref={(el) => {
                          dropdownRefs.current[item.label] = el
                        }}
                        className="absolute top-full left-0 mt-2 w-64 rounded-lg shadow-lg z-[999] border"
                        style={{
                          // visual / transition
                          background: 'var(--pill-bg, #fff)',
                          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                          borderColor: 'rgba(0,0,0,0.06)',
                          // animation states: when open -> visible; when closed -> translateY & opacity 0
                          opacity: openDropdown === item.label ? 1 : 0,
                          transform: openDropdown === item.label ? 'translateY(0)' : 'translateY(-6px)',
                          transition: 'opacity var(--nav-transition-duration) var(--nav-transition-easing), transform var(--nav-transition-duration) var(--nav-transition-easing)',
                          pointerEvents: openDropdown === item.label ? 'auto' : 'none',
                          minWidth: '16rem',
                          overflow: 'hidden'
                        }}
                        role="menu"
                        aria-label={`${item.label} submenu`}
                        aria-hidden={openDropdown === item.label ? undefined : true}
                        onMouseEnter={() => {
                          // keep open while hovered
                          if (!isPointerTouch) openDropdownImmediate(item.label)
                        }}
                        onMouseLeave={() => {
                          if (!isPointerTouch) closeDropdownSmooth(item.label)
                        }}
                      >
                        {item.dropdownItems?.map((dropdownItem, dropdownIndex) => {
                          const isDropdownActive = pathname === dropdownItem.href
                          return (
                            <Link
                              key={dropdownItem.href}
                              href={dropdownItem.href}
                              className="block px-4 py-3 text-sm hover:bg-gray-100 transition-colors duration-200 no-underline focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1"
                              style={{
                                background: isDropdownActive ? 'var(--base, #000)' : 'transparent',
                                color: isDropdownActive ? 'var(--hover-text, #fff)' : 'var(--pill-text, #000)'
                              }}
                              role="menuitem"
                              tabIndex={openDropdown === item.label ? 0 : -1}
                              onClick={() => setOpenDropdown(null)}
                              onKeyDown={handleDropdownItemKeyDown}
                              aria-current={isDropdownActive ? 'page' : undefined}
                            >
                              <div className="font-medium">{dropdownItem.label}</div>
                              {dropdownItem.description && (
                                <div className="text-xs opacity-70 mt-1">{dropdownItem.description}</div>
                              )}
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  </li>
                )
              }

              return (
                <li key={item.href} role="none" className="flex h-full">
                  <Link
                    role="menuitem"
                    href={item.href}
                    className={basePillClasses}
                    style={pillStyle}
                    aria-label={item.label}
                    onMouseEnter={() => handleEnter(i)}
                    onMouseLeave={() => handleLeave(i)}
                  >
                    {PillContent}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>

        {/* Desktop CTA Button */}
        <Link
          href="/contact"
          className="hidden md:inline-block px-6 py-2 bg-accent text-accent-foreground rounded-lg hover:shadow-lg hover:shadow-accent/30 transition-all duration-300 hover:-translate-y-0.5"
          aria-label="Navigate to Contact"
          style={{
            fontFamily: 'var(--nav-font-family)',
            fontSize: 'var(--nav-font-size)',
            fontWeight: 'var(--nav-font-weight)',
            lineHeight: 'var(--nav-line-height)',
            letterSpacing: 'var(--nav-letter-spacing)',
            textTransform: 'none' as const
          }}
        >
          Contact
        </Link>

        {/* Mobile Menu Button */}
        <button
          ref={hamburgerRef}
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
          aria-expanded={isMobileMenuOpen}
          className="md:hidden rounded-full border-0 flex flex-col items-center justify-center gap-1 cursor-pointer p-0 relative"
          style={{
            width: 'var(--nav-h)',
            height: 'var(--nav-h)',
            background: 'var(--base, #000)'
          }}
        >
          <span
            className="hamburger-line w-4 h-0.5 rounded origin-center transition-all duration-[10ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]"
            style={{ background: 'var(--pill-bg, #fff)' }}
          />
          <span
            className="hamburger-line w-4 h-0.5 rounded origin-center transition-all duration-[10ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]"
            style={{ background: 'var(--pill-bg, #fff)' }}
          />
        </button>
      </nav>

      {/* Mobile Navigation */}
      <div
        ref={mobileMenuRef}
        className="md:hidden absolute top-[calc(100%+1rem)] left-4 right-4 rounded-[27px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] z-[998] origin-top"
        style={{
          ...cssVars,
          background: 'var(--base, #f0f0f0)'
        }}
      >
        <ul className="list-none m-0 p-[3px] flex flex-col gap-[3px]">
          {items.map(item => {
            const hasDropdown = item.dropdownItems && item.dropdownItems.length > 0
            
            const defaultStyle = {
              background: 'var(--pill-bg, #fff)',
              color: 'var(--pill-text, #fff)',
              fontFamily: 'var(--nav-font-family)',
              fontSize: 'var(--nav-font-size)',
              fontWeight: 'var(--nav-font-weight)',
              lineHeight: 'var(--nav-line-height)',
              letterSpacing: 'var(--nav-letter-spacing)',
              textTransform: 'none' as const,
              textAlign: 'center' as const,
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 200ms ease-[cubic-bezier(0.25,0.1,0.25,1)], color 200ms ease-[cubic-bezier(0.25,0.1,0.25,1)]'
            }
            const hoverIn = (e: React.MouseEvent) => {
              const target = e.currentTarget as HTMLElement
              target.style.background = 'var(--base)'
              target.style.color = 'var(--hover-text, #fff)'
            }
            const hoverOut = (e: React.MouseEvent) => {
              const target = e.currentTarget as HTMLElement
              target.style.background = 'var(--pill-bg, #fff)'
              target.style.color = 'var(--pill-text, #fff)'
            }
    
            const linkClasses =
              'block py-4 px-4 rounded-[50px] transition-all duration-200 ease-[cubic-bezier(0.25,0.1,0.25,1)] min-h-[44px] flex items-center justify-center'

            if (hasDropdown) {
              return (
                <Fragment key={item.href}>
                  <li role="none">
                    <button
                      className={linkClasses}
                      style={defaultStyle}
                      aria-haspopup="true"
                      aria-expanded={openDropdown === item.label}
                      onClick={() => setOpenDropdown(openDropdown === item.label ? null : item.label)}
                      onKeyDown={(e) => handleDropdownKeyDown(e, item.label)}
                      tabIndex={0}
                    >
                      <span className="flex items-center justify-between w-full">
                        {item.label}
                        <span 
                          className="ml-2 w-2 h-2 border-r-2 border-b-2 border-current transform transition-transform duration-200"
                          style={{
                            transform: openDropdown === item.label ? 'rotate(45deg)' : 'rotate(-45deg)',
                            opacity: 0.7
                          }}
                          aria-hidden="true"
                        />
                      </span>
                    </button>
                  </li>
                  {openDropdown === item.label && item.dropdownItems?.map(dropdownItem => {
                    const isDropdownActive = pathname === dropdownItem.href
                    const dropdownStyle = {
                      ...defaultStyle,
                      background: isDropdownActive ? 'var(--base, #000)' : 'var(--pill-bg, #fff)',
                      color: isDropdownActive ? 'var(--hover-text, #fff)' : 'var(--pill-text, #fff)',
                      paddingLeft: '2rem',
                      fontSize: '0.875rem'
                    }
                    
                    return (
                      <li key={dropdownItem.href} role="none">
                        <Link
                          href={dropdownItem.href}
                          className={linkClasses}
                          style={dropdownStyle}
                          onMouseEnter={hoverIn}
                          onMouseLeave={hoverOut}
                          onClick={() => {
                            setIsMobileMenuOpen(false)
                            setOpenDropdown(null)
                          }}
                          role="menuitem"
                          tabIndex={0}
                          aria-current={isDropdownActive ? 'page' : undefined}
                          onKeyDown={handleDropdownItemKeyDown}
                        >
                          {dropdownItem.label}
                        </Link>
                      </li>
                    )
                  })}
                </Fragment>
              )
            }
    
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={linkClasses}
                  style={defaultStyle}
                  onMouseEnter={hoverIn}
                  onMouseLeave={hoverOut}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            )
          })}
          <li>
            <Link
              href="/contact"
              className="block py-4 px-4 rounded-[50px] transition-all duration-200 ease-[cubic-bezier(0.25,0.1,0.25,1)] min-h-[44px] flex items-center justify-center"
              style={{
                background: 'var(--pill-bg, #fff)',
                color: 'var(--pill-text, #fff)',
                fontFamily: 'var(--nav-font-family)',
                fontSize: 'var(--nav-font-size)',
                fontWeight: 'var(--nav-font-weight)',
                lineHeight: 'var(--nav-line-height)',
                letterSpacing: 'var(--nav-letter-spacing)',
                textTransform: 'none' as const,
                textAlign: 'center' as const,
                minHeight: '44px'
              }}
              onMouseEnter={(e) => {
                const target = e.currentTarget as HTMLElement
                target.style.background = 'var(--base)'
                target.style.color = 'var(--hover-text, #fff)'
              }}
              onMouseLeave={(e) => {
                const target = e.currentTarget as HTMLElement
                target.style.background = 'var(--pill-bg, #fff)'
                target.style.color = 'var(--pill-text, #fff)'
              }}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Contact
            </Link>
          </li>
        </ul>
      </div>
    </div>
  )
}
