"use client"

import Link from "next/link"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import useSWR, { useSWRConfig } from "swr"
import { format } from "date-fns"
import { ArrowLeft, Globe, Link2, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ErrorFallback } from "@/components/admin/ui/error-boundary"
import { Field, FullPageSpinner, inputClass, LoadingButton, Panel, PanelBody, PanelHeader, StatusBadge, ToggleRow } from "@/components/admin/ui/primitives"
import { toast } from "@/components/admin/ui/toast"
import { feedback } from "@/components/admin/ui/feedback"
import { ImageUploadField } from "@/components/admin/ui/uploads"
import { api } from "@/lib/admin/api-client"
import { slugifyClient, useSubmit, useUnsavedChangesWarning } from "@/lib/admin/hooks"
import { setCached } from "@/lib/admin/store"
import type { CmsPage } from "@/lib/cms/types"
import { cn } from "@/lib/utils"

const RichTextEditor = dynamic(() => import("@/components/admin/editor/rich-text-editor"), {
  ssr: false,
  loading: () => <div className="admin-skeleton h-[520px] rounded-2xl" />,
})

type Form = Pick<CmsPage, "title" | "slug" | "content" | "featuredImage" | "status" | "seoTitle" | "seoDescription">
const EMPTY: Form = { title: "", slug: "", content: "", featuredImage: "", status: "draft", seoTitle: "", seoDescription: "" }
const pick = (p: CmsPage): Form => ({ title: p.title, slug: p.slug, content: p.content, featuredImage: p.featuredImage, status: p.status, seoTitle: p.seoTitle, seoDescription: p.seoDescription })

export function PageEditor({ pageId }: { pageId?: string }) {
  const router = useRouter()
  const { mutate: globalMutate } = useSWRConfig()
  const isNew = !pageId
  const { data: page, error, isLoading, mutate } = useSWR<CmsPage>(pageId ? `/api/admin/pages/${pageId}` : null)
  const [form, setForm] = useState<Form>(EMPTY)
  const [saved, setSaved] = useState<Form>(EMPTY)
  const [slugTouched, setSlugTouched] = useState(false)
  const [titleError, setTitleError] = useState("")
  const [editorBusy, setEditorBusy] = useState(false)
  const { busy, run } = useSubmit()

  useEffect(() => {
    if (page) {
      setForm(pick(page))
      setSaved(pick(page))
      setSlugTouched(true)
    }
  }, [page])

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(saved), [form, saved])
  useUnsavedChangesWarning(dirty)

  if (error) return <ErrorFallback label="page" message={(error as Error).message} onRetry={() => mutate()} />
  if (pageId && isLoading) return <FullPageSpinner />

  const save = () =>
    run("save", async ({ showPreloader }) => {
      if (!form.title.trim()) return setTitleError("Give the page a title")
      if (editorBusy) return toast.warning("Please wait", "Images are still uploading.")
      showPreloader(form.status === "published" ? "Publishing page…" : "Saving page…")
      try {
        const result = await api<CmsPage>(isNew ? "/api/admin/pages" : `/api/admin/pages/${pageId}`, { method: isNew ? "POST" : "PUT", body: form })
        setForm(pick(result))
        setSaved(pick(result))
        globalMutate("/api/admin/pages")
        const live = result.status === "published"
        feedback.success(live ? (saved.status === "published" ? "Page updated" : "Page published!") : isNew ? "Page created" : "Page saved", {
          description: live ? `It's live at /pages/${result.slug}.` : "Saved as a draft. It isn't visible on the website yet.",
          celebrate: live && saved.status !== "published",
          actions: live ? [{ label: "View page", href: `/pages/${result.slug}`, external: true }] : undefined,
        })
        // Seed the store first so the editor opens instantly on the new URL (no spinner / refetch).
        await setCached(`/api/admin/pages/${result.id}`, result)
        if (isNew) router.replace(`/admin/pages/${result.id}`)
      } catch (err) {
        feedback.error("Couldn't save the page", err)
      }
    })

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }))

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="rounded-xl" aria-label="Back to pages">
            <Link href="/admin/pages"><ArrowLeft /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-admin-text sm:text-2xl">{isNew ? "New page" : "Edit page"}</h1>
              {!isNew && <StatusBadge status={saved.status} />}
            </div>
            <p className="text-sm text-admin-muted">
              {dirty ? <span className="font-medium text-admin-gold-strong">● Unsaved changes</span> : page ? `Last saved ${format(new Date(page.updatedAt), "d MMM, HH:mm")} by ${page.updatedBy}` : "Not saved yet"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {saved.status === "published" && (
            <Button asChild variant="outline" className="rounded-xl">
              <a href={`/pages/${saved.slug}`} target="_blank" rel="noopener noreferrer"><Globe /> View live</a>
            </Button>
          )}
          <LoadingButton data-shortcut="save" loading={busy === "save"} loadingText="Saving…" onClick={save} className="rounded-xl bg-admin-brand text-admin-brand-fg hover:bg-admin-brand/90">
            <Save /> {isNew ? "Create page" : "Save page"}
          </LoadingButton>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-5">
          <Panel>
            <PanelBody className="space-y-3">
              <input
                value={form.title}
                onChange={(e) => {
                  set("title", e.target.value)
                  setTitleError("")
                  if (!slugTouched) set("slug", slugifyClient(e.target.value))
                }}
                placeholder="Page title"
                aria-label="Page title"
                aria-invalid={!!titleError}
                className="w-full bg-transparent text-3xl font-bold tracking-tight text-admin-text outline-none placeholder:text-admin-muted/50"
              />
              {titleError && <p className="text-sm font-medium text-admin-danger" role="alert">{titleError}</p>}
              <label className="flex items-center gap-2 text-sm text-admin-muted">
                <Link2 className="size-4" aria-hidden /> /pages/
                <input
                  value={form.slug}
                  onChange={(e) => (setSlugTouched(true), set("slug", slugifyClient(e.target.value)))}
                  placeholder="page-url"
                  aria-label="URL slug"
                  className="h-8 min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 font-medium text-admin-text hover:border-admin-border focus:border-admin-brand focus:outline-none"
                />
              </label>
            </PanelBody>
          </Panel>
          <RichTextEditor value={form.content} onChange={(html) => set("content", html)} folder="pages" placeholder="Write the page content…" onBusyChange={setEditorBusy} ariaLabel="Page content" />
        </div>

        <aside className="space-y-5">
          <Panel>
            <PanelHeader title="Visibility" />
            <PanelBody>
              <ToggleRow
                label="Published"
                description={form.status === "published" ? "Visible to everyone" : "Only visible in the dashboard"}
                checked={form.status === "published"}
                onCheckedChange={(on) => set("status", on ? "published" : "draft")}
              />
            </PanelBody>
          </Panel>
          <Panel>
            <PanelHeader title="Header image" />
            <PanelBody>
              <ImageUploadField value={form.featuredImage} onChange={(url) => set("featuredImage", url)} folder="pages" label="header image" />
            </PanelBody>
          </Panel>
          <Panel>
            <PanelHeader title="SEO" />
            <PanelBody className="space-y-4">
              <Field label="SEO title" htmlFor="page-seo-title" hint={`${form.seoTitle.length}/60 recommended`}>
                <input id="page-seo-title" value={form.seoTitle} maxLength={120} onChange={(e) => set("seoTitle", e.target.value)} placeholder={form.title} className={inputClass} />
              </Field>
              <Field label="Meta description" htmlFor="page-seo-desc" hint={`${form.seoDescription.length}/160 recommended`}>
                <textarea id="page-seo-desc" rows={4} maxLength={320} value={form.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} className={cn(inputClass, "h-auto py-2.5")} />
              </Field>
            </PanelBody>
          </Panel>
        </aside>
      </div>
    </div>
  )
}
