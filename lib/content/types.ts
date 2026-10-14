export interface NavLink {
  label: string
  href: string
}

export interface MediaItem {
  publicId?: string
  url?: string
  alt: string
}

export interface HeroButton {
  label: string
  href: string
  variant: "primary" | "secondary"
}

export interface HeroContent {
  title: string
  phrases: string[]
  backgroundVideoUrl: string
  carouselImages: MediaItem[]
  buttons: HeroButton[]
}

export interface AboutContent {
  title: string
  highlightText: string
  content: string
  learnMoreHref: string
  carouselImages: MediaItem[]
}

export interface SermonContent {
  badge: string
  title: string
  date: string
  /** No longer displayed (removed from the site); may exist in older saved content. */
  duration?: string
  speaker: string
  summaryParagraphs: string[]
  quote: string
  keyTopics: string[]
  featuredImageUrl: string
  facebookVideoEmbedUrl: string
  watchNowUrl: string
  /** Text on the first sermon button (defaults to "Watch Now"). */
  watchNowLabel: string
  downloadAppUrl: string
  /** Text on the second sermon button (defaults to "Download App"). */
  downloadAppLabel: string
}

export interface NewsletterContent {
  title: string
  titleHighlight: string
  description: string
}

export interface ContactContent {
  title: string
  titleHighlight: string
  subtitle: string
  email: string
  phone: string
  location: string
}

export interface VisitContent {
  heroTitle: string
  heroSubtitle: string
  gallerySectionTitle: string
}

export interface FooterContent {
  tagline: string
  quickLinks: NavLink[]
  email: string
  phone: string
  address: string
  socialLinks: {
    facebook: string
    instagram: string
    youtube: string
    email: string
  }
  copyright: string
}

export interface SiteBranding {
  brandName: string
  brandInitial: string
}

/** Text box shown under a gallery category on the Crusade / Outreach page. */
export interface GalleryCategoryDescription {
  title: string
  /** Plain text; blank lines start a new paragraph. */
  description: string
  /** Optional "Read More" link (hidden when empty). */
  readMoreUrl: string
}

export interface GalleryHeaderContent {
  label: string
  title: string
  subtitle: string
  /** Keyed by category name (the same names used in the gallery data). */
  categoryDescriptions: Record<string, GalleryCategoryDescription>
  /** Ordered subcategories per category (e.g. Ghana → ["2024", "2025", "2026"]). */
  categorySubcategories: Record<string, string[]>
  /** Description per subcategory: category → subcategory → text. Falls back to the category's. */
  subcategoryDescriptions: Record<string, Record<string, GalleryCategoryDescription>>
}

export interface GalleryItem {
  id: number
  title: string
  image: string
  type: "image" | "video"
  rotation?: number
  scale?: number
  zIndex?: number
  cloudinaryId?: string
  /** Name of the subcategory within its category (e.g. "2024"); none = shown only under "All". */
  subcategory?: string
}

export type GalleryData = Record<string, GalleryItem[]>

export interface SiteContent {
  branding: SiteBranding
  header: {
    aboutDropdownItems: NavLink[]
    navItems: NavLink[]
  }
  footer: FooterContent
  home: {
    hero: HeroContent
    about: AboutContent
    sermon: SermonContent
    newsletter: NewsletterContent
  }
  contact: ContactContent
  visit: VisitContent
  gallery: GalleryHeaderContent
  updatedAt: string
  updatedBy: string
}

export type ContentSection = keyof Omit<SiteContent, "updatedAt" | "updatedBy">
