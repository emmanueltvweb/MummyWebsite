"use client"

import { useEffect } from "react"

import { ErrorFallback } from "@/components/admin/ui/error-boundary"

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(JSON.stringify({ level: "error", msg: "Admin route error", error: error.message, digest: error.digest }))
  }, [error])

  return (
    <div className="py-10">
      <ErrorFallback label="page" message={error.message || "An unexpected error occurred."} onRetry={reset} />
    </div>
  )
}
