import { NextRequest, NextResponse } from "next/server"

import { getSiteContent, saveSiteContent } from "@/lib/content/store"
import { formatZodError, siteContentSchema } from "@/lib/content/validation"
import { requireUser } from "@/lib/server/api"
import { audit } from "@/lib/server/audit"

export async function GET() {
  try {
    const content = await getSiteContent()
    return NextResponse.json({ success: true, data: content })
  } catch (error) {
    console.error("Error fetching site content:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch site content" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  const user = await requireUser("website.manage")
  if (user instanceof Response) return user

  try {
    const body = await request.json()
    const parsed = siteContentSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: formatZodError(parsed.error),
          details: parsed.error.flatten(),
        },
        { status: 400 }
      )
    }

    const saved = await saveSiteContent(parsed.data, user.name)
    await audit(user, "content.update", "content", "Updated website content")
    return NextResponse.json({
      success: true,
      message: "Site content saved successfully",
      data: saved,
    })
  } catch (error) {
    console.error("Error saving site content:", error)
    return NextResponse.json(
      { success: false, error: "Failed to save site content" },
      { status: 500 }
    )
  }
}
