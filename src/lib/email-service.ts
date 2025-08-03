interface EmailTemplate {
  subject: string
  html: string
  text: string
}

interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text: string
}

export class EmailService {
  private baseUrl: string

  constructor() {
    this.baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3003'
  }

  /**
   * Send email using appropriate service based on environment
   */
  async sendEmail({ to, subject, html, text }: SendEmailOptions): Promise<boolean> {
    try {
      // Development: Log to console
      if (process.env.NODE_ENV === 'development') {
        console.log('\n' + '='.repeat(60))
        console.log('📧 EMAIL SENT (Development Mode)')
        console.log('='.repeat(60))
        console.log(`To: ${to}`)
        console.log(`Subject: ${subject}`)
        console.log('\n--- Email Content ---')
        console.log(text)
        console.log('\n--- HTML Version ---')
        console.log(html)
        console.log('='.repeat(60) + '\n')
        return true
      }

      // Production: SendGrid Integration
      if (process.env.SENDGRID_API_KEY) {
        return await this.sendWithSendGrid({ to, subject, html, text })
      }

      // Production: AWS SES Integration
      if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
        return await this.sendWithAWSSES({ to, subject, html, text })
      }

      // Fallback: Nodemailer SMTP
      if (process.env.SMTP_HOST) {
        return await this.sendWithSMTP({ to, subject, html, text })
      }

      console.error('No email service configured for production')
      return false

    } catch (error) {
      console.error('Email sending failed:', error)
      return false
    }
  }

  /**
   * Send email using SendGrid (Recommended for production)
   */
  private async sendWithSendGrid({ to, subject, html, text }: SendEmailOptions): Promise<boolean> {
    try {
      // Note: In actual implementation, install @sendgrid/mail
      // npm install @sendgrid/mail
      
      const sgMail = await import('@sendgrid/mail')

      sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

      const msg = {
        to,
        from: {
          email: process.env.FROM_EMAIL || 'noreply@hayl-energy-ai.com',
          name: 'Hayl Energy AI'
        },
        subject,
        text,
        html,
        replyTo: process.env.SUPPORT_EMAIL || 'support@hayl-energy-ai.com',
        trackingSettings: {
          clickTracking: { enable: true },
          openTracking: { enable: true }
        }
      }

      await sgMail.send(msg)
      console.log(`Email sent successfully to ${to} via SendGrid`)
      return true

    } catch (error) {
      console.error('SendGrid email failed:', error)
      return false
    }
  }

  /**
   * Send email using AWS SES
   */
  private async sendWithAWSSES({ to, subject, html, text }: SendEmailOptions): Promise<boolean> {
    try {
      console.error('AWS SES not configured for this deployment')
      return false
    } catch (error) {
      console.error('AWS SES email failed:', error)
      return false
    }
  }

  /**
   * Send email using SMTP (Nodemailer fallback)
   */
  private async sendWithSMTP({ to, subject, html, text }: SendEmailOptions): Promise<boolean> {
    try {
      console.error('SMTP not configured for this deployment')
      return false
    } catch (error) {
      console.error('SMTP email failed:', error)
      return false
    }
  }

  /**
   * Generate email verification template
   */
  generateVerificationEmail(
    email: string, 
    name: string | null, 
    verificationToken: string
  ): EmailTemplate {
    const verificationUrl = `${this.baseUrl}/api/auth/verify-email?token=${verificationToken}`
    const dashboardUrl = `${this.baseUrl}/dashboard`
    const displayName = name || email.split('@')[0]

    const subject = 'Verify your email - Hayl Energy AI'
    
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
        }
        .content {
            background: #f8fafc;
            padding: 30px;
            border-radius: 0 0 10px 10px;
        }
        .button {
            display: inline-block;
            background: #3b82f6;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            margin: 20px 0;
            font-weight: 600;
        }
        .button:hover {
            background: #2563eb;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 14px;
            color: #6b7280;
        }
        .security-note {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1 style="margin: 0; font-size: 24px;">⚡ Hayl Energy AI</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Smart Energy Management Solutions</p>
    </div>
    
    <div class="content">
        <h2>Welcome ${displayName}! 👋</h2>
        
        <p>Thank you for creating your Hayl Energy AI account. To complete your registration and access all features, please verify your email address.</p>
        
        <div style="text-align: center;">
            <a href="${verificationUrl}" class="button">
                ✅ Verify Email Address
            </a>
        </div>
        
        <div class="security-note">
            <strong>🔒 Security Note:</strong> This verification link is valid for 24 hours and can only be used once.
        </div>
        
        <p><strong>What happens after verification?</strong></p>
        <ul>
            <li>✅ Full access to your dashboard</li>
            <li>✅ Energy monitoring and analytics</li>
            <li>✅ AI-powered optimization features</li>
            <li>✅ Predictive analytics tools</li>
        </ul>
        
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; background: #e5e7eb; padding: 10px; border-radius: 4px; font-family: monospace;">
            ${verificationUrl}
        </p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        
        <p><strong>Didn't create this account?</strong></p>
        <p>If you didn't sign up for Hayl Energy AI, you can safely ignore this email. No account has been created yet.</p>
    </div>
    
    <div class="footer">
        <p>© 2024 Hayl Energy AI - Smart Energy Management Solutions</p>
        <p>This email was sent to ${email}</p>
    </div>
</body>
</html>
    `

    const text = `
Welcome to Hayl Energy AI, ${displayName}!

Thank you for creating your account. To complete your registration, please verify your email address by clicking the link below:

${verificationUrl}

This verification link is valid for 24 hours and can only be used once.

After verification, you'll have full access to:
- Energy monitoring and analytics dashboard
- AI-powered optimization features  
- Predictive analytics tools
- Smart energy management solutions

If you didn't create this account, you can safely ignore this email.

---
© 2024 Hayl Energy AI
This email was sent to ${email}
    `

    return { subject, html, text }
  }

  /**
   * Send email verification
   */
  async sendVerificationEmail(
    email: string, 
    name: string | null, 
    verificationToken: string
  ): Promise<boolean> {
    const template = this.generateVerificationEmail(email, name, verificationToken)
    
    return await this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text
    })
  }

  /**
   * Generate welcome email for verified users
   */
  generateWelcomeEmail(email: string, name: string | null): EmailTemplate {
    const dashboardUrl = `${this.baseUrl}/dashboard`
    const displayName = name || email.split('@')[0]

    const subject = 'Welcome to Hayl Energy AI! 🎉'
    
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Hayl Energy AI</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
        }
        .content {
            background: #f8fafc;
            padding: 30px;
            border-radius: 0 0 10px 10px;
        }
        .button {
            display: inline-block;
            background: #10b981;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            margin: 20px 0;
            font-weight: 600;
        }
        .feature-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .feature-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1 style="margin: 0; font-size: 24px;">🎉 Welcome to Hayl Energy AI!</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Your email has been verified successfully</p>
    </div>
    
    <div class="content">
        <h2>Hello ${displayName}!</h2>
        
        <p>Congratulations! Your email has been verified and your Hayl Energy AI account is now fully active. You're ready to start optimizing your energy management with AI-powered solutions.</p>
        
        <div style="text-align: center;">
            <a href="${dashboardUrl}" class="button">
                🚀 Access Your Dashboard
            </a>
        </div>
        
        <div class="feature-grid">
            <div class="feature-card">
                <h3>📊 Energy Monitoring</h3>
                <p>Real-time tracking and analysis of your energy consumption patterns.</p>
            </div>
            <div class="feature-card">
                <h3>🤖 AI Optimization</h3>
                <p>Machine learning algorithms to reduce costs and improve efficiency.</p>
            </div>
            <div class="feature-card">
                <h3>📈 Predictive Analytics</h3>
                <p>Forecast demand and identify improvement opportunities.</p>
            </div>
        </div>
        
        <p><strong>Need help getting started?</strong></p>
        <ul>
            <li>📖 Check out our documentation</li>
            <li>💬 Contact our support team</li>
            <li>🎥 Watch our tutorial videos</li>
        </ul>
    </div>
    
    <div style="text-align: center; margin-top: 30px; font-size: 14px; color: #6b7280;">
        <p>© 2024 Hayl Energy AI - Smart Energy Management Solutions</p>
    </div>
</body>
</html>
    `

    const text = `
🎉 Welcome to Hayl Energy AI, ${displayName}!

Your email has been verified and your account is now fully active!

You now have access to:
📊 Energy Monitoring - Real-time consumption tracking
🤖 AI Optimization - Machine learning cost reduction  
📈 Predictive Analytics - Demand forecasting

Ready to get started? Access your dashboard:
${dashboardUrl}

Need help? Our support team is here to assist you.

---
© 2024 Hayl Energy AI
    `

    return { subject, html, text }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(email: string, name: string | null): Promise<boolean> {
    const template = this.generateWelcomeEmail(email, name)
    
    return await this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text
    })
  }
}

// Export singleton instance
export const emailService = new EmailService()