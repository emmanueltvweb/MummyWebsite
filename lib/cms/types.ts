import type { Permission } from "./rbac"

/** A role id, e.g. "super_admin", "editor" or a custom role's id. */
export type Role = string

export interface BaseEntity {
  id: string
  createdAt: string
  updatedAt: string
}

/* ----------------------------------------------------------------------------- Users & access */

export type UserStatus = "active" | "suspended"

export interface AdminUser extends BaseEntity {
  name: string
  email: string
  role: Role
  status: UserStatus
  passwordHash: string
  sessionVersion: number
  avatarUrl?: string
  lastLoginAt?: string
  mustChangePassword?: boolean
  suspendedAt?: string
  suspendedReason?: string
}

export type PublicUser = Omit<AdminUser, "passwordHash" | "sessionVersion">

export interface RoleRecord extends BaseEntity {
  name: string
  description: string
  permissions: Permission[]
  system: boolean
  locked?: boolean
}

export interface SessionRecord extends BaseEntity {
  userId: string
  remember: boolean
  ip?: string
  userAgent?: string
  lastSeenAt: string
  expiresAt: string
  revokedAt?: string
}

/** What `/api/auth/me` returns for the signed-in user. */
export interface CurrentUser extends PublicUser {
  roleName: string
  permissions: Permission[]
  session: { id: string; remember: boolean; expiresAt: string; idleTimeoutMs: number | null }
}

/* ----------------------------------------------------------------------------- Blog */

export type PostStatus = "draft" | "scheduled" | "published" | "archived"

export interface Post extends BaseEntity {
  title: string
  slug: string
  excerpt: string
  content: string // sanitised HTML
  featuredImage: string // Cloudinary URL
  featuredImageAlt: string
  categoryIds: string[]
  tags: string[]
  authorId: string
  authorName: string
  status: PostStatus
  publishedAt: string | null
  scheduledAt: string | null
  seoTitle: string
  seoDescription: string
  metaKeywords: string[]
  views: number
  readingMinutes: number
}

export interface Category extends BaseEntity {
  name: string
  slug: string
  description: string
  color: string
}

export type CommentStatus = "pending" | "approved" | "spam"

export interface Comment extends BaseEntity {
  postId: string
  authorName: string
  authorEmail: string
  content: string
  status: CommentStatus
  ip?: string
}

/* ----------------------------------------------------------------------------- Pages */

export type PageStatus = "draft" | "published"

export interface CmsPage extends BaseEntity {
  title: string
  slug: string
  content: string
  featuredImage: string
  status: PageStatus
  seoTitle: string
  seoDescription: string
  updatedBy: string
}

/* ----------------------------------------------------------------------------- Slider */

export interface Slide extends BaseEntity {
  title: string
  subtitle: string
  description: string
  buttonText: string
  buttonUrl: string
  backgroundImage: string // Cloudinary URL
  enabled: boolean
  order: number
}

/* ----------------------------------------------------------------------------- Newsletter */

export interface Subscriber extends BaseEntity {
  email: string
  name?: string
  status: "subscribed" | "unsubscribed"
  source: string
  token: string // used for unsubscribe + tracking links
  unsubscribedAt?: string
}

export type CampaignStatus = "draft" | "sending" | "sent" | "failed"

export interface Campaign extends BaseEntity {
  subject: string
  previewText: string
  content: string // HTML
  status: CampaignStatus
  sentAt: string | null
  recipients: number
  delivered: number
  failed: number
  opens: string[] // unique subscriber ids that opened
  clicks: string[] // unique subscriber ids that clicked
  links: string[] // allow-list of URLs that the click tracker may redirect to
  createdBy: string
}

/* ----------------------------------------------------------------------------- System */

export interface AuditEntry extends BaseEntity {
  userId: string
  userName: string
  action: string // e.g. "post.create"
  entityType: string
  entityId?: string
  summary: string
  ip?: string
}

export interface Notification extends BaseEntity {
  type: "comment" | "subscriber" | "post" | "system" | "campaign"
  title: string
  body: string
  href?: string
  read: boolean
}

export interface SiteSettings {
  siteName: string
  tagline: string
  logoUrl: string
  faviconUrl: string
  contactEmail: string
  contactPhone: string
  address: string
  social: {
    facebook: string
    instagram: string
    youtube: string
    twitter: string
    tiktok: string
  }
  seo: {
    defaultTitle: string
    titleTemplate: string
    defaultDescription: string
    keywords: string[]
    ogImage: string
    twitterHandle: string
    allowIndexing: boolean
    googleAnalyticsId: string
  }
  blog: {
    postsPerPage: number
    commentsEnabled: boolean
    requireCommentApproval: boolean
  }
  updatedAt?: string
}

export interface ApiSuccess<T> {
  success: true
  data: T
  message?: string
}

export interface ApiFailure {
  success: false
  error: string
  code?: string
  details?: unknown
}

export type ApiResult<T> = ApiSuccess<T> | ApiFailure

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  pageCount: number
}
