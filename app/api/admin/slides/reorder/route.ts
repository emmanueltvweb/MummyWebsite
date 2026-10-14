import { audit } from "@/lib/server/audit"
import { parseBody, route } from "@/lib/server/api"
import { reorderInput } from "@/lib/cms/schemas"
import { slides } from "@/lib/cms/store"

export const POST = route({ permission: "website.manage" }, async ({ request, user, ip }) => {
  const { ids } = await parseBody(request, reorderInput)
  const position = new Map(ids.map((id, index) => [id, index]))
  const next = await slides.mutate((items) =>
    items
      .map((s) => ({ ...s, order: position.get(s.id) ?? ids.length + s.order }))
      .sort((a, b) => a.order - b.order)
      .map((s, index) => ({ ...s, order: index }))
  )
  await audit(user, "slide.reorder", "slide", "Reordered homepage slides", { ip })
  return next
})
