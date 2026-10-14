import { revalidatePath } from "next/cache"

import { audit } from "@/lib/server/audit"
import { parseBody, route } from "@/lib/server/api"
import { settingsInput } from "@/lib/cms/schemas"
import { settings } from "@/lib/cms/store"

export const GET = route({ permission: "settings.view" }, async () => settings.get())

export const PUT = route({ permission: "settings.manage" }, async ({ request, user, ip }) => {
  const input = await parseBody(request, settingsInput)
  const saved = await settings.set({ ...input, updatedAt: new Date().toISOString() })
  revalidatePath("/", "layout")
  await audit(user, "settings.update", "settings", "Updated site & SEO settings", { ip })
  return saved
})
