'use client'

import { useEffect } from 'react'
import { useEdit } from './edit-context'

interface UseEditableOptions {
  id: string
  content: string
  type?: 'text' | 'html' | 'image' | 'video'
  validation?: {
    required?: boolean
    minLength?: number
    maxLength?: number
    pattern?: RegExp
  }
}

export function useEditable({
  id,
  content,
  type = 'text',
  validation,
}: UseEditableOptions) {
  const { editState, updateContent } = useEdit()

  useEffect(() => {
    // Register the editable content when component mounts
    updateContent(id, content)
  }, [id, content, updateContent])

  const currentContent = editState.content[id]?.content ?? content
  const hasChanges = editState.content[id]?.content !== editState.content[id]?.originalContent
  const errors = editState.content[id] ? getValidationErrors(editState.content[id]) : []

  return {
    content: currentContent,
    hasChanges,
    errors,
    isEditMode: editState.isEditMode,
  }
}

function getValidationErrors(editable: any): string[] {
  if (!editable.validation) return []
  
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
}