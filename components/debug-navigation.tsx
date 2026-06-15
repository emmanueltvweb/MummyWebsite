"use client"

import { useEffect } from 'react'

export function DebugNavigation() {
  useEffect(() => {
    // Add event listeners to track navigation
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      console.log('Click detected:', {
        target: target.tagName,
        className: target.className,
        id: target.id,
        href: target.getAttribute('href'),
        parent: target.parentElement?.tagName,
        isButton: target.tagName === 'BUTTON',
        isLink: target.tagName === 'A',
      })
    }

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      console.log('Navigation detected:', window.location.href)
    }

    document.addEventListener('click', handleClick, true)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      document.removeEventListener('click', handleClick, true)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  return null
}