import { z } from "zod"

import { audit } from "@/lib/server/audit"
import { toPublicUser } from "@/lib/server/auth"
import { notFound, parseBody, route } from "@/lib/server/api"
import { users } from "@/lib/cms/store"

/** Lets any signed-in user update their own display name. */
export const PATCH = route({}, async ({ request, user, ip }) => {
  const { name } = await parseBody(request, z.object({ name: z.string().trim().min(2, "is required").max(80) }))
  const updated = await users.update(user!.id, { name })
  if (!updated) throw notFound("User")
  await audit(user, "user.profile", "user", `Updated profile name to “${name}”`, { entityId: user!.id, ip })
  return toPublicUser(updated)
})
