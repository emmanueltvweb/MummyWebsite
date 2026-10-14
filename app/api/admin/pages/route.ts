import { audit } from "@/lib/server/audit"
import { parseBody, route } from "@/lib/server/api"
import { sanitizeRichText, uniqueSlug } from "@/lib/cms/html"
import { pageInput } from "@/lib/cms/schemas"
import { pages } from "@/lib/cms/store"

export const GET = route({ permission: "website.view" }, async () => {
  const items = await pages.all()
  return (
    items
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .map(({ content, ...rest }) => rest)
  )
})

export const POST = route({ permission: "website.manage" }, async ({ request, user, ip }) => {
  const input = await parseBody(request, pageInput)
  const slug = uniqueSlug(input.slug || input.title, (await pages.all()).map((p) => p.slug))
  const page = await pages.insert({ ...input, slug, content: sanitizeRichText(input.content), updatedBy: user!.name })
  await audit(user, "page.create", "page", `Created page “${page.title}”`, { entityId: page.id, ip })
  return page
})
