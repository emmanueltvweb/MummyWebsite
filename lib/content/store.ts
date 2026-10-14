import { promises as fs } from "fs"
import path from "path"

import { defaultSiteContent } from "./defaults"
import { defaultGalleryData } from "./gallery-defaults"
import type { GalleryData, SiteContent } from "./types"

const DATA_DIR = path.join(process.cwd(), "data")
const SITE_CONTENT_FILE = path.join(DATA_DIR, "site-content.json")
const GALLERY_CONTENT_FILE = path.join(DATA_DIR, "gallery-content.json")

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true })
}

function deepMerge<T extends Record<string, unknown>>(defaults: T, overrides: Partial<T>): T {
  const result = { ...defaults }

  for (const key of Object.keys(overrides) as (keyof T)[]) {
    const overrideValue = overrides[key]
    const defaultValue = defaults[key]

    if (
      overrideValue &&
      typeof overrideValue === "object" &&
      !Array.isArray(overrideValue) &&
      defaultValue &&
      typeof defaultValue === "object" &&
      !Array.isArray(defaultValue)
    ) {
      result[key] = deepMerge(
        defaultValue as Record<string, unknown>,
        overrideValue as Record<string, unknown>
      ) as T[keyof T]
    } else if (overrideValue !== undefined) {
      result[key] = overrideValue as T[keyof T]
    }
  }

  return result
}

export async function getSiteContent(): Promise<SiteContent> {
  try {
    const raw = await fs.readFile(SITE_CONTENT_FILE, "utf-8")
    const parsed = JSON.parse(raw) as Partial<SiteContent>
    return deepMerge(defaultSiteContent, parsed)
  } catch {
    return defaultSiteContent
  }
}

export async function saveSiteContent(
  content: SiteContent,
  updatedBy = "Admin"
): Promise<SiteContent> {
  await ensureDataDir()

  const payload: SiteContent = {
    ...content,
    updatedAt: new Date().toISOString(),
    updatedBy,
  }

  await fs.writeFile(SITE_CONTENT_FILE, JSON.stringify(payload, null, 2), "utf-8")
  return payload
}

export async function getGalleryContent(): Promise<GalleryData> {
  try {
    const raw = await fs.readFile(GALLERY_CONTENT_FILE, "utf-8")
    return JSON.parse(raw) as GalleryData
  } catch {
    return defaultGalleryData
  }
}

export async function saveGalleryContent(data: GalleryData): Promise<GalleryData> {
  await ensureDataDir()
  await fs.writeFile(GALLERY_CONTENT_FILE, JSON.stringify(data, null, 2), "utf-8")
  return data
}

export { defaultSiteContent, defaultGalleryData }
