/**
 * Role-based access control catalog (safe to import on both server and client).
 * Permissions are `<module>.<action>` strings; roles hold a list of them.
 */

export const PERMISSION_MODULES = [
  {
    key: "dashboard",
    label: "Dashboard",
    description: "The dashboard home and its summary cards.",
    actions: [{ key: "view", label: "View dashboard" }],
  },
  {
    key: "analytics",
    label: "Analytics",
    description: "Growth charts, trends and engagement statistics.",
    actions: [{ key: "view", label: "View analytics" }],
  },
  {
    key: "blog",
    label: "Blog",
    description: "Blog posts and the publishing workflow.",
    actions: [
      { key: "view", label: "View posts" },
      { key: "create", label: "Write & edit own posts" },
      { key: "edit_any", label: "Edit everyone's posts" },
      { key: "publish", label: "Publish, schedule & archive" },
      { key: "delete", label: "Delete posts" },
    ],
  },
  {
    key: "categories",
    label: "Categories",
    description: "Blog categories.",
    actions: [
      { key: "view", label: "View categories" },
      { key: "manage", label: "Create, edit & delete" },
    ],
  },
  {
    key: "media",
    label: "Media",
    description: "The Cloudinary media library.",
    actions: [
      { key: "view", label: "Browse media" },
      { key: "upload", label: "Upload & replace" },
      { key: "delete", label: "Delete files" },
    ],
  },
  {
    key: "comments",
    label: "Comments",
    description: "Reader comments on blog posts.",
    actions: [
      { key: "view", label: "View comments" },
      { key: "moderate", label: "Approve, spam & delete" },
    ],
  },
  {
    key: "subscribers",
    label: "Email Subscribers",
    description: "Newsletter subscriber list.",
    actions: [
      { key: "view", label: "View & export" },
      { key: "manage", label: "Remove subscribers" },
    ],
  },
  {
    key: "newsletter",
    label: "Newsletter",
    description: "Email campaigns.",
    actions: [
      { key: "view", label: "View campaigns & reports" },
      { key: "manage", label: "Create & edit drafts" },
      { key: "send", label: "Send campaigns" },
    ],
  },
  {
    key: "website",
    label: "Pages & Website",
    description: "Custom pages, homepage slider, website content and sermons.",
    actions: [
      { key: "view", label: "View" },
      { key: "manage", label: "Create, edit & publish" },
    ],
  },
  {
    key: "users",
    label: "Users",
    description: "Team accounts, roles and permissions.",
    actions: [
      { key: "view", label: "View users & roles" },
      { key: "manage", label: "Create, edit, suspend & delete users" },
      { key: "roles", label: "Manage roles & permissions" },
    ],
  },
  {
    key: "settings",
    label: "Settings",
    description: "Site settings, SEO and the audit log.",
    actions: [
      { key: "view", label: "View settings & audit log" },
      { key: "manage", label: "Change settings" },
    ],
  },
] as const

type Module = (typeof PERMISSION_MODULES)[number]
export type Permission = { [M in Module as M["key"]]: `${M["key"]}.${M["actions"][number]["key"]}` }[Module["key"]]

export const ALL_PERMISSIONS = PERMISSION_MODULES.flatMap((m) => m.actions.map((a) => `${m.key}.${a.key}` as Permission))

export function isPermission(value: string): value is Permission {
  return (ALL_PERMISSIONS as string[]).includes(value)
}

export const SUPER_ADMIN_ROLE = "super_admin"

export interface RoleDefinition {
  id: string
  name: string
  description: string
  permissions: Permission[]
  /** Built-in role (can't be deleted). */
  system: boolean
  /** Permissions can't be edited (Super Admin always has everything). */
  locked?: boolean
}

const except = (...excluded: Permission[]) => ALL_PERMISSIONS.filter((p) => !excluded.includes(p))

export const SYSTEM_ROLES: RoleDefinition[] = [
  {
    id: SUPER_ADMIN_ROLE,
    name: "Super Admin",
    description: "Full control, including users, roles and permissions.",
    permissions: ALL_PERMISSIONS,
    system: true,
    locked: true,
  },
  {
    id: "admin",
    name: "Admin",
    description: "Runs the website day to day. Can see the team but not change accounts or permissions.",
    permissions: except("users.manage", "users.roles"),
    system: true,
  },
  {
    id: "editor",
    name: "Editor",
    description: "Publishes and manages all content, media, comments and newsletters.",
    permissions: [
      "dashboard.view", "analytics.view",
      "blog.view", "blog.create", "blog.edit_any", "blog.publish", "blog.delete",
      "categories.view", "categories.manage",
      "media.view", "media.upload", "media.delete",
      "comments.view", "comments.moderate",
      "subscribers.view",
      "newsletter.view", "newsletter.manage", "newsletter.send",
      "website.view", "website.manage",
    ],
    system: true,
  },
  {
    id: "author",
    name: "Author",
    description: "Writes their own posts as drafts for an editor to publish.",
    permissions: ["dashboard.view", "blog.view", "blog.create", "categories.view", "media.view", "media.upload", "comments.view"],
    system: true,
  },
  {
    id: "moderator",
    name: "Moderator",
    description: "Keeps the conversation healthy by moderating reader comments.",
    permissions: ["dashboard.view", "blog.view", "comments.view", "comments.moderate", "subscribers.view"],
    system: true,
  },
]

/** Maps roles from the previous 3-role system. */
export const LEGACY_ROLE_MAP: Record<string, string> = { admin: "admin", editor: "editor", contributor: "author" }

/** Which permission each admin route needs (longest prefix wins). Used for page guards and navigation. */
export const ROUTE_PERMISSIONS: [string, Permission][] = [
  ["/admin/posts", "blog.view"],
  ["/admin/categories", "categories.view"],
  ["/admin/comments", "comments.view"],
  ["/admin/pages", "website.view"],
  ["/admin/slider", "website.view"],
  ["/admin/content", "website.manage"],
  ["/admin/media", "media.view"],
  ["/admin/subscribers", "subscribers.view"],
  ["/admin/newsletter", "newsletter.view"],
  ["/admin/users", "users.view"],
  ["/admin/roles", "users.view"],
  ["/admin/audit-logs", "settings.view"],
  ["/admin/settings", "settings.view"],
]

export function permissionForPath(pathname: string): Permission | null {
  if (pathname === "/admin") return "dashboard.view"
  const match = ROUTE_PERMISSIONS.filter(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`)).sort((a, b) => b[0].length - a[0].length)[0]
  return match?.[1] ?? null
}
