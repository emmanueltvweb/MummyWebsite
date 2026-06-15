import { NextRequest, NextResponse } from 'next/server'
import { getEmailTransporter, emailTemplates } from '@/lib/email-config-resend'

// Get the configured email transporter
const transporter = getEmailTransporter()

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Get email templates
    const subscriberTemplate = emailTemplates.newsletterWelcome(email)
    const adminTemplate = emailTemplates.adminNotification(email)

    // Email content for the subscriber
    const subscriberMailOptions = {
      from: 'noreply@scoanlegacy.org',
      to: email,
      subject: subscriberTemplate.subject,
      html: subscriberTemplate.html,
      text: subscriberTemplate.text,
    }

    // Email notification for admin (optional)
    const adminMailOptions = {
      from: 'noreply@scoanlegacy.org',
      to: process.env.ADMIN_EMAIL || 'admin@scoanlegacy.org',
      subject: adminTemplate.subject,
      html: adminTemplate.html,
      text: adminTemplate.text,
    }

    try {
      // Send email to subscriber
      await transporter.sendMail(subscriberMailOptions)
      
      // Send notification to admin (optional - remove if not needed)
      try {
        await transporter.sendMail(adminMailOptions)
      } catch (adminError) {
        console.warn('Failed to send admin notification:', adminError)
        // Don't fail the main request if admin email fails
      }

      return NextResponse.json({
        success: true,
        message: 'Successfully subscribed to newsletter'
      })

    } catch (emailError) {
      console.error('Email sending failed:', emailError)
      return NextResponse.json(
        { 
          error: 'Subscription successful but email notification failed',
          details: process.env.NODE_ENV === 'development' ? emailError.message : undefined
        },
        { status: 200 }
      )
    }

  } catch (error) {
    console.error('Newsletter subscription error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'Newsletter API endpoint - Use POST to subscribe' },
    { status: 200 }
  )
}