"use client"

import { useCallback, useRef, useState } from "react"
import useSWRInfinite from "swr/infinite"
import { CheckCircle2, ImageIcon, ImagePlus, Library, Loader2, RefreshCw, Trash2, UploadCloud, X, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { fetcher } from "@/lib/admin/api-client"
import { uploadToCloudinary, validateFile, type UploadedAsset } from "@/lib/admin/upload"
import { optimizeCloudinaryUrl } from "@/lib/cloudinary/optimize"
import type { CloudinaryMediaAsset, CloudinaryMediaListResponse } from "@/lib/cloudinary/types"
import { dedupeCloudinaryAssets } from "@/lib/cloudinary/utils"
import { cn } from "@/lib/utils"
import { SearchInput } from "./controls"
import { EmptyState, Spinner } from "./primitives"
import { toast } from "./toast"

/* ------------------------------------------------------------------ Drag & drop hook */

function useDropTarget(onFiles: (files: File[]) => void, disabled?: boolean) {
  const [over, setOver] = useState(false)
  const depth = useRef(0)
  return {
    over,
    props: {
      onDragEnter: (e: React.DragEvent) => {
        if (disabled || !e.dataTransfer.types.includes("Files")) return
        e.preventDefault()
        depth.current++
        setOver(true)
      },
      onDragOver: (e: React.DragEvent) => {
        if (disabled || !e.dataTransfer.types.includes("Files")) return
        e.preventDefault()
        e.dataTransfer.dropEffect = "copy"
      },
      onDragLeave: () => {
        depth.current = Math.max(0, depth.current - 1)
        if (!depth.current) setOver(false)
      },
      onDrop: (e: React.DragEvent) => {
        if (disabled) return
        e.preventDefault()
        depth.current = 0
        setOver(false)
        const files = Array.from(e.dataTransfer.files)
        if (files.length) onFiles(files)
      },
    },
  }
}

/* ------------------------------------------------------------------ Multi-file dropzone */

interface QueueItem {
  id: string
  file: File
  progress: number
  status: "uploading" | "done" | "error"
  error?: string
  preview?: string
  controller: AbortController
}

export function UploadDropzone({
  accept = "image",
  folder,
  multiple = true,
  onUploaded,
  className,
  compact,
}: {
  accept?: "image" | "media"
  folder?: string
  multiple?: boolean
  onUploaded?: (assets: UploadedAsset[]) => void
  className?: string
  compact?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [queue, setQueue] = useState<QueueItem[]>([])

  const patch = (id: string, update: Partial<QueueItem>) =>
    setQueue((items) => items.map((item) => (item.id === id ? { ...item, ...update } : item)))

  const start = useCallback(
    async (files: File[]) => {
      const list = multiple ? files : files.slice(0, 1)
      const accepted: QueueItem[] = []
      for (const file of list) {
        const problem = validateFile(file, accept)
        if (problem) {
          toast.error("File skipped", problem)
          continue
        }
        accepted.push({
          id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2)}`,
          file,
          progress: 0,
          status: "uploading",
          preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
          controller: new AbortController(),
        })
      }
      if (!accepted.length) return
      setQueue((items) => [...accepted, ...items])

      const results = await Promise.all(
        accepted.map(async (item) => {
          try {
            const asset = await uploadToCloudinary(item.file, {
              folder,
              signal: item.controller.signal,
              onProgress: (progress) => patch(item.id, { progress }),
            })
            patch(item.id, { status: "done", progress: 100 })
            return asset
          } catch (error) {
            const cancelled = (error as Error).name === "AbortError"
            patch(item.id, { status: "error", error: cancelled ? "Cancelled" : (error as Error).message })
            return null
          }
        })
      )
      const uploaded = results.filter(Boolean) as UploadedAsset[]
      if (uploaded.length) {
        toast.success(uploaded.length === 1 ? "File uploaded" : `${uploaded.length} files uploaded`, "Stored & optimised on Cloudinary")
        onUploaded?.(uploaded)
      }
      // Clear finished rows after a moment so the list doesn't grow forever.
      setTimeout(() => setQueue((items) => items.filter((i) => i.status !== "done")), 2500)
    },
    [accept, folder, multiple, onUploaded]
  )

  const drop = useDropTarget(start)
  const acceptAttr = accept === "image" ? "image/*" : "image/*,video/*,audio/*"

  return (
    <div className={className}>
      <div
        {...drop.props}
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), inputRef.current?.click())}
        aria-label={`Upload ${accept === "image" ? "images" : "files"}: click or drag and drop`}
        className={cn(
          "group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed text-center transition-all duration-200 focus-visible:ring-4 focus-visible:ring-admin-brand/20 focus-visible:outline-none",
          compact ? "gap-1 px-4 py-6" : "gap-2 px-6 py-10",
          drop.over
            ? "scale-[1.01] border-admin-gold bg-admin-gold-soft/60"
            : "border-admin-border bg-admin-surface-2 hover:border-admin-brand/40 hover:bg-admin-brand-soft/40"
        )}
      >
        <span className={cn("flex items-center justify-center rounded-2xl bg-admin-surface text-admin-brand shadow-admin transition-transform group-hover:-translate-y-0.5", compact ? "size-10" : "size-14")}>
          <UploadCloud className={compact ? "size-5" : "size-7"} aria-hidden />
        </span>
        <p className="text-sm font-semibold text-admin-text">
          {drop.over ? "Drop to upload" : <>Drag & drop {multiple ? "files" : "a file"} or <span className="text-admin-brand underline underline-offset-2">browse</span></>}
        </p>
        <p className="text-xs text-admin-muted">
          {accept === "image" ? "JPG, PNG, WebP, GIF, AVIF or SVG" : "Images, video or audio"} · up to 100 MB{multiple ? " each" : ""}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={acceptAttr}
          multiple={multiple}
          className="hidden"
          onChange={(e) => {
            start(Array.from(e.target.files ?? []))
            e.target.value = ""
          }}
        />
      </div>

      {queue.length > 0 && (
        <ul className="mt-3 space-y-2" aria-live="polite">
          {queue.map((item) => (
            <li key={item.id} className="admin-rise flex items-center gap-3 rounded-xl border border-admin-border/70 bg-admin-surface p-2.5">
              <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-admin-subtle">
                {item.preview ? (
                  <img src={item.preview} alt="" className="size-full object-cover" />
                ) : (
                  <ImageIcon className="size-4 text-admin-muted" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate font-medium text-admin-text">{item.file.name}</span>
                  <span className="shrink-0 text-xs text-admin-muted tabular-nums">
                    {item.status === "uploading" ? `${item.progress}%` : item.status === "done" ? "Done" : item.error}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-admin-subtle" role="progressbar" aria-valuenow={item.progress} aria-valuemin={0} aria-valuemax={100} aria-label={`Uploading ${item.file.name}`}>
                  <div
                    className={cn(
                      "h-full rounded-full transition-[width] duration-300",
                      item.status === "error" ? "bg-admin-danger" : item.status === "done" ? "bg-admin-success" : "bg-admin-brand"
                    )}
                    style={{ width: `${item.status === "error" ? 100 : item.progress}%` }}
                  />
                </div>
              </div>
              {item.status === "uploading" ? (
                <Button variant="ghost" size="icon-sm" onClick={() => item.controller.abort()} aria-label={`Cancel ${item.file.name}`}>
                  <X />
                </Button>
              ) : item.status === "done" ? (
                <CheckCircle2 className="size-5 shrink-0 text-admin-success" aria-hidden />
              ) : (
                <XCircle className="size-5 shrink-0 text-admin-danger" aria-hidden />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ Single image field */

export function ImageUploadField({
  value,
  onChange,
  folder,
  aspect = "aspect-video",
  label = "image",
}: {
  value: string
  onChange: (url: string, asset?: UploadedAsset) => void
  folder?: string
  aspect?: string
  label?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)

  const upload = async (files: File[]) => {
    const file = files[0]
    if (!file) return
    const problem = validateFile(file, "image")
    if (problem) return toast.error("Can't upload that file", problem)
    setProgress(0)
    try {
      const asset = await uploadToCloudinary(file, { folder, onProgress: setProgress })
      onChange(asset.secureUrl, asset)
      toast.success(value ? "Image replaced" : "Image uploaded")
    } catch (error) {
      toast.fromError(error, "Upload failed")
    } finally {
      setProgress(null)
    }
  }

  const drop = useDropTarget(upload, progress !== null)
  const uploading = progress !== null

  return (
    <div>
      <div
        {...drop.props}
        className={cn(
          "relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-200",
          aspect,
          drop.over ? "border-admin-gold bg-admin-gold-soft/60" : value ? "border-transparent" : "border-admin-border bg-admin-surface-2"
        )}
      >
        {value ? (
          <>
            <img src={optimizeCloudinaryUrl(value, { width: 900 })} alt="" className="absolute inset-0 size-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 flex flex-wrap justify-end gap-1.5 bg-gradient-to-t from-black/60 to-transparent p-2.5">
              <Button type="button" size="sm" variant="secondary" className="h-8 rounded-lg bg-white/90 text-gray-900 hover:bg-white" onClick={() => inputRef.current?.click()} disabled={uploading}>
                <RefreshCw /> Replace
              </Button>
              <Button type="button" size="sm" variant="secondary" className="h-8 rounded-lg bg-white/90 text-gray-900 hover:bg-white" onClick={() => setPickerOpen(true)} disabled={uploading}>
                <Library /> Library
              </Button>
              <Button type="button" size="icon-sm" variant="secondary" className="size-8 rounded-lg bg-white/90 text-red-600 hover:bg-white" onClick={() => onChange("")} disabled={uploading} aria-label={`Remove ${label}`}>
                <Trash2 />
              </Button>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
            <ImagePlus className="size-7 text-admin-brand" aria-hidden />
            <p className="text-sm font-medium text-admin-text">{drop.over ? "Drop to upload" : `Drag & drop the ${label} here`}</p>
            <div className="flex gap-2">
              <Button type="button" size="sm" variant="outline" className="rounded-lg" onClick={() => inputRef.current?.click()}>
                Upload
              </Button>
              <Button type="button" size="sm" variant="ghost" className="rounded-lg" onClick={() => setPickerOpen(true)}>
                <Library /> Media library
              </Button>
            </div>
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-admin-surface/85 backdrop-blur-sm">
            <Loader2 className="size-6 animate-spin text-admin-brand" aria-hidden />
            <div className="h-1.5 w-2/3 overflow-hidden rounded-full bg-admin-subtle" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Upload progress">
              <div className="h-full rounded-full bg-admin-brand transition-[width] duration-300" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-xs font-medium text-admin-muted tabular-nums">{progress}%</span>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          upload(Array.from(e.target.files ?? []))
          e.target.value = ""
        }}
      />
      <MediaPickerDialog open={pickerOpen} onOpenChange={setPickerOpen} onSelect={(asset) => onChange(asset.secureUrl)} />
    </div>
  )
}

/* ------------------------------------------------------------------ Media picker */

export function MediaPickerDialog({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (asset: CloudinaryMediaAsset) => void
}) {
  const [search, setSearch] = useState("")
  const { data, error, isLoading, size, setSize, mutate } = useSWRInfinite<CloudinaryMediaListResponse>(
    (index, previous) => {
      if (!open) return null
      if (previous && !previous.nextCursor) return null
      const params = new URLSearchParams({ type: "image", limit: "30" })
      if (search) params.set("search", search)
      if (previous?.nextCursor) params.set("cursor", previous.nextCursor)
      return `/api/admin/cloudinary/media?${params}`
    },
    fetcher,
    { revalidateFirstPage: false }
  )
  // Pages can overlap (e.g. after a new upload shifts the list), so drop duplicates.
  const assets = dedupeCloudinaryAssets(data?.flatMap((page) => page.assets) ?? [])
  const hasMore = !!data?.[data.length - 1]?.nextCursor

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-hidden rounded-2xl p-0 sm:max-w-4xl">
        <DialogHeader className="border-b border-admin-border px-6 pt-6 pb-4">
          <DialogTitle>Choose from media library</DialogTitle>
          <DialogDescription>Pick an existing image or upload a new one to Cloudinary.</DialogDescription>
        </DialogHeader>
        <div className="admin-scroll max-h-[70vh] space-y-4 overflow-y-auto px-6 pb-6">
          <UploadDropzone compact multiple={false} onUploaded={() => mutate()} />
          <SearchInput value={search} onChange={setSearch} placeholder="Search images…" />
          {error ? (
            <p className="text-sm text-admin-danger">{(error as Error).message}</p>
          ) : isLoading ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : assets.length === 0 ? (
            <EmptyState icon={ImageIcon} title="No images found" description="Upload an image above to get started." />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {assets.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => {
                    onSelect(asset)
                    onOpenChange(false)
                  }}
                  className="group relative aspect-square overflow-hidden rounded-xl border border-admin-border bg-admin-subtle focus-visible:ring-4 focus-visible:ring-admin-brand/30 focus-visible:outline-none"
                >
                  <img src={asset.thumbnailUrl} alt={asset.displayName} loading="lazy" className="size-full object-cover transition duration-300 group-hover:scale-105" />
                  <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-2 pt-6 pb-1.5 text-left text-xs text-white">
                    {asset.displayName}
                  </span>
                </button>
              ))}
            </div>
          )}
          {hasMore && (
            <div className="flex justify-center">
              <Button variant="outline" className="rounded-xl" onClick={() => setSize(size + 1)}>
                Load more
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
