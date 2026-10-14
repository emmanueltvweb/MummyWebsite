import { z } from "zod"

import { audit } from "@/lib/server/audit"
import { notFound, parseBody, route } from "@/lib/server/api"
import { slideInput } from "@/lib/cms/schemas"
import { slides } from "@/lib/cms/store"

type Params = { id: string }

export const PUT = route<Params>({ permission: "website.manage" }, async ({ request, params, user, ip }) => {
  const existing = await slides.get(params.id)
  if (!existing) throw notFound("Slide")
  const input = await parseBody(request, slideInput)
  const updated = await slides.update(existing.id, input)
  await audit(user, "slide.update", "slide", `Updated slide “${updated!.title}”`, { entityId: existing.id, ip })
  return updated
})

/** Lightweight toggle used by the enable/disable switch. */
export const PATCH = route<Params>({ permission: "website.manage" }, async ({ request, params, user, ip }) => {
  const existing = await slides.get(params.id)
  if (!existing) throw notFound("Slide")
  const { enabled } = await parseBody(request, z.object({ enabled: z.boolean() }))
  const updated = await slides.update(existing.id, { enabled })
  await audit(user, "slide.toggle", "slide", `${enabled ? "Enabled" : "Disabled"} slide “${existing.title}”`, {
    entityId: existing.id,
    ip,
  })
  return updated
})

export const DELETE = route<Params>({ permission: "website.manage" }, async ({ params, user, ip }) => {
  const existing = await slides.get(params.id)
  if (!existing) throw notFound("Slide")
  await slides.remove(existing.id)
  await audit(user, "slide.delete", "slide", `Deleted slide “${existing.title}”`, { entityId: existing.id, ip })
  return { deleted: 1 }
})
