import { after } from "next/server"

import { audit, notify } from "@/lib/server/audit"
import { ApiError, notFound, route } from "@/lib/server/api"
import { logger } from "@/lib/server/logger"
import { sendCampaign, siteUrl } from "@/lib/cms/newsletter"
import { campaigns, subscribers } from "@/lib/cms/store"

export const POST = route<{ id: string }>(
  { permission: "newsletter.send", rateLimit: { limit: 5, windowMs: 60_000, key: "campaign-send" } },
  async ({ request, params, user, ip }) => {
    const campaign = await campaigns.get(params.id)
    if (!campaign) throw notFound("Campaign")
    if (campaign.status !== "draft") throw new ApiError(409, "This campaign has already been sent", "CONFLICT")
    if (!campaign.content.trim()) throw new ApiError(400, "Add some content before sending", "EMPTY_CAMPAIGN")

    const recipients = (await subscribers.all()).filter((s) => s.status === "subscribed").length
    if (!recipients) throw new ApiError(400, "There are no active subscribers to send to", "NO_RECIPIENTS")

    await campaigns.update(campaign.id, { status: "sending", recipients })
    const base = siteUrl(request)

    after(async () => {
      try {
        await sendCampaign(campaign.id, base)
        await notify({
          type: "campaign",
          title: "Campaign sent",
          body: `“${campaign.subject}” was delivered to ${recipients} subscriber(s).`,
          href: "/admin/newsletter",
        })
      } catch (error) {
        logger.error("Campaign send crashed", { campaignId: campaign.id, error })
        await campaigns.update(campaign.id, { status: "failed" })
      }
    })

    await audit(user, "campaign.send", "campaign", `Started sending “${campaign.subject}” to ${recipients} subscriber(s)`, {
      entityId: campaign.id,
      ip,
    })
    return { queued: recipients }
  }
)
