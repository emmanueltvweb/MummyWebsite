"use client"

import { mutate, type SWRConfiguration } from "swr"

import { fetcher } from "./api-client"

/*
  Admin state management.

  Every admin screen reads server data through SWR, which acts as one shared, in-memory store
  for the whole dashboard (it lives in the admin shell, so it survives moving between pages).

  - Screens render instantly from the store and refresh silently in the background.
  - After a save, write the server's response straight into the store (`setCached`) and mark
    related data as stale (`refresh`). The page updates in place — nothing is reloaded or
    blanked out.
  - Only an explicit "Reload" fetches everything again on purpose.
*/

export const adminSWRConfig: SWRConfiguration = {
  fetcher,
  // Keep showing the current data while new data loads (filters, paging, refreshes).
  keepPreviousData: true,
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  // Show cached data immediately when returning to a page, then refresh quietly.
  revalidateIfStale: true,
  dedupingInterval: 4000,
  errorRetryCount: 2,
}

type KeyMatcher = string | RegExp | ((key: string) => boolean)

const toPredicate = (matchers: KeyMatcher[]) => (key: unknown) => {
  if (typeof key !== "string") return false
  return matchers.some((m) => (typeof m === "string" ? key.startsWith(m) : m instanceof RegExp ? m.test(key) : m(key)))
}

/** Puts fresh data in the store without refetching (e.g. the record the server returned after a save). */
export function setCached<T>(key: string, data: T) {
  return mutate(key, data, { revalidate: false })
}

/** Updates cached data in place (optimistic UI). */
export function updateCached<T>(key: string, update: (current: T | undefined) => T | undefined) {
  return mutate<T>(key, update, { revalidate: false })
}

/**
 * Quietly refreshes every cached request whose key starts with / matches one of `matchers`.
 * Screens keep showing their current data while this happens.
 */
export function refresh(...matchers: KeyMatcher[]) {
  // Called with the key filter only: passing `undefined` as data would wipe the cache.
  return mutate(toPredicate(matchers))
}
