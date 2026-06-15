import { getEmailTransporter } from '@/lib/email-config'

export async function testEmailConfiguration() {
  try {
    const transporter = getEmailTransporter()
    
    // Test email configuration
    const testEmail = {
      from: process.env.SMTP_USER || 'test@example.com',
      to: 'scoandocs@gmail.com',
      subject: 'Test Email - SCOAN Legacy Newsletter System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #667eea;">✅ Email System Test Successful!</h2>
          <p>Your email configuration is working correctly.</p>
          <p><strong>Provider:</strong> ${process.env.EMAIL_PROVIDER || 'Not set'}</p>
          <p><strong>From:</strong> ${process.env.SMTP_USER || 'Not set'}</p>
          <p><strong>Admin Email:</strong> ${process.env.ADMIN_EMAIL || 'Not set'}</p>
          <p>The newsletter subscription system is ready to send real emails!</p>
        </div>
      `,
      text: 'Email system test successful! Your configuration is working correctly.'
    }

    console.log('🧪 Testing email configuration...')
    console.log('📧 Email details:', {
      from: testEmail.from,
      to: testEmail.to,
      subject: testEmail.subject
    })

    const result = await transporter.sendMail(testEmail)
    console.log('✅ Email test successful!')
    console.log('📨 Message ID:', result.messageId)
    
    return {
      success: true,
      messageId: result.messageId,
      message: 'Email configuration test successful!'
    }
  } catch (error) {
    console.error('❌ Email test failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Email configuration test failed. Check your credentials and settings.'
    }
  }
}