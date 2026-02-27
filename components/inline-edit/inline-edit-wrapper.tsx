'use client'

import React, { ReactNode } from 'react'
import { EditProvider } from './edit-context'
import { EditToolbar } from './edit-toolbar'

interface InlineEditWrapperProps {
  children: ReactNode
  enabled?: boolean
  className?: string
  toolbarPosition?: 'top' | 'bottom' | 'floating'
  onSave?: () => Promise<void>
  onError?: (error: Error) => void
}

export function InlineEditWrapper({
  children,
  enabled = true,
  className,
  toolbarPosition = 'top',
  onSave,
  onError,
}: InlineEditWrapperProps) {
  if (!enabled) {
    return <div className={className}>{children}</div>
  }

  const handleSave = async () => {
    try {
      if (onSave) {
        await onSave()
      }
    } catch (error) {
      if (onError) {
        onError(error instanceof Error ? error : new Error('Unknown error'))
      }
      throw error
    }
  }

  const handlePreview = () => {
    // Open current page in new tab for preview
    window.open(window.location.href, '_blank')
  }

  return (
    <EditProvider>
      <div className={className}>
        <EditToolbar
          position={toolbarPosition}
          onPreview={handlePreview}
          onSave={handleSave}
        />
        {children}
      </div>
    </EditProvider>
  )
}