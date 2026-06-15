import { NextRequest, NextResponse } from 'next/server'

// Mock database for now - in production this would connect to your actual database
let homePageContent = {
  heroTitle: "Good Morning,",
  heroSubtitle: "And Win Today",
  heroPhrases: ["And Win Today", "Win Tomorrow", "And Win Forever"],
  heroDescription: "Serving the world with faith, love, and spiritual guidance.",
  aboutTitle: "About Pastor Evelyn Joshua",
  aboutContent: "Pastor Evelyn Joshua is a Nigerian minister of God, pastor, preacher and tele-evangelist. She is the Senior Pastor and Leader of world renowned charismatic Christian ministry, The Synagogue, Church of All Nations (The SCOAN). Evelyn is also the President of Emmanuel Global Network (Owner of Emmanuel TV).",
  sermonTitle: "THE YEAR OF OVERFLOWING JOY 2026",
  sermonContent: "So did the Lord Almighty declare through Pastor Evelyn Joshua to believers across the world during the SCOAN Candlelight Service 2025.",
  updatedAt: new Date().toISOString(),
  updatedBy: 'Admin User'
}

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: homePageContent
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch home page content' 
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content } = body

    if (!content) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Content is required' 
        },
        { status: 400 }
      )
    }

    // Validate content structure
    const requiredFields = ['heroTitle', 'heroSubtitle', 'aboutTitle', 'aboutContent']
    const missingFields = requiredFields.filter(field => !content[field])
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Missing required fields: ${missingFields.join(', ')}` 
        },
        { status: 400 }
      )
    }

    // Simulate database save
    homePageContent = {
      ...homePageContent,
      ...content,
      updatedAt: new Date().toISOString(),
      updatedBy: 'Admin User' // In production, get from session/auth
    }

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000))

    return NextResponse.json({
      success: true,
      message: 'Home page content saved successfully',
      data: homePageContent
    })
  } catch (error) {
    console.error('Error saving home page content:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to save home page content' 
      },
      { status: 500 }
    )
  }
}