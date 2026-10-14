import { z } from "zod"

const navLinkSchema = z.object({
  label: z.string().min(1, "Label is required"),
  href: z.string().min(1, "Link is required"),
})

const mediaItemSchema = z.object({
  publicId: z.string().optional(),
  url: z.string().optional(),
  alt: z.string().min(1, "Alt text is required"),
})

/** Description box for a gallery category or subcategory. */
const galleryDescription = z.object({
  title: z.string().trim().max(200).default(""),
  description: z.string().trim().max(5000).default(""),
  readMoreUrl: z
    .string()
    .trim()
    .max(2000)
    .refine((v) => v === "" || /^https?:\/\//i.test(v) || v.startsWith("/"), "Read More links must start with https:// (or a site path)")
    .default(""),
})

export const siteContentSchema = z.object({
  branding: z.object({
    brandName: z.string().min(1),
    brandInitial: z.string().min(1),
  }),
  header: z.object({
    aboutDropdownItems: z.array(navLinkSchema),
    navItems: z.array(navLinkSchema),
  }),
  footer: z.object({
    tagline: z.string().min(1),
    quickLinks: z.array(navLinkSchema),
    email: z.string().email(),
    phone: z.string().min(1),
    address: z.string().min(1),
    socialLinks: z.object({
      facebook: z.string(),
      instagram: z.string(),
      youtube: z.string(),
      email: z.string(),
    }),
    copyright: z.string().min(1),
  }),
  home: z.object({
    hero: z.object({
      title: z.string().min(1),
      phrases: z.array(z.string().min(1)).min(1),
      backgroundVideoUrl: z.string().url(),
      carouselImages: z.array(mediaItemSchema),
      buttons: z.array(
        z.object({
          label: z.string().min(1),
          href: z.string().min(1),
          variant: z.enum(["primary", "secondary"]),
        })
      ),
    }),
    about: z.object({
      title: z.string().min(1),
      highlightText: z.string().min(1),
      content: z.string().min(1),
      learnMoreHref: z.string().min(1),
      carouselImages: z.array(mediaItemSchema),
    }),
    sermon: z.object({
      badge: z.string().min(1),
      title: z.string().min(1),
      date: z.string().min(1),
      /** No longer shown on the website; kept optional so older saved content still validates. */
      duration: z.string().optional(),
      speaker: z.string().min(1),
      summaryParagraphs: z.array(z.string()),
      quote: z.string(),
      keyTopics: z.array(z.string()),
      featuredImageUrl: z.string().url("Add a featured image for the sermon (upload one or paste an image URL)"),
      facebookVideoEmbedUrl: z.string().url(),
      watchNowUrl: z.string().url(),
      watchNowLabel: z.string().trim().max(40).default("Watch Now"),
      downloadAppUrl: z.string().url(),
      downloadAppLabel: z.string().trim().max(40).default("Download App"),
    }),
    newsletter: z.object({
      title: z.string().min(1),
      titleHighlight: z.string().min(1),
      description: z.string().min(1),
    }),
  }),
  contact: z.object({
    title: z.string().min(1),
    titleHighlight: z.string().min(1),
    subtitle: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(1),
    location: z.string().min(1),
  }),
  visit: z.object({
    heroTitle: z.string().min(1),
    heroSubtitle: z.string().min(1),
    gallerySectionTitle: z.string().min(1),
  }),
  gallery: z.object({
    label: z.string().min(1),
    title: z.string().min(1),
    subtitle: z.string().min(1),
    categoryDescriptions: z.record(galleryDescription).default({}),
    categorySubcategories: z.record(z.array(z.string().trim().min(1).max(80))).default({}),
    subcategoryDescriptions: z.record(z.record(galleryDescription)).default({}),
  }),
  updatedAt: z.string(),
  updatedBy: z.string(),
})

export const galleryItemSchema = z.object({
  id: z.coerce.number(),
  title: z.string(),
  image: z.string(),
  type: z.enum(["image", "video"]).default("image"),
  rotation: z.number().optional(),
  scale: z.number().optional(),
  zIndex: z.number().optional(),
  cloudinaryId: z.string().optional(),
  subcategory: z.string().trim().max(80).optional(),
})

export const galleryDataSchema = z.record(z.array(galleryItemSchema))

export function formatZodError(error: z.ZodError): string {
  const issue = error.issues[0]
  if (!issue) return "Validation failed"

  const path = issue.path.filter((part) => part !== "").join(" > ")
  return path ? `${path}: ${issue.message}` : issue.message
}
