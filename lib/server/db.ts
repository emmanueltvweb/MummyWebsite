import "server-only"

import { randomUUID } from "crypto"
import { promises as fs } from "fs"
import path from "path"

/**
 * Minimal JSON-file document store.
 *
 * Mirrors the existing `lib/content/store.ts` approach (content lives in `data/*.json`) but adds:
 *  - per-file write serialisation so concurrent requests can't clobber each other
 *  - atomic writes (write to temp file, then rename)
 *  - a tiny in-memory cache invalidated on write
 *
 * Swap this module for a real database adapter later without touching callers.
 */

const DATA_DIR = path.join(process.cwd(), "data")

const locks = new Map<string, Promise<unknown>>()
/** Parsed file contents keyed by name, invalidated when the file's mtime changes (e.g. edited by hand). */
const cache = new Map<string, { data: unknown; mtimeMs: number }>()

function filePath(name: string) {
  return path.join(DATA_DIR, `${name}.json`)
}

async function readFile<T>(name: string, fallback: T): Promise<T> {
  try {
    const { mtimeMs } = await fs.stat(filePath(name))
    const hit = cache.get(name)
    if (hit && hit.mtimeMs === mtimeMs) return structuredClone(hit.data as T)
    const parsed = JSON.parse(await fs.readFile(filePath(name), "utf-8")) as T
    cache.set(name, { data: parsed, mtimeMs })
    return structuredClone(parsed)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error
    return structuredClone(fallback)
  }
}

async function writeFile<T>(name: string, data: T) {
  await fs.mkdir(DATA_DIR, { recursive: true })
  const target = filePath(name)
  const tmp = `${target}.${process.pid}.${Date.now()}.tmp`
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf-8")
  await fs.rename(tmp, target)
  const { mtimeMs } = await fs.stat(target)
  cache.set(name, { data: structuredClone(data), mtimeMs })
}

/** Run `fn` with exclusive access to the named file. */
async function withLock<R>(name: string, fn: () => Promise<R>): Promise<R> {
  const previous = locks.get(name) ?? Promise.resolve()
  let release!: () => void
  const current = new Promise<void>((resolve) => (release = resolve))
  const chained = previous.then(() => current)
  locks.set(name, chained)
  await previous
  try {
    return await fn()
  } finally {
    release()
    if (locks.get(name) === chained) locks.delete(name)
  }
}

export interface Entity {
  id: string
  createdAt: string
  updatedAt: string
}

export type NewEntity<T extends Entity> = Omit<T, "id" | "createdAt" | "updatedAt"> & { id?: string }

export function createCollection<T extends Entity>(name: string, seed: () => T[] = () => []) {
  async function all(): Promise<T[]> {
    return readFile<T[]>(name, seed())
  }

  return {
    all,

    async get(id: string): Promise<T | undefined> {
      return (await all()).find((item) => item.id === id)
    },

    async find(predicate: (item: T) => boolean): Promise<T | undefined> {
      return (await all()).find(predicate)
    },

    async insert(input: NewEntity<T>): Promise<T> {
      return withLock(name, async () => {
        const items = await all()
        const now = new Date().toISOString()
        const item = { ...input, id: input.id ?? randomUUID(), createdAt: now, updatedAt: now } as T
        items.push(item)
        await writeFile(name, items)
        return item
      })
    },

    async update(id: string, patch: Partial<Omit<T, "id" | "createdAt">>): Promise<T | undefined> {
      return withLock(name, async () => {
        const items = await all()
        const index = items.findIndex((item) => item.id === id)
        if (index === -1) return undefined
        const updated = { ...items[index], ...patch, id, updatedAt: new Date().toISOString() } as T
        items[index] = updated
        await writeFile(name, items)
        return updated
      })
    },

    async remove(ids: string | string[]): Promise<number> {
      const set = new Set(Array.isArray(ids) ? ids : [ids])
      return withLock(name, async () => {
        const items = await all()
        const kept = items.filter((item) => !set.has(item.id))
        if (kept.length !== items.length) await writeFile(name, kept)
        return items.length - kept.length
      })
    },

    /** Replace the whole collection atomically (used for reorder / bulk operations). */
    async mutate(fn: (items: T[]) => T[] | Promise<T[]>): Promise<T[]> {
      return withLock(name, async () => {
        const next = await fn(await all())
        await writeFile(name, next)
        return next
      })
    },
  }
}

export function createDocument<T extends object>(name: string, defaults: () => T) {
  return {
    async get(): Promise<T> {
      const stored = await readFile<Partial<T>>(name, {})
      return { ...defaults(), ...stored }
    },
    async set(patch: Partial<T>): Promise<T> {
      return withLock(name, async () => {
        const current = { ...defaults(), ...(await readFile<Partial<T>>(name, {})) }
        const next = { ...current, ...patch }
        await writeFile(name, next)
        return next
      })
    },
  }
}
