import { randomUUID } from "crypto"
import { z } from "zod"

import { audit } from "@/lib/server/audit"
import { parseBody, route } from "@/lib/server/api"
import { newSubscriberToken } from "@/lib/cms/newsletter"
import { subscribers } from "@/lib/cms/store"
import type { Subscriber } from "@/lib/cms/types"

const MAX_ROWS = 5000

const importInput = z.object({
  rows: z
    .array(
      z.object({
        email: z.string().trim().max(200),
        name: z.string().trim().max(80).optional(),
      })
    )
    .min(1, "Add at least one email address")
    .max(MAX_ROWS, `You can import up to ${MAX_ROWS} contacts at a time`),
  source: z.string().trim().max(40).optional(),
  consent: z.literal(true, { errorMap: () => ({ message: "Please confirm these people agreed to receive your emails" }) }),
})

const emailSchema = z.string().email()

/**
 * Bulk-adds subscribers. New addresses are subscribed; existing subscribers are left as they are;
 * people who previously unsubscribed are skipped (their opt-out is respected). No emails are sent.
 */
export const POST = route(
  { permission: "subscribers.manage", rateLimit: { limit: 10, windowMs: 10 * 60_000, key: "subscriber-import" } },
  async ({ request, user, ip }) => {
    const { rows, source } = await parseBody(request, importInput)
    const label = source || "import"

    const result = { added: 0, alreadySubscribed: 0, unsubscribed: 0, duplicates: 0, invalid: [] as string[] }
    const now = new Date().toISOString()

    await subscribers.mutate((existing) => {
      const byEmail = new Map(existing.map((s) => [s.email.toLowerCase(), s]))
      const seen = new Set<string>()
      const additions: Subscriber[] = []

      for (const row of rows) {
        const email = row.email.toLowerCase()
        if (!emailSchema.safeParse(email).success) {
          if (result.invalid.length < 50) result.invalid.push(row.email)
          else result.invalid.push("")
          continue
        }
        if (seen.has(email)) {
          result.duplicates++
          continue
        }
        seen.add(email)
        const current = byEmail.get(email)
        if (current?.status === "subscribed") {
          result.alreadySubscribed++
          continue
        }
        if (current?.status === "unsubscribed") {
          result.unsubscribed++
          continue
        }
        additions.push({
          id: randomUUID(),
          email,
          name: row.name || undefined,
          status: "subscribed",
          source: label,
          token: newSubscriberToken(),
          createdAt: now,
          updatedAt: now,
        })
      }
      result.added = additions.length
      return [...existing, ...additions]
    })

    const invalidCount = result.invalid.length
    await audit(user, "subscriber.import", "subscriber", `Imported ${result.added} subscriber(s)${invalidCount ? `, ${invalidCount} invalid` : ""}`, { ip })
    return { ...result, invalid: result.invalid.filter(Boolean), invalidCount }
  }
)
