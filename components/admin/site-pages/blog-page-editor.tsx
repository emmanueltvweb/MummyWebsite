"use client"

import Link from "next/link"
import { FolderTree, PenSquare } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ErrorFallback } from "@/components/admin/ui/error-boundary"
import { FullPageSpinner, Panel, PanelBody, PanelHeader } from "@/components/admin/ui/primitives"
import type { BlogPageContent, BuiltInPage } from "@/lib/content/page-types"

import { PageEditorShell, TextArea, TextInput, usePageContentDraft } from "./page-editor-kit"

export function BlogPageEditor({ page }: { page: BuiltInPage }) {
  const { draft, update, dirty, save, reload, saving, reloading, error } = usePageContentDraft("blog", page.title)

  if (error && !draft) return <ErrorFallback label="page" message={error.message} onRetry={reload} />
  if (!draft) return <FullPageSpinner />

  const content = draft as BlogPageContent
  const set = (patch: Partial<BlogPageContent>) => update((c) => ({ ...c, ...patch }))

  return (
    <PageEditorShell
      title={page.title}
      description="Edit the heading of the blog page. Articles themselves are managed in Blog Posts."
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
        <PanelHeader title="Page heading" description="Shown above the search box and article list." />
        <PanelBody className="grid gap-4 sm:grid-cols-2">
          <TextInput label="Small label" value={content.label} onChange={(label) => set({ label })} placeholder="The Blog" />
          <div className="grid grid-cols-2 gap-3">
            <TextInput label="Title" value={content.title} onChange={(title) => set({ title })} />
            <TextInput label="Highlighted words" value={content.titleHighlight} onChange={(titleHighlight) => set({ titleHighlight })} hint="Shown in gold" />
          </div>
          <div className="sm:col-span-2">
            <TextArea label="Subtitle" value={content.subtitle} onChange={(subtitle) => set({ subtitle })} rows={2} />
          </div>
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHeader title="Articles" description="Write, edit and publish blog posts, or organise them into categories." />
        <PanelBody className="flex flex-wrap gap-2">
          <Button asChild className="rounded-xl">
            <Link href="/admin/posts"><PenSquare /> Manage blog posts</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/admin/categories"><FolderTree /> Categories</Link>
          </Button>
        </PanelBody>
      </Panel>
    </PageEditorShell>
  )
}
