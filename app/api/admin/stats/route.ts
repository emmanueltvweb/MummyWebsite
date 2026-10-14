import { route } from "@/lib/server/api"
import { can } from "@/lib/server/auth"
import { getCloudinaryAssetCount } from "@/lib/cloudinary/usage"
import { allPosts } from "@/lib/cms/posts"
import { auditLog, campaigns, categories, comments, subscribers, users } from "@/lib/cms/store"

const DAY = 86_400_000

interface Dated {
  createdAt: string
}

/** Percentage change of items created in the last 30 days vs. the 30 days before. */
function trend(items: Dated[], now: number) {
  let current = 0
  let previous = 0
  for (const item of items) {
    const age = now - new Date(item.createdAt).getTime()
    if (age < 30 * DAY) current++
    else if (age < 60 * DAY) previous++
  }
  const change = previous === 0 ? (current > 0 ? 100 : 0) : ((current - previous) / previous) * 100
  return { current, previous, change: Math.round(change * 10) / 10 }
}

/** Daily counts for the last `days` days (oldest first). */
function spark(items: Dated[], now: number, days = 14) {
  const buckets = new Array(days).fill(0)
  for (const item of items) {
    const age = Math.floor((now - new Date(item.createdAt).getTime()) / DAY)
    if (age >= 0 && age < days) buckets[days - 1 - age]++
  }
  return buckets
}

export const GET = route({ permission: "dashboard.view" }, async ({ request, user }) => {
  const params = new URL(request.url).searchParams
  const months = params.get("months") === "12" ? 12 : 6
  const commentDays = params.get("days") === "30" ? 30 : params.get("days") === "7" ? 7 : 15
  const now = Date.now()

  const [postList, commentList, subscriberList, campaignList, categoryList, userList, activity, mediaCount] =
    await Promise.all([
      allPosts(),
      comments.all(),
      subscribers.all(),
      campaigns.all(),
      categories.all(),
      users.all(),
      auditLog.all(),
      getCloudinaryAssetCount(),
    ])

  const published = postList.filter((p) => p.status === "published")
  const activeSubs = subscriberList.filter((s) => s.status === "subscribed")
  const sent = campaignList.filter((c) => c.status === "sent")
  const delivered = sent.reduce((sum, c) => sum + c.delivered, 0)
  const opens = sent.reduce((sum, c) => sum + c.opens.length, 0)
  const clicks = sent.reduce((sum, c) => sum + c.clicks.length, 0)
  const newSubs = trend(subscriberList, now)
  const campaignDates = sent.map((c) => ({ createdAt: c.sentAt ?? c.createdAt }))

  const cards = {
    totalPosts: { value: postList.length, trend: trend(postList, now).change, spark: spark(postList, now) },
    publishedPosts: {
      value: published.length,
      trend: trend(published.map((p) => ({ createdAt: p.publishedAt ?? p.createdAt })), now).change,
      spark: spark(published.map((p) => ({ createdAt: p.publishedAt ?? p.createdAt })), now),
    },
    draftPosts: { value: postList.filter((p) => p.status === "draft").length },
    scheduledPosts: { value: postList.filter((p) => p.status === "scheduled").length },
    subscribers: { value: activeSubs.length, trend: newSubs.change, spark: spark(subscriberList, now) },
    newSubscribers: { value: newSubs.current, trend: newSubs.change },
    campaignsSent: { value: sent.length, trend: trend(campaignDates, now).change },
    delivered: { value: delivered },
    openRate: { value: delivered ? Math.round((opens / delivered) * 1000) / 10 : 0 },
    clickRate: { value: delivered ? Math.round((clicks / delivered) * 1000) / 10 : 0 },
    comments: {
      value: commentList.length,
      pending: commentList.filter((c) => c.status === "pending").length,
      trend: trend(commentList, now).change,
      spark: spark(commentList, now),
    },
    categories: { value: categoryList.length },
    users: { value: userList.length },
    media: { value: mediaCount },
  }

  // Posts per month (by publish date, falling back to creation date)
  const monthKeys: string[] = []
  const reference = new Date(now)
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(reference.getFullYear(), reference.getMonth() - i, 1)
    monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`)
  }
  const perMonth = new Map(monthKeys.map((k) => [k, 0]))
  for (const post of postList) {
    const key = (post.publishedAt ?? post.createdAt).slice(0, 7)
    if (perMonth.has(key)) perMonth.set(key, perMonth.get(key)! + 1)
  }
  const postGrowth = monthKeys.map((key) => ({
    key,
    label: new Date(`${key}-01T00:00:00`).toLocaleString("en", { month: "short" }),
    posts: perMonth.get(key)!,
  }))

  // Comments per day, split by status
  const commentTrend = Array.from({ length: commentDays }, (_, i) => {
    const day = new Date(now - (commentDays - 1 - i) * DAY)
    return { date: day.toISOString().slice(0, 10), label: String(day.getDate()), approved: 0, pending: 0, spam: 0 }
  })
  const dayIndex = new Map(commentTrend.map((d, i) => [d.date, i]))
  for (const comment of commentList) {
    const index = dayIndex.get(comment.createdAt.slice(0, 10))
    if (index !== undefined) commentTrend[index][comment.status]++
  }

  // Subscriber growth – cumulative active subscribers over the last 30 days
  const subscriberGrowth = Array.from({ length: 30 }, (_, i) => {
    const end = now - (29 - i) * DAY
    const date = new Date(end)
    const total = subscriberList.filter(
      (s) =>
        new Date(s.createdAt).getTime() <= end && (s.status === "subscribed" || new Date(s.unsubscribedAt ?? 0).getTime() > end)
    ).length
    return { date: date.toISOString().slice(0, 10), label: date.toLocaleString("en", { day: "numeric", month: "short" }), total }
  })

  const postTitles = new Map(postList.map((p) => [p.id, p.title]))

  // Charts, trends and the activity feed are analytics; other lists follow their module permissions.
  const analytics = can(user, "analytics.view")
  return {
    cards,
    analytics,
    postGrowth: analytics ? postGrowth : [],
    commentTrend: analytics ? commentTrend : [],
    subscriberGrowth: analytics ? subscriberGrowth : [],
    latestPosts: (can(user, "blog.view") ? [...postList] : [])
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 5)
      .map((p) => ({ id: p.id, title: p.title, status: p.status, date: p.publishedAt ?? p.updatedAt, slug: p.slug })),
    recentComments: (can(user, "comments.view") ? [...commentList] : [])
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5)
      .map((c) => ({
        id: c.id,
        authorName: c.authorName,
        content: c.content,
        status: c.status,
        createdAt: c.createdAt,
        postTitle: postTitles.get(c.postId) ?? "Deleted post",
      })),
    activity: (analytics ? [...activity] : [])
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 8)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .map(({ ip, ...entry }) => entry),
  }
})
