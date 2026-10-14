"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { inputClass } from "./primitives"

/* ------------------------------------------------------------------ Debounced search */

export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  className,
  delay = 300,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  delay?: number
}) {
  const [draft, setDraft] = useState(value)
  const first = useRef(true)

  useEffect(() => setDraft(value), [value])

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    const t = setTimeout(() => draft !== value && onChange(draft), delay)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft])

  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-admin-muted" aria-hidden />
      <input
        type="search"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={cn(inputClass, "pr-8 pl-9 [&::-webkit-search-cancel-button]:hidden")}
      />
      {draft && (
        <button
          type="button"
          onClick={() => {
            setDraft("")
            onChange("")
          }}
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1 text-admin-muted hover:bg-admin-subtle"
          aria-label="Clear search"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ Pagination */

export function PaginationBar({
  page,
  pageCount,
  total,
  pageSize,
  onPage,
  noun = "items",
}: {
  page: number
  pageCount: number
  total: number
  pageSize: number
  onPage: (page: number) => void
  noun?: string
}) {
  if (total === 0) return null
  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  const pages: (number | "…")[] = []
  for (let p = 1; p <= pageCount; p++) {
    if (p === 1 || p === pageCount || Math.abs(p - page) <= 1) pages.push(p)
    else if (pages[pages.length - 1] !== "…") pages.push("…")
  }

  return (
    <nav className="flex flex-col items-center justify-between gap-3 border-t border-admin-border/70 px-5 py-4 sm:flex-row" aria-label="Pagination">
      <p className="text-sm text-admin-muted">
        Showing <span className="font-medium text-admin-text">{from}</span>–<span className="font-medium text-admin-text">{to}</span> of{" "}
        <span className="font-medium text-admin-text">{total}</span> {noun}
      </p>
      {pageCount > 1 && (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page">
            <ChevronLeft />
          </Button>
          {pages.map((p, i) =>
            p === "…" ? (
              <span key={`gap-${i}`} className="px-1 text-admin-muted">…</span>
            ) : (
              <Button
                key={p}
                variant="ghost"
                size="icon-sm"
                onClick={() => onPage(p)}
                aria-current={p === page ? "page" : undefined}
                className={cn("rounded-lg text-sm", p === page && "bg-admin-brand text-admin-brand-fg hover:bg-admin-brand/90 hover:text-admin-brand-fg")}
              >
                {p}
              </Button>
            )
          )}
          <Button variant="ghost" size="icon-sm" disabled={page >= pageCount} onClick={() => onPage(page + 1)} aria-label="Next page">
            <ChevronRight />
          </Button>
        </div>
      )}
    </nav>
  )
}

/* ------------------------------------------------------------------ Tag input */

export function TagInput({
  value,
  onChange,
  placeholder = "Type and press Enter",
  suggestions = [],
  id,
  max = 30,
}: {
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  suggestions?: string[]
  id?: string
  max?: number
}) {
  const [draft, setDraft] = useState("")
  const add = (raw: string) => {
    const tags = raw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
    if (!tags.length) return
    const next = [...value]
    for (const tag of tags) if (!next.some((t) => t.toLowerCase() === tag.toLowerCase()) && next.length < max) next.push(tag)
    onChange(next)
    setDraft("")
  }
  const matches = draft
    ? suggestions.filter((s) => s.toLowerCase().includes(draft.toLowerCase()) && !value.includes(s)).slice(0, 5)
    : []

  return (
    <div className="relative">
      <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-xl border border-admin-border bg-admin-surface px-2 py-1.5 focus-within:border-admin-brand focus-within:ring-4 focus-within:ring-admin-brand/15">
        {value.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 rounded-lg bg-admin-brand-soft px-2 py-0.5 text-xs font-medium text-admin-brand">
            {tag}
            <button type="button" onClick={() => onChange(value.filter((t) => t !== tag))} aria-label={`Remove ${tag}`} className="rounded hover:bg-admin-brand/10">
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault()
              add(draft)
            } else if (e.key === "Backspace" && !draft && value.length) {
              onChange(value.slice(0, -1))
            }
          }}
          onBlur={() => add(draft)}
          placeholder={value.length ? "" : placeholder}
          className="min-w-24 flex-1 bg-transparent px-1 text-sm text-admin-text outline-none placeholder:text-admin-muted/70"
        />
      </div>
      {matches.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-admin-border bg-admin-surface py-1 shadow-admin-lg">
          {matches.map((s) => (
            <li key={s}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  add(s)
                }}
                className="w-full px-3 py-1.5 text-left text-sm hover:bg-admin-subtle"
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ Segmented tabs */

export function SegmentedTabs<T extends string>({
  value,
  onChange,
  options,
  className,
  ariaLabel,
}: {
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string; count?: number }[]
  className?: string
  ariaLabel?: string
}) {
  return (
    <div role="tablist" aria-label={ariaLabel} className={cn("admin-scroll flex gap-1 overflow-x-auto rounded-xl bg-admin-subtle p-1", className)}>
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all duration-200",
              active ? "bg-admin-surface text-admin-text shadow-sm" : "text-admin-muted hover:text-admin-text"
            )}
          >
            {option.label}
            {option.count !== undefined && (
              <span className={cn("rounded-md px-1.5 text-xs tabular-nums", active ? "bg-admin-brand-soft text-admin-brand" : "bg-admin-surface/60")}>
                {option.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
