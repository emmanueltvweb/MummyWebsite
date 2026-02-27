'use client'

import React from 'react'
import { useEdit } from './edit-context'
import { SquarePen } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface IsolatedEditButtonProps {
  className?: string
}

export function IsolatedEditButton({ className }: IsolatedEditButtonProps) {
  const { enterEditMode } = useEdit()

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    console.log('IsolatedEditButton clicked')
    
    // Prevent all forms of navigation
    e.preventDefault()
    e.stopPropagation()
    e.nativeEvent.stopImmediatePropagation()
    
    // Disable any parent form submission
    const button = e.currentTarget
    button.form?.removeEventListener('submit', () => {})
    
    // Enter edit mode
    enterEditMode()
  }

  return (
    <Button
      type="button"
      onClick={handleClick}
      className={className || "bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg"}
      size="sm"
    >
      <SquarePen className="w-4 h-4 mr-2" />
      Edit Page
    </Button>
  )
}