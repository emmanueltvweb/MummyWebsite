import { audit } from "@/lib/server/audit"
import { parseBody, route } from "@/lib/server/api"
import { sanitizeRichText } from "@/lib/cms/html"
import { campaignInput } from "@/lib/cms/schemas"
import { campaigns, subscribers } from "@/lib/cms/store"

export const GET = route({ permission: "newsletter.view" }, async () => {
  const [items, subs] = await Promise.all([campaigns.all(), subscribers.all()])
  return {
    items: items
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .map(({ content, opens, clicks, links, ...c }) => ({ ...c, openCount: opens.length, clickCount: clicks.length })),
    activeSubscribers: subs.filter((s) => s.status === "subscribed").length,
  }
})

export const POST = route({ permission: "newsletter.manage" }, async ({ request, user, ip }) => {
  const input = await parseBody(request, campaignInput)
  const campaign = await campaigns.insert({
    ...input,
    content: sanitizeRichText(input.content),
    status: "draft",
    sentAt: null,
    recipients: 0,
    delivered: 0,
    failed: 0,
    opens: [],
    clicks: [],
    links: [],
    createdBy: user!.name,
  })
  await audit(user, "campaign.create", "campaign", `Created campaign “${campaign.subject}”`, { entityId: campaign.id, ip })
  return campaign
})
