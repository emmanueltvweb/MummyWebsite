import { audit } from "@/lib/server/audit"
import { notFound, parseBody, route } from "@/lib/server/api"
import { sanitizeRichText, uniqueSlug } from "@/lib/cms/html"
import { pageInput } from "@/lib/cms/schemas"
import { pages } from "@/lib/cms/store"

type Params = { pageId: string }

export const GET = route<Params>({ permission: "website.view" }, async ({ params }) => {
  const page = await pages.get(params.pageId)
  if (!page) throw notFound("Page")
  return page
})

export const PUT = route<Params>({ permission: "website.manage" }, async ({ request, params, user, ip }) => {
  const existing = await pages.get(params.pageId)
  if (!existing) throw notFound("Page")
  const input = await parseBody(request, pageInput)
  const others = (await pages.all()).filter((p) => p.id !== existing.id).map((p) => p.slug)
  const updated = await pages.update(existing.id, {
    ...input,
    slug: uniqueSlug(input.slug || existing.slug, others),
    content: sanitizeRichText(input.content),
    updatedBy: user!.name,
  })
  await audit(user, "page.update", "page", `Updated page “${updated!.title}”`, { entityId: existing.id, ip })
  return updated
})

export const DELETE = route<Params>({ permission: "website.manage" }, async ({ params, user, ip }) => {
  const existing = await pages.get(params.pageId)
  if (!existing) throw notFound("Page")
  await pages.remove(existing.id)
  await audit(user, "page.delete", "page", `Deleted page “${existing.title}”`, { entityId: existing.id, ip })
  return { deleted: 1 }
})
