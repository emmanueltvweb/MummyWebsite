'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'

export interface EditableContent {
  id: string
  content: string
  originalContent: string
  type: 'text' | 'html' | 'image' | 'video'
  validation?: {
    required?: boolean
    minLength?: number
    maxLength?: number
    pattern?: RegExp
  }
}

export interface EditState {
  isEditMode: boolean
  content: Record<string, EditableContent>
  hasChanges: boolean
  isSaving: boolean
  saveError: string | null
  lastSaved: Date | null
}

interface EditContextType {
  editState: EditState
  enterEditMode: () => void
  exitEditMode: () => void
  updateContent: (id: string, content: string) => void
  saveChanges: () => Promise<void>
  discardChanges: () => void
  validateContent: (id: string) => boolean
  getValidationErrors: (id: string) => string[]
}

const EditContext = createContext<EditContextType | undefined>(undefined)

export function EditProvider({ children }: { children: ReactNode }) {
  const [editState, setEditState] = useState<EditState>({
    isEditMode: false,
    content: {},
    hasChanges: false,
    isSaving: false,
    saveError: null,
    lastSaved: null,
  })

  const enterEditMode = useCallback(() => {
    console.log('Entering edit mode...')
    setEditState(prev => ({
      ...prev,
      isEditMode: true,
      saveError: null,
    }))
  }, [])

  const exitEditMode = useCallback(() => {
    setEditState(prev => ({
      ...prev,
      isEditMode: false,
      hasChanges: false,
    }))
  }, [])

  const updateContent = useCallback((id: string, content: string) => {
    setEditState(prev => {
      const existingContent = prev.content[id]
      if (!existingContent) return prev

      return {
        ...prev,
        content: {
          ...prev.content,
          [id]: {
            ...existingContent,
            content,
          },
        },
        hasChanges: content !== existingContent.originalContent,
      }
    })
  }, [])

  const validateContent = useCallback((id: string): boolean => {
    const editable = editState.content[id]
    if (!editable || !editable.validation) return true

    const { validation, content } = editable
    const errors: string[] = []

    if (validation.required && !content.trim()) {
      errors.push('This field is required')
    }

    if (validation.minLength && content.length < validation.minLength) {
      errors.push(`Minimum length is ${validation.minLength} characters`)
    }

    if (validation.maxLength && content.length > validation.maxLength) {
      errors.push(`Maximum length is ${validation.maxLength} characters`)
    }

    if (validation.pattern && !validation.pattern.test(content)) {
      errors.push('Content does not match required format')
    }

    return errors.length === 0
  }, [editState.content])

  const getValidationErrors = useCallback((id: string): string[] => {
    const editable = editState.content[id]
    if (!editable || !editable.validation) return []

    const { validation, content } = editable
    const errors: string[] = []

    if (validation.required && !content.trim()) {
      errors.push('This field is required')
    }

    if (validation.minLength && content.length < validation.minLength) {
      errors.push(`Minimum length is ${validation.minLength} characters`)
    }

    if (validation.maxLength && content.length > validation.maxLength) {
      errors.push(`Maximum length is ${validation.maxLength} characters`)
    }

    if (validation.pattern && !validation.pattern.test(content)) {
      errors.push('Content does not match required format')
    }

    return errors
  }, [editState.content])

  const saveChanges = useCallback(async (): Promise<void> => {
    // Validate all content before saving
    const validationErrors = Object.keys(editState.content).filter(id => !validateContent(id))
    if (validationErrors.length > 0) {
      setEditState(prev => ({
        ...prev,
        saveError: 'Please fix validation errors before saving',
      }))
      throw new Error('Validation failed')
    }

    setEditState(prev => ({
      ...prev,
      isSaving: true,
      saveError: null,
    }))

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Update original content with new content
      setEditState(prev => {
        const updatedContent = Object.keys(prev.content).reduce((acc, id) => {
          const editable = prev.content[id]
          acc[id] = {
            ...editable,
            originalContent: editable.content,
          }
          return acc
        }, {} as Record<string, EditableContent>)

        return {
          ...prev,
          content: updatedContent,
          hasChanges: false,
          lastSaved: new Date(),
        }
      })
    } catch (error) {
      setEditState(prev => ({
        ...prev,
        saveError: error instanceof Error ? error.message : 'Failed to save changes',
      }))
      throw error
    } finally {
      setEditState(prev => ({
        ...prev,
        isSaving: false,
      }))
    }
  }, [editState.content, validateContent])

  const discardChanges = useCallback(() => {
    setEditState(prev => {
      const restoredContent = Object.keys(prev.content).reduce((acc, id) => {
        const editable = prev.content[id]
        acc[id] = {
          ...editable,
          content: editable.originalContent,
        }
        return acc
      }, {} as Record<string, EditableContent>)

      return {
        ...prev,
        content: restoredContent,
        hasChanges: false,
      }
    })
  }, [])

  const value: EditContextType = {
    editState,
    enterEditMode,
    exitEditMode,
    updateContent,
    saveChanges,
    discardChanges,
    validateContent,
    getValidationErrors,
  }

  return <EditContext.Provider value={value}>{children}</EditContext.Provider>
}

export function useEdit() {
  const context = useContext(EditContext)
  if (context === undefined) {
    throw new Error('useEdit must be used within an EditProvider')
  }
  return context
}