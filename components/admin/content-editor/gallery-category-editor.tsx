"use client"

import { useEffect, useState } from "react"
import { FileText, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { GalleryCategoryDescription } from "@/lib/content/types"

export const emptyCategoryDescription = (): GalleryCategoryDescription => ({ title: "", description: "", readMoreUrl: "" })

/** The title / text / "Read More" fields shared by the category, subcategory and "Add category" forms. */
export function DescriptionFields({
  idPrefix,
  value,
  onChange,
}: {
  idPrefix: string
  value: GalleryCategoryDescription
  onChange: (value: GalleryCategoryDescription) => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor={`${idPrefix}-title`}>Heading</Label>
        <Input
          id={`${idPrefix}-title`}
          className="mt-1"
          value={value.title}
          placeholder="e.g. Kenya Crusade and Charity"
          onChange={(e) => onChange({ ...value, title: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-description`}>Description</Label>
        <Textarea
          id={`${idPrefix}-description`}
          className="mt-1"
          rows={6}
          value={value.description}
          placeholder="Tell visitors about this crusade or outreach. Press Enter to start a new paragraph."
          onChange={(e) => onChange({ ...value, description: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-link`}>“Read More” link (optional)</Label>
        <Input
          id={`${idPrefix}-link`}
          className="mt-1"
          value={value.readMoreUrl}
          placeholder="https://www.scoan.org/…"
          onChange={(e) => onChange({ ...value, readMoreUrl: e.target.value.trim() })}
        />
        <p className="mt-1 text-xs text-gray-500">Leave empty to hide the Read More button.</p>
      </div>
    </div>
  )
}

/** Description box shown under the category on the public Crusade / Outreach page. */
export function CategoryDescriptionPanel({
  category,
  value,
  imageCount,
  onChange,
  onDelete,
}: {
  category: string
  value: GalleryCategoryDescription | undefined
  imageCount: number
  onChange: (value: GalleryCategoryDescription) => void
  onDelete: () => void
}) {
  const current = value ?? emptyCategoryDescription()
  const empty = !current.title.trim() && !current.description.trim()
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <FileText className="mt-0.5 h-5 w-5 text-gray-500" aria-hidden />
          <div>
            <p className="font-semibold text-gray-900">“{category}” description</p>
            <p className="text-xs text-gray-500">
              {empty ? "No description yet — the box under the photos is hidden on the website." : "Shown under the photos when visitors pick this category."}
              {imageCount === 0 && " This category is hidden on the website until it has at least one image."}
            </p>
          </div>
        </div>
        <Button type="button" variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={onDelete}>
          <Trash2 className="h-4 w-4 mr-1" /> Delete category
        </Button>
      </div>
      <DescriptionFields idPrefix={`cat-${category}`} value={current} onChange={onChange} />
    </div>
  )
}

/** "Add category" form: name plus its description. */
export function AddCategoryDialog({
  open,
  onOpenChange,
  existing,
  onCreate,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  existing: string[]
  onCreate: (name: string, description: GalleryCategoryDescription) => void
}) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState(emptyCategoryDescription())
  const [error, setError] = useState("")

  useEffect(() => {
    if (open) {
      setName("")
      setDescription(emptyCategoryDescription())
      setError("")
    }
  }, [open])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return setError("Give the category a name.")
    if (existing.some((c) => c.toLowerCase() === trimmed.toLowerCase())) return setError(`“${trimmed}” already exists.`)
    onCreate(trimmed, { ...description, title: description.title.trim() || trimmed })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <form onSubmit={submit} className="space-y-5">
          <DialogHeader>
            <DialogTitle>Add a gallery category</DialogTitle>
            <DialogDescription>
              For example a crusade or outreach location. After creating it, upload its photos, then click “Save All Changes”.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label htmlFor="new-category-name">Category name</Label>
            <Input
              id="new-category-name"
              className="mt-1"
              value={name}
              placeholder="e.g. Brazil"
              onChange={(e) => {
                setName(e.target.value)
                setError("")
              }}
            />
            {error ? <p className="mt-1 text-xs font-medium text-red-600" role="alert">{error}</p> : <p className="mt-1 text-xs text-gray-500">This is the button visitors click on the gallery page.</p>}
          </div>
          <DescriptionFields idPrefix="new-category" value={description} onChange={setDescription} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Create category</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
