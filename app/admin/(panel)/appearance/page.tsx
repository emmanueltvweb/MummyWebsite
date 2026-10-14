"use client"

import { Check, Monitor, Moon, Palette, Sun } from "lucide-react"

import { usePreferences, type ThemePreference } from "@/components/admin/shell/preferences"
import { PageHeader, Panel, PanelBody, PanelHeader, ToggleRow } from "@/components/admin/ui/primitives"
import { cn } from "@/lib/utils"

const THEMES: { value: ThemePreference; label: string; icon: typeof Sun; preview: string }[] = [
  { value: "light", label: "Light", icon: Sun, preview: "bg-[oklch(0.972_0.008_265)]" },
  { value: "dark", label: "Dark", icon: Moon, preview: "bg-[oklch(0.16_0.02_265)]" },
  { value: "system", label: "Match device", icon: Monitor, preview: "bg-gradient-to-r from-[oklch(0.972_0.008_265)] from-50% to-[oklch(0.16_0.02_265)] to-50%" },
]

const BRAND = [
  { name: "Navy (primary)", var: "--admin-brand" },
  { name: "Gold (accent)", var: "--admin-gold" },
  { name: "Sky (secondary)", var: "--admin-sky" },
  { name: "Success", var: "--admin-success" },
  { name: "Warning", var: "--admin-warning" },
  { name: "Danger", var: "--admin-danger" },
]

export default function AppearancePage() {
  const prefs = usePreferences()

  return (
    <div className="max-w-4xl">
      <PageHeader icon={Palette} title="Appearance" description="Personalise how the dashboard looks for you. These settings are saved on this device." />
      <div className="space-y-6">
        <Panel>
          <PanelHeader title="Theme" />
          <PanelBody>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3" role="radiogroup" aria-label="Theme">
              {THEMES.map((theme) => {
                const active = prefs.theme === theme.value
                return (
                  <button
                    key={theme.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => prefs.set("theme", theme.value)}
                    className={cn("group overflow-hidden rounded-2xl border-2 text-left transition hover:-translate-y-0.5", active ? "border-admin-brand shadow-admin-lg" : "border-admin-border")}
                  >
                    <div className={cn("relative h-28 p-3", theme.preview)}>
                      <div className="flex h-full gap-2">
                        <div className="w-1/4 rounded-lg bg-white/70 shadow-sm dark:bg-white/10" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 w-2/3 rounded bg-[oklch(0.28_0.09_265)]/60" />
                          <div className="h-10 rounded-lg bg-white/80 shadow-sm" />
                          <div className="h-3 w-1/2 rounded bg-[oklch(0.76_0.15_75)]/80" />
                        </div>
                      </div>
                      {active && <span className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-admin-brand text-admin-brand-fg"><Check className="size-4" /></span>}
                    </div>
                    <div className="flex items-center gap-2 bg-admin-surface px-4 py-3 text-sm font-medium text-admin-text">
                      <theme.icon className="size-4" /> {theme.label}
                    </div>
                  </button>
                )
              })}
            </div>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader title="Layout & motion" />
          <PanelBody className="divide-y divide-admin-border/70">
            {([
              ["sidebarCollapsed", "Compact sidebar", "Show icons only to give content more room. Shortcut: Ctrl + B."],
              ["reducedMotion", "Reduce motion", "Turn off animations and transitions throughout the dashboard."],
            ] as const).map(([key, label, description]) => (
              <ToggleRow
                key={key}
                label={label}
                description={description}
                checked={prefs[key]}
                onCheckedChange={(v) => prefs.set(key, v)}
                className="py-4 first:pt-0 last:pb-0"
              />
            ))}
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader title="Brand palette" description="The dashboard uses the same colours as the public website so everything feels like one ministry." />
          <PanelBody>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {BRAND.map((c) => (
                <div key={c.var} className="flex items-center gap-3 rounded-xl border border-admin-border/70 p-3">
                  <span className="size-10 rounded-xl shadow-inner" style={{ background: `var(${c.var})` }} />
                  <span className="text-sm font-medium text-admin-text">{c.name}</span>
                </div>
              ))}
            </div>
          </PanelBody>
        </Panel>
      </div>
    </div>
  )
}
