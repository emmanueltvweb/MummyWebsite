import { CampaignEditor } from "@/components/admin/newsletter/campaign-editor"

export const metadata = { title: "Campaign" }

export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <CampaignEditor key={id} campaignId={id} />
}
