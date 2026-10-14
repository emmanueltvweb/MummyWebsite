import { Metadata } from "next"

import GalleryPageClient from "./gallery-page-client"

export const metadata: Metadata = {
  title: "Crusade/Outreach | Gallery",
  description: "Explore our ministry gallery featuring crusades, outreach programs, and community service events.",
}

export default function GalleryPage() {
  return <GalleryPageClient />
}
