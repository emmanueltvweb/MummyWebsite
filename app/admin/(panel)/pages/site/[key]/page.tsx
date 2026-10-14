import { notFound } from "next/navigation"

import { SiteContentEditor } from "@/components/admin/content-editor/site-content-editor"
import { AboutPageEditor } from "@/components/admin/site-pages/about-page-editor"
import { BlogPageEditor } from "@/components/admin/site-pages/blog-page-editor"
import { SermonPageEditor } from "@/components/admin/site-pages/sermon-page-editor"
import { ABOUT_PAGE_KEYS, BUILT_IN_PAGES } from "@/lib/content/page-types"

export const metadata = { title: "Edit page" }

/** Editor for one of the website's built-in pages (Admin → Pages → Built-in pages). */
export default async function BuiltInPageEditorRoute({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params
  const page = BUILT_IN_PAGES.find((p) => p.key === key)
  if (!page) notFound()

  switch (page.key) {
    case "home":
    case "contact":
    case "visit":
    case "gallery":
      return <SiteContentEditor key={page.key} scope={page.key} />
    case "sermon":
      return <SermonPageEditor page={page} />
    case "blog":
      return <BlogPageEditor page={page} />
    default: {
      const aboutKey = ABOUT_PAGE_KEYS.find((k) => page.key === `about-${k}`)
      if (!aboutKey) notFound()
      return <AboutPageEditor key={aboutKey} page={page} aboutKey={aboutKey} />
    }
  }
}
