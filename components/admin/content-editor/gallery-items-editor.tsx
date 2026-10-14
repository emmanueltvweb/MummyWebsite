"use client"

import { useState } from "react"
import { ArrowLeft, ArrowRight, Check, FolderPlus, ImagePlus, Pencil, Plus, Trash2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useConfirm } from "@/components/admin/ui/confirm-dialog"
import { inputClass } from "@/components/admin/ui/primitives"
import { toast } from "@/components/admin/ui/toast"
import { ImageUploadField, UploadDropzone } from "@/components/admin/ui/uploads"
import type { UploadedAsset } from "@/lib/admin/upload"
import { publicIdFromUrl } from "@/lib/cloudinary/optimize"
import type { GalleryCategoryDescription, GalleryItem } from "@/lib/content/types"

import { DescriptionFields, emptyCategoryDescription } from "./gallery-category-editor"
import { cn } from "@/lib/utils"

const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
const folderFor = (category: string, subcategory?: string | null) =>
  `gallery/${slug(category) || "general"}${subcategory ? `/${slug(subcategory) || "sub"}` : ""}`

/** The public gallery prefers `cloudinaryId`, so keep it in sync with the image link. */
function withImage(item: GalleryItem, url: string, asset?: UploadedAsset): GalleryItem {
  const cloudinaryId = asset?.publicId ?? (url ? publicIdFromUrl(url)?.publicId : undefined) ?? ""
  return { ...item, image: url, cloudinaryId, type: "image" }
}

const titleFromFile = (name?: string) =>
  (name ?? "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim() || "Gallery image"

/** Subcategory names: the saved order first, then any found on images but missing from the list. */
export function subcategoriesFor(items: GalleryItem[], saved: string[] = []) {
  const extra = items.map((i) => i.subcategory?.trim()).filter((s): s is string => !!s && !saved.includes(s))
  return [...saved, ...Array.from(new Set(extra))]
}

/**
 * Image grid for one gallery category: optional subcategories (e.g. years), preview,
 * upload / replace / pick from library, bulk upload.
 */
export function GalleryCategoryItems({
  category,
  items,
  onChange,
  subcategories: savedSubcategories,
  onSubcategoriesChange,
  subcategoryDescriptions,
  onSubcategoryDescriptionsChange,
}: {
  category: string
  items: GalleryItem[]
  onChange: (items: GalleryItem[]) => void
  subcategories: string[]
  onSubcategoriesChange: (subcategories: string[]) => void
  /** Subcategory name → its own description (shown on the website when that subcategory is picked). */
  subcategoryDescriptions: Record<string, GalleryCategoryDescription>
  onSubcategoryDescriptionsChange: (descriptions: Record<string, GalleryCategoryDescription>) => void
}) {
  const confirm = useConfirm()
  const subcategories = subcategoriesFor(items, savedSubcategories)
  /** null = all images; "" = images without a subcategory; otherwise a subcategory name. */
  const [filter, setFilter] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState("")
  const [renaming, setRenaming] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")

  const activeFilter = filter && !subcategories.includes(filter) ? null : filter
  const uploadTarget = activeFilter || undefined
  const visible = items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) =>
      activeFilter === null ? true : activeFilter === "" ? !item.subcategory : item.subcategory === activeFilter
    )
  const unassigned = items.filter((i) => !i.subcategory).length
  const countFor = (sub: string) => items.filter((i) => i.subcategory === sub).length
  const nextId = (list: GalleryItem[]) => list.reduce((max, i) => Math.max(max, i.id), 0) + 1

  const setItem = (index: number, item: GalleryItem) => onChange(items.map((it, i) => (i === index ? item : it)))

  /** Moves an image past its visible neighbour (so reordering works inside a filtered view too). */
  const move = (position: number, direction: -1 | 1) => {
    const from = visible[position]?.index
    const to = visible[position + direction]?.index
    if (from === undefined || to === undefined) return
    const next = [...items]
    ;[next[from], next[to]] = [next[to], next[from]]
    onChange(next)
  }

  const remove = async (index: number) => {
    const item = items[index]
    const ok = await confirm({
      title: `Remove “${item.title || "this image"}”?`,
      description: `It will be removed from the ${category} gallery when you save. The file stays in your media library.`,
      confirmText: "Remove",
      tone: "danger",
    })
    if (ok) onChange(items.filter((_, i) => i !== index))
  }

  const addUploaded = (assets: UploadedAsset[]) => {
    if (!assets.length) return
    let id = nextId(items)
    const added = assets.map((asset) =>
      withImage(
        { id: id++, title: titleFromFile(asset.originalFilename), image: "", type: "image", ...(uploadTarget ? { subcategory: uploadTarget } : {}) },
        asset.secureUrl,
        asset
      )
    )
    onChange([...items, ...added])
    toast.success(
      `${added.length} image${added.length === 1 ? "" : "s"} added to ${category}${uploadTarget ? ` › ${uploadTarget}` : ""}`,
      "Click “Save All Changes” to publish them."
    )
  }

  const addEmpty = () =>
    onChange([
      ...items,
      { id: nextId(items), title: "New gallery image", image: "", type: "image", cloudinaryId: "", ...(uploadTarget ? { subcategory: uploadTarget } : {}) },
    ])

  /* ---------------- subcategory management ---------------- */

  const exists = (name: string, except?: string) =>
    subcategories.some((s) => s.toLowerCase() === name.toLowerCase() && s !== except)

  const addSubcategory = () => {
    const name = newName.trim()
    if (!name) return
    if (exists(name)) return toast.error(`“${name}” already exists in ${category}`)
    onSubcategoriesChange([...subcategories, name])
    setNewName("")
    setAdding(false)
    setFilter(name)
  }

  const renameSubcategory = (from: string) => {
    const to = renameValue.trim()
    setRenaming(null)
    if (!to || to === from) return
    if (exists(to, from)) return toast.error(`“${to}” already exists in ${category}`)
    onSubcategoriesChange(subcategories.map((s) => (s === from ? to : s)))
    onChange(items.map((i) => (i.subcategory === from ? { ...i, subcategory: to } : i)))
    if (subcategoryDescriptions[from]) {
      const { [from]: moved, ...rest } = subcategoryDescriptions
      onSubcategoryDescriptionsChange({ ...rest, [to]: moved })
    }
    setFilter(to)
  }

  const deleteSubcategory = async (name: string) => {
    const count = countFor(name)
    const ok = await confirm({
      title: `Delete the “${name}” subcategory?`,
      description: count
        ? `Its ${count} image${count === 1 ? " stays" : "s stay"} in ${category}, just without a subcategory (shown under “All”). Its description is removed. Nothing is deleted from the media library.`
        : "It has no images. Its description is removed.",
      confirmText: "Delete subcategory",
      tone: "danger",
    })
    if (!ok) return
    onSubcategoriesChange(subcategories.filter((s) => s !== name))
    onChange(items.map((i) => (i.subcategory === name ? { ...i, subcategory: undefined } : i)))
    if (subcategoryDescriptions[name]) {
      onSubcategoryDescriptionsChange(Object.fromEntries(Object.entries(subcategoryDescriptions).filter(([key]) => key !== name)))
    }
    setFilter(null)
  }

  const moveSubcategory = (name: string, direction: -1 | 1) => {
    const i = subcategories.indexOf(name)
    const j = i + direction
    if (i < 0 || j < 0 || j >= subcategories.length) return
    const next = [...subcategories]
    ;[next[i], next[j]] = [next[j], next[i]]
    onSubcategoriesChange(next)
  }

  const pill = (active: boolean) =>
    cn(
      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition",
      active ? "border-admin-brand bg-admin-brand text-white" : "border-admin-border bg-admin-surface text-admin-text hover:bg-admin-subtle"
    )
  const badge = (active: boolean) => cn("rounded-full px-1.5 text-[11px] tabular-nums", active ? "bg-white/20" : "bg-admin-subtle text-admin-muted")

  return (
    <div className="space-y-5">
      {/* Subcategories */}
      <div className="rounded-xl border border-admin-border/70 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-admin-text">Subcategories in {category}</p>
            <p className="text-xs text-admin-muted">
              Optional — e.g. years like 2024, 2025, 2026. Visitors can pick one to see just its images.
            </p>
          </div>
          {!adding && (
            <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={() => setAdding(true)}>
              <FolderPlus /> Add subcategory
            </Button>
          )}
        </div>

        {adding && (
          <form
            className="mb-3 flex flex-wrap items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              addSubcategory()
            }}
          >
            <input
              className={cn(inputClass, "h-9 max-w-xs")}
              value={newName}
              placeholder="e.g. 2026"
              aria-label="New subcategory name"
              onChange={(e) => setNewName(e.target.value)}
            />
            <Button type="submit" size="sm" className="rounded-xl" disabled={!newName.trim()}>
              <Check /> Add
            </Button>
            <Button type="button" variant="ghost" size="sm" className="rounded-xl" onClick={() => (setAdding(false), setNewName(""))}>
              Cancel
            </Button>
          </form>
        )}

        <div className="flex flex-wrap items-center gap-2" role="group" aria-label={`Filter ${category} images by subcategory`}>
          <button type="button" className={pill(activeFilter === null)} aria-pressed={activeFilter === null} onClick={() => setFilter(null)}>
            All images <span className={badge(activeFilter === null)}>{items.length}</span>
          </button>
          {subcategories.map((sub) =>
            renaming === sub ? (
              <form
                key={sub}
                className="flex items-center gap-1"
                onSubmit={(e) => {
                  e.preventDefault()
                  renameSubcategory(sub)
                }}
              >
                <input className={cn(inputClass, "h-8 w-32")} value={renameValue} aria-label={`Rename ${sub}`} onChange={(e) => setRenameValue(e.target.value)} />
                <Button type="submit" size="icon-sm" className="rounded-lg" aria-label="Save name">
                  <Check />
                </Button>
                <Button type="button" variant="ghost" size="icon-sm" className="rounded-lg" aria-label="Cancel rename" onClick={() => setRenaming(null)}>
                  <X />
                </Button>
              </form>
            ) : (
              <button key={sub} type="button" className={pill(activeFilter === sub)} aria-pressed={activeFilter === sub} onClick={() => setFilter(sub)}>
                {sub} <span className={badge(activeFilter === sub)}>{countFor(sub)}</span>
              </button>
            )
          )}
          {subcategories.length > 0 && unassigned > 0 && (
            <button type="button" className={pill(activeFilter === "")} aria-pressed={activeFilter === ""} onClick={() => setFilter("")}>
              No subcategory <span className={badge(activeFilter === "")}>{unassigned}</span>
            </button>
          )}
        </div>

        {activeFilter && renaming !== activeFilter && (
          <div className="mt-3 flex flex-wrap items-center gap-1 border-t border-admin-border/70 pt-3">
            <span className="mr-1 text-xs text-admin-muted">“{activeFilter}”:</span>
            <Button type="button" variant="ghost" size="sm" className="h-8 rounded-lg" onClick={() => moveSubcategory(activeFilter, -1)} disabled={subcategories.indexOf(activeFilter) === 0}>
              <ArrowLeft /> Move left
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 rounded-lg"
              onClick={() => moveSubcategory(activeFilter, 1)}
              disabled={subcategories.indexOf(activeFilter) === subcategories.length - 1}
            >
              Move right <ArrowRight />
            </Button>
            <Button type="button" variant="ghost" size="sm" className="h-8 rounded-lg" onClick={() => (setRenaming(activeFilter), setRenameValue(activeFilter))}>
              <Pencil /> Rename
            </Button>
            <Button type="button" variant="ghost" size="sm" className="h-8 rounded-lg text-admin-danger hover:bg-admin-danger-soft hover:text-admin-danger" onClick={() => deleteSubcategory(activeFilter)}>
              <Trash2 /> Delete
            </Button>
          </div>
        )}

        {activeFilter && renaming !== activeFilter && (
          <div className="mt-3 rounded-xl border border-admin-border/70 bg-admin-surface-2/60 p-4">
            <p className="text-sm font-semibold text-admin-text">“{category} › {activeFilter}” description</p>
            <p className="mb-3 text-xs text-admin-muted">
              {subcategoryDescriptions[activeFilter]?.title.trim() || subcategoryDescriptions[activeFilter]?.description.trim()
                ? `Shown under the photos when visitors pick ${activeFilter}.`
                : `Empty — visitors who pick ${activeFilter} see the ${category} description instead.`}
            </p>
            <DescriptionFields
              idPrefix={`sub-${category}-${activeFilter}`}
              value={subcategoryDescriptions[activeFilter] ?? emptyCategoryDescription()}
              onChange={(value) => onSubcategoryDescriptionsChange({ ...subcategoryDescriptions, [activeFilter]: value })}
            />
          </div>
        )}
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-admin-text">
          Add images to {category}
          {uploadTarget ? <> › <span className="text-admin-brand">{uploadTarget}</span></> : subcategories.length ? " (no subcategory — pick one above to upload straight into it)" : ""}
        </p>
        <UploadDropzone accept="image" multiple folder={folderFor(category, uploadTarget)} onUploaded={addUploaded} />
      </div>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-admin-border p-8 text-center text-sm text-admin-muted">
          <ImagePlus className="size-6 text-admin-brand" aria-hidden />
          {activeFilter ? `No images in “${activeFilter}” yet. Upload some above.` : `No images in ${category} yet. Upload some above.`}
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map(({ item, index }, position) => (
            <li key={item.id} className={cn("space-y-3 rounded-2xl border border-admin-border/70 bg-admin-surface p-3 shadow-xs", !item.image && "border-admin-warning/60")}>
              <ImageUploadField
                value={item.image}
                folder={folderFor(category, item.subcategory)}
                aspect="aspect-[4/3]"
                label="gallery image"
                onChange={(url, asset) => setItem(index, withImage(item, url, asset))}
              />
              <input
                className={inputClass}
                value={item.title}
                placeholder="Caption"
                aria-label={`Caption for image ${position + 1}`}
                onChange={(e) => setItem(index, { ...item, title: e.target.value })}
              />
              <input
                className={cn(inputClass, "h-8 text-xs")}
                value={item.image}
                placeholder="…or paste an image link"
                aria-label={`Image link for image ${position + 1}`}
                onChange={(e) => setItem(index, withImage(item, e.target.value.trim()))}
              />
              {subcategories.length > 0 && (
                <label className="flex items-center gap-2 text-xs text-admin-muted">
                  Subcategory
                  <select
                    className={cn(inputClass, "h-8 flex-1 text-xs")}
                    value={item.subcategory ?? ""}
                    onChange={(e) => setItem(index, { ...item, subcategory: e.target.value || undefined })}
                  >
                    <option value="">None</option>
                    {subcategories.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs text-admin-muted tabular-nums">
                  #{position + 1}{!item.image && <span className="ml-1 font-medium text-admin-gold-strong">· needs an image</span>}
                </span>
                <div className="flex items-center gap-0.5">
                  <Button type="button" variant="ghost" size="icon-sm" className="rounded-lg" onClick={() => move(position, -1)} disabled={position === 0} aria-label="Move earlier">
                    <ArrowLeft />
                  </Button>
                  <Button type="button" variant="ghost" size="icon-sm" className="rounded-lg" onClick={() => move(position, 1)} disabled={position === visible.length - 1} aria-label="Move later">
                    <ArrowRight />
                  </Button>
                  <Button type="button" variant="ghost" size="icon-sm" className="rounded-lg text-admin-danger hover:bg-admin-danger-soft hover:text-admin-danger" onClick={() => remove(index)} aria-label={`Remove image ${position + 1}`}>
                    <Trash2 />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Button type="button" variant="outline" className="rounded-xl" onClick={addEmpty}>
        <Plus /> Add empty slot to {category}{uploadTarget ? ` › ${uploadTarget}` : ""}
      </Button>
    </div>
  )
}
