'use client'

import { Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface NavLinksEditorProps {
  label: string
  links: { label: string; href: string }[]
  onChange: (links: { label: string; href: string }[]) => void
}

export function NavLinksEditor({ label, links, onChange }: NavLinksEditorProps) {
  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      {links.map((link, index) => (
        <div key={index} className="flex gap-2 items-start">
          <Input
            value={link.label}
            onChange={(e) => {
              const updated = [...links]
              updated[index] = { ...link, label: e.target.value }
              onChange(updated)
            }}
            placeholder="Label"
            className="flex-1"
          />
          <Input
            value={link.href}
            onChange={(e) => {
              const updated = [...links]
              updated[index] = { ...link, href: e.target.value }
              onChange(updated)
            }}
            placeholder="/path or https://..."
            className="flex-[2]"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onChange(links.filter((_, i) => i !== index))}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...links, { label: '', href: '' }])}
      >
        <Plus className="h-4 w-4 mr-1" />
        Add Link
      </Button>
    </div>
  )
}

interface StringListEditorProps {
  label: string
  items: string[]
  onChange: (items: string[]) => void
  placeholder?: string
}

export function StringListEditor({ label, items, onChange, placeholder }: StringListEditorProps) {
  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      {items.map((item, index) => (
        <div key={index} className="flex gap-2">
          <Input
            value={item}
            onChange={(e) => {
              const updated = [...items]
              updated[index] = e.target.value
              onChange(updated)
            }}
            placeholder={placeholder}
            className="flex-1"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onChange(items.filter((_, i) => i !== index))}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...items, ''])}
      >
        <Plus className="h-4 w-4 mr-1" />
        Add Item
      </Button>
    </div>
  )
}
