import { rateLimit, clientIp } from "@/lib/server/rate-limit"
import { subscribers } from "@/lib/cms/store"

function page(title: string, message: string, status = 200) {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title></head><body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#f4f6fb;font-family:system-ui,sans-serif;color:#1b2552">
<main style="max-width:420px;margin:16px;padding:32px;background:#fff;border-radius:16px;box-shadow:0 10px 30px rgba(27,37,82,.08);text-align:center">
<h1 style="font-size:22px;margin:0 0 8px">${title}</h1><p style="color:#4b5563;line-height:1.5;margin:0 0 20px">${message}</p>
<a href="/" style="display:inline-block;padding:10px 18px;border-radius:999px;background:#1b2552;color:#fff;text-decoration:none">Back to website</a>
</main></body></html>`
  return new Response(html, { status, headers: { "Content-Type": "text/html; charset=utf-8" } })
}

export async function GET(request: Request) {
  if (!rateLimit(`unsubscribe:${clientIp(request)}`, 20, 60_000).ok) {
    return page("Slow down", "Too many requests. Please try again in a minute.", 429)
  }
  const token = new URL(request.url).searchParams.get("token")
  const subscriber = token ? await subscribers.find((s) => s.token === token) : undefined
  if (!subscriber) return page("Link not recognised", "This unsubscribe link is invalid or has expired.", 404)
  if (subscriber.status !== "unsubscribed") {
    await subscribers.update(subscriber.id, { status: "unsubscribed", unsubscribedAt: new Date().toISOString() })
  }
  return page("You're unsubscribed", "You won't receive any more newsletters from us. You can re-subscribe on our website at any time.")
}
