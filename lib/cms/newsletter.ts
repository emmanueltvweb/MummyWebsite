import "server-only"

import { randomBytes } from "crypto"

import { getEmailTransporter } from "@/lib/email-config-resend"
import { logger } from "@/lib/server/logger"
import { sanitizeRichText, stripHtml } from "./html"
import { campaigns, settings, subscribers } from "./store"
import type { Campaign, Subscriber } from "./types"

export const newSubscriberToken = () => randomBytes(18).toString("base64url")

export function siteUrl(request?: Request) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL
  if (configured) return configured.replace(/\/$/, "")
  if (request) return new URL(request.url).origin
  return "http://localhost:3000"
}

export function extractLinks(html: string): string[] {
  const links = new Set<string>()
  for (const match of html.matchAll(/href="(https?:\/\/[^"]+)"/g)) links.add(match[1].replace(/&amp;/g, "&"))
  return [...links]
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]!)
}

function renderEmail(campaign: Campaign, subscriber: Subscriber, base: string, siteName: string) {
  const q = `c=${encodeURIComponent(campaign.id)}&s=${encodeURIComponent(subscriber.token)}`
  const body = sanitizeRichText(campaign.content).replace(/href="(https?:\/\/[^"]+)"/g, (_m, url: string) => {
    const tracked = `${base}/api/newsletter/track/click?${q}&u=${encodeURIComponent(url.replace(/&amp;/g, "&"))}`
    return `href="${tracked.replace(/&/g, "&amp;")}"`
  })
  const unsubscribe = `${base}/api/newsletter/unsubscribe?token=${encodeURIComponent(subscriber.token)}`

  const html = `<!doctype html><html><body style="margin:0;background:#f4f6fb;font-family:Arial,Helvetica,sans-serif;color:#1f2937">
<span style="display:none;max-height:0;overflow:hidden">${escapeHtml(campaign.previewText)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden">
<tr><td style="background:#1b2552;padding:24px 32px;color:#f5c04a;font-size:20px;font-weight:bold">${escapeHtml(siteName)}</td></tr>
<tr><td style="padding:32px;font-size:16px;line-height:1.6">${body}</td></tr>
<tr><td style="padding:20px 32px;background:#f9fafb;font-size:12px;color:#6b7280;text-align:center">
You're receiving this because you subscribed to ${escapeHtml(siteName)}.<br>
<a href="${unsubscribe}" style="color:#6b7280">Unsubscribe</a></td></tr>
</table></td></tr></table>
<img src="${base}/api/newsletter/track/open?${q.replace(/&/g, "&amp;")}" width="1" height="1" alt="" style="display:block;border:0">
</body></html>`

  return { html, text: `${stripHtml(campaign.content)}\n\nUnsubscribe: ${unsubscribe}` }
}

/** Sends a campaign to every active subscriber. Runs in the background after the API responds. */
export async function sendCampaign(campaignId: string, base: string) {
  const campaign = await campaigns.get(campaignId)
  if (!campaign) return
  const recipients = (await subscribers.all()).filter((s) => s.status === "subscribed")
  const { siteName } = await settings.get()
  const transporter = getEmailTransporter()
  const from = process.env.NEWSLETTER_FROM_EMAIL || "noreply@scoanlegacy.org"

  await campaigns.update(campaign.id, {
    status: "sending",
    recipients: recipients.length,
    delivered: 0,
    failed: 0,
    links: extractLinks(campaign.content),
  })

  let delivered = 0
  let failed = 0
  for (const subscriber of recipients) {
    try {
      const { html, text } = renderEmail(campaign, subscriber, base, siteName)
      await transporter.sendMail({ from, to: subscriber.email, subject: campaign.subject, html, text })
      delivered++
    } catch (error) {
      failed++
      logger.warn("Newsletter delivery failed", { campaignId, subscriber: subscriber.id, error })
    }
    // Persist progress every 25 messages so the dashboard shows live numbers.
    if ((delivered + failed) % 25 === 0) await campaigns.update(campaign.id, { delivered, failed })
  }

  await campaigns.update(campaign.id, {
    status: recipients.length > 0 && delivered === 0 ? "failed" : "sent",
    sentAt: new Date().toISOString(),
    delivered,
    failed,
  })
  logger.info("Newsletter campaign sent", { campaignId, delivered, failed })
}
