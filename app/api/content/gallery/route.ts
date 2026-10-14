import { NextRequest, NextResponse } from "next/server"

import { getGalleryContent, saveGalleryContent } from "@/lib/content/store"
import { formatZodError, galleryDataSchema } from "@/lib/content/validation"
import { requireUser } from "@/lib/server/api"

export async function GET() {
  try {
    const data = await getGalleryContent()
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error fetching gallery content:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch gallery content" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  const user = await requireUser("website.manage")
  if (user instanceof Response) return user

  try {
    const body = await request.json()
    const parsed = galleryDataSchema.safeParse(body)

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

    const saved = await saveGalleryContent(parsed.data)
    return NextResponse.json({
      success: true,
      message: "Gallery content saved successfully",
      data: saved,
    })
  } catch (error) {
    console.error("Error saving gallery content:", error)
    return NextResponse.json(
      { success: false, error: "Failed to save gallery content" },
      { status: 500 }
    )
  }
}
