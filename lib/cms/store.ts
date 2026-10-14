import "server-only"

import { createCollection, createDocument } from "@/lib/server/db"

import { SYSTEM_ROLES } from "./rbac"
import type {
  AdminUser,
  AuditEntry,
  Campaign,
  Category,
  CmsPage,
  Comment,
  Notification,
  Post,
  RoleRecord,
  SessionRecord,
  SiteSettings,
  Slide,
  Subscriber,
} from "./types"

export const users = createCollection<AdminUser>("users")
export const sessions = createCollection<SessionRecord>("sessions")
export const roles = createCollection<RoleRecord>("roles", () => {
  const now = new Date().toISOString()
  return SYSTEM_ROLES.map((role) => ({ ...role, createdAt: now, updatedAt: now }))
})
export const posts = createCollection<Post>("posts")
export const categories = createCollection<Category>("categories")
export const comments = createCollection<Comment>("comments")
export const pages = createCollection<CmsPage>("pages")
export const slides = createCollection<Slide>("slides")
export const subscribers = createCollection<Subscriber>("subscribers")
export const campaigns = createCollection<Campaign>("campaigns")
export const auditLog = createCollection<AuditEntry>("audit-log")
export const notifications = createCollection<Notification>("notifications")

export const defaultSettings = (): SiteSettings => ({
  siteName: "Pastor Evelyn Joshua",
  tagline: "A ministry dedicated to spiritual growth, community service, and faith-based teachings.",
  logoUrl: "",
  faviconUrl: "",
  contactEmail: "",
  contactPhone: "",
  address: "",
  social: { facebook: "", instagram: "", youtube: "", twitter: "", tiktok: "" },
  seo: {
    defaultTitle: "Pastor Evelyn Joshua website",
    titleTemplate: "%s",
    defaultDescription:
      "Welcome to a ministry dedicated to spiritual growth, community service, and faith-based teachings with gold and blue elegance.",
    keywords: [],
    ogImage: "",
    twitterHandle: "",
    allowIndexing: true,
    googleAnalyticsId: "",
  },
  blog: { postsPerPage: 9, commentsEnabled: true, requireCommentApproval: true },
})

export const settings = createDocument<SiteSettings>("settings", defaultSettings)
