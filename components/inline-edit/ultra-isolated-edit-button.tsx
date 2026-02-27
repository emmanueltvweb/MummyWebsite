'use client'

import React from 'react'
import { useEdit } from './edit-context'
import { SquarePen } from 'lucide-react'

interface UltraIsolatedEditButtonProps {
  className?: string
}

export function UltraIsolatedEditButton({ className }: UltraIsolatedEditButtonProps) {
  const { enterEditMode } = useEdit()

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    console.log('UltraIsolatedEditButton clicked - preventing all navigation')
    
    // Ultra-aggressive navigation prevention
    e.preventDefault()
    e.stopPropagation()
    e.nativeEvent.stopImmediatePropagation()
    
    // Remove any href attributes from parent elements
    let currentElement = e.currentTarget.parentElement
    while (currentElement) {
      if (currentElement.hasAttribute('href')) {
        console.log('Removing href from parent:', currentElement.getAttribute('href'))
        currentElement.removeAttribute('href')
      }
      currentElement = currentElement.parentElement
    }
    
    // Disable any form submission
    const forms = document.querySelectorAll('form')
    forms.forEach(form => {
      form.addEventListener('submit', (e) => {
        e.preventDefault()
        e.stopPropagation()
      }, { once: true })
    })
    
    // Enter edit mode
    console.log('Entering edit mode now...')
    enterEditMode()
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={className || "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5"}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-square-pen h-4 w-4 mr-1">
        <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"></path>
      </svg>
      Edit
    </button>
  )
}