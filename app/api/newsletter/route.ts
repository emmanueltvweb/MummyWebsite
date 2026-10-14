import { after } from "next/server"

import { emailTemplates, getEmailTransporter } from "@/lib/email-config-resend"
import { notify } from "@/lib/server/audit"
import { parseBody, route } from "@/lib/server/api"
import { logger } from "@/lib/server/logger"
import { newSubscriberToken } from "@/lib/cms/newsletter"
import { subscribeInput } from "@/lib/cms/schemas"
import { subscribers } from "@/lib/cms/store"

export const POST = route(
  { auth: false, rateLimit: { limit: 5, windowMs: 10 * 60_000, key: "newsletter" } },
  async ({ request }) => {
    const { email, name, source } = await parseBody(request, subscribeInput)

    const existing = await subscribers.find((s) => s.email === email)
    if (existing?.status === "subscribed") {
      // Respond identically so the endpoint can't be used to probe who is subscribed.
      return { subscribed: true, message: "Successfully subscribed to newsletter" }
    }

    if (existing) {
      await subscribers.update(existing.id, { status: "subscribed", unsubscribedAt: undefined })
    } else {
      await subscribers.insert({ email, name, status: "subscribed", source: source || "website", token: newSubscriberToken() })
    }

    after(async () => {
      await notify({ type: "subscriber", title: "New subscriber", body: `${email} joined the newsletter.`, href: "/admin/subscribers" })
      const transporter = getEmailTransporter()
      const from = process.env.NEWSLETTER_FROM_EMAIL || "noreply@scoanlegacy.org"
      const welcome = emailTemplates.newsletterWelcome(email)
      const admin = emailTemplates.adminNotification(email)
      try {
        await transporter.sendMail({ from, to: email, ...welcome })
      } catch (error) {
        logger.warn("Welcome email failed", { error })
      }
      try {
        await transporter.sendMail({ from, to: process.env.ADMIN_EMAIL || "admin@scoanlegacy.org", ...admin })
      } catch (error) {
        logger.warn("Admin subscriber notification failed", { error })
      }
    })

    return { subscribed: true, message: "Successfully subscribed to newsletter" }
  }
)

export async function GET() {
  return Response.json({ message: "Newsletter API endpoint - Use POST to subscribe" })
}
