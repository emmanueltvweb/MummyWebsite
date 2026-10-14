import { audit } from "@/lib/server/audit"
import { parseBody, route } from "@/lib/server/api"
import { slideInput } from "@/lib/cms/schemas"
import { slides } from "@/lib/cms/store"

export const GET = route({ permission: "website.view" }, async () => (await slides.all()).sort((a, b) => a.order - b.order))

export const POST = route({ permission: "website.manage" }, async ({ request, user, ip }) => {
  const input = await parseBody(request, slideInput)
  const order = (await slides.all()).reduce((max, s) => Math.max(max, s.order), -1) + 1
  const slide = await slides.insert({ ...input, order })
  await audit(user, "slide.create", "slide", `Added slide “${slide.title}”`, { entityId: slide.id, ip })
  return slide
})
