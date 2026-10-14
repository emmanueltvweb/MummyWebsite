import {
  Activity,
  FileText,
  FolderTree,
  GalleryHorizontalEnd,
  Image as ImageIcon,
  LayoutDashboard,
  type LucideIcon,
  Mail,
  MessageSquare,
  Newspaper,
  Palette,
  PanelsTopLeft,
  Settings,
  ShieldCheck,
  UserRound,
  Users,
  Video,
} from "lucide-react"

import { permissionForPath, type Permission } from "@/lib/cms/rbac"

export interface NavChild {
  href: string
  label: string
  /** Only shown to users with this permission. */
  permission?: Permission
  /** Opens a tool (e.g. a dialog) rather than a page, so it's never highlighted as the current page. */
  action?: boolean
}

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  /** Overrides the permission inferred from the route (see ROUTE_PERMISSIONS). */
  permission?: Permission
  badge?: "pendingComments"
  children?: NavChild[]
  /** Extra path prefixes that should mark this item active. */
  match?: string[]
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

export const NAV: NavGroup[] = [
  {
    label: "Overview",
    items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Content",
    items: [
      {
        href: "/admin/posts",
        label: "Blog Posts",
        icon: Newspaper,
        children: [
          { href: "/admin/posts", label: "All posts" },
          { href: "/admin/posts/new", label: "Add new", permission: "blog.create" },
          { href: "/admin/posts?status=published", label: "Published" },
          { href: "/admin/posts?status=draft", label: "Drafts" },
          { href: "/admin/posts?status=scheduled", label: "Scheduled" },
          { href: "/admin/posts?status=archived", label: "Archived" },
        ],
      },
      { href: "/admin/categories", label: "Categories", icon: FolderTree },
      { href: "/admin/comments", label: "Comments", icon: MessageSquare, badge: "pendingComments" },
      { href: "/admin/pages", label: "Pages", icon: FileText },
      { href: "/admin/slider", label: "Homepage Slider", icon: GalleryHorizontalEnd },
      { href: "/admin/content", label: "Website Content", icon: PanelsTopLeft },
      { href: "/admin/pages/site/sermon", label: "Sermons", icon: Video },
      { href: "/admin/media", label: "Media Library", icon: ImageIcon },
    ],
  },
  {
    label: "Audience",
    items: [
      {
        href: "/admin/subscribers",
        label: "Subscribers",
        icon: UserRound,
        children: [
          { href: "/admin/subscribers", label: "All subscribers" },
          { href: "/admin/subscribers?import=1", label: "Import subscribers", permission: "subscribers.manage", action: true },
        ],
      },
      { href: "/admin/newsletter", label: "Newsletter", icon: Mail },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/users", label: "Users", icon: Users },
      { href: "/admin/roles", label: "Roles & Permissions", icon: ShieldCheck },
      { href: "/admin/audit-logs", label: "Audit Logs", icon: Activity },
      { href: "/admin/appearance", label: "Appearance", icon: Palette },
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
]

/** Flat lookup used by breadcrumbs and the command palette. */
export const ROUTE_LABELS: Record<string, string> = {
  admin: "Dashboard",
  posts: "Blog Posts",
  new: "New",
  categories: "Categories",
  comments: "Comments",
  pages: "Pages",
  slider: "Homepage Slider",
  content: "Website Content",
  sermons: "Sermons",
  media: "Media Library",
  subscribers: "Subscribers",
  newsletter: "Newsletter",
  users: "Users",
  "audit-logs": "Audit Logs",
  appearance: "Appearance",
  settings: "Settings",
  notifications: "Notifications",
  profile: "Profile",
  roles: "Roles & Permissions",
}

/** The permission needed to see a navigation item. */
export function navPermission(item: Pick<NavItem, "href" | "permission">): Permission | null {
  return item.permission ?? permissionForPath(item.href)
}
