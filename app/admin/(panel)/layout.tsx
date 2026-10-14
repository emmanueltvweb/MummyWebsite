import type React from "react"

import { AdminShell } from "@/components/admin/shell/admin-shell"

export const dynamic = "force-dynamic"

export default function AdminPanelLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AdminShell>{children}</AdminShell>
}
