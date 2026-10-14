import { NextResponse } from "next/server"

import { campaigns, subscribers } from "@/lib/cms/store"

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const campaignId = params.get("c")
  const token = params.get("s")
  const target = params.get("u")
  const home = new URL("/", request.url)

  const campaign = campaignId ? await campaigns.get(campaignId) : undefined
  // Only redirect to URLs that actually appear in the campaign – prevents open-redirect abuse.
  if (!campaign || !target || !campaign.links.includes(target)) return NextResponse.redirect(home)

  const subscriber = token ? await subscribers.find((s) => s.token === token) : undefined
  if (subscriber) {
    const update: { clicks?: string[]; opens?: string[] } = {}
    if (!campaign.clicks.includes(subscriber.id)) update.clicks = [...campaign.clicks, subscriber.id]
    // A click implies an open even when images were blocked.
    if (!campaign.opens.includes(subscriber.id)) update.opens = [...campaign.opens, subscriber.id]
    if (update.clicks || update.opens) await campaigns.update(campaign.id, update)
  }

  return NextResponse.redirect(target)
}
