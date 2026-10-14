"use client"

import dynamic from "next/dynamic"
import { useState } from "react"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useConfirm } from "@/components/admin/ui/confirm-dialog"
import { ErrorFallback } from "@/components/admin/ui/error-boundary"
import { FullPageSpinner, Panel, PanelBody, PanelHeader } from "@/components/admin/ui/primitives"
import { optimizeCloudinaryUrl } from "@/lib/cloudinary/optimize"
import type { AboutPageContent, AboutPageKey, AboutSlide, BuiltInPage } from "@/lib/content/page-types"
import { cn } from "@/lib/utils"

import { ImageInput, ListItemCard, moveItem, newId, PageEditorShell, TextInput, usePageContentDraft } from "./page-editor-kit"

const RichTextEditor = dynamic(() => import("@/components/admin/editor/rich-text-editor"), {
  ssr: false,
  loading: () => <div className="admin-skeleton h-[320px] rounded-2xl" />,
})

export function AboutPageEditor({ page, aboutKey }: { page: BuiltInPage; aboutKey: AboutPageKey }) {
  const { draft, update, dirty, save, reload, saving, reloading, setBusy, error } = usePageContentDraft(`about-${aboutKey}`, page.title)
  const confirm = useConfirm()
  const [openId, setOpenId] = useState<string | null>(null)

  if (error && !draft) return <ErrorFallback label="page" message={error.message} onRetry={reload} />
  if (!draft) return <FullPageSpinner />

  const content = draft as AboutPageContent
  const setContent = (patch: Partial<AboutPageContent>) => update((c) => ({ ...c, ...patch }))
  const setSlide = (id: string, patch: Partial<AboutSlide>) =>
    setContent({ slides: content.slides.map((s) => (s.id === id ? { ...s, ...patch } : s)) })

  const addSlide = () => {
    const last = content.slides[content.slides.length - 1]
    const slide: AboutSlide = {
      id: newId(aboutKey),
      title: "New section",
      subtitle: last?.subtitle ?? "",
      html: "<p></p>",
      imageUrl: "",
      imageAlt: "",
      imagePosition: last?.imagePosition === "right" ? "left" : "right",
    }
    setContent({ slides: [...content.slides, slide] })
    setOpenId(slide.id)
  }

  const removeSlide = async (slide: AboutSlide) => {
    if (content.slides.length === 1) return
    const ok = await confirm({ title: `Remove “${slide.title || "this slide"}”?`, description: "The slide is removed when you save the page.", confirmText: "Remove slide", tone: "danger" })
    if (ok) setContent({ slides: content.slides.filter((s) => s.id !== slide.id) })
  }

  return (
    <PageEditorShell
      title={page.title}
      description="Edit the slideshow on this page: each slide has a title, text and a round photo."
      path={page.path}
      dirty={dirty}
      saving={saving}
      reloading={reloading}
      updatedAt={content.updatedAt}
      updatedBy={content.updatedBy}
      onSave={save}
      onReload={reload}
    >
      <Panel>
        <PanelHeader
          title={`Slides (${content.slides.length})`}
          description="Shown one at a time, in this order. Click a slide to edit it."
          actions={
            <Button size="sm" className="rounded-xl" onClick={addSlide}>
              <Plus /> Add slide
            </Button>
          }
        />
        <PanelBody className="space-y-3">
          {content.slides.map((slide, index) => (
            <ListItemCard
              key={slide.id}
              index={index}
              total={content.slides.length}
              title={slide.title}
              subtitle={slide.subtitle}
              thumbnail={slide.imageUrl ? optimizeCloudinaryUrl(slide.imageUrl, { width: 120, height: 120, crop: "fill" }) : undefined}
              open={openId === slide.id}
              onToggle={() => setOpenId(openId === slide.id ? null : slide.id)}
              onMove={(direction) => setContent({ slides: moveItem(content.slides, index, direction) })}
              onRemove={() => removeSlide(slide)}
              removeLabel={`Remove slide ${index + 1}`}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput label="Small heading (above the title)" value={slide.subtitle} onChange={(subtitle) => setSlide(slide.id, { subtitle })} />
                <TextInput label="Title" value={slide.title} onChange={(title) => setSlide(slide.id, { title })} />
              </div>

              <div className="grid gap-5 md:grid-cols-[260px_1fr]">
                <div className="space-y-3">
                  <ImageInput label="Photo" value={slide.imageUrl} onChange={(imageUrl) => setSlide(slide.id, { imageUrl })} folder="about" aspect="aspect-square" className="max-w-[280px]" />
                  <TextInput label="Photo description (alt text)" value={slide.imageAlt} onChange={(imageAlt) => setSlide(slide.id, { imageAlt })} placeholder="Describe the photo" />
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium text-admin-text">Photo position</p>
                    <div className="grid grid-cols-2 gap-1 rounded-xl bg-admin-subtle p-1" role="radiogroup" aria-label="Photo position">
                      {(["left", "right"] as const).map((side) => (
                        <button
                          key={side}
                          type="button"
                          role="radio"
                          aria-checked={slide.imagePosition === side}
                          onClick={() => setSlide(slide.id, { imagePosition: side })}
                          className={cn(
                            "rounded-lg py-1.5 text-sm font-medium capitalize transition",
                            slide.imagePosition === side ? "bg-admin-surface text-admin-text shadow-sm" : "text-admin-muted hover:text-admin-text"
                          )}
                        >
                          {side}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="min-w-0 space-y-1.5">
                  <p className="text-sm font-medium text-admin-text">Text</p>
                  <RichTextEditor
                    value={slide.html}
                    onChange={(html) => setSlide(slide.id, { html })}
                    folder="about"
                    minimal
                    placeholder="Write this part of the story…"
                    onBusyChange={setBusy}
                    ariaLabel={`Text for ${slide.title}`}
                  />
                </div>
              </div>
            </ListItemCard>
          ))}
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHeader title="“Read more” button" description="Optional button under the slideshow. Leave either field empty to hide it." />
        <PanelBody className="grid gap-4 sm:grid-cols-2">
          <TextInput label="Button text" value={content.readMoreLabel} onChange={(readMoreLabel) => setContent({ readMoreLabel })} placeholder="Read more" maxLength={80} />
          <TextInput label="Button link" value={content.readMoreUrl} onChange={(readMoreUrl) => setContent({ readMoreUrl: readMoreUrl.trim() })} placeholder="https://…" />
        </PanelBody>
      </Panel>
    </PageEditorShell>
  )
}
