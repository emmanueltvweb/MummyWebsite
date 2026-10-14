"use client"

import { useState } from "react"
import useSWR from "swr"
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Eye, GalleryHorizontalEnd, GripVertical, Pencil, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { SlideView } from "@/components/sections/home-slider"
import { useConfirm } from "@/components/admin/ui/confirm-dialog"
import { ErrorFallback } from "@/components/admin/ui/error-boundary"
import { BrandButton, EmptyState, Field, inputClass, LoadingButton, PageHeader, Panel, Pill, Skeleton, ToggleRow } from "@/components/admin/ui/primitives"
import { toast } from "@/components/admin/ui/toast"
import { feedback } from "@/components/admin/ui/feedback"
import { ImageUploadField } from "@/components/admin/ui/uploads"
import { api } from "@/lib/admin/api-client"
import { useSubmit } from "@/lib/admin/hooks"
import { optimizeCloudinaryUrl } from "@/lib/cloudinary/optimize"
import type { Slide } from "@/lib/cms/types"
import { cn } from "@/lib/utils"

const EMPTY = { title: "", subtitle: "", description: "", buttonText: "", buttonUrl: "", backgroundImage: "", enabled: true }
type SlideForm = typeof EMPTY

function SortableSlide({
  slide,
  index,
  onEdit,
  onDelete,
  onToggle,
  onPreview,
}: {
  slide: Slide
  index: number
  onEdit: () => void
  onDelete: () => void
  onToggle: (enabled: boolean) => void
  onPreview: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: slide.id })
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-admin-border/70 bg-admin-surface p-3 transition-shadow sm:gap-4",
        isDragging && "relative z-10 shadow-admin-lg ring-2 ring-admin-gold",
        !slide.enabled && "opacity-70"
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="flex h-16 w-7 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-admin-muted hover:bg-admin-subtle active:cursor-grabbing"
        aria-label={`Reorder slide ${index + 1}: ${slide.title}. Use space and arrow keys to move.`}
      >
        <GripVertical className="size-5" />
      </button>
      <span className="hidden text-sm font-bold text-admin-muted tabular-nums sm:block">{String(index + 1).padStart(2, "0")}</span>
      <div className="relative aspect-[16/9] w-28 shrink-0 overflow-hidden rounded-xl bg-admin-subtle sm:w-40">
        <img src={optimizeCloudinaryUrl(slide.backgroundImage, { width: 320, height: 180, crop: "fill" })} alt="" loading="lazy" className="size-full object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-semibold text-admin-text">{slide.title}</p>
          <Pill tone={slide.enabled ? "success" : "neutral"} dot>{slide.enabled ? "Live" : "Hidden"}</Pill>
        </div>
        {slide.subtitle && <p className="truncate text-sm text-admin-muted">{slide.subtitle}</p>}
        {slide.buttonText && <p className="mt-0.5 truncate text-xs text-admin-muted">Button: {slide.buttonText} → {slide.buttonUrl}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <Switch checked={slide.enabled} onCheckedChange={onToggle} aria-label={slide.enabled ? "Hide slide" : "Show slide"} />
        <Button variant="ghost" size="icon-sm" className="hidden rounded-lg sm:inline-flex" onClick={onPreview} aria-label="Preview slide"><Eye /></Button>
        <Button variant="ghost" size="icon-sm" className="rounded-lg" onClick={onEdit} aria-label="Edit slide"><Pencil /></Button>
        <Button variant="ghost" size="icon-sm" className="rounded-lg text-admin-danger hover:bg-admin-danger-soft hover:text-admin-danger" onClick={onDelete} aria-label="Delete slide"><Trash2 /></Button>
      </div>
    </li>
  )
}

export default function SliderPage() {
  const confirm = useConfirm()
  const { data, error, isLoading, mutate } = useSWR<Slide[]>("/api/admin/slides")
  const [editing, setEditing] = useState<Slide | "new" | null>(null)
  const [preview, setPreview] = useState<Slide | null>(null)
  const [form, setForm] = useState<SlideForm>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof SlideForm, string>>>({})
  const { busy, run } = useSubmit()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))

  const slides = data ?? []
  const open = (slide: Slide | "new") => {
    setEditing(slide)
    setErrors({})
    setForm(slide === "new" ? EMPTY : { title: slide.title, subtitle: slide.subtitle, description: slide.description, buttonText: slide.buttonText, buttonUrl: slide.buttonUrl, backgroundImage: slide.backgroundImage, enabled: slide.enabled })
  }

  const save = () =>
    run("save", async ({ showPreloader }) => {
      const next: typeof errors = {}
      if (!form.title.trim()) next.title = "Title is required"
      if (!form.backgroundImage) next.backgroundImage = "Upload a background image"
      if (form.buttonText && !form.buttonUrl) next.buttonUrl = "Add where the button should link to"
      if (form.buttonUrl && !/^(\/|#|https?:\/\/)/.test(form.buttonUrl)) next.buttonUrl = "Use a path like /visit or a full https:// link"
      setErrors(next)
      if (Object.keys(next).length) return
      const isNew = editing === "new"
      showPreloader(isNew ? "Adding slide…" : "Saving slide…")
      try {
        const saved = await api<Slide>(isNew ? "/api/admin/slides" : `/api/admin/slides/${(editing as Slide).id}`, { method: isNew ? "POST" : "PUT", body: form })
        await mutate((rows = []) => (isNew ? [...rows, saved] : rows.map((r) => (r.id === saved.id ? saved : r))), { revalidate: false })
        setEditing(null)
        feedback.success(isNew ? "Slide added" : "Slide updated", {
          description: saved.enabled ? "It's live in the homepage slider." : "Saved. It's hidden from the homepage until you switch it on.",
          actions: saved.enabled ? [{ label: "View homepage", href: "/", external: true }] : undefined,
        })
      } catch (err) {
        feedback.error("Couldn't save slide", err)
      }
    })

  const toggle = async (slide: Slide, enabled: boolean) => {
    try {
      await mutate(
        async (rows = []) => {
          await api(`/api/admin/slides/${slide.id}`, { method: "PATCH", body: { enabled } })
          return rows.map((r) => (r.id === slide.id ? { ...r, enabled } : r))
        },
        { optimisticData: (rows = []) => rows.map((r) => (r.id === slide.id ? { ...r, enabled } : r)), rollbackOnError: true, revalidate: false }
      )
      toast.success(enabled ? "Slide is now live" : "Slide hidden from homepage")
    } catch (err) {
      toast.fromError(err, "Couldn't update slide")
    }
  }

  const remove = async (slide: Slide) => {
    if (!(await confirm({ title: `Delete “${slide.title}”?`, description: "The slide will be removed from the homepage. The image stays in your media library." }))) return
    try {
      await mutate(
        async (rows = []) => {
          await api(`/api/admin/slides/${slide.id}`, { method: "DELETE" })
          return rows.filter((r) => r.id !== slide.id)
        },
        { optimisticData: (rows = []) => rows.filter((r) => r.id !== slide.id), rollbackOnError: true, revalidate: false }
      )
      toast.success("Slide deleted")
    } catch (err) {
      toast.fromError(err, "Couldn't delete slide")
    }
  }

  const onDragEnd = async ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const from = slides.findIndex((s) => s.id === active.id)
    const to = slides.findIndex((s) => s.id === over.id)
    const reordered = arrayMove(slides, from, to).map((s, order) => ({ ...s, order }))
    try {
      await mutate(
        async () => api<Slide[]>("/api/admin/slides/reorder", { body: { ids: reordered.map((s) => s.id) } }),
        { optimisticData: reordered, rollbackOnError: true, revalidate: false }
      )
      toast.success("Slide order saved")
    } catch (err) {
      toast.fromError(err, "Couldn't save the new order")
    }
  }

  const liveCount = slides.filter((s) => s.enabled).length

  return (
    <div>
      <PageHeader
        icon={GalleryHorizontalEnd}
        title="Homepage Slider"
        description="Feature announcements, events and campaigns in a full-width slider on the homepage."
        actions={
          <>
            <Button asChild variant="outline" className="rounded-xl">
              <a href="/" target="_blank" rel="noopener noreferrer"><Eye /> View homepage</a>
            </Button>
            <BrandButton onClick={() => open("new")}><Plus /> Add slide</BrandButton>
          </>
        }
      />

      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-admin-border/70 px-5 py-4">
          <p className="text-sm text-admin-muted">
            <span className="font-semibold text-admin-text">{liveCount}</span> of {slides.length} slide{slides.length === 1 ? "" : "s"} live · Drag the handle to reorder
          </p>
        </div>
        <div className="p-4 sm:p-5">
          {error ? (
            <ErrorFallback label="slides" message={(error as Error).message} onRetry={() => mutate()} />
          ) : isLoading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
          ) : slides.length === 0 ? (
            <EmptyState icon={GalleryHorizontalEnd} title="No slides yet" description="Add your first slide — it will appear on the homepage right after the hero section." action={{ label: "Add a slide", onClick: () => open("new") }} />
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={slides.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                <ol className="space-y-3">
                  {slides.map((slide, index) => (
                    <SortableSlide
                      key={slide.id}
                      slide={slide}
                      index={index}
                      onEdit={() => open(slide)}
                      onDelete={() => remove(slide)}
                      onToggle={(enabled) => toggle(slide, enabled)}
                      onPreview={() => setPreview(slide)}
                    />
                  ))}
                </ol>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </Panel>

      {/* Editor */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto rounded-2xl sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>{editing === "new" ? "Add slide" : "Edit slide"}</DialogTitle>
            <DialogDescription>Changes are previewed live on the right.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => (e.preventDefault(), save())} className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <Field label="Background image" required error={errors.backgroundImage} hint="Landscape images of at least 1920×1080 look best.">
                <ImageUploadField value={form.backgroundImage} onChange={(url) => (setForm((f) => ({ ...f, backgroundImage: url })), setErrors((e) => ({ ...e, backgroundImage: undefined })))} folder="slider" label="background image" />
              </Field>
              <Field label="Title" htmlFor="slide-title" required error={errors.title}>
                <input id="slide-title" value={form.title} maxLength={160} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className={inputClass} />
              </Field>
              <Field label="Subtitle" htmlFor="slide-subtitle" hint="Short label shown above the title, e.g. “Upcoming event”.">
                <input id="slide-subtitle" value={form.subtitle} maxLength={200} onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))} className={inputClass} />
              </Field>
              <Field label="Description" htmlFor="slide-desc">
                <textarea id="slide-desc" rows={3} value={form.description} maxLength={600} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className={cn(inputClass, "h-auto py-2.5")} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Button text" htmlFor="slide-btn">
                  <input id="slide-btn" value={form.buttonText} maxLength={40} onChange={(e) => setForm((f) => ({ ...f, buttonText: e.target.value }))} placeholder="Learn more" className={inputClass} />
                </Field>
                <Field label="Button URL" htmlFor="slide-url" error={errors.buttonUrl}>
                  <input id="slide-url" value={form.buttonUrl} maxLength={500} onChange={(e) => setForm((f) => ({ ...f, buttonUrl: e.target.value }))} placeholder="/visit or https://…" className={inputClass} />
                </Field>
              </div>
              <ToggleRow
                label="Show on homepage"
                description="Turn off to keep the slide as a draft."
                checked={form.enabled}
                onCheckedChange={(enabled) => setForm((f) => ({ ...f, enabled }))}
                className="rounded-xl border border-admin-border p-3"
              />
            </div>
            <div className="space-y-2 lg:sticky lg:top-0 lg:self-start">
              <p className="text-sm font-medium text-admin-text">Live preview</p>
              <div className="overflow-hidden rounded-2xl bg-[oklch(0.2_0.05_265)] shadow-admin-lg">
                <SlideView compact slide={{ id: "preview", ...form }} />
              </div>
            </div>
            <DialogFooter className="lg:col-span-2">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setEditing(null)}>Cancel</Button>
              <LoadingButton type="submit" loading={busy === "save"} loadingText="Saving…" className="rounded-xl bg-admin-brand text-admin-brand-fg hover:bg-admin-brand/90">
                {editing === "new" ? "Add slide" : "Save changes"}
              </LoadingButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Full preview */}
      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="overflow-hidden rounded-2xl border-0 p-0 sm:max-w-6xl">
          <DialogTitle className="sr-only">Slide preview</DialogTitle>
          <DialogDescription className="sr-only">How the slide appears on the homepage.</DialogDescription>
          {preview && <SlideView slide={preview} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}
