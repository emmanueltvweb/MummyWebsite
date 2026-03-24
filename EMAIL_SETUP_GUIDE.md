# Email Configuration Guide for Newsletter Subscriptions

This guide will help you set up email notifications for newsletter subscriptions on your SCOAN Legacy website.

## 🔧 Environment Variables

Create a `.env` file in your project root and add the following variables:

```env
# Email Configuration
EMAIL_PROVIDER=gmail  # Options: gmail, sendgrid, mailgun
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
ADMIN_EMAIL=admin@scoanlegacy.org

# For SendGrid (alternative)
# EMAIL_PROVIDER=sendgrid
# SENDGRID_API_KEY=your-sendgrid-api-key

# For Mailgun (alternative)
# EMAIL_PROVIDER=mailgun
# MAILGUN_USER=your-mailgun-user
# MAILGUN_PASS=your-mailgun-password
```

## 📧 Gmail Setup (Recommended for Development)

### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account settings
2. Navigate to "Security"
3. Enable "2-Step Verification"

### Step 2: Generate App Password
1. In your Google Account, go to "Security"
2. Under "Signing in to Google," click "App passwords"
3. Select "Mail" and your device
4. Click "Generate"
5. Copy the 16-character app password
6. Use this as your `SMTP_PASS` in the `.env` file

### Step 3: Configure Environment
```env
EMAIL_PROVIDER=gmail
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-character-app-password
ADMIN_EMAIL=admin@scoanlegacy.org
```

## 🚀 SendGrid Setup (Recommended for Production)

### Step 1: Create SendGrid Account
1. Sign up at [SendGrid](https://sendgrid.com/)
2. Verify your account and set up sender authentication

### Step 2: Generate API Key
1. Go to Settings > API Keys
2. Click "Create API Key"
3. Choose "Full Access" or customize permissions
4. Copy the API key

### Step 3: Configure Environment
```env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your-sendgrid-api-key
ADMIN_EMAIL=admin@scoanlegacy.org
```

## 📮 Mailgun Setup (Alternative)

### Step 1: Create Mailgun Account
1. Sign up at [Mailgun](https://www.mailgun.com/)
2. Add and verify your domain

### Step 2: Get SMTP Credentials
1. Go to Settings > SMTP
2. Copy your SMTP username and password

### Step 3: Configure Environment
```env
EMAIL_PROVIDER=mailgun
MAILGUN_USER=your-mailgun-smtp-user
MAILGUN_PASS=your-mailgun-smtp-password
ADMIN_EMAIL=admin@scoanlegacy.org
```

## 🧪 Testing the Email System

### Test Subscription
1. Navigate to your website's newsletter section
2. Enter a valid email address
3. Click "Subscribe"
4. Check your email inbox for the welcome message

### Test Admin Notifications
1. Subscribe with any email
2. Check the admin email inbox for notification

### Troubleshooting

#### Email Not Sending
- Check your `.env` file configuration
- Verify SMTP credentials are correct
- Check console logs for error messages
- Ensure your email provider allows SMTP access

#### Gmail Issues
- Make sure 2-factor authentication is enabled
- Use app-specific password, not your regular password
- Check if "Less secure app access" is enabled (if needed)

#### SendGrid Issues
- Verify your API key has the correct permissions
- Check if sender authentication is complete
- Review SendGrid's email activity dashboard

## 🔒 Security Notes

- Never commit your `.env` file to version control
- Use strong, unique passwords for email accounts
- Consider using a dedicated email address for notifications
- Monitor your email sending limits and reputation
- Implement rate limiting for subscription endpoints

## 📊 Email Templates

The system includes professionally designed email templates with:

- Welcome message for new subscribers
- Admin notifications for new subscriptions
- Responsive HTML design
- Plain text fallback versions
- Biblical verses and spiritual content
- Social media links
- Unsubscribe instructions

## 🎨 Customization

You can customize the email templates in `/lib/email-config.ts`:

- Modify colors and styling
- Update content and messaging
- Add your organization's branding
- Include additional links or information
- Change the biblical verses

## 📈 Monitoring

Consider implementing:
- Email delivery tracking
- Subscription analytics
- Bounce rate monitoring
- User engagement metrics
- A/B testing for email content

## 🔗 Additional Resources

- [Nodemailer Documentation](https://nodemailer.com/)
- [Gmail SMTP Settings](https://support.google.com/mail/answer/7126229)
- [SendGrid Documentation](https://docs.sendgrid.com/)
- [Mailgun Documentation](https://documentation.mailgun.com/)

## 📞 Support

If you encounter issues:
1. Check the console logs for error messages
2. Verify your environment variables
3. Test with different email providers
4. Check spam folders for test emails
5. Review the API endpoint logs

Remember to restart your development server after making changes to environment variables!