"use client"

import { useEffect, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { CheckCircle2, Loader2, MessageCircle } from "lucide-react"

interface PublicComment {
  id: string
  authorName: string
  content: string
  createdAt: string
}

export function CommentsSection({ slug, enabled }: { slug: string; enabled: boolean }) {
  const [comments, setComments] = useState<PublicComment[] | null>(null)
  const [form, setForm] = useState({ authorName: "", authorEmail: "", content: "", website: "" })
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle")
  const [message, setMessage] = useState("")

  useEffect(() => {
    fetch(`/api/blog/${slug}/comments`)
      .then((r) => r.json())
      .then((r) => setComments(r.success ? r.data : []))
      .catch(() => setComments([]))
    // Count a view (server de-duplicates per visitor).
    fetch(`/api/blog/${slug}/view`, { method: "POST" }).catch(() => undefined)
  }, [slug])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (state === "sending") return
    setState("sending")
    try {
      const response = await fetch(`/api/blog/${slug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.error || "Couldn't post your comment")
      setState("sent")
      setMessage(result.data.status === "approved" ? "Thank you! Your comment has been published." : "Thank you! Your comment will appear once it has been reviewed.")
      if (result.data.status === "approved") {
        setComments((c) => [...(c ?? []), { id: crypto.randomUUID(), authorName: form.authorName, content: form.content, createdAt: new Date().toISOString() }])
      }
      setForm({ authorName: "", authorEmail: "", content: "", website: "" })
    } catch (error) {
      setState("error")
      setMessage((error as Error).message)
    }
  }

  const field = "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"

  return (
    <section className="mt-16 border-t border-border pt-10" aria-labelledby="comments-heading">
      <h2 id="comments-heading" className="flex items-center gap-2 text-2xl font-bold text-primary">
        <MessageCircle className="size-6 text-accent" /> Comments {comments && comments.length > 0 && <span className="text-foreground/50">({comments.length})</span>}
      </h2>

      <div className="mt-6 space-y-5">
        {comments === null ? (
          <p className="text-sm text-foreground/60">Loading comments…</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-foreground/60">No comments yet. Be the first to share your thoughts.</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="flex gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent/70 font-bold text-accent-foreground">
                {c.authorName.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1 rounded-2xl bg-muted/60 p-4">
                <p className="text-sm font-semibold text-foreground">
                  {c.authorName} <span className="ml-2 font-normal text-foreground/50">{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</span>
                </p>
                <p className="mt-1 text-sm leading-relaxed whitespace-pre-line text-foreground/80">{c.content}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {enabled ? (
        <form onSubmit={submit} className="mt-10 space-y-4 rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-primary">Leave a comment</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium">Name</span>
              <input required minLength={2} maxLength={80} value={form.authorName} onChange={(e) => setForm({ ...form, authorName: e.target.value })} className={field} autoComplete="name" />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium">Email <span className="font-normal text-foreground/50">(never published)</span></span>
              <input required type="email" maxLength={200} value={form.authorEmail} onChange={(e) => setForm({ ...form, authorEmail: e.target.value })} className={field} autoComplete="email" />
            </label>
          </div>
          {/* Honeypot for bots */}
          <input type="text" tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="hidden" aria-hidden />
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Comment</span>
            <textarea required minLength={3} maxLength={3000} rows={5} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className={field} />
          </label>
          {message && (
            <p role="status" className={`flex items-center gap-2 text-sm ${state === "error" ? "text-destructive" : "text-green-700"}`}>
              {state === "sent" && <CheckCircle2 className="size-4" />} {message}
            </p>
          )}
          <button type="submit" disabled={state === "sending"} className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md transition hover:-translate-y-0.5 disabled:opacity-60">
            {state === "sending" && <Loader2 className="size-4 animate-spin" />} Post comment
          </button>
        </form>
      ) : (
        <p className="mt-8 text-sm text-foreground/60">Comments are closed.</p>
      )}
    </section>
  )
}
