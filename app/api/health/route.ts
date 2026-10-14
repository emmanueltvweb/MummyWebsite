import { isCloudinaryConfigured } from "@/lib/cloudinary/config"

/** Liveness/readiness probe for uptime monitoring. */
export async function GET() {
  return Response.json(
    {
      status: "ok",
      time: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      memoryMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
      checks: {
        cloudinary: isCloudinaryConfigured() ? "configured" : "missing",
        email: process.env.RESEND_API_KEY ? "configured" : "mock",
        sessionSecret: process.env.ADMIN_SESSION_SECRET ? "configured" : "dev-fallback",
      },
    },
    { headers: { "Cache-Control": "no-store" } }
  )
}
