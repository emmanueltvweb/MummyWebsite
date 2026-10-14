"use client"

import { useState } from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

const axis = { stroke: "var(--admin-muted)", fontSize: 12, tickLine: false, axisLine: false }

function ChartTooltip({ active, payload, label, suffix }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string; suffix?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl bg-[oklch(0.2_0.04_265)] px-3 py-2 text-xs text-white shadow-lg">
      {label && <p className="mb-1 font-semibold opacity-70">{label}</p>}
      {payload.map((item) => (
        <p key={item.name} className="flex items-center gap-2 font-medium">
          <span className="size-2 rounded-full" style={{ background: item.color }} />
          {item.value} {suffix ?? item.name}
        </p>
      ))}
    </div>
  )
}

export function PostGrowthChart({ data }: { data: { label: string; posts: number }[] }) {
  const [active, setActive] = useState<number | null>(null)
  const peak = data.reduce((best, d, i) => (d.posts > data[best].posts ? i : best), 0)
  const highlight = active ?? peak

  return (
    <div className="h-64 w-full" role="img" aria-label={`Posts per month: ${data.map((d) => `${d.label} ${d.posts}`).join(", ")}`}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 4, left: -24, bottom: 0 }} onMouseLeave={() => setActive(null)}>
          <CartesianGrid vertical={false} strokeDasharray="4 6" stroke="var(--admin-border)" />
          <XAxis dataKey="label" {...axis} />
          <YAxis allowDecimals={false} {...axis} />
          <Tooltip cursor={false} content={<ChartTooltip suffix="posts" />} />
          <Bar dataKey="posts" name="posts" radius={[8, 8, 4, 4]} maxBarSize={56} onMouseEnter={(_, index) => setActive(index)}>
            {data.map((entry, index) => (
              <Cell
                key={entry.label}
                fill={index === highlight ? "var(--admin-teal)" : "var(--admin-teal-soft)"}
                className="transition-[fill] duration-300"
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export const COMMENT_SERIES = [
  { key: "approved", label: "Approved", color: "var(--admin-teal)" },
  { key: "pending", label: "Pending", color: "var(--admin-orange)" },
  { key: "spam", label: "Spam", color: "var(--admin-danger)" },
] as const

export function CommentsTrendChart({ data }: { data: { label: string; approved: number; pending: number; spam: number }[] }) {
  return (
    <div className="h-64 w-full" role="img" aria-label="Daily comments by status">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="4 6" stroke="var(--admin-border)" />
          <XAxis dataKey="label" {...axis} interval="preserveStartEnd" />
          <YAxis allowDecimals={false} {...axis} />
          <Tooltip content={<ChartTooltip />} />
          {COMMENT_SERIES.map((series) => (
            <Line
              key={series.key}
              type="monotone"
              dataKey={series.key}
              name={series.label.toLowerCase()}
              stroke={series.color}
              strokeWidth={2.25}
              strokeDasharray="6 4"
              dot={false}
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function SubscriberGrowthChart({ data }: { data: { label: string; total: number }[] }) {
  return (
    <div className="h-56 w-full" role="img" aria-label="Active subscribers over the last 30 days">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id="subscriberFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--admin-sky)" stopOpacity={0.4} />
              <stop offset="100%" stopColor="var(--admin-sky)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="4 6" stroke="var(--admin-border)" />
          <XAxis dataKey="label" {...axis} interval={6} />
          <YAxis allowDecimals={false} {...axis} />
          <Tooltip content={<ChartTooltip suffix="subscribers" />} />
          <Area type="monotone" dataKey="total" name="subscribers" stroke="var(--admin-teal)" strokeWidth={2.5} fill="url(#subscriberFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
