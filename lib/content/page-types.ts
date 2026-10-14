/** Content models for the website's built-in pages that are edited in Admin → Pages. */

export const ABOUT_PAGE_KEYS = ["pst-evelyn-joshua", "tb-joshua", "scoan", "emmanuel-tv"] as const
export type AboutPageKey = (typeof ABOUT_PAGE_KEYS)[number]

export interface AboutSlide {
  id: string
  title: string
  subtitle: string
  /** Rich text (sanitised HTML). */
  html: string
  imageUrl: string
  imageAlt: string
  imagePosition: "left" | "right"
}

export interface AboutPageContent {
  slides: AboutSlide[]
  /** Optional button under the slideshow (hidden when the label or link is empty). */
  readMoreLabel: string
  readMoreUrl: string
  updatedAt?: string
  updatedBy?: string
}

export interface SermonVideo {
  id: string
  title: string
  description: string
  thumbnail: string
  /** Facebook / YouTube embed URL. */
  embedUrl: string
}

export interface SermonAudioTrack {
  id: number
  title: string
  artist: string
  category: string
  duration: string
  date: string
  /** Direct audio file URL (e.g. an MP3 on Cloudinary). */
  audioUrl: string
}

export interface SermonPageContent {
  hero: { label: string; title: string; titleHighlight: string; subtitle: string }
  featured: {
    badge: string
    title: string
    date: string
    /** No longer displayed (removed from the site); may exist in older saved content. */
    duration?: string
    speaker: string
    summaryHtml: string
    keyTopics: string[]
    imageUrl: string
    videoEmbedUrl: string
    watchNowLabel: string
    watchNowUrl: string
    downloadAppLabel: string
    downloadAppUrl: string
  }
  videos: { title: string; subtitle: string; items: SermonVideo[] }
  audio: { tracks: SermonAudioTrack[] }
  updatedAt?: string
  updatedBy?: string
}

export interface BlogPageContent {
  label: string
  title: string
  titleHighlight: string
  subtitle: string
  updatedAt?: string
  updatedBy?: string
}

/** Pages whose content is stored per page (the rest live in Website Content). */
export type PageContentKey = `about-${AboutPageKey}` | "sermon" | "blog"

export interface PageContentMap {
  "about-pst-evelyn-joshua": AboutPageContent
  "about-tb-joshua": AboutPageContent
  "about-scoan": AboutPageContent
  "about-emmanuel-tv": AboutPageContent
  sermon: SermonPageContent
  blog: BlogPageContent
}

export type BuiltInPageKey = PageContentKey | "home" | "gallery" | "visit" | "contact"

export interface BuiltInPage {
  key: BuiltInPageKey
  title: string
  path: string
  description: string
}

export const BUILT_IN_PAGES: BuiltInPage[] = [
  { key: "home", title: "Home", path: "/", description: "Hero banner, about, latest sermon and newsletter sections" },
  { key: "about-pst-evelyn-joshua", title: "About Pastor Evelyn Joshua", path: "/about/pst-evelyn-joshua", description: "Biography slideshow" },
  { key: "about-tb-joshua", title: "About TB Joshua", path: "/about/tb-joshua", description: "Biography slideshow" },
  { key: "about-scoan", title: "About SCOAN", path: "/about/scoan", description: "Church history slideshow" },
  { key: "about-emmanuel-tv", title: "About Emmanuel TV", path: "/about/emmanuel-tv", description: "About slideshow" },
  { key: "sermon", title: "Sermon", path: "/Sermon", description: "Heading, sermon of the week, videos and audio playlist" },
  { key: "gallery", title: "Crusade / Outreach (Gallery)", path: "/gallery", description: "Page heading and gallery images" },
  { key: "visit", title: "Visit", path: "/visit", description: "Page heading and gallery title" },
  { key: "contact", title: "Contact", path: "/contact", description: "Heading and contact details" },
  { key: "blog", title: "Blog", path: "/blog", description: "Page heading (posts are managed in Blog Posts)" },
]

export const isBuiltInPageKey = (key: string): key is BuiltInPageKey => BUILT_IN_PAGES.some((p) => p.key === key)
export const isPageContentKey = (key: string): key is PageContentKey =>
  key === "sermon" || key === "blog" || ABOUT_PAGE_KEYS.some((k) => key === `about-${k}`)
