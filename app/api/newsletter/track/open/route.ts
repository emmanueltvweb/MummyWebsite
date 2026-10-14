import { campaigns, subscribers } from "@/lib/cms/store"

// 1×1 transparent GIF
const PIXEL = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64")

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const campaignId = params.get("c")
  const token = params.get("s")

  if (campaignId && token) {
    const subscriber = await subscribers.find((s) => s.token === token)
    const campaign = subscriber ? await campaigns.get(campaignId) : undefined
    if (subscriber && campaign && !campaign.opens.includes(subscriber.id)) {
      await campaigns.update(campaign.id, { opens: [...campaign.opens, subscriber.id] })
    }
  }

  return new Response(PIXEL, {
    headers: { "Content-Type": "image/gif", "Cache-Control": "no-store, max-age=0" },
  })
}
