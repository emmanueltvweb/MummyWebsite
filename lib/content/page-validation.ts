import { z } from "zod"

import type { PageContentKey } from "./page-types"

const text = (max: number) => z.string().trim().max(max)
const required = (max: number, message: string) => z.string().trim().min(1, message).max(max)
/** A link or image address: absolute URL, site path, or empty. */
const link = z
  .string()
  .trim()
  .max(2000)
  .refine((v) => v === "" || v.startsWith("/") || /^https?:\/\//i.test(v) || v.startsWith("mailto:"), "Use a full link starting with https:// (or a site path like /about)")

const aboutSlide = z.object({
  id: required(100, "Slide id is missing"),
  title: required(200, "Every slide needs a title"),
  subtitle: text(200).default(""),
  html: z.string().max(200_000).default(""),
  imageUrl: link.default(""),
  imageAlt: text(300).default(""),
  imagePosition: z.enum(["left", "right"]).default("right"),
})

const aboutPage = z.object({
  slides: z.array(aboutSlide).min(1, "Add at least one slide").max(50),
  readMoreLabel: text(80).default(""),
  readMoreUrl: link.default(""),
})

const sermonPage = z.object({
  hero: z.object({
    label: text(80).default(""),
    title: required(120, "Add a page title"),
    titleHighlight: text(120).default(""),
    subtitle: text(500).default(""),
  }),
  featured: z.object({
    badge: text(80).default(""),
    title: required(200, "Add a title for the sermon of the week"),
    date: text(80).default(""),
    duration: text(80).optional(),
    speaker: text(120).default(""),
    summaryHtml: z.string().max(100_000).default(""),
    keyTopics: z.array(text(60)).max(20).default([]),
    imageUrl: link.default(""),
    videoEmbedUrl: link.default(""),
    watchNowLabel: text(40).default("Watch Now"),
    watchNowUrl: link.default(""),
    downloadAppLabel: text(40).default("Download App"),
    downloadAppUrl: link.default(""),
  }),
  videos: z.object({
    title: text(120).default(""),
    subtitle: text(300).default(""),
    items: z
      .array(
        z.object({
          id: required(100, "Video id is missing"),
          title: required(200, "Every video needs a title"),
          description: text(1000).default(""),
          thumbnail: link.default(""),
          embedUrl: link.default(""),
        })
      )
      .max(100),
  }),
  audio: z.object({
    tracks: z
      .array(
        z.object({
          id: z.coerce.number().int(),
          title: required(200, "Every audio track needs a title"),
          artist: text(120).default(""),
          category: text(80).default(""),
          duration: text(20).default(""),
          date: text(80).default(""),
          audioUrl: link.refine((v) => v !== "", "Every audio track needs an audio file"),
        })
      )
      .max(200),
  }),
})

const blogPage = z.object({
  label: text(80).default(""),
  title: required(120, "Add a page title"),
  titleHighlight: text(120).default(""),
  subtitle: text(500).default(""),
})

export function pageContentSchema(key: PageContentKey) {
  if (key === "sermon") return sermonPage
  if (key === "blog") return blogPage
  return aboutPage
}
