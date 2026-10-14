"use client"

import { useMemo, useRef, useState } from "react"
import { AlertTriangle, CheckCircle2, ClipboardPaste, FileSpreadsheet, UploadCloud, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { feedback } from "@/components/admin/ui/feedback"
import { SegmentedTabs } from "@/components/admin/ui/controls"
import { Field, inputClass, LoadingButton } from "@/components/admin/ui/primitives"
import { api } from "@/lib/admin/api-client"
import { useSubmit } from "@/lib/admin/hooks"
import { cn } from "@/lib/utils"

const EMAIL = /^[^\s@,;<>"]+@[^\s@,;<>"]+\.[^\s@,;<>"]+$/
const MAX_ROWS = 5000
const MAX_FILE_BYTES = 2 * 1024 * 1024

interface ParsedRow {
  email: string
  name?: string
}

/** Minimal CSV/TSV parser that understands quoted fields and auto-detects , ; or tab. */
function parseDelimited(text: string): string[][] {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? ""
  const delimiter = [",", ";", "\t"].sort((a, b) => firstLine.split(b).length - firstLine.split(a).length)[0]
  const rows: string[][] = []
  let row: string[] = []
  let cell = ""
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"'
        i++
      } else if (ch === '"') quoted = false
      else cell += ch
    } else if (ch === '"') quoted = true
    else if (ch === delimiter) {
      row.push(cell.trim())
      cell = ""
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++
      row.push(cell.trim())
      if (row.some(Boolean)) rows.push(row)
      row = []
      cell = ""
    } else cell += ch
  }
  row.push(cell.trim())
  if (row.some(Boolean)) rows.push(row)
  return rows
}

/** Turns a spreadsheet export or a pasted list into { email, name } rows. */
function extractContacts(text: string): ParsedRow[] {
  const rows = parseDelimited(text.replace(/^\uFEFF/, ""))
  if (!rows.length) return []

  const header = rows[0].map((h) => h.toLowerCase().replace(/[^a-z]/g, ""))
  const emailIdx = header.findIndex((h) => h === "email" || h === "emailaddress" || h === "mail")
  if (emailIdx !== -1) {
    const nameIdx = header.findIndex((h) => h === "name" || h === "fullname")
    const firstIdx = header.findIndex((h) => h === "firstname" || h === "first")
    const lastIdx = header.findIndex((h) => h === "lastname" || h === "last" || h === "surname")
    return rows.slice(1).map((r) => ({
      email: (r[emailIdx] ?? "").replace(/^mailto:/i, ""),
      name: (nameIdx !== -1 ? r[nameIdx] : [r[firstIdx] ?? "", r[lastIdx] ?? ""].join(" ")).trim() || undefined,
    }))
  }

  // No header: pick the email-looking cell in each row; the first other cell is treated as the name.
  return rows.flatMap((r) => {
    const cells = r.flatMap((c) => c.split(/\s+(?=\S+@)/))
    const emails = cells.filter((c) => c.includes("@"))
    if (!emails.length) return r.length === 1 && r[0] ? [{ email: r[0] }] : []
    // Several addresses on one line (e.g. "a@x.com, b@y.com") → one contact each, without names.
    if (emails.length > 1) return emails.map((e) => ({ email: e.replace(/^mailto:/i, "").replace(/^<|>$/g, "") }))
    const email = emails[0]
    const name = r.find((c) => !c.includes("@") && c.length > 1)
    return [{ email: email.replace(/^mailto:/i, "").replace(/^<|>$/g, ""), name }]
  })
}

interface ImportResult {
  added: number
  alreadySubscribed: number
  unsubscribed: number
  duplicates: number
  invalidCount: number
  invalid: string[]
}

export function ImportSubscribersDialog({ open, onOpenChange, onImported }: { open: boolean; onOpenChange: (open: boolean) => void; onImported: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<"file" | "paste">("file")
  const [text, setText] = useState("")
  const [fileName, setFileName] = useState("")
  const [source, setSource] = useState("")
  const [consent, setConsent] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState("")
  const { busy, run } = useSubmit()

  const parsed = useMemo(() => extractContacts(text), [text])
  const summary = useMemo(() => {
    const seen = new Set<string>()
    let valid = 0
    let duplicates = 0
    const invalid: string[] = []
    for (const row of parsed) {
      const email = row.email.trim().toLowerCase()
      if (!EMAIL.test(email)) {
        invalid.push(row.email || "(empty)")
        continue
      }
      if (seen.has(email)) duplicates++
      else {
        seen.add(email)
        valid++
      }
    }
    return { valid, duplicates, invalid }
  }, [parsed])

  const reset = () => {
    setText("")
    setFileName("")
    setSource("")
    setConsent(false)
    setError("")
    setMode("file")
  }

  const readFile = async (file: File) => {
    setError("")
    if (file.size > MAX_FILE_BYTES) return setError("That file is larger than 2 MB. Split it into smaller files.")
    if (!/\.(csv|txt|tsv)$/i.test(file.name) && !/^text\//.test(file.type)) {
      return setError("Please choose a .csv or .txt file. (In Excel or Google Sheets: File → Download → CSV.)")
    }
    setFileName(file.name)
    setText(await file.text())
  }

  const submit = () =>
    run("import", async ({ showPreloader }) => {
      setError("")
      if (!summary.valid) return setError("No valid email addresses found.")
      if (parsed.length > MAX_ROWS) return setError(`You can import up to ${MAX_ROWS.toLocaleString()} contacts at a time.`)
      if (!consent) return setError("Please confirm these people agreed to receive your emails.")
      showPreloader(`Importing ${summary.valid.toLocaleString()} contact${summary.valid === 1 ? "" : "s"}…`)
      try {
        const result = await api<ImportResult>("/api/admin/subscribers/import", {
          body: {
            rows: parsed.map((r) => ({ email: r.email.trim(), name: r.name?.trim().slice(0, 80) || undefined })),
            source: source.trim() || undefined,
            consent: true,
          },
        })
        onImported()
        onOpenChange(false)
        reset()
        const skipped = [
          result.alreadySubscribed && `${result.alreadySubscribed} already subscribed`,
          result.unsubscribed && `${result.unsubscribed} previously unsubscribed (left out)`,
          result.duplicates && `${result.duplicates} duplicate${result.duplicates === 1 ? "" : "s"}`,
          result.invalidCount && `${result.invalidCount} invalid`,
        ].filter(Boolean)
        feedback.success(result.added ? `${result.added.toLocaleString()} subscriber${result.added === 1 ? "" : "s"} imported` : "Nothing new to import", {
          description: skipped.length ? `Skipped: ${skipped.join(", ")}.` : "Everyone in your list was added.",
          autoCloseMs: skipped.length ? 6000 : 3200,
        })
      } catch (err) {
        setError((err as Error).message)
      }
    })

  return (
    <Dialog open={open} onOpenChange={(o) => (onOpenChange(o), !o && reset())}>
      <DialogContent className="admin-scroll max-h-[92vh] overflow-y-auto rounded-2xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import subscribers</DialogTitle>
          <DialogDescription>
            Add people to your newsletter list from a spreadsheet or by pasting their email addresses. No welcome email is sent.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <SegmentedTabs
            ariaLabel="Import method"
            value={mode}
            onChange={(v) => {
              setMode(v)
              setText("")
              setFileName("")
              setError("")
            }}
            options={[
              { value: "file", label: "Upload a file" },
              { value: "paste", label: "Paste emails" },
            ]}
            className="w-fit"
          />

          {mode === "file" ? (
            fileName ? (
              <div className="flex items-center gap-3 rounded-2xl border border-admin-border bg-admin-surface-2 p-4">
                <FileSpreadsheet className="size-8 text-admin-success" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-admin-text">{fileName}</p>
                  <p className="text-xs text-admin-muted">{parsed.length.toLocaleString()} rows found</p>
                </div>
                <Button variant="ghost" size="icon-sm" className="rounded-lg" aria-label="Remove file" onClick={() => (setFileName(""), setText(""))}>
                  <X />
                </Button>
              </div>
            ) : (
              <div
                role="button"
                tabIndex={0}
                onClick={() => fileRef.current?.click()}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), fileRef.current?.click())}
                onDragOver={(e) => (e.preventDefault(), setDragOver(true))}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragOver(false)
                  const file = e.dataTransfer.files[0]
                  if (file) readFile(file)
                }}
                className={cn(
                  "flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition",
                  dragOver ? "border-admin-gold bg-admin-gold-soft/60" : "border-admin-border bg-admin-surface-2 hover:border-admin-brand/40"
                )}
              >
                <UploadCloud className="size-9 text-admin-brand" aria-hidden />
                <p className="text-sm font-semibold text-admin-text">
                  Drag & drop a CSV file or <span className="text-admin-brand underline underline-offset-2">browse</span>
                </p>
                <p className="max-w-md text-xs text-admin-muted">
                  Needs an <strong>email</strong> column. A <strong>name</strong> (or first/last name) column is optional. Exports from Excel, Google Sheets,
                  Mailchimp and most email tools work.
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.txt,.tsv,text/csv,text/plain"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) readFile(file)
                    e.target.value = ""
                  }}
                />
              </div>
            )
          ) : (
            <Field label="Email addresses" htmlFor="paste-emails" hint="One per line, or separated by commas. You can also paste “Name, email” pairs.">
              <div className="relative">
                <ClipboardPaste className="pointer-events-none absolute top-3 right-3 size-4 text-admin-muted" aria-hidden />
                <textarea
                  id="paste-emails"
                  rows={7}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={"grace@example.com\nJohn Okafor, john@example.com"}
                  className={cn(inputClass, "h-auto py-2.5 font-mono text-xs")}
                />
              </div>
            </Field>
          )}

          {parsed.length > 0 && (
            <div className="admin-rise space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-admin-success-soft p-3">
                  <p className="text-xl font-bold text-admin-success tabular-nums">{summary.valid.toLocaleString()}</p>
                  <p className="text-xs text-admin-muted">ready to import</p>
                </div>
                <div className="rounded-xl bg-admin-subtle p-3">
                  <p className="text-xl font-bold text-admin-text tabular-nums">{summary.duplicates.toLocaleString()}</p>
                  <p className="text-xs text-admin-muted">duplicates in list</p>
                </div>
                <div className={cn("rounded-xl p-3", summary.invalid.length ? "bg-admin-danger-soft" : "bg-admin-subtle")}>
                  <p className={cn("text-xl font-bold tabular-nums", summary.invalid.length ? "text-admin-danger" : "text-admin-text")}>{summary.invalid.length.toLocaleString()}</p>
                  <p className="text-xs text-admin-muted">invalid</p>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-admin-border">
                <table className="w-full text-sm">
                  <thead className="bg-admin-surface-2 text-left text-xs text-admin-muted">
                    <tr>
                      <th scope="col" className="px-3 py-2 font-medium">Email</th>
                      <th scope="col" className="px-3 py-2 font-medium">Name</th>
                      <th scope="col" className="w-8 px-3 py-2"><span className="sr-only">Valid</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-admin-border/70">
                    {parsed.slice(0, 6).map((row, i) => {
                      const ok = EMAIL.test(row.email.trim().toLowerCase())
                      return (
                        <tr key={i}>
                          <td className="max-w-56 truncate px-3 py-2 text-admin-text">{row.email || "—"}</td>
                          <td className="max-w-40 truncate px-3 py-2 text-admin-muted">{row.name || "—"}</td>
                          <td className="px-3 py-2">
                            {ok ? <CheckCircle2 className="size-4 text-admin-success" aria-label="Valid" /> : <AlertTriangle className="size-4 text-admin-danger" aria-label="Invalid" />}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {parsed.length > 6 && <p className="bg-admin-surface-2 px-3 py-2 text-xs text-admin-muted">…and {(parsed.length - 6).toLocaleString()} more</p>}
              </div>

              {summary.invalid.length > 0 && (
                <p className="text-xs text-admin-muted">
                  Invalid entries will be skipped: <span className="font-mono">{summary.invalid.slice(0, 5).join(", ")}{summary.invalid.length > 5 ? "…" : ""}</span>
                </p>
              )}
            </div>
          )}

          <Field label="Source label (optional)" htmlFor="import-source" hint="Shown in the Source column so you remember where these contacts came from.">
            <input id="import-source" value={source} maxLength={40} onChange={(e) => setSource(e.target.value)} placeholder="e.g. Crusade sign-up sheet" className={inputClass} />
          </Field>

          <label htmlFor="import-consent" className="flex cursor-pointer items-start gap-3 rounded-xl border border-admin-border bg-admin-surface-2 p-3">
            <input id="import-consent" type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 size-4 accent-[var(--admin-brand)]" />
            <span className="text-sm text-admin-text">
              I confirm these people agreed to receive emails from the ministry. People who previously unsubscribed will not be re-added.
            </span>
          </label>

          {error && (
            <p role="alert" className="rounded-xl bg-admin-danger-soft px-3 py-2 text-sm text-admin-danger">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <LoadingButton
            loading={busy === "import"}
            disabled={!summary.valid || !consent}
            onClick={submit}
            className="rounded-xl bg-admin-brand text-admin-brand-fg hover:bg-admin-brand/90"
          >
            <UploadCloud /> Import {summary.valid ? summary.valid.toLocaleString() : ""} subscriber{summary.valid === 1 ? "" : "s"}
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
