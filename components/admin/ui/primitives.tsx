"use client"

import Link from "next/link"
import { useId } from "react"
import { Loader2, type LucideIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

/* ------------------------------------------------------------------ Panel (card) */

export function Panel({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <section
      className={cn("admin-card rounded-3xl bg-admin-surface", className)}
      {...props}
    >
      {children}
    </section>
  )
}

export function PanelHeader({
  title,
  description,
  actions,
  className,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3 px-5 pt-5 sm:px-6 sm:pt-6", className)}>
      <div className="min-w-0">
        <h2 className="text-base font-semibold tracking-tight text-admin-text sm:text-lg">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-admin-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function PanelBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 sm:p-6", className)} {...props} />
}

/* ------------------------------------------------------------------ Page header */

export function PageHeader({
  title,
  description,
  actions,
  icon: Icon,
}: {
  title: string
  description?: React.ReactNode
  actions?: React.ReactNode
  icon?: LucideIcon
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        {Icon && (
          <span className="hidden size-11 shrink-0 items-center justify-center rounded-xl bg-admin-brand-soft text-admin-brand sm:flex">
            <Icon className="size-5" aria-hidden />
          </span>
        )}
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight text-admin-text">{title}</h1>
          {description && <p className="mt-0.5 text-sm text-admin-muted">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

/* ------------------------------------------------------------------ Buttons */

type ButtonProps = React.ComponentProps<typeof Button>

/** Button with a built-in spinner that also blocks double submission while `loading`. */
export function LoadingButton({
  loading,
  loadingText,
  children,
  disabled,
  ...props
}: ButtonProps & { loading?: boolean; loadingText?: string }) {
  return (
    <Button disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {loading && loadingText ? loadingText : children}
    </Button>
  )
}

export function BrandButton({ className, ...props }: ButtonProps) {
  return (
    <Button
      className={cn(
        "rounded-xl bg-admin-brand text-admin-brand-fg shadow-sm hover:bg-admin-brand/90 hover:shadow-md",
        className
      )}
      {...props}
    />
  )
}

/* ------------------------------------------------------------------ Badges */

const TONES = {
  neutral: "bg-admin-subtle text-admin-muted",
  brand: "bg-admin-brand-soft text-admin-brand",
  gold: "bg-admin-gold-soft text-admin-gold-strong",
  success: "bg-admin-success-soft text-admin-success",
  warning: "bg-admin-warning-soft text-admin-gold-strong",
  danger: "bg-admin-danger-soft text-admin-danger",
  sky: "bg-admin-sky-soft text-admin-sky",
} as const

export type Tone = keyof typeof TONES

export function Pill({ tone = "neutral", className, children, dot }: { tone?: Tone; className?: string; children: React.ReactNode; dot?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap", TONES[tone], className)}>
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  )
}

const STATUS_TONE: Record<string, Tone> = {
  published: "success",
  approved: "success",
  active: "success",
  subscribed: "success",
  sent: "success",
  draft: "neutral",
  scheduled: "sky",
  sending: "sky",
  pending: "warning",
  archived: "gold",
  inactive: "neutral",
  suspended: "danger",
  unsubscribed: "neutral",
  spam: "danger",
  failed: "danger",
  enabled: "success",
  disabled: "neutral",
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <Pill tone={STATUS_TONE[status] ?? "neutral"} dot>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Pill>
  )
}

/* ------------------------------------------------------------------ Empty state */

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon
  title: string
  description?: string
  action?: { label: string; href?: string; onClick?: () => void }
  className?: string
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-14 text-center admin-rise", className)}>
      <div className="relative mb-4">
        <div className="absolute inset-0 scale-150 rounded-full bg-admin-gold-soft blur-xl" aria-hidden />
        <span className="relative flex size-14 items-center justify-center rounded-2xl border border-admin-border bg-admin-surface text-admin-brand shadow-admin">
          <Icon className="size-6" aria-hidden />
        </span>
      </div>
      <h3 className="text-base font-semibold text-admin-text">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-admin-muted">{description}</p>}
      {action &&
        (action.href ? (
          <BrandButton asChild className="mt-5">
            <Link href={action.href}>{action.label}</Link>
          </BrandButton>
        ) : (
          <BrandButton className="mt-5" onClick={action.onClick}>
            {action.label}
          </BrandButton>
        ))}
    </div>
  )
}

/* ------------------------------------------------------------------ Skeletons & spinner */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("admin-skeleton rounded-lg", className)} aria-hidden />
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3 p-5" role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className={cn("h-4", c === 0 ? "w-2/5" : "flex-1")} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function Spinner({ className, label = "Loading" }: { className?: string; label?: string }) {
  return (
    <span role="status" className="inline-flex items-center">
      <Loader2 className={cn("size-5 animate-spin text-admin-brand", className)} aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  )
}

export function FullPageSpinner() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Spinner className="size-7" />
    </div>
  )
}

/* ------------------------------------------------------------------ Form field */

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className,
}: {
  label: string
  htmlFor?: string
  hint?: React.ReactNode
  error?: string
  required?: boolean
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-admin-text">
        {label}
        {required && <span className="ml-0.5 text-admin-danger" aria-hidden>*</span>}
      </label>
      {children}
      {error ? (
        <p className="text-xs font-medium text-admin-danger" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-admin-muted">{hint}</p>
      )}
    </div>
  )
}

/** A labelled on/off setting row (label + description + switch), correctly associated for screen readers. */
export function ToggleRow({
  label,
  description,
  checked,
  onCheckedChange,
  className,
}: {
  label: string
  description?: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  className?: string
}) {
  const id = useId()
  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <div>
        <label htmlFor={id} className="block cursor-pointer text-sm font-medium text-admin-text">
          {label}
        </label>
        {description && <p id={`${id}-desc`} className="text-sm text-admin-muted">{description}</p>}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} aria-describedby={description ? `${id}-desc` : undefined} />
    </div>
  )
}

export const inputClass =
  "h-10 w-full rounded-xl border border-admin-border bg-admin-surface px-3 text-sm text-admin-text placeholder:text-admin-muted/70 shadow-xs transition focus-visible:border-admin-brand focus-visible:ring-4 focus-visible:ring-admin-brand/15 focus-visible:outline-none disabled:opacity-60"
