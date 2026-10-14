import { revalidatePath } from "next/cache"

import { audit } from "@/lib/server/audit"
import { notFound, parseBody, route } from "@/lib/server/api"
import { getPageContent, savePageContent } from "@/lib/content/page-store"
import { BUILT_IN_PAGES, isPageContentKey, type PageContentMap } from "@/lib/content/page-types"
import { pageContentSchema } from "@/lib/content/page-validation"

type Params = { key: string }

/** Content of a built-in page (About pages, Sermon, Blog heading). */
export const GET = route<Params>({ permission: "website.view" }, async ({ params }) => {
  if (!isPageContentKey(params.key)) throw notFound("Page")
  return getPageContent(params.key)
})

export const PUT = route<Params>({ permission: "website.manage" }, async ({ request, params, user, ip }) => {
  const key = params.key
  if (!isPageContentKey(key)) throw notFound("Page")
  const input = (await parseBody(request, pageContentSchema(key))) as PageContentMap[typeof key]
  const saved = await savePageContent(key, input, user!.name)
  const page = BUILT_IN_PAGES.find((p) => p.key === key)!
  revalidatePath(page.path)
  await audit(user, "page.update", "page", `Updated the “${page.title}” page`, { entityId: key, ip })
  return saved
})
