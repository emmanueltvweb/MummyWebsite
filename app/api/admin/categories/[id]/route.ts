import { audit } from "@/lib/server/audit"
import { ApiError, notFound, parseBody, route } from "@/lib/server/api"
import { slugify } from "@/lib/cms/html"
import { categoryInput } from "@/lib/cms/schemas"
import { categories, posts } from "@/lib/cms/store"

type Params = { id: string }

export const PUT = route<Params>({ permission: "categories.manage" }, async ({ request, params, user, ip }) => {
  const existing = await categories.get(params.id)
  if (!existing) throw notFound("Category")
  const input = await parseBody(request, categoryInput)
  const slug = input.slug || slugify(input.name)
  if (await categories.find((c) => c.slug === slug && c.id !== existing.id)) {
    throw new ApiError(409, `A category with the slug “${slug}” already exists`, "CONFLICT")
  }
  const updated = await categories.update(existing.id, { ...input, slug })
  await audit(user, "category.update", "category", `Updated category “${updated!.name}”`, { entityId: existing.id, ip })
  return updated
})

export const DELETE = route<Params>({ permission: "categories.manage" }, async ({ params, user, ip }) => {
  const existing = await categories.get(params.id)
  if (!existing) throw notFound("Category")
  await categories.remove(existing.id)
  // Detach from posts rather than deleting them.
  await posts.mutate((items) =>
    items.map((p) =>
      p.categoryIds.includes(existing.id) ? { ...p, categoryIds: p.categoryIds.filter((c) => c !== existing.id) } : p
    )
  )
  await audit(user, "category.delete", "category", `Deleted category “${existing.name}”`, { entityId: existing.id, ip })
  return { deleted: 1 }
})
