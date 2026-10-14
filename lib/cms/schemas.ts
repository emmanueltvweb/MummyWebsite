import { z } from "zod"

import { isPermission } from "./rbac"

const trimmed = (max: number) => z.string().trim().max(max)

/** Media fields may only hold Cloudinary delivery URLs (or be empty). */
export const cloudinaryUrl = z
  .string()
  .trim()
  .max(1000)
  .refine((value) => value === "" || /^https:\/\/res\.cloudinary\.com\/[\w-]+\/(image|video|raw)\/upload\//.test(value), {
    message: "must be an image uploaded to Cloudinary",
  })

const linkUrl = z
  .string()
  .trim()
  .max(500)
  .refine((value) => value === "" || value.startsWith("/") || value.startsWith("#") || /^https?:\/\//.test(value), {
    message: "must be a relative path (/about) or a full URL (https://…)",
  })

const slug = z
  .string()
  .trim()
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "may only contain lowercase letters, numbers and dashes")

const isoDate = z.string().datetime({ offset: true })

export const postStatus = z.enum(["draft", "scheduled", "published", "archived"])

export const postInput = z
  .object({
    title: trimmed(200).min(1, "is required"),
    slug: slug.or(z.literal("")).optional(),
    excerpt: trimmed(500).default(""),
    content: z.string().max(500_000).default(""),
    featuredImage: cloudinaryUrl.default(""),
    featuredImageAlt: trimmed(250).default(""),
    categoryIds: z.array(z.string().max(64)).max(20).default([]),
    tags: z.array(trimmed(40).min(1)).max(30).default([]),
    authorId: z.string().max(64).optional(),
    status: postStatus.default("draft"),
    scheduledAt: isoDate.nullable().optional(),
    seoTitle: trimmed(120).default(""),
    seoDescription: trimmed(320).default(""),
    metaKeywords: z.array(trimmed(40).min(1)).max(30).default([]),
  })
  .superRefine((value, ctx) => {
    if (value.status === "scheduled") {
      if (!value.scheduledAt) {
        ctx.addIssue({ code: "custom", path: ["scheduledAt"], message: "is required for scheduled posts" })
      } else if (new Date(value.scheduledAt).getTime() <= Date.now()) {
        ctx.addIssue({ code: "custom", path: ["scheduledAt"], message: "must be in the future" })
      }
    }
  })

export type PostInput = z.infer<typeof postInput>

export const bulkPostAction = z.object({
  ids: z.array(z.string()).min(1).max(500),
  action: z.enum(["delete", "publish", "unpublish", "draft", "archive"]),
})

export const categoryInput = z.object({
  name: trimmed(80).min(1, "is required"),
  slug: slug.or(z.literal("")).optional(),
  description: trimmed(500).default(""),
  color: z.string().regex(/^#[0-9a-f]{6}$/i, "must be a hex colour").default("#1e2a5a"),
})

export const commentInput = z.object({
  authorName: trimmed(80).min(2, "is required"),
  authorEmail: z.string().trim().toLowerCase().email().max(200),
  content: trimmed(3000).min(3, "is too short"),
  website: z.string().max(500).optional(), // honeypot – real visitors never fill this in
})

export const commentModeration = z.object({
  ids: z.array(z.string()).min(1).max(500),
  action: z.enum(["approve", "pending", "spam", "delete"]),
})

export const pageInput = z.object({
  title: trimmed(200).min(1, "is required"),
  slug: slug.or(z.literal("")).optional(),
  content: z.string().max(500_000).default(""),
  featuredImage: cloudinaryUrl.default(""),
  status: z.enum(["draft", "published"]).default("draft"),
  seoTitle: trimmed(120).default(""),
  seoDescription: trimmed(320).default(""),
})

export const slideInput = z.object({
  title: trimmed(160).min(1, "is required"),
  subtitle: trimmed(200).default(""),
  description: trimmed(600).default(""),
  buttonText: trimmed(40).default(""),
  buttonUrl: linkUrl.default(""),
  backgroundImage: cloudinaryUrl.refine((v) => v !== "", { message: "is required" }),
  enabled: z.boolean().default(true),
})

export const reorderInput = z.object({ ids: z.array(z.string()).min(1).max(200) })

export const subscribeInput = z.object({
  email: z.string().trim().toLowerCase().email("Please enter a valid email address").max(200),
  name: trimmed(80).optional(),
  source: trimmed(40).optional(),
})

export const campaignInput = z.object({
  subject: trimmed(200).min(1, "is required"),
  previewText: trimmed(200).default(""),
  content: z.string().max(500_000).default(""),
})

/** A role id (system roles like "editor" or a custom role's id). Existence is checked in the route. */
export const roleId = z.string().trim().min(1).max(64).regex(/^[a-z0-9_]+$/, "is not a valid role")

const password = z
  .string()
  .min(10, "must be at least 10 characters")
  .max(200)
  .regex(/[a-z]/i, "must contain a letter")
  .regex(/\d/, "must contain a number")

export const userCreateInput = z.object({
  name: trimmed(80).min(2, "is required"),
  email: z.string().trim().toLowerCase().email().max(200),
  role: roleId,
  status: z.enum(["active", "suspended"]).default("active"),
  password,
})

export const userUpdateInput = userCreateInput.partial().extend({ password: password.optional().or(z.literal("")) })

export const userStatusInput = z.object({
  status: z.enum(["active", "suspended"]),
  reason: trimmed(200).optional(),
})

const permissionList = z.array(z.string().refine(isPermission, { message: "is not a known permission" })).max(100)

export const roleInput = z.object({
  name: trimmed(60).min(2, "is required"),
  description: trimmed(240).default(""),
  permissions: permissionList.default([]),
})

export const passwordChangeInput = z.object({
  currentPassword: z.string().min(1, "is required"),
  newPassword: password,
})

export const loginInput = z.object({
  email: z.string().trim().toLowerCase().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required").max(200),
  remember: z.boolean().default(false),
})

export const settingsInput = z.object({
  siteName: trimmed(120).min(1),
  tagline: trimmed(300),
  logoUrl: cloudinaryUrl,
  faviconUrl: cloudinaryUrl,
  contactEmail: z.string().trim().email().max(200).or(z.literal("")),
  contactPhone: trimmed(60),
  address: trimmed(300),
  social: z.object({
    facebook: linkUrl,
    instagram: linkUrl,
    youtube: linkUrl,
    twitter: linkUrl,
    tiktok: linkUrl,
  }),
  seo: z.object({
    defaultTitle: trimmed(120).min(1),
    titleTemplate: trimmed(120).refine((v) => v === "" || v.includes("%s"), { message: "must contain %s" }),
    defaultDescription: trimmed(320),
    keywords: z.array(trimmed(40).min(1)).max(40),
    ogImage: cloudinaryUrl,
    twitterHandle: trimmed(40),
    allowIndexing: z.boolean(),
    googleAnalyticsId: z.string().trim().max(40).regex(/^(G-[A-Z0-9]+|UA-\d+-\d+)?$/i, "must look like G-XXXXXXX"),
  }),
  blog: z.object({
    postsPerPage: z.number().int().min(3).max(48),
    commentsEnabled: z.boolean(),
    requireCommentApproval: z.boolean(),
  }),
})
