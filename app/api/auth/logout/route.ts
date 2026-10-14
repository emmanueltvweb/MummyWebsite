import { audit } from "@/lib/server/audit"
import { endSession } from "@/lib/server/auth"
import { route } from "@/lib/server/api"

export const POST = route({ auth: false }, async ({ user, ip }) => {
  if (user) await audit(user, "auth.logout", "user", `${user.name} signed out`, { entityId: user.id, ip })
  await endSession()
  return { signedOut: true }
})
