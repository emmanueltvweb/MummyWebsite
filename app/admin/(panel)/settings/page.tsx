"use client"

import { useEffect, useMemo, useState } from "react"
import useSWR from "swr"
import * as Tabs from "@radix-ui/react-tabs"
import { Facebook, Globe, Instagram, Mail, MessageSquare, Save, Search, Settings, ShieldCheck, Twitter, Youtube } from "lucide-react"

import { useAuth } from "@/components/admin/admin-auth-provider"
import { TagInput } from "@/components/admin/ui/controls"
import { ErrorFallback } from "@/components/admin/ui/error-boundary"
import { EmptyState, Field, FullPageSpinner, inputClass, LoadingButton, PageHeader, Panel, PanelBody, PanelHeader, ToggleRow } from "@/components/admin/ui/primitives"
import { feedback } from "@/components/admin/ui/feedback"
import { ImageUploadField } from "@/components/admin/ui/uploads"
import { api } from "@/lib/admin/api-client"
import { useSubmit, useUnsavedChangesWarning } from "@/lib/admin/hooks"
import type { SiteSettings } from "@/lib/cms/types"
import { cn } from "@/lib/utils"

const TABS = [
  { value: "general", label: "General", icon: Globe },
  { value: "contact", label: "Contact & social", icon: Mail },
  { value: "seo", label: "SEO", icon: Search },
  { value: "blog", label: "Blog & comments", icon: MessageSquare },
]

export default function SettingsPage() {
  const { can } = useAuth()
  const { data, error, isLoading, mutate } = useSWR<SiteSettings>(can("settings.view") ? "/api/admin/settings" : null)
  const [form, setForm] = useState<SiteSettings | null>(null)
  const [tab, setTab] = useState("general")
  const { busy, run } = useSubmit()

  useEffect(() => {
    if (data) setForm(data)
  }, [data])

  const dirty = useMemo(() => !!form && !!data && JSON.stringify(form) !== JSON.stringify(data), [form, data])
  useUnsavedChangesWarning(dirty)

  if (!can("settings.view")) return <EmptyState icon={ShieldCheck} title="No access" description="Your role doesn't include access to site settings." />
  if (error) return <ErrorFallback label="settings" message={(error as Error).message} onRetry={() => mutate()} />
  if (isLoading || !form) return <FullPageSpinner />

  const set = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => setForm((f) => f && { ...f, [key]: value })
  const setSeo = <K extends keyof SiteSettings["seo"]>(key: K, value: SiteSettings["seo"][K]) => setForm((f) => f && { ...f, seo: { ...f.seo, [key]: value } })
  const setSocial = (key: keyof SiteSettings["social"], value: string) => setForm((f) => f && { ...f, social: { ...f.social, [key]: value } })
  const setBlog = <K extends keyof SiteSettings["blog"]>(key: K, value: SiteSettings["blog"][K]) => setForm((f) => f && { ...f, blog: { ...f.blog, [key]: value } })

  const save = () =>
    run("save", async ({ showPreloader }) => {
      showPreloader("Saving settings…")
      try {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { updatedAt, ...payload } = form
        const saved = await api<SiteSettings>("/api/admin/settings", { method: "PUT", body: payload })
        await mutate(saved, { revalidate: false })
        setForm(saved)
        feedback.success("Settings saved", { description: "Your changes are live on the website." })
      } catch (err) {
        feedback.error("Couldn't save settings", err)
      }
    })

  return (
    <div>
      <PageHeader
        icon={Settings}
        title="Site settings"
        description="Branding, contact details, social profiles and search engine settings for the whole website."
        actions={
          <LoadingButton data-shortcut="save" loading={busy === "save"} loadingText="Saving…" disabled={!dirty || !can("settings.manage")} onClick={save} className="rounded-xl bg-admin-brand text-admin-brand-fg hover:bg-admin-brand/90">
            <Save /> Save changes
          </LoadingButton>
        }
      />

      <Tabs.Root value={tab} onValueChange={setTab} className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <Tabs.List aria-label="Settings sections" className="admin-scroll flex gap-1 overflow-x-auto lg:flex-col">
          {TABS.map((t) => (
            <Tabs.Trigger
              key={t.value}
              value={t.value}
              className="flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-sm font-medium text-admin-muted transition hover:bg-admin-surface hover:text-admin-text data-[state=active]:bg-admin-surface data-[state=active]:text-admin-brand data-[state=active]:shadow-admin"
            >
              <t.icon className="size-4" /> {t.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <div className="min-w-0">
          <Tabs.Content value="general" className="admin-page-enter space-y-6 outline-none">
            <Panel>
              <PanelHeader title="Site identity" />
              <PanelBody className="grid gap-4 md:grid-cols-2">
                <Field label="Site name" htmlFor="s-name" required>
                  <input id="s-name" value={form.siteName} onChange={(e) => set("siteName", e.target.value)} className={inputClass} />
                </Field>
                <Field label="Tagline" htmlFor="s-tagline">
                  <input id="s-tagline" value={form.tagline} onChange={(e) => set("tagline", e.target.value)} className={inputClass} />
                </Field>
              </PanelBody>
            </Panel>
            <div className="grid gap-6 md:grid-cols-2">
              <Panel>
                <PanelHeader title="Logo" description="Used in emails and social previews. PNG or SVG with a transparent background works best." />
                <PanelBody><ImageUploadField value={form.logoUrl} onChange={(url) => set("logoUrl", url)} folder="branding" aspect="aspect-[3/1]" label="logo" /></PanelBody>
              </Panel>
              <Panel>
                <PanelHeader title="Favicon" description="The small icon in browser tabs. Square, at least 512×512px." />
                <PanelBody><ImageUploadField value={form.faviconUrl} onChange={(url) => set("faviconUrl", url)} folder="branding" aspect="aspect-[3/1]" label="favicon" /></PanelBody>
              </Panel>
            </div>
          </Tabs.Content>

          <Tabs.Content value="contact" className="admin-page-enter space-y-6 outline-none">
            <Panel>
              <PanelHeader title="Contact information" />
              <PanelBody className="grid gap-4 md:grid-cols-2">
                <Field label="Email" htmlFor="s-email"><input id="s-email" type="email" value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} className={inputClass} /></Field>
                <Field label="Phone" htmlFor="s-phone"><input id="s-phone" value={form.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} className={inputClass} /></Field>
                <Field label="Address" htmlFor="s-address" className="md:col-span-2">
                  <textarea id="s-address" rows={2} value={form.address} onChange={(e) => set("address", e.target.value)} className={cn(inputClass, "h-auto py-2.5")} />
                </Field>
              </PanelBody>
            </Panel>
            <Panel>
              <PanelHeader title="Social profiles" description="Full links, e.g. https://facebook.com/yourpage" />
              <PanelBody className="grid gap-4 md:grid-cols-2">
                {([
                  ["facebook", "Facebook", Facebook],
                  ["instagram", "Instagram", Instagram],
                  ["youtube", "YouTube", Youtube],
                  ["twitter", "X / Twitter", Twitter],
                  ["tiktok", "TikTok", Globe],
                ] as const).map(([key, label, Icon]) => (
                  <Field key={key} label={label} htmlFor={`s-${key}`}>
                    <div className="relative">
                      <Icon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-admin-muted" />
                      <input id={`s-${key}`} value={form.social[key]} onChange={(e) => setSocial(key, e.target.value)} placeholder="https://" className={cn(inputClass, "pl-9")} />
                    </div>
                  </Field>
                ))}
              </PanelBody>
            </Panel>
          </Tabs.Content>

          <Tabs.Content value="seo" className="admin-page-enter space-y-6 outline-none">
            <Panel>
              <PanelHeader title="Search & social defaults" description="Used on every page unless a post or page overrides them." />
              <PanelBody className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Default title" htmlFor="seo-title" required><input id="seo-title" value={form.seo.defaultTitle} onChange={(e) => setSeo("defaultTitle", e.target.value)} className={inputClass} /></Field>
                  <Field label="Title template" htmlFor="seo-template" hint="%s is replaced with the page title."><input id="seo-template" value={form.seo.titleTemplate} onChange={(e) => setSeo("titleTemplate", e.target.value)} className={inputClass} /></Field>
                </div>
                <Field label="Default description" htmlFor="seo-desc" hint={`${form.seo.defaultDescription.length}/160 recommended`}>
                  <textarea id="seo-desc" rows={3} value={form.seo.defaultDescription} onChange={(e) => setSeo("defaultDescription", e.target.value)} className={cn(inputClass, "h-auto py-2.5")} />
                </Field>
                <Field label="Keywords" htmlFor="seo-keywords"><TagInput id="seo-keywords" value={form.seo.keywords} onChange={(v) => setSeo("keywords", v)} placeholder="ministry, sermons, prayer…" /></Field>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="X / Twitter handle" htmlFor="seo-twitter"><input id="seo-twitter" value={form.seo.twitterHandle} onChange={(e) => setSeo("twitterHandle", e.target.value)} placeholder="@handle" className={inputClass} /></Field>
                  <Field label="Google Analytics ID" htmlFor="seo-ga" hint="e.g. G-XXXXXXXXXX. Leave blank to disable."><input id="seo-ga" value={form.seo.googleAnalyticsId} onChange={(e) => setSeo("googleAnalyticsId", e.target.value.trim())} className={inputClass} /></Field>
                </div>
                <ToggleRow
                  label="Allow search engines to index the site"
                  description="Turn off while the site is under construction."
                  checked={form.seo.allowIndexing}
                  onCheckedChange={(v) => setSeo("allowIndexing", v)}
                  className="rounded-xl border border-admin-border p-4"
                />
              </PanelBody>
            </Panel>
            <Panel>
              <PanelHeader title="Social sharing image" description="Shown when links are shared on Facebook, WhatsApp, X, etc. 1200×630px recommended." />
              <PanelBody className="max-w-lg"><ImageUploadField value={form.seo.ogImage} onChange={(url) => setSeo("ogImage", url)} folder="branding" label="sharing image" /></PanelBody>
            </Panel>
          </Tabs.Content>

          <Tabs.Content value="blog" className="admin-page-enter space-y-6 outline-none">
            <Panel>
              <PanelHeader title="Blog" />
              <PanelBody className="space-y-4">
                <Field label="Posts per page" htmlFor="blog-per-page" hint="Between 3 and 48.">
                  <input id="blog-per-page" type="number" min={3} max={48} value={form.blog.postsPerPage} onChange={(e) => setBlog("postsPerPage", Math.max(3, Math.min(48, Number(e.target.value) || 9)))} className={cn(inputClass, "w-32")} />
                </Field>
                {([
                  ["commentsEnabled", "Allow comments", "Readers can leave comments on blog posts."],
                  ["requireCommentApproval", "Hold comments for approval", "New comments stay hidden until approved in Comments."],
                ] as const).map(([key, label, description]) => (
                  <ToggleRow
                    key={key}
                    label={label}
                    description={description}
                    checked={form.blog[key]}
                    onCheckedChange={(v) => setBlog(key, v)}
                    className="rounded-xl border border-admin-border p-4"
                  />
                ))}
              </PanelBody>
            </Panel>
          </Tabs.Content>
        </div>
      </Tabs.Root>
    </div>
  )
}
