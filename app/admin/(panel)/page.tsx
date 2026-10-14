"use client"

import Link from "next/link"
import dynamic from "next/dynamic"
import { useState } from "react"
import useSWR from "swr"
import { format, formatDistanceToNow } from "date-fns"
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Eye,
  FileEdit,
  FilePlus2,
  FolderTree,
  ImageIcon,
  Mail,
  MailCheck,
  MessageSquare,
  MousePointerClick,
  Newspaper,
  Send,
  UserPlus,
  UserRound,
  Users,
} from "lucide-react"

import { useAuth } from "@/components/admin/admin-auth-provider"
import { COMMENT_SERIES } from "@/components/admin/dashboard/charts"
import { ErrorBoundary, ErrorFallback } from "@/components/admin/ui/error-boundary"
import { EmptyState, Panel, PanelHeader, Skeleton, StatusBadge } from "@/components/admin/ui/primitives"
import { StatCard } from "@/components/admin/ui/stat-card"
import type { AuditEntry, CommentStatus, PostStatus } from "@/lib/cms/types"
import { cn } from "@/lib/utils"

const chartFallback = () => <Skeleton className="h-64 w-full rounded-xl" />
const PostGrowthChart = dynamic(() => import("@/components/admin/dashboard/charts").then((m) => m.PostGrowthChart), { ssr: false, loading: chartFallback })
const CommentsTrendChart = dynamic(() => import("@/components/admin/dashboard/charts").then((m) => m.CommentsTrendChart), { ssr: false, loading: chartFallback })
const SubscriberGrowthChart = dynamic(() => import("@/components/admin/dashboard/charts").then((m) => m.SubscriberGrowthChart), { ssr: false, loading: chartFallback })

interface Card {
  value: number | null
  trend?: number
  spark?: number[]
  pending?: number
}

interface Stats {
  cards: Record<
    | "totalPosts" | "publishedPosts" | "draftPosts" | "scheduledPosts" | "subscribers" | "newSubscribers" | "campaignsSent"
    | "delivered" | "openRate" | "clickRate" | "comments" | "categories" | "users" | "media",
    Card
  >
  postGrowth: { key: string; label: string; posts: number }[]
  commentTrend: { date: string; label: string; approved: number; pending: number; spam: number }[]
  subscriberGrowth: { date: string; label: string; total: number }[]
  latestPosts: { id: string; title: string; status: PostStatus; date: string; slug: string }[]
  recentComments: { id: string; authorName: string; content: string; status: CommentStatus; createdAt: string; postTitle: string }[]
  activity: Omit<AuditEntry, "ip">[]
  analytics: boolean
}

function RangeSelect<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; label: string }) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className="h-9 cursor-pointer rounded-full border border-admin-border bg-admin-surface-2 px-3.5 text-sm font-medium text-admin-text transition hover:border-admin-brand/30 focus-visible:ring-4 focus-visible:ring-admin-brand/15 focus-visible:outline-none"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

function ActivityIcon({ action }: { action: string }) {
  const [entity, verb] = action.split(".")
  const Icon =
    entity === "post" ? Newspaper : entity === "comment" ? MessageSquare : entity === "subscriber" ? UserRound : entity === "campaign" ? Mail : entity === "media" ? ImageIcon : entity === "user" || entity === "auth" ? Users : Activity
  const tone = verb?.includes("delete") ? "bg-admin-danger-soft text-admin-danger" : verb === "create" ? "bg-admin-success-soft text-admin-success" : "bg-admin-brand-soft text-admin-brand"
  return (
    <span className={cn("relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full ring-4 ring-admin-surface", tone)}>
      <Icon className="size-3.5" aria-hidden />
    </span>
  )
}

export default function AdminDashboard() {
  const { user, can } = useAuth()
  const [months, setMonths] = useState<"6" | "12">("6")
  const [days, setDays] = useState<"7" | "15" | "30">("15")
  const { data, error, isLoading, mutate } = useSWR<Stats>(`/api/admin/stats?months=${months}&days=${days}`, { keepPreviousData: true, refreshInterval: 120_000 })

  if (error && !data) return <ErrorFallback label="dashboard" message={(error as Error).message} onRetry={() => mutate()} />

  const c = data?.cards
  const showAnalytics = data?.analytics !== false
  const loading = isLoading && !data
  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-admin-text sm:text-3xl">
            {greeting}, {user?.name.split(" ")[0] ?? "there"}
          </h1>
          <p className="mt-1 text-sm text-admin-muted">Here's what's happening across the website · {format(new Date(), "EEEE, d MMMM")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {can("blog.create") && (
          <Link href="/admin/posts/new" className="inline-flex items-center gap-2 rounded-xl bg-admin-gold px-4 py-2.5 text-sm font-semibold text-[oklch(0.2_0.05_265)] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md" data-ripple>
            <FilePlus2 className="size-4" /> Write a post
          </Link>
          )}
          {can("newsletter.manage") && (
            <Link href="/admin/newsletter/new" className="inline-flex items-center gap-2 rounded-xl border border-admin-border bg-admin-surface px-4 py-2.5 text-sm font-semibold text-admin-text shadow-sm transition hover:-translate-y-0.5 hover:shadow-md" data-ripple>
              <Send className="size-4" /> New campaign
            </Link>
          )}
        </div>
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading || !c ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[178px] rounded-3xl" />)
        ) : (
          <>
            <StatCard label="Total Blog Posts" value={c.totalPosts.value} trend={c.totalPosts.trend} spark={c.totalPosts.spark} icon={Newspaper} kpi="green" />
            <StatCard label="Published Posts" value={c.publishedPosts.value} trend={c.publishedPosts.trend} spark={c.publishedPosts.spark} icon={CheckCircle2} kpi="teal" delay={60} />
            <StatCard label="Email Subscribers" value={c.subscribers.value} trend={c.subscribers.trend} spark={c.subscribers.spark} icon={Users} kpi="blue" delay={120} />
            <StatCard
              label="Total Comments"
              value={c.comments.value}
              trend={c.comments.trend}
              spark={c.comments.spark}
              icon={MessageSquare}
              kpi="ocean"
              delay={180}
              hint={c.comments.pending ? `${c.comments.pending} awaiting review` : undefined}
            />
          </>
        )}
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        {loading || !c ? (
          Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-[76px] rounded-2xl" />)
        ) : (
          <>
            <StatCard size="sm" label="Draft Posts" value={c.draftPosts.value} icon={FileEdit} tone="neutral" hint={c.scheduledPosts.value ? `${c.scheduledPosts.value} scheduled` : undefined} />
            <StatCard size="sm" label="New Subscribers (30d)" value={c.newSubscribers.value} trend={c.newSubscribers.trend} icon={UserPlus} tone="gold" delay={30} />
            <StatCard size="sm" label="Campaigns Sent" value={c.campaignsSent.value} trend={c.campaignsSent.trend} icon={Send} tone="brand" delay={60} />
            <StatCard size="sm" label="Delivered Newsletters" value={c.delivered.value} icon={MailCheck} tone="success" delay={90} />
            <StatCard size="sm" label="Open Rate" value={c.openRate.value} suffix="%" decimals={1} icon={Eye} tone="sky" delay={120} />
            <StatCard size="sm" label="Click Rate" value={c.clickRate.value} suffix="%" decimals={1} icon={MousePointerClick} tone="sky" delay={150} />
            <StatCard size="sm" label="Categories" value={c.categories.value} icon={FolderTree} tone="brand" delay={180} />
            <StatCard size="sm" label="Users" value={c.users.value} icon={Users} tone="neutral" delay={210} />
            <StatCard size="sm" label="Media Files" value={c.media.value} icon={ImageIcon} tone="gold" delay={240} hint={c.media.value === null ? "Cloudinary" : undefined} />
            <StatCard size="sm" label="Pending Comments" value={c.comments.pending ?? 0} icon={MessageSquare} tone="warning" delay={270} />
          </>
        )}
      </div>

      {/* Charts */}
      {showAnalytics && (
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <Panel className="xl:col-span-2">
          <PanelHeader
            title="Post Growth"
            description="Posts published per month"
            actions={<RangeSelect label="Post growth range" value={months} onChange={setMonths} options={[{ value: "6", label: "6 months" }, { value: "12", label: "12 months" }]} />}
          />
          <div className="px-5 pt-3 pb-5 sm:px-6">
            <p className="mb-3 flex items-center gap-2 text-sm text-admin-muted">
              <span className="size-3 rounded-full bg-[var(--admin-teal)]" /> Total number of posts
            </p>
            <ErrorBoundary label="chart">{data ? <PostGrowthChart data={data.postGrowth} /> : chartFallback()}</ErrorBoundary>
          </div>
        </Panel>
        <Panel className="xl:col-span-3">
          <PanelHeader
            title="Comments Trend"
            description="New comments by moderation status"
            actions={
              <RangeSelect
                label="Comments range"
                value={days}
                onChange={setDays}
                options={[{ value: "7", label: "Last 7 days" }, { value: "15", label: "Last 15 days" }, { value: "30", label: "Last 30 days" }]}
              />
            }
          />
          <div className="px-5 pt-3 pb-5 sm:px-6">
            <div className="mb-3 flex flex-wrap gap-x-5 gap-y-1">
              {COMMENT_SERIES.map((s) => (
                <span key={s.key} className="flex items-center gap-2 text-sm text-admin-muted">
                  <span className="size-3 rounded-full" style={{ background: s.color }} /> {s.label}
                </span>
              ))}
            </div>
            <ErrorBoundary label="chart">{data ? <CommentsTrendChart data={data.commentTrend} /> : chartFallback()}</ErrorBoundary>
          </div>
        </Panel>
      </div>
      )}

      {/* Tables */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <Panel className="overflow-hidden xl:col-span-2">
          <PanelHeader
            title="Latest Posts"
            actions={
              <Link href="/admin/posts" className="inline-flex items-center gap-1 text-sm font-medium text-admin-brand hover:underline">
                View all <ArrowRight className="size-4" />
              </Link>
            }
          />
          <div className="mt-4 overflow-x-auto">
            {loading ? (
              <div className="space-y-3 p-5">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-5" />)}</div>
            ) : !data?.latestPosts.length ? (
              <EmptyState icon={Newspaper} title="No posts yet" description="Your latest blog posts will appear here." action={{ label: "Write your first post", href: "/admin/posts/new" }} />
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-admin-surface-2 text-left text-xs text-admin-muted">
                  <tr>
                    <th scope="col" className="px-5 py-3 font-medium sm:px-6">Title</th>
                    <th scope="col" className="px-3 py-3 font-medium">Status</th>
                    <th scope="col" className="px-5 py-3 font-medium sm:px-6">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-admin-border/70">
                  {data.latestPosts.map((post) => (
                    <tr key={post.id} className="transition hover:bg-admin-surface-2">
                      <td className="max-w-[220px] px-5 py-3.5 sm:px-6">
                        <Link href={`/admin/posts/${post.id}`} className="block truncate font-medium text-admin-text hover:text-admin-brand">
                          {post.title}
                        </Link>
                      </td>
                      <td className="px-3 py-3.5"><StatusBadge status={post.status} /></td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-admin-muted sm:px-6">{format(new Date(post.date), "d MMM")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Panel>

        <Panel className="overflow-hidden xl:col-span-3">
          <PanelHeader
            title="Recent Comments"
            actions={
              <Link href="/admin/comments" className="inline-flex items-center gap-1 text-sm font-medium text-admin-brand hover:underline">
                Moderate <ArrowRight className="size-4" />
              </Link>
            }
          />
          <div className="mt-4 overflow-x-auto">
            {loading ? (
              <div className="space-y-3 p-5">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-5" />)}</div>
            ) : !data?.recentComments.length ? (
              <EmptyState icon={MessageSquare} title="No comments yet" description="When readers comment on your posts, you'll see them here." />
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-admin-surface-2 text-left text-xs text-admin-muted">
                  <tr>
                    <th scope="col" className="px-5 py-3 font-medium sm:px-6">Author</th>
                    <th scope="col" className="px-3 py-3 font-medium">Comment</th>
                    <th scope="col" className="px-3 py-3 font-medium">Date</th>
                    <th scope="col" className="px-5 py-3 text-right font-medium sm:px-6">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-admin-border/70">
                  {data.recentComments.map((comment) => (
                    <tr key={comment.id} className="transition hover:bg-admin-surface-2">
                      <td className="px-5 py-3.5 font-medium whitespace-nowrap text-admin-text sm:px-6">{comment.authorName}</td>
                      <td className="max-w-[280px] px-3 py-3.5">
                        <p className="truncate text-admin-text">“{comment.content}”</p>
                        <p className="truncate text-xs text-admin-muted">on {comment.postTitle}</p>
                      </td>
                      <td className="px-3 py-3.5 whitespace-nowrap text-admin-muted">{format(new Date(comment.createdAt), "d MMM")}</td>
                      <td className="px-5 py-3.5 text-right sm:px-6"><StatusBadge status={comment.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Panel>
      </div>

      {/* Audience + activity */}
      {showAnalytics && (
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <Panel className="xl:col-span-3">
          <PanelHeader
            title="Subscriber Growth"
            description="Active newsletter subscribers, last 30 days"
            actions={
              <Link href="/admin/subscribers" className="inline-flex items-center gap-1 text-sm font-medium text-admin-brand hover:underline">
                Subscribers <ArrowRight className="size-4" />
              </Link>
            }
          />
          <div className="px-5 pt-4 pb-5 sm:px-6">
            <ErrorBoundary label="chart">{data ? <SubscriberGrowthChart data={data.subscriberGrowth} /> : chartFallback()}</ErrorBoundary>
          </div>
        </Panel>

        <Panel className="xl:col-span-2">
          <PanelHeader
            title="Recent Activity"
            actions={
              can("settings.view") && (
                <Link href="/admin/audit-logs" className="inline-flex items-center gap-1 text-sm font-medium text-admin-brand hover:underline">
                  Audit log <ArrowRight className="size-4" />
                </Link>
              )
            }
          />
          <div className="px-5 pt-4 pb-5 sm:px-6">
            {loading ? (
              <div className="space-y-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-9" />)}</div>
            ) : !data?.activity.length ? (
              <EmptyState icon={Activity} title="No activity yet" description="Changes made by your team will be listed here." className="py-8" />
            ) : (
              <ol className="relative space-y-4 before:absolute before:top-2 before:bottom-2 before:left-4 before:w-px before:bg-admin-border">
                {data.activity.map((entry) => (
                  <li key={entry.id} className="relative flex gap-3">
                    <ActivityIcon action={entry.action} />
                    <div className="min-w-0 pt-0.5">
                      <p className="text-sm text-admin-text">
                        <span className="font-semibold">{entry.userName}</span> <span className="text-admin-muted">·</span> {entry.summary}
                      </p>
                      <p className="text-xs text-admin-muted">{formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </Panel>
      </div>
      )}
    </div>
  )
}
