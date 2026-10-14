import { Suspense } from "react"

import { PostsManager } from "@/components/admin/posts/posts-manager"
import { FullPageSpinner } from "@/components/admin/ui/primitives"

export const metadata = { title: "Blog posts" }

export default function PostsPage() {
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <PostsManager />
    </Suspense>
  )
}
