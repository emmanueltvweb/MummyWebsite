import { audit } from "@/lib/server/audit"
import { ApiError, parseBody, route } from "@/lib/server/api"
import { slugify } from "@/lib/cms/html"
import { categoryInput } from "@/lib/cms/schemas"
import { categories, posts } from "@/lib/cms/store"

export const GET = route({ permission: ["categories.view", "blog.view"] }, async () => {
  const [items, allPosts] = await Promise.all([categories.all(), posts.all()])
  return items
    .map((category) => ({
      ...category,
      postCount: allPosts.filter((p) => p.categoryIds.includes(category.id)).length,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
})

export const POST = route({ permission: "categories.manage" }, async ({ request, user, ip }) => {
  const input = await parseBody(request, categoryInput)
  const slug = input.slug || slugify(input.name)
  if (await categories.find((c) => c.slug === slug)) {
    throw new ApiError(409, `A category with the slug “${slug}” already exists`, "CONFLICT")
  }
  const category = await categories.insert({ ...input, slug })
  await audit(user, "category.create", "category", `Created category “${category.name}”`, { entityId: category.id, ip })
  return { ...category, postCount: 0 }
})
