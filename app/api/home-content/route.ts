import { NextRequest, NextResponse } from "next/server"

import { getSiteContent, saveSiteContent } from "@/lib/content/store"
import { requireUser } from "@/lib/server/api"

export async function GET() {
  try {
    const content = await getSiteContent()
    const legacy = {
      heroTitle: content.home.hero.title,
      heroSubtitle: content.home.hero.phrases[0] ?? "",
      heroPhrases: content.home.hero.phrases,
      heroDescription: content.home.about.content.slice(0, 120),
      aboutTitle: `${content.home.about.title} ${content.home.about.highlightText}`,
      aboutContent: content.home.about.content,
      sermonTitle: content.home.sermon.title,
      sermonContent: content.home.sermon.summaryParagraphs[0] ?? "",
      updatedAt: content.updatedAt,
      updatedBy: content.updatedBy,
    }

    return NextResponse.json({ success: true, data: legacy })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch home page content" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const user = await requireUser("website.manage")
  if (user instanceof Response) return user

  try {
    const body = await request.json()
    const { content: legacyContent } = body

    if (!legacyContent) {
      return NextResponse.json(
        { success: false, error: "Content is required" },
        { status: 400 }
      )
    }

    const current = await getSiteContent()
    const updated = await saveSiteContent(
      {
        ...current,
        home: {
          ...current.home,
          hero: {
            ...current.home.hero,
            title: legacyContent.heroTitle ?? current.home.hero.title,
            phrases: legacyContent.heroPhrases ?? current.home.hero.phrases,
          },
          about: {
            ...current.home.about,
            content: legacyContent.aboutContent ?? current.home.about.content,
          },
          sermon: {
            ...current.home.sermon,
            title: legacyContent.sermonTitle ?? current.home.sermon.title,
            summaryParagraphs: legacyContent.sermonContent
              ? [legacyContent.sermonContent]
              : current.home.sermon.summaryParagraphs,
          },
        },
      },
      user.name
    )

    return NextResponse.json({
      success: true,
      message: "Home page content saved successfully",
      data: updated,
    })
  } catch (error) {
    console.error("Error saving home page content:", error)
    return NextResponse.json(
      { success: false, error: "Failed to save home page content" },
      { status: 500 }
    )
  }
}
