import { audit } from "@/lib/server/audit"
import { ApiError, notFound, parseBody, route } from "@/lib/server/api"
import { sanitizeRichText } from "@/lib/cms/html"
import { campaignInput } from "@/lib/cms/schemas"
import { campaigns } from "@/lib/cms/store"

type Params = { id: string }

export const GET = route<Params>({ permission: "newsletter.view" }, async ({ params }) => {
  const campaign = await campaigns.get(params.id)
  if (!campaign) throw notFound("Campaign")
  return campaign
})

export const PUT = route<Params>({ permission: "newsletter.manage" }, async ({ request, params, user, ip }) => {
  const existing = await campaigns.get(params.id)
  if (!existing) throw notFound("Campaign")
  if (existing.status !== "draft") throw new ApiError(409, "Sent campaigns can't be edited", "CONFLICT")
  const input = await parseBody(request, campaignInput)
  const updated = await campaigns.update(existing.id, { ...input, content: sanitizeRichText(input.content) })
  await audit(user, "campaign.update", "campaign", `Updated campaign “${updated!.subject}”`, { entityId: existing.id, ip })
  return updated
})

export const DELETE = route<Params>({ permission: "newsletter.manage" }, async ({ params, user, ip }) => {
  const existing = await campaigns.get(params.id)
  if (!existing) throw notFound("Campaign")
  if (existing.status === "sending") throw new ApiError(409, "This campaign is currently sending", "CONFLICT")
  await campaigns.remove(existing.id)
  await audit(user, "campaign.delete", "campaign", `Deleted campaign “${existing.subject}”`, { entityId: existing.id, ip })
  return { deleted: 1 }
})
