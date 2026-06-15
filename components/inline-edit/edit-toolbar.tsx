'use client'

import React from 'react'
import { useEdit } from './edit-context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Save, 
  RotateCcw, 
  Eye, 
  X, 
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { UltraIsolatedEditButton } from './ultra-isolated-edit-button'

interface EditToolbarProps {
  className?: string
  showPreview?: boolean
  onPreview?: () => void
  onSave?: () => Promise<void>
  position?: 'top' | 'bottom' | 'floating'
}

export function EditToolbar({
  className,
  showPreview = true,
  onPreview,
  onSave,
  position = 'top'
}: EditToolbarProps) {
  const { 
    editState, 
    enterEditMode, 
    exitEditMode, 
    saveChanges, 
    discardChanges 
  } = useEdit()

  const handleEnterEditMode = (e?: React.MouseEvent) => {
    console.log('Edit button clicked - entering edit mode')
    e?.preventDefault()
    e?.stopPropagation()
    enterEditMode()
  }

  const handleSave = async (e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    try {
      if (onSave) {
        await onSave()
      } else {
        await saveChanges()
      }
    } catch (error) {
      // Error is already handled in the context
      console.error('Save failed:', error)
    }
  }

  const handleDiscard = (e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    if (editState.hasChanges) {
      if (confirm('Are you sure you want to discard all changes? This action cannot be undone.')) {
        discardChanges()
      }
    } else {
      exitEditMode()
    }
  }

  const handleExit = (e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    if (editState.hasChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to exit edit mode?')) {
        exitEditMode()
      }
    } else {
      exitEditMode()
    }
  }

  const getStatusColor = () => {
    if (editState.isSaving) return 'bg-yellow-500'
    if (editState.saveError) return 'bg-red-500'
    if (editState.hasChanges) return 'bg-orange-500'
    if (editState.lastSaved) return 'bg-green-500'
    return 'bg-gray-500'
  }

  const getStatusText = () => {
    if (editState.isSaving) return 'Saving...'
    if (editState.saveError) return 'Save Failed'
    if (editState.hasChanges) return 'Unsaved Changes'
    if (editState.lastSaved) return 'Saved'
    return 'No Changes'
  }

  if (!editState.isEditMode) {
    return (
      <div className={cn(
        "fixed z-50",
        position === 'top' && "top-4 right-4",
        position === 'bottom' && "bottom-4 right-4",
        position === 'floating' && "top-1/2 right-4 -translate-y-1/2",
        className
      )}>
        <UltraIsolatedEditButton />
      </div>
    )
  }

  const toolbarContent = (
    <div className={cn(
      "bg-background border rounded-lg shadow-lg p-3 space-y-3",
      className
    )}>
      {/* Status Bar */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full", getStatusColor())} />
          <span className={cn(
            "font-medium",
            editState.saveError && "text-red-600",
            editState.hasChanges && "text-orange-600",
            editState.lastSaved && !editState.hasChanges && "text-green-600"
          )}>
            {getStatusText()}
          </span>
        </div>
        
        {editState.lastSaved && (
          <span className="text-muted-foreground text-xs">
            Last saved: {editState.lastSaved.toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Error Message */}
      {editState.saveError && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-2 rounded">
          <AlertCircle className="w-4 h-4" />
          <span>{editState.saveError}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 flex-wrap">
        {showPreview && onPreview && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onPreview?.()
            }}
            disabled={editState.isSaving}
          >
            <Eye className="w-4 h-4 mr-1" />
            Preview
          </Button>
        )}

        <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleDiscard(e)
            }}
            disabled={editState.isSaving}
            className="text-orange-600 hover:text-orange-700"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Discard
          </Button>

        <Button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleSave(e)
            }}
            disabled={!editState.hasChanges || editState.isSaving}
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {editState.isSaving ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-1" />
            )}
            {editState.isSaving ? 'Saving...' : 'Publish'}
          </Button>

        <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleExit(e)
            }}
            disabled={editState.isSaving}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <X className="w-4 h-4 mr-1" />
            Exit
          </Button>
      </div>
    </div>
  )

  if (position === 'floating') {
    return (
      <div className="fixed top-1/2 right-4 -translate-y-1/2 z-50">
        {toolbarContent}
      </div>
    )
  }

  return (
    <div className={cn(
      "fixed z-50",
      position === 'top' && "top-4 right-4",
      position === 'bottom' && "bottom-4 right-4",
      className
    )}>
      {toolbarContent}
    </div>
  )
}