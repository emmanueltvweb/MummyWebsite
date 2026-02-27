'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useEdit } from './edit-context'
import { SquarePen, X, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EditableFieldProps {
  id: string
  content: string
  type?: 'text' | 'html' | 'image' | 'video'
  className?: string
  placeholder?: string
  validation?: {
    required?: boolean
    minLength?: number
    maxLength?: number
    pattern?: RegExp
  }
  onSave?: (content: string) => void
  children?: React.ReactNode
}

export function EditableField({
  id,
  content,
  type = 'text',
  className,
  placeholder = 'Click to edit...',
  validation,
  onSave,
  children,
}: EditableFieldProps) {
  const { editState, updateContent, validateContent, getValidationErrors } = useEdit()
  const [localContent, setLocalContent] = useState(content)
  const [isEditing, setIsEditing] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setLocalContent(content)
  }, [content])

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.select()
    }
  }, [isEditing])

  const handleEdit = () => {
    if (!editState.isEditMode) return
    setIsEditing(true)
    setErrors([])
  }

  const handleSave = () => {
    const validationErrors = getValidationErrors(id)
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }

    updateContent(id, localContent)
    setIsEditing(false)
    onSave?.(localContent)
  }

  const handleCancel = () => {
    setLocalContent(content)
    setIsEditing(false)
    setErrors([])
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }

  if (!editState.isEditMode) {
    return (
      <div className={cn("relative group", className)}>
        {children || (
          <span 
            dangerouslySetInnerHTML={{ 
              __html: content || placeholder 
            }}
          />
        )}
      </div>
    )
  }

  if (isEditing) {
    return (
      <div className={cn("relative", className)}>
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={localContent}
            onChange={(e) => setLocalContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={cn(
              "w-full min-h-[100px] p-3 border-2 border-accent rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-accent/50",
              errors.length > 0 && "border-red-500 focus:ring-red-500/50"
            )}
          />
          <div className="absolute top-2 right-2 flex gap-1">
            <button
              onClick={handleSave}
              className="p-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              title="Save (Ctrl+Enter)"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={handleCancel}
              className="p-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              title="Cancel (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        {errors.length > 0 && (
          <div className="mt-2 text-sm text-red-600">
            {errors.map((error, index) => (
              <div key={index}>{error}</div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn("relative group", className)}>
      <span 
        className="cursor-pointer hover:bg-accent/10 rounded-md p-2 -m-2 transition-colors"
        onClick={handleEdit}
      >
        {children || (
          <span 
            dangerouslySetInnerHTML={{ 
              __html: content || placeholder 
            }}
          />
        )}
      </span>
      <button
        onClick={handleEdit}
        className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 bg-accent text-accent-foreground rounded-full p-1 transition-all duration-200 hover:scale-110"
        title="Click to edit"
      >
        <SquarePen className="w-4 h-4" />
      </button>
    </div>
  )
}

interface EditableTextProps {
  id: string
  text: string
  className?: string
  placeholder?: string
  validation?: {
    required?: boolean
    minLength?: number
    maxLength?: number
    pattern?: RegExp
  }
  onSave?: (text: string) => void
}

export function EditableText({
  id,
  text,
  className,
  placeholder,
  validation,
  onSave,
}: EditableTextProps) {
  return (
    <EditableField
      id={id}
      content={text}
      type="text"
      className={className}
      placeholder={placeholder}
      validation={validation}
      onSave={onSave}
    >
      <span>{text || placeholder}</span>
    </EditableField>
  )
}

interface EditableHTMLProps {
  id: string
  html: string
  className?: string
  placeholder?: string
  validation?: {
    required?: boolean
    minLength?: number
    maxLength?: number
    pattern?: RegExp
  }
  onSave?: (html: string) => void
}

export function EditableHTML({
  id,
  html,
  className,
  placeholder,
  validation,
  onSave,
}: EditableHTMLProps) {
  return (
    <EditableField
      id={id}
      content={html}
      type="html"
      className={className}
      placeholder={placeholder}
      validation={validation}
      onSave={onSave}
    />
  )
}