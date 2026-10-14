"use client"

import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import useSWR from "swr"
import { formatDistanceToNow } from "date-fns"
import { ArrowDown, ArrowLeft, ArrowUp, CheckCircle2, ChevronDown, Eye, Loader2, RefreshCw, Save, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/admin/admin-auth-provider"
import { useConfirm } from "@/components/admin/ui/confirm-dialog"
import { feedback } from "@/components/admin/ui/feedback"
import { Field, inputClass, Pill } from "@/components/admin/ui/primitives"
import { toast } from "@/components/admin/ui/toast"
import { ImageUploadField } from "@/components/admin/ui/uploads"
import { api } from "@/lib/admin/api-client"
import { useUnsavedChangesWarning } from "@/lib/admin/hooks"
import { setCached } from "@/lib/admin/store"
import type { PageContentKey, PageContentMap } from "@/lib/content/page-types"
import { cn } from "@/lib/utils"

/* ============================================================================
   Data: load a built-in page into an editable draft, track changes, save.
   ========================================================================== */

export function usePageContentDraft<K extends PageContentKey>(key: K, pageTitle: string) {
  const url = `/api/admin/site-pages/${key}`
  const query = useSWR<PageContentMap[K]>(url)
  const confirm = useConfirm()
  const [draft, setDraft] = useState<PageContentMap[K] | null>(null)
  const [snapshot, setSnapshot] = useState("")
  const [saving, setSaving] = useState(false)
  const [reloading, setReloading] = useState(false)
  const [busy, setBusy] = useState(false)

  const dirty = draft !== null && JSON.stringify(draft) !== snapshot
  const dirtyRef = useRef(dirty)
  dirtyRef.current = dirty
  useUnsavedChangesWarning(dirty)

  const apply = useCallback((data: PageContentMap[K]) => {
    setDraft(data)
    setSnapshot(JSON.stringify(data))
  }, [])

  // Take server data from the shared store, but never overwrite unsaved edits.
  useEffect(() => {
    if (query.data && !dirtyRef.current) apply(query.data)
  }, [query.data, apply])

  const update = useCallback((fn: (current: PageContentMap[K]) => PageContentMap[K]) => {
    setDraft((current) => (current ? fn(current) : current))
  }, [])

  const save = async () => {
    if (!draft) return
    if (!dirty) return toast.info("No changes to save")
    if (busy) return toast.warning("Please wait", "Images are still uploading.")
    setSaving(true)
    const stop = feedback.saving(`Saving ${pageTitle}…`)
    try {
      const result = await api<PageContentMap[K]>(url, { method: "PUT", body: draft })
      apply(result)
      setCached(url, result)
      stop()
      feedback.success("Page updated", { description: `Your changes to “${pageTitle}” are live on the website.` })
    } catch (error) {
      stop()
      feedback.error("Couldn't save the page", error)
    } finally {
      setSaving(false)
    }
  }

  const reload = async () => {
    if (
      dirty &&
      !(await confirm({
        title: "Discard unsaved changes?",
        description: "Reloading replaces your edits with the version currently on the website.",
        confirmText: "Discard & reload",
        tone: "danger",
      }))
    )
      return
    setReloading(true)
    try {
      const fresh = await query.mutate()
      if (fresh) apply(fresh)
      toast.success("Loaded the latest version")
    } catch (error) {
      toast.fromError(error, "Couldn't reload the page")
    } finally {
      setReloading(false)
    }
  }

  return { draft, update, dirty, save, reload, saving, reloading, setBusy, error: query.error as Error | undefined }
}

/* ============================================================================
   Layout: sticky header with status + actions, then the page's panels.
   ========================================================================== */

export function PageEditorShell({
  title,
  description,
  path,
  dirty,
  saving,
  reloading,
  updatedAt,
  updatedBy,
  onSave,
  onReload,
  children,
}: {
  title: string
  description: string
  path: string
  dirty: boolean
  saving: boolean
  reloading: boolean
  updatedAt?: string
  updatedBy?: string
  onSave: () => void
  onReload: () => void
  children: React.ReactNode
}) {
  const { can } = useAuth()
  const canEdit = can("website.manage")
  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10">
      <div className="sticky top-[84px] z-20 rounded-3xl border border-admin-border/70 bg-admin-surface/95 p-4 shadow-admin-lg backdrop-blur sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <Link href="/admin/pages" className="mb-1 inline-flex items-center gap-1 text-xs font-medium text-admin-muted hover:text-admin-text">
              <ArrowLeft className="size-3" /> All pages
            </Link>
            <h1 className="truncate text-2xl font-bold tracking-tight text-admin-text">{title}</h1>
            <p className="text-sm text-admin-muted">{description}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {dirty ? (
                <Pill tone="warning" dot>Unsaved changes</Pill>
              ) : (
                <Pill tone="success">
                  <CheckCircle2 className="size-3" /> All changes saved
                </Pill>
              )}
              {updatedAt && (
                <span className="text-xs text-admin-muted">
                  Last updated {formatDistanceToNow(new Date(updatedAt), { addSuffix: true })}
                  {updatedBy ? ` by ${updatedBy}` : ""}
                </span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button variant="outline" size="sm" className="rounded-xl" onClick={onReload} disabled={saving || reloading}>
              <RefreshCw className={cn(reloading && "animate-spin")} /> Reload
            </Button>
            <Button asChild variant="outline" size="sm" className="rounded-xl">
              <a href={path} target="_blank" rel="noopener noreferrer">
                <Eye /> View page
              </a>
            </Button>
            {canEdit && (
              <Button size="sm" className="rounded-xl" onClick={onSave} disabled={saving}>
                {saving ? <Loader2 className="animate-spin" /> : <Save />}
                {saving ? "Saving…" : "Save changes"}
              </Button>
            )}
          </div>
        </div>
        {!canEdit && <p className="mt-3 text-xs text-admin-muted">You can view this page's content, but your role can't change it.</p>}
      </div>
      {children}
    </div>
  )
}

/* ============================================================================
   Small form building blocks shared by the page editors.
   ========================================================================== */

export function TextInput({
  label,
  value,
  onChange,
  placeholder,
  hint,
  maxLength,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  hint?: React.ReactNode
  maxLength?: number
}) {
  return (
    <Field label={label} hint={hint}>
      <input className={inputClass} value={value} placeholder={placeholder} maxLength={maxLength} onChange={(e) => onChange(e.target.value)} aria-label={label} />
    </Field>
  )
}

export function TextArea({ label, value, onChange, rows = 3, placeholder }: { label: string; value: string; onChange: (value: string) => void; rows?: number; placeholder?: string }) {
  return (
    <Field label={label}>
      <textarea
        className={cn(inputClass, "h-auto py-2.5 leading-relaxed")}
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
      />
    </Field>
  )
}

/** Image with preview, upload, media library, and a box to paste a link. */
export function ImageInput({
  label,
  value,
  onChange,
  folder,
  aspect = "aspect-video",
  className,
}: {
  label: string
  value: string
  onChange: (url: string) => void
  folder: string
  aspect?: string
  className?: string
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-sm font-medium text-admin-text">{label}</p>
      <ImageUploadField value={value} onChange={(url) => onChange(url)} folder={folder} aspect={aspect} label={label.toLowerCase()} />
      <input
        className={cn(inputClass, "h-9 text-xs")}
        value={value}
        placeholder="…or paste an image link (e.g. https://res.cloudinary.com/…)"
        onChange={(e) => onChange(e.target.value.trim())}
        aria-label={`${label} link`}
      />
    </div>
  )
}

/** Comma-separated tags input. */
export function TagsInput({ label, value, onChange, hint }: { label: string; value: string[]; onChange: (tags: string[]) => void; hint?: string }) {
  const [text, setText] = useState(value.join(", "))
  useEffect(() => {
    // Keep in sync when the value changes from outside (e.g. reload).
    if (text.split(",").map((t) => t.trim()).filter(Boolean).join("|") !== value.join("|")) setText(value.join(", "))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])
  return (
    <Field label={label} hint={hint ?? "Separate with commas"}>
      <input
        className={inputClass}
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          onChange(e.target.value.split(",").map((t) => t.trim()).filter(Boolean))
        }}
        aria-label={label}
      />
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {value.map((tag, i) => (
            <span key={`${tag}-${i}`} className="rounded-full bg-admin-brand-soft px-2.5 py-0.5 text-xs font-medium text-admin-brand">{tag}</span>
          ))}
        </div>
      )}
    </Field>
  )
}

export function moveItem<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction
  if (target < 0 || target >= items.length) return items
  const next = [...items]
  ;[next[index], next[target]] = [next[target], next[index]]
  return next
}

/** A collapsible list item with reorder / delete controls. */
export function ListItemCard({
  index,
  total,
  title,
  subtitle,
  thumbnail,
  open,
  onToggle,
  onMove,
  onRemove,
  removeLabel,
  children,
}: {
  index: number
  total: number
  title: string
  subtitle?: string
  thumbnail?: string
  open: boolean
  onToggle: () => void
  onMove: (direction: -1 | 1) => void
  onRemove: () => void
  removeLabel: string
  children: React.ReactNode
}) {
  return (
    <div className={cn("overflow-hidden rounded-2xl border transition", open ? "border-admin-brand/40 shadow-admin" : "border-admin-border/70")}>
      <div className="flex items-center gap-3 bg-admin-surface-2/60 px-3 py-2.5 sm:px-4">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-admin-brand-soft text-xs font-bold text-admin-brand tabular-nums">{index + 1}</span>
        {thumbnail ? (
          <img src={thumbnail} alt="" className="size-10 shrink-0 rounded-lg object-cover" />
        ) : null}
        <button type="button" onClick={onToggle} className="min-w-0 flex-1 text-left" aria-expanded={open}>
          <p className="truncate text-sm font-semibold text-admin-text">{title || "Untitled"}</p>
          {subtitle && <p className="truncate text-xs text-admin-muted">{subtitle}</p>}
        </button>
        <div className="flex shrink-0 items-center gap-0.5">
          <Button type="button" variant="ghost" size="icon-sm" className="rounded-lg" onClick={() => onMove(-1)} disabled={index === 0} aria-label="Move up">
            <ArrowUp />
          </Button>
          <Button type="button" variant="ghost" size="icon-sm" className="rounded-lg" onClick={() => onMove(1)} disabled={index === total - 1} aria-label="Move down">
            <ArrowDown />
          </Button>
          <Button type="button" variant="ghost" size="icon-sm" className="rounded-lg text-admin-danger hover:bg-admin-danger-soft hover:text-admin-danger" onClick={onRemove} aria-label={removeLabel}>
            <Trash2 />
          </Button>
          <Button type="button" variant="ghost" size="icon-sm" className="rounded-lg" onClick={onToggle} aria-label={open ? "Collapse" : "Expand"}>
            <ChevronDown className={cn("transition-transform", open && "rotate-180")} />
          </Button>
        </div>
      </div>
      {open && <div className="space-y-4 border-t border-admin-border/70 p-4 sm:p-5">{children}</div>}
    </div>
  )
}

export const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
