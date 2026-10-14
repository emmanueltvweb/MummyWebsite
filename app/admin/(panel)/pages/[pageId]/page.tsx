import { PageEditor } from "@/components/admin/pages/page-editor"

export const metadata = { title: "Edit page" }

export default async function EditPage({ params }: { params: Promise<{ pageId: string }> }) {
  const { pageId } = await params
  return <PageEditor key={pageId} pageId={pageId} />
}
