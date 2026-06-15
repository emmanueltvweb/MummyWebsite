import { Resend } from 'resend'

// Resend.com email configuration
export function getEmailTransporter() {
  try {
    const apiKey = process.env.RESEND_API_KEY
    
    if (!apiKey) {
      console.warn('⚠️ Resend API key not configured. Using mock transporter.')
      console.log('🔧 To enable real emails, set RESEND_API_KEY in .env.local')
      return getMockTransporter()
    }
    
    console.log('📧 Creating Resend email transporter')
    
    return {
      sendMail: async (options: any) => {
        const resend = new Resend(apiKey)
        
        try {
          const result = await resend.emails.send({
            from: options.from || 'noreply@scoanlegacy.org',
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text,
          })
          
          console.log('✅ Resend email sent successfully:', result)
          return { messageId: result.data?.id || 'resend-message-id' }
        } catch (error) {
          console.error('❌ Resend email failed:', error)
          throw error
        }
      }
    }
  } catch (error) {
    console.error('❌ Failed to create Resend transporter:', error)
    return getMockTransporter()
  }
}

// Mock transporter for development/testing
function getMockTransporter() {
  return {
    sendMail: async (options: any) => {
      console.log('📧 Mock email sent (not real):', {
        to: options.to,
        subject: options.subject,
        from: options.from
      })
      return { messageId: 'mock-message-id' }
    }
  }
}

// Email templates
export const emailTemplates = {
  newsletterWelcome: (email: string) => ({
    subject: 'Thank you for subscribing to SCOAN Legacy Newsletter',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to SCOAN Legacy Newsletter</title>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0;
            padding: 0;
            background-color: #f8f9fa;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 40px 30px; 
            text-align: center; 
          }
          .header h1 { margin: 0; font-size: 28px; font-weight: 300; }
          .header p { margin: 10px 0 0 0; font-size: 16px; opacity: 0.9; }
          .content { 
            padding: 40px 30px; 
            background: white;
          }
          .content h2 { 
            color: #667eea; 
            font-size: 22px; 
            margin-bottom: 20px; 
            font-weight: 400;
          }
          .content p { margin-bottom: 20px; font-size: 16px; }
          .content ul { 
            margin: 20px 0; 
            padding-left: 20px; 
          }
          .content li { 
            margin-bottom: 10px; 
            font-size: 15px;
          }
          .button { 
            display: inline-block; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 12px 30px; 
            text-decoration: none; 
            border-radius: 25px; 
            margin: 20px 0;
            font-weight: 500;
            transition: transform 0.2s ease;
          }
          .button:hover { transform: translateY(-2px); }
          .footer { 
            text-align: center; 
            padding: 30px;
            background: #f8f9fa;
            color: #666; 
            font-size: 14px; 
            border-top: 1px solid #e9ecef;
          }
          .social-links { text-align: center; margin: 20px 0; }
          .social-links a { 
            display: inline-block; 
            margin: 0 10px; 
            color: #667eea; 
            text-decoration: none;
            font-size: 14px;
          }
          .verse { 
            background: #f8f9fa; 
            border-left: 4px solid #667eea; 
            padding: 20px; 
            margin: 20px 0; 
            font-style: italic;
            border-radius: 0 8px 8px 0;
          }
          @media (max-width: 600px) {
            .container { margin: 10px; }
            .header, .content { padding: 30px 20px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🙏 Welcome to SCOAN Legacy!</h1>
            <p>Thank you for subscribing to our newsletter</p>
          </div>
          
          <div class="content">
            <h2>Dear Beloved in Christ,</h2>
            
            <p>Thank you for subscribing to our SCOAN Legacy newsletter! We are delighted to have you as part of our spiritual family.</p>
            
            <div class="verse">
              <p><strong>"For I know the plans I have for you," declares the Lord, "plans to prosper you and not to harm you, plans to give you hope and a future."</strong></p>
              <p style="text-align: right; margin-top: 10px;">- Jeremiah 29:11</p>
            </div>
            
            <p>Through this newsletter, you will receive:</p>
            <ul>
              <li>🔥 Inspiring teachings and sermons from Pastor Evelyn Joshua</li>
              <li>📅 Updates on upcoming events, crusades, and special programs</li>
              <li>🙏 Daily prayer points and spiritual guidance</li>
              <li>📺 Latest videos and prophetic messages</li>
              <li>✨ Powerful testimonies and miracles</li>
              <li>📖 Words of wisdom and encouragement</li>
            </ul>
            
            <p>As Pastor Evelyn Joshua always reminds us, <em>"We may have reasons to be worried, but we have more reasons not to be worried."</em> We believe this newsletter will be a source of blessing, encouragement, and spiritual growth for you.</p>
            
            <h2>Stay Connected with Us:</h2>
            <div class="social-links">
              <a href="https://scoanlegacy.org">🌐 Website</a>
              <a href="https://emmanuel.tv">📺 Emmanuel TV</a>
              <a href="https://scoan.org">🏛️ SCOAN</a>
              <a href="https://facebook.com/SCOANLegacy">📘 Facebook</a>
              <a href="https://youtube.com/SCOANLegacy">📺 YouTube</a>
            </div>
            
            <div class="verse">
              <p><strong>"May the God of hope fill you with all joy and peace as you trust in him, so that you may overflow with hope by the power of the Holy Spirit."</strong></p>
              <p style="text-align: right; margin-top: 10px;">- Romans 15:13</p>
            </div>
            
            <p>May the Lord bless you abundantly as you stay connected with His work! We pray that this newsletter will strengthen your faith and draw you closer to God.</p>
            
            <p>In His Service,<br>
            <strong>The SCOAN Legacy Team</strong></p>
            
            <p><em>P.S. Feel free to share this newsletter with friends and family who might be blessed by it!</em></p>
          </div>
          
          <div class="footer">
            <p><strong>You received this email because you subscribed to our newsletter.</strong></p>
            <p>If you wish to unsubscribe at any time, please reply to this email with "UNSUBSCRIBE" in the subject line.</p>
            <p style="margin-top: 15px; font-size: 12px;">© 2024 SCOAN Legacy. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Thank you for subscribing to SCOAN Legacy Newsletter!

Dear Beloved in Christ,

Thank you for subscribing to our SCOAN Legacy newsletter! We are delighted to have you as part of our spiritual family.

"For I know the plans I have for you," declares the Lord, "plans to prosper you and not to harm you, plans to give you hope and a future." - Jeremiah 29:11

Through this newsletter, you will receive:
- Inspiring teachings and sermons from Pastor Evelyn Joshua
- Updates on upcoming events, crusades, and special programs
- Daily prayer points and spiritual guidance
- Latest videos and prophetic messages
- Powerful testimonies and miracles
- Words of wisdom and encouragement

As Pastor Evelyn Joshua always reminds us, "We may have reasons to be worried, but we have more reasons not to be worried." We believe this newsletter will be a source of blessing, encouragement, and spiritual growth for you.

Stay Connected with Us:
- Website: scoanlegacy.org
- Emmanuel TV: emmanuel.tv
- SCOAN: scoan.org
- Facebook: facebook.com/SCOANLegacy
- YouTube: youtube.com/SCOANLegacy

"May the God of hope fill you with all joy and peace as you trust in him, so that you may overflow with hope by the power of the Holy Spirit." - Romans 15:13

May the Lord bless you abundantly as you stay connected with His work! We pray that this newsletter will strengthen your faith and draw you closer to God.

In His Service,
The SCOAN Legacy Team

P.S. Feel free to share this newsletter with friends and family who might be blessed by it!

You received this email because you subscribed to our newsletter.
If you wish to unsubscribe at any time, please reply to this email with "UNSUBSCRIBE" in the subject line.

© 2024 SCOAN Legacy. All rights reserved.
    `
  }),
  
  adminNotification: (email: string) => ({
    subject: 'New Newsletter Subscription - SCOAN Legacy',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px; border-radius: 10px;">
        <h2 style="color: #667eea; margin-bottom: 20px;">📧 New Newsletter Subscription</h2>
        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Status:</strong> <span style="color: green;">✅ Successfully subscribed</span></p>
        </div>
        <p style="color: #666; font-size: 14px;">This is an automated notification from the SCOAN Legacy website.</p>
      </div>
    `,
    text: `New newsletter subscription from: ${email} at ${new Date().toLocaleString()}`
  })
}