import { route } from "@/lib/server/api"
import { users } from "@/lib/cms/store"

/** Minimal list of people who can be credited as a post author. */
export const GET = route({ permission: "blog.view" }, async () =>
  (await users.all())
    .filter((u) => u.status === "active")
    .map((u) => ({ id: u.id, name: u.name, role: u.role }))
    .sort((a, b) => a.name.localeCompare(b.name))
)
