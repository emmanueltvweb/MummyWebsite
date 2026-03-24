# Resend.com Configuration Guide

## 🔑 Getting Your Resend API Key

1. **Sign up for Resend**: Go to [https://resend.com](https://resend.com) and create an account
2. **Add a domain**: Add your domain (e.g., `scoanlegacy.org`) and verify it
3. **Get your API key**: Go to API Keys section and copy your API key
4. **Set up your sender**: Configure your sender email (e.g., `noreply@scoanlegacy.org`)

## 🔧 Environment Configuration

Add these to your `.env.local` file:

```env
# Resend.com Configuration
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_YourActualAPIKeyHere
ADMIN_EMAIL=your-admin-email@gmail.com
FROM_EMAIL=noreply@scoanlegacy.org
FROM_NAME=SCOAN Legacy
```

## 🚀 Quick Start

1. **Get your API key** from [Resend Dashboard](https://resend.com/api-keys)
2. **Add your domain** and verify it
3. **Update your `.env.local`** with the API key
4. **Test the subscription** on your website

## 📧 Features with Resend

- ✅ **Real-time email delivery**
- ✅ **Professional HTML templates**
- ✅ **Email analytics and tracking**
- ✅ **High deliverability rates**
- ✅ **Simple API integration**
- ✅ **Free tier available** (100 emails/day)

## 🔍 Testing

After setting up:
1. Enter your email in the newsletter form
2. Click "Subscribe"
3. Check your email inbox for the welcome message
4. Check the admin email for notification

## 🛠️ Troubleshooting

If emails aren't sending:
1. **Check API key**: Ensure `RESEND_API_KEY` is correct
2. **Verify domain**: Make sure your domain is verified in Resend
3. **Check spam folder**: Emails might go to spam initially
4. **Review logs**: Check console for error messages
5. **Test API**: Use Resend's dashboard to test sending

## 📊 Monitoring

Monitor your email sending through:
- Resend Dashboard: [https://resend.com](https://resend.com)
- Email analytics and delivery rates
- Bounce and complaint tracking

## 🔒 Security Notes

- Never commit your API key to version control
- Use environment variables for sensitive data
- Consider rate limiting for production use
- Monitor your sending reputation

## 📞 Support

If you encounter issues:
1. Check Resend's documentation: [https://resend.com/docs](https://resend.com/docs)
2. Review your API key and domain settings
3. Test with Resend's dashboard first
4. Check console logs for specific error messages