"use client"

import Link from "next/link"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import useSWR, { useSWRConfig } from "swr"
import { format } from "date-fns"
import { ArrowLeft, Eye, MailCheck, MousePointerClick, Save, Send, Users, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/admin/admin-auth-provider"
import { useConfirm } from "@/components/admin/ui/confirm-dialog"
import { ErrorFallback } from "@/components/admin/ui/error-boundary"
import { Field, FullPageSpinner, inputClass, LoadingButton, Panel, PanelBody, PanelHeader, StatusBadge } from "@/components/admin/ui/primitives"
import { StatCard } from "@/components/admin/ui/stat-card"
import { toast } from "@/components/admin/ui/toast"
import { feedback } from "@/components/admin/ui/feedback"
import { api } from "@/lib/admin/api-client"
import { useSubmit, useUnsavedChangesWarning } from "@/lib/admin/hooks"
import { setCached } from "@/lib/admin/store"
import type { Campaign } from "@/lib/cms/types"

const RichTextEditor = dynamic(() => import("@/components/admin/editor/rich-text-editor"), {
  ssr: false,
  loading: () => <div className="admin-skeleton h-[480px] rounded-2xl" />,
})

type Form = Pick<Campaign, "subject" | "previewText" | "content">
const EMPTY: Form = { subject: "", previewText: "", content: "" }

export function CampaignEditor({ campaignId }: { campaignId?: string }) {
  const router = useRouter()
  const confirm = useConfirm()
  const { can } = useAuth()
  const { mutate: globalMutate } = useSWRConfig()
  const isNew = !campaignId
  const { data: campaign, error, isLoading, mutate } = useSWR<Campaign>(campaignId ? `/api/admin/campaigns/${campaignId}` : null, {
    refreshInterval: (c) => (c?.status === "sending" ? 2500 : 0),
  })
  const { data: list } = useSWR<{ activeSubscribers: number }>("/api/admin/campaigns")
  const [form, setForm] = useState<Form>(EMPTY)
  const [saved, setSaved] = useState<Form>(EMPTY)
  const [subjectError, setSubjectError] = useState("")
  const { busy, run } = useSubmit()

  useEffect(() => {
    if (campaign) {
      const next = { subject: campaign.subject, previewText: campaign.previewText, content: campaign.content }
      setForm(next)
      setSaved(next)
    }
  }, [campaign?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(saved), [form, saved])
  useUnsavedChangesWarning(dirty)

  if (error) return <ErrorFallback label="campaign" message={(error as Error).message} onRetry={() => mutate()} />
  if (campaignId && isLoading) return <FullPageSpinner />

  const readOnly = !!campaign && campaign.status !== "draft"
  const recipients = list?.activeSubscribers ?? 0

  const persist = async (): Promise<Campaign | null> => {
    if (!form.subject.trim()) {
      setSubjectError("Add a subject line")
      return null
    }
    const result = await api<Campaign>(isNew ? "/api/admin/campaigns" : `/api/admin/campaigns/${campaignId}`, { method: isNew ? "POST" : "PUT", body: form })
    setSaved(form)
    globalMutate("/api/admin/campaigns")
    return result
  }

  const saveDraft = () =>
    run("save", async ({ showPreloader }) => {
      if (!form.subject.trim()) return setSubjectError("Add a subject line")
      showPreloader("Saving campaign…")
      try {
        const result = await persist()
        if (!result) return
        feedback.success("Draft saved", { description: "Your campaign is saved. Send it whenever you're ready." })
        // Seed the store first so the editor opens instantly on the new URL (no spinner / refetch).
        await setCached(`/api/admin/campaigns/${result.id}`, result)
        if (isNew) router.replace(`/admin/newsletter/${result.id}`)
      } catch (err) {
        feedback.error("Couldn't save campaign", err)
      }
    })

  const send = () =>
    run("send", async ({ showPreloader }) => {
      if (!form.content.trim()) return toast.error("Your campaign is empty", "Write some content before sending.")
      const ok = await confirm({
        tone: "default",
        title: `Send to ${recipients} subscriber${recipients === 1 ? "" : "s"}?`,
        description: "Once sent, a campaign can't be edited or recalled. Make sure the subject and content are final.",
        confirmText: "Send now",
      })
      if (!ok) return
      showPreloader("Sending campaign…")
      try {
        const result = await persist()
        if (!result) return
        await api(`/api/admin/campaigns/${result.id}/send`, { method: "POST" })
        feedback.success("Campaign is on its way!", { description: `Sending to ${recipients} subscriber${recipients === 1 ? "" : "s"}. Delivery progress updates live on this page.`, celebrate: true })
        globalMutate((k) => typeof k === "string" && (k.startsWith("/api/admin/campaigns") || k.startsWith("/api/admin/stats")))
        if (isNew) router.replace(`/admin/newsletter/${result.id}`)
        else mutate()
      } catch (err) {
        feedback.error("Couldn't send campaign", err)
      }
    })

  const pct = (n: number) => (campaign?.delivered ? Math.round((n / campaign.delivered) * 1000) / 10 : 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="rounded-xl" aria-label="Back to newsletter">
            <Link href="/admin/newsletter"><ArrowLeft /></Link>
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-xl font-bold tracking-tight text-admin-text sm:text-2xl">{isNew ? "New campaign" : readOnly ? "Campaign report" : "Edit campaign"}</h1>
              {campaign && <StatusBadge status={campaign.status} />}
            </div>
            <p className="text-sm text-admin-muted">
              {readOnly && campaign?.sentAt ? `Sent ${format(new Date(campaign.sentAt), "d MMM yyyy 'at' HH:mm")}` : dirty ? <span className="font-medium text-admin-gold-strong">● Unsaved changes</span> : `Will be sent to ${recipients} active subscriber${recipients === 1 ? "" : "s"}`}
            </p>
          </div>
        </div>
        {!readOnly && can("newsletter.manage") && (
          <div className="flex gap-2">
            <LoadingButton variant="outline" className="rounded-xl" data-shortcut="save" loading={busy === "save"} disabled={!!busy} onClick={saveDraft}>
              <Save /> Save draft
            </LoadingButton>
            <LoadingButton className="rounded-xl bg-admin-brand text-admin-brand-fg hover:bg-admin-brand/90" loading={busy === "send"} loadingText="Sending…" disabled={!!busy || !recipients || !can("newsletter.send")} title={can("newsletter.send") ? undefined : "Your role can't send campaigns"} onClick={send}>
              <Send /> Send campaign
            </LoadingButton>
          </div>
        )}
      </div>

      {readOnly && campaign && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard size="sm" label="Recipients" value={campaign.recipients} icon={Users} tone="brand" />
          <StatCard size="sm" label="Delivered" value={campaign.delivered} icon={MailCheck} tone="success" hint={campaign.status === "sending" ? "sending…" : undefined} />
          <StatCard size="sm" label="Open rate" value={pct(campaign.opens.length)} suffix="%" decimals={1} icon={Eye} tone="sky" hint={`${campaign.opens.length} opened`} />
          <StatCard size="sm" label="Click rate" value={pct(campaign.clicks.length)} suffix="%" decimals={1} icon={MousePointerClick} tone="gold" hint={`${campaign.clicks.length} clicked`} />
          {campaign.failed > 0 && (
            <p className="flex items-center gap-2 rounded-xl bg-admin-danger-soft p-3 text-sm text-admin-danger sm:col-span-2 xl:col-span-4">
              <XCircle className="size-4" /> {campaign.failed} message(s) could not be delivered. Check the email provider configuration.
            </p>
          )}
        </div>
      )}

      <Panel>
        <PanelHeader title="Email details" />
        <PanelBody className="grid gap-4 md:grid-cols-2">
          <Field label="Subject line" htmlFor="campaign-subject" required error={subjectError}>
            <input id="campaign-subject" value={form.subject} readOnly={readOnly} maxLength={200} onChange={(e) => (setForm((f) => ({ ...f, subject: e.target.value })), setSubjectError(""))} placeholder="This week at the ministry…" className={inputClass} />
          </Field>
          <Field label="Preview text" htmlFor="campaign-preview" hint="Shown next to the subject in most inboxes.">
            <input id="campaign-preview" value={form.previewText} readOnly={readOnly} maxLength={200} onChange={(e) => setForm((f) => ({ ...f, previewText: e.target.value }))} className={inputClass} />
          </Field>
        </PanelBody>
      </Panel>

      {readOnly ? (
        <Panel>
          <PanelHeader title="Content" description="This is what subscribers received." />
          <PanelBody>
            <div className="rich-content mx-auto max-w-2xl rounded-2xl border border-admin-border bg-white p-8 text-gray-800" dangerouslySetInnerHTML={{ __html: campaign?.content ?? "" }} />
          </PanelBody>
        </Panel>
      ) : (
        <RichTextEditor value={form.content} onChange={(html) => setForm((f) => ({ ...f, content: html }))} folder="newsletter" minimal placeholder="Write your newsletter… Links are tracked automatically." ariaLabel="Newsletter content" />
      )}
    </div>
  )
}
