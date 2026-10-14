"use client"

import Link from "next/link"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import useSWR, { useSWRConfig } from "swr"
import { format } from "date-fns"
import {
  Archive,
  ArrowLeft,
  CalendarClock,
  ChevronDown,
  Eye,
  FolderPlus,
  Globe,
  Link2,
  Pencil,
  Rocket,
  Save,
  Search,
  Undo2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/components/admin/admin-auth-provider"
import { TagInput } from "@/components/admin/ui/controls"
import { Field, FullPageSpinner, inputClass, LoadingButton, Panel, PanelBody, PanelHeader, StatusBadge } from "@/components/admin/ui/primitives"
import { toast } from "@/components/admin/ui/toast"
import { feedback } from "@/components/admin/ui/feedback"
import { ImageUploadField } from "@/components/admin/ui/uploads"
import { ErrorFallback } from "@/components/admin/ui/error-boundary"
import { api } from "@/lib/admin/api-client"
import { slugifyClient, useSubmit, useUnsavedChangesWarning } from "@/lib/admin/hooks"
import { setCached } from "@/lib/admin/store"
import type { Category, Post, PostStatus } from "@/lib/cms/types"
import { cn } from "@/lib/utils"

const RichTextEditor = dynamic(() => import("@/components/admin/editor/rich-text-editor"), {
  ssr: false,
  loading: () => <div className="admin-skeleton h-[560px] rounded-2xl" />,
})

interface FormState {
  title: string
  slug: string
  excerpt: string
  content: string
  featuredImage: string
  featuredImageAlt: string
  categoryIds: string[]
  tags: string[]
  authorId: string
  status: PostStatus
  scheduledAt: string // datetime-local value
  seoTitle: string
  seoDescription: string
  metaKeywords: string[]
}

const EMPTY: FormState = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  featuredImage: "",
  featuredImageAlt: "",
  categoryIds: [],
  tags: [],
  authorId: "",
  status: "draft",
  scheduledAt: "",
  seoTitle: "",
  seoDescription: "",
  metaKeywords: [],
}

function toLocalInput(iso: string | null) {
  if (!iso) return ""
  const d = new Date(iso)
  return format(d, "yyyy-MM-dd'T'HH:mm")
}

function fromPost(post: Post): FormState {
  return {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    featuredImage: post.featuredImage,
    featuredImageAlt: post.featuredImageAlt,
    categoryIds: post.categoryIds,
    tags: post.tags,
    authorId: post.authorId,
    status: post.status,
    scheduledAt: toLocalInput(post.scheduledAt),
    seoTitle: post.seoTitle,
    seoDescription: post.seoDescription,
    metaKeywords: post.metaKeywords,
  }
}

function Counter({ value, max }: { value: number; max: number }) {
  return <span className={cn("tabular-nums", value > max ? "text-admin-danger" : value > max * 0.85 ? "text-admin-gold-strong" : "")}>{value}/{max}</span>
}

export function PostEditor({ postId }: { postId?: string }) {
  const router = useRouter()
  const { can } = useAuth()
  const { mutate: globalMutate } = useSWRConfig()
  const isNew = !postId

  const { data: post, error, isLoading, mutate } = useSWR<Post>(postId ? `/api/admin/posts/${postId}` : null)
  const { data: categories, mutate: mutateCategories } = useSWR<(Category & { postCount: number })[]>("/api/admin/categories")
  const { data: authors } = useSWR<{ id: string; name: string }[]>(can("blog.edit_any") ? "/api/admin/authors" : null)
  const { data: tagSource } = useSWR<{ items: Post[] }>("/api/admin/posts?pageSize=100")

  const [form, setForm] = useState<FormState>(EMPTY)
  const [saved, setSaved] = useState<FormState>(EMPTY)
  const [slugTouched, setSlugTouched] = useState(false)
  const [editingSlug, setEditingSlug] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [newCategory, setNewCategory] = useState("")
  const [editorBusy, setEditorBusy] = useState(false)
  const { busy, run } = useSubmit()

  useEffect(() => {
    if (post) {
      const next = fromPost(post)
      setForm(next)
      setSaved(next)
      setSlugTouched(true)
    }
  }, [post])

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(saved), [form, saved])
  useUnsavedChangesWarning(dirty)

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const allTags = useMemo(() => [...new Set(tagSource?.items.flatMap((p) => p.tags) ?? [])], [tagSource])

  if (error) return <ErrorFallback label="post" message={(error as Error).message} onRetry={() => mutate()} />
  if (postId && isLoading) return <FullPageSpinner />

  const validate = (status: PostStatus) => {
    const next: typeof errors = {}
    if (!form.title.trim()) next.title = "Give your post a title"
    if (status === "scheduled") {
      if (!form.scheduledAt) next.scheduledAt = "Choose a date and time"
      else if (new Date(form.scheduledAt).getTime() <= Date.now()) next.scheduledAt = "Pick a time in the future"
    }
    setErrors(next)
    if (Object.keys(next).length) {
      toast.error("Please fix the highlighted fields")
      return false
    }
    return true
  }

  const save = (status: PostStatus, key: string) =>
    run(key, async ({ showPreloader }) => {
      if (!validate(status)) return
      if (editorBusy) return toast.warning("Please wait", "Images are still uploading to Cloudinary.")
      const wasLive = post?.status === "published"
      showPreloader(
        status === "published" ? (wasLive ? "Updating post…" : "Publishing post…") : status === "scheduled" ? "Scheduling post…" : status === "archived" ? "Archiving post…" : "Saving draft…"
      )
      const payload = {
        ...form,
        status,
        slug: form.slug,
        authorId: form.authorId || undefined,
        scheduledAt: status === "scheduled" ? new Date(form.scheduledAt).toISOString() : null,
      }
      try {
        const result = await api<Post>(isNew ? "/api/admin/posts" : `/api/admin/posts/${postId}`, {
          method: isNew ? "POST" : "PUT",
          body: payload,
        })
        const next = fromPost(result)
        setForm(next)
        setSaved(next)
        globalMutate((k) => typeof k === "string" && (k.startsWith("/api/admin/posts") || k.startsWith("/api/admin/stats")))
        const publishedNow = status === "published" && !wasLive
        const titles: Record<PostStatus, string> = {
          draft: wasLive ? "Post unpublished" : "Draft saved",
          published: publishedNow ? "Post published!" : "Post updated",
          scheduled: "Post scheduled",
          archived: "Post archived",
        }
        const descriptions: Record<PostStatus, string> = {
          draft: wasLive ? "It's been taken off the blog and moved to drafts." : `“${result.title}” is saved. It isn't visible on the website yet.`,
          published: publishedNow ? `“${result.title}” is now live on the blog.` : "Your changes are live on the blog.",
          scheduled: `It will go live automatically on ${format(new Date(result.scheduledAt!), "d MMM yyyy 'at' HH:mm")}.`,
          archived: "It's been removed from the blog and kept for reference.",
        }
        feedback.success(titles[status], {
          description: descriptions[status],
          celebrate: publishedNow,
          actions: status === "published" ? [{ label: "View post", href: `/blog/${result.slug}`, external: true }] : undefined,
        })
        // Seed the store first so the editor opens instantly on the new URL (no spinner / refetch).
        await setCached(`/api/admin/posts/${result.id}`, result)
        if (isNew) router.replace(`/admin/posts/${result.id}`)
      } catch (err) {
        feedback.error("Couldn't save the post", err)
      }
    })

  const addCategory = async () => {
    const name = newCategory.trim()
    if (!name) return
    try {
      const created = await api<Category>("/api/admin/categories", { body: { name } })
      await mutateCategories()
      set("categoryIds", [...form.categoryIds, created.id])
      setNewCategory("")
      toast.success(`Category “${name}” created`)
    } catch (err) {
      toast.fromError(err, "Couldn't create category")
    }
  }

  const status = form.status
  const isLive = saved.status === "published"
  const previewSlug = form.slug || slugifyClient(form.title) || "your-post"
  const canPublish = can("blog.publish")

  return (
    <div className="space-y-6">
      {/* Action bar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="shrink-0 rounded-xl" aria-label="Back to posts">
            <Link href="/admin/posts">
              <ArrowLeft />
            </Link>
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-xl font-bold tracking-tight text-admin-text sm:text-2xl">{isNew ? "New post" : "Edit post"}</h1>
              {!isNew && <StatusBadge status={saved.status} />}
            </div>
            <p className="text-sm text-admin-muted">
              {dirty ? <span className="font-medium text-admin-gold-strong">● Unsaved changes</span> : post ? `Last saved ${format(new Date(post.updatedAt), "d MMM, HH:mm")}` : "Not saved yet"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isNew && (
            <Button asChild variant="outline" className="rounded-xl">
              <a href={`/blog/preview/${postId}`} target="_blank" rel="noopener noreferrer" onClick={(e) => dirty && (e.preventDefault(), toast.info("Save first", "Preview shows the last saved version — save your changes, then preview."))}>
                <Eye /> Preview
              </a>
            </Button>
          )}
          {!isLive && (
            <LoadingButton variant="outline" className="rounded-xl" loading={busy === "draft"} disabled={!!busy} onClick={() => save("draft", "draft")} data-shortcut={!canPublish || !isLive ? "save" : undefined}>
              <Save /> Save draft
            </LoadingButton>
          )}
          {canPublish && (
            <div className="flex">
              <LoadingButton
                className="rounded-l-xl rounded-r-none bg-admin-brand text-admin-brand-fg hover:bg-admin-brand/90"
                loading={busy === "publish"}
                loadingText={isLive ? "Updating…" : "Publishing…"}
                disabled={!!busy}
                onClick={() => save(status === "scheduled" && !isLive ? "scheduled" : "published", "publish")}
                data-shortcut={isLive ? "save" : undefined}
              >
                {status === "scheduled" && !isLive ? <CalendarClock /> : <Rocket />}
                {isLive ? "Update" : status === "scheduled" ? "Schedule" : "Publish"}
              </LoadingButton>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="rounded-l-none rounded-r-xl border-l border-white/20 bg-admin-brand px-2 text-admin-brand-fg hover:bg-admin-brand/90" disabled={!!busy} aria-label="More publishing options">
                    <ChevronDown />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl">
                  <DropdownMenuItem onSelect={() => save("published", "publish")}>
                    <Rocket /> {isLive ? "Update now" : "Publish immediately"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => set("status", "scheduled")}>
                    <CalendarClock /> Schedule for later…
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {isLive && (
                    <DropdownMenuItem onSelect={() => save("draft", "unpublish")}>
                      <Undo2 /> Unpublish (move to draft)
                    </DropdownMenuItem>
                  )}
                  {!isNew && saved.status !== "archived" && (
                    <DropdownMenuItem onSelect={() => save("archived", "archive")}>
                      <Archive /> Archive
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* Main column */}
        <div className="min-w-0 space-y-5">
          <Panel>
            <PanelBody className="space-y-3">
              <label htmlFor="post-title" className="sr-only">Title</label>
              <textarea
                id="post-title"
                rows={1}
                value={form.title}
                onChange={(e) => {
                  set("title", e.target.value)
                  if (!slugTouched) set("slug", slugifyClient(e.target.value))
                }}
                onInput={(e) => {
                  const el = e.currentTarget
                  el.style.height = "auto"
                  el.style.height = `${el.scrollHeight}px`
                }}
                placeholder="Post title"
                aria-invalid={!!errors.title}
                className="w-full resize-none bg-transparent text-3xl leading-tight font-bold tracking-tight text-admin-text outline-none placeholder:text-admin-muted/50 sm:text-4xl"
              />
              {errors.title && <p className="text-sm font-medium text-admin-danger" role="alert">{errors.title}</p>}

              <div className="flex flex-wrap items-center gap-2 text-sm text-admin-muted">
                <Link2 className="size-4 shrink-0" aria-hidden />
                <span>/blog/</span>
                {editingSlug ? (
                  <input
                    ref={(el) => el?.focus()}
                    value={form.slug}
                    aria-label="URL slug"
                    onChange={(e) => {
                      setSlugTouched(true)
                      set("slug", slugifyClient(e.target.value.replace(/\s/g, "-")) + (e.target.value.endsWith("-") ? "-" : ""))
                    }}
                    onBlur={() => {
                      setEditingSlug(false)
                      set("slug", slugifyClient(form.slug))
                    }}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), e.currentTarget.blur())}
                    className="h-7 min-w-40 flex-1 rounded-lg border border-admin-brand bg-admin-surface px-2 font-medium text-admin-text outline-none"
                  />
                ) : (
                  <>
                    <span className="font-medium break-all text-admin-text">{previewSlug}</span>
                    <button type="button" onClick={() => setEditingSlug(true)} className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium text-admin-brand hover:bg-admin-brand-soft">
                      <Pencil className="size-3" /> Edit
                    </button>
                  </>
                )}
                {isLive && (
                  <a href={`/blog/${saved.slug}`} target="_blank" rel="noopener noreferrer" className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-admin-success hover:underline">
                    <Globe className="size-3.5" /> View live
                  </a>
                )}
              </div>
            </PanelBody>
          </Panel>

          <RichTextEditor value={form.content} onChange={(html) => set("content", html)} placeholder="Tell your story… Type, paste, or drag images in." onBusyChange={setEditorBusy} ariaLabel="Post content" />

          <Panel>
            <PanelHeader title="Excerpt" description="A short summary shown on the blog listing and in social previews. Leave empty to generate one automatically." />
            <PanelBody>
              <textarea
                value={form.excerpt}
                onChange={(e) => set("excerpt", e.target.value)}
                rows={3}
                maxLength={500}
                aria-label="Excerpt"
                className={cn(inputClass, "h-auto py-2.5")}
                placeholder="Write a compelling one or two sentence summary…"
              />
              <p className="mt-1 text-right text-xs text-admin-muted"><Counter value={form.excerpt.length} max={500} /></p>
            </PanelBody>
          </Panel>

          {/* SEO */}
          <Panel>
            <PanelHeader title="Search engine optimisation" description="Control how this post appears on Google and social media." />
            <PanelBody className="space-y-4">
              <div className="rounded-xl border border-admin-border bg-admin-surface-2 p-4">
                <p className="mb-1 flex items-center gap-1.5 text-xs text-admin-muted"><Search className="size-3.5" /> Google preview</p>
                <p className="truncate text-xs text-admin-muted">yourwebsite.com › blog › {previewSlug}</p>
                <p className="truncate text-lg text-[#1a0dab] dark:text-[#8ab4f8]">{form.seoTitle || form.title || "Post title"}</p>
                <p className="line-clamp-2 text-sm text-admin-muted">{form.seoDescription || form.excerpt || "Add a meta description to control the text shown here."}</p>
              </div>
              <Field label="SEO title" htmlFor="seo-title" hint={<>Recommended under 60 characters · <Counter value={form.seoTitle.length} max={60} /></>}>
                <input id="seo-title" value={form.seoTitle} maxLength={120} onChange={(e) => set("seoTitle", e.target.value)} placeholder={form.title} className={inputClass} />
              </Field>
              <Field label="Meta description" htmlFor="seo-desc" hint={<>Recommended 120–160 characters · <Counter value={form.seoDescription.length} max={160} /></>}>
                <textarea id="seo-desc" rows={3} value={form.seoDescription} maxLength={320} onChange={(e) => set("seoDescription", e.target.value)} className={cn(inputClass, "h-auto py-2.5")} />
              </Field>
              <Field label="Meta keywords" htmlFor="seo-keywords" hint="Press Enter or comma to add a keyword.">
                <TagInput id="seo-keywords" value={form.metaKeywords} onChange={(v) => set("metaKeywords", v)} placeholder="faith, prayer, sermon…" />
              </Field>
            </PanelBody>
          </Panel>
        </div>

        {/* Sidebar */}
        <aside className="space-y-5" aria-label="Post settings">
          <Panel>
            <PanelHeader title="Publishing" />
            <PanelBody className="space-y-4">
              <Field label="Status" htmlFor="post-status">
                <select
                  id="post-status"
                  value={status}
                  disabled={!canPublish}
                  onChange={(e) => set("status", e.target.value as PostStatus)}
                  className={cn(inputClass, "cursor-pointer")}
                >
                  <option value="draft">Draft</option>
                  {canPublish && <option value="published">Published</option>}
                  {canPublish && <option value="scheduled">Scheduled</option>}
                  {canPublish && <option value="archived">Archived</option>}
                </select>
              </Field>
              {status === "scheduled" && (
                <Field label="Publish on" htmlFor="post-schedule" error={errors.scheduledAt} hint="The post goes live automatically at this time.">
                  <input
                    id="post-schedule"
                    type="datetime-local"
                    value={form.scheduledAt}
                    min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                    onChange={(e) => set("scheduledAt", e.target.value)}
                    className={inputClass}
                  />
                </Field>
              )}
              {!canPublish && <p className="rounded-xl bg-admin-sky-soft p-3 text-xs text-admin-sky">As a contributor you can save drafts. An editor will review and publish your post.</p>}
              {post?.publishedAt && (
                <p className="text-xs text-admin-muted">First published {format(new Date(post.publishedAt), "d MMM yyyy 'at' HH:mm")} · {post.views.toLocaleString()} views</p>
              )}
              {canPublish && status !== saved.status && !isNew && (
                <LoadingButton className="w-full rounded-xl" variant="outline" loading={busy === "status"} disabled={!!busy} onClick={() => save(status, "status")}>
                  Apply status change
                </LoadingButton>
              )}
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Featured image" />
            <PanelBody className="space-y-3">
              <ImageUploadField value={form.featuredImage} onChange={(url) => set("featuredImage", url)} folder="blog" label="featured image" />
              <Field label="Alt text" htmlFor="featured-alt" hint="Describe the image for screen readers & SEO.">
                <input id="featured-alt" value={form.featuredImageAlt} onChange={(e) => set("featuredImageAlt", e.target.value)} className={inputClass} />
              </Field>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Categories" />
            <PanelBody className="space-y-3">
              {!categories ? (
                <div className="admin-skeleton h-24 rounded-xl" />
              ) : categories.length === 0 ? (
                <p className="text-sm text-admin-muted">No categories yet — create your first one below.</p>
              ) : (
                <ul className="admin-scroll max-h-56 space-y-1 overflow-y-auto" role="group" aria-label="Categories">
                  {categories.map((category) => {
                    const checked = form.categoryIds.includes(category.id)
                    return (
                      <li key={category.id}>
                        <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm hover:bg-admin-subtle">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => set("categoryIds", checked ? form.categoryIds.filter((id) => id !== category.id) : [...form.categoryIds, category.id])}
                            className="size-4 rounded accent-[var(--admin-brand)]"
                          />
                          <span className="size-2.5 rounded-full" style={{ background: category.color }} aria-hidden />
                          <span className="flex-1 text-admin-text">{category.name}</span>
                        </label>
                      </li>
                    )
                  })}
                </ul>
              )}
              {can("categories.manage") && (
                <div className="flex gap-2">
                  <input
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCategory())}
                    placeholder="New category"
                    aria-label="New category name"
                    className={cn(inputClass, "h-9")}
                  />
                  <Button type="button" variant="outline" size="icon" className="size-9 shrink-0 rounded-xl" onClick={addCategory} aria-label="Add category">
                    <FolderPlus />
                  </Button>
                </div>
              )}
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Tags" />
            <PanelBody>
              <TagInput value={form.tags} onChange={(v) => set("tags", v)} suggestions={allTags} placeholder="Add tags…" />
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Author" />
            <PanelBody>
              {authors && can("blog.edit_any") ? (
                <select
                  aria-label="Author"
                  value={form.authorId || post?.authorId || ""}
                  onChange={(e) => set("authorId", e.target.value)}
                  className={cn(inputClass, "cursor-pointer")}
                >
                  {!form.authorId && !post && <option value="">Me</option>}
                  {authors.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-admin-text">{post?.authorName ?? "You"}</p>
              )}
            </PanelBody>
          </Panel>
        </aside>
      </div>
    </div>
  )
}
