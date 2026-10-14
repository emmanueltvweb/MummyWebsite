"use client"

import { SearchX } from "lucide-react"

import { EmptyState, Panel } from "@/components/admin/ui/primitives"

export default function AdminNotFound() {
  return (
    <Panel>
      <EmptyState
        icon={SearchX}
        title="We couldn't find that page"
        description="It may have been moved or deleted. Use the sidebar or press Ctrl K to search."
        action={{ label: "Back to dashboard", href: "/admin" }}
      />
    </Panel>
  )
}
