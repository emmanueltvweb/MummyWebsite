import { PostEditor } from "@/components/admin/posts/post-editor"

export const metadata = { title: "Edit post" }

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <PostEditor key={id} postId={id} />
}
