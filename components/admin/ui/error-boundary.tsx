"use client"

import { Component, type ErrorInfo, type ReactNode } from "react"
import { AlertOctagon, RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"

interface Props {
  children: ReactNode
  /** Short label used in the fallback, e.g. "chart". */
  label?: string
  fallback?: ReactNode
}

interface State {
  error: Error | null
}

/** Contains a crash to one widget instead of taking down the whole dashboard. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(JSON.stringify({ level: "error", msg: "UI error boundary", label: this.props.label, error: error.message, stack: info.componentStack?.slice(0, 500) }))
  }

  render() {
    if (!this.state.error) return this.props.children
    if (this.props.fallback) return this.props.fallback
    return <ErrorFallback message={this.state.error.message} label={this.props.label} onRetry={() => this.setState({ error: null })} />
  }
}

export function ErrorFallback({ message, label, onRetry }: { message?: string; label?: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-admin-danger/40 bg-admin-danger-soft/40 p-8 text-center">
      <AlertOctagon className="size-7 text-admin-danger" aria-hidden />
      <div>
        <p className="font-semibold text-admin-text">{label ? `This ${label} failed to load` : "Something went wrong"}</p>
        {message && <p className="mt-1 max-w-md text-sm text-admin-muted">{message}</p>}
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" className="rounded-xl" onClick={onRetry}>
          <RotateCcw className="size-4" /> Try again
        </Button>
      )}
    </div>
  )
}
