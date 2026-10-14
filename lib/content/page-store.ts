import "server-only"

import { sanitizeRichText } from "@/lib/cms/html"
import { createDocument } from "@/lib/server/db"

import { getDefaultPageContent } from "./page-defaults"
import type { AboutPageContent, AboutPageKey, PageContentKey, PageContentMap, SermonPageContent } from "./page-types"

// One JSON file per page: data/page-<key>.json
const documents = new Map<PageContentKey, ReturnType<typeof createDocument<object>>>()

function doc<K extends PageContentKey>(key: K) {
  let d = documents.get(key)
  if (!d) {
    d = createDocument<object>(`page-${key}`, () => getDefaultPageContent(key))
    documents.set(key, d)
  }
  return d as unknown as ReturnType<typeof createDocument<PageContentMap[K]>>
}

export async function getPageContent<K extends PageContentKey>(key: K): Promise<PageContentMap[K]> {
  return doc(key).get()
}

export const getAboutPageContent = (key: AboutPageKey) => getPageContent(`about-${key}`) as Promise<AboutPageContent>

/** Saves a page, cleaning any rich text before it is stored. */
export async function savePageContent<K extends PageContentKey>(key: K, content: PageContentMap[K], updatedBy: string) {
  let clean: PageContentMap[K] = content
  if (key === "sermon") {
    const sermon = content as SermonPageContent
    clean = { ...sermon, featured: { ...sermon.featured, summaryHtml: sanitizeRichText(sermon.featured.summaryHtml) } } as PageContentMap[K]
  } else if (key.startsWith("about-")) {
    const about = content as AboutPageContent
    clean = { ...about, slides: about.slides.map((s) => ({ ...s, html: sanitizeRichText(s.html) })) } as PageContentMap[K]
  }
  return doc(key).set({ ...clean, updatedAt: new Date().toISOString(), updatedBy })
}
