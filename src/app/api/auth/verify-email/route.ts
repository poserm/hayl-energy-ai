import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logAuthEvent } from '@/lib/auth-logger'
import { emailService } from '@/lib/email-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      await logAuthEvent('suspicious_activity', request, {
        success: false,
        error: 'Email verification attempted without token'
      })

      return NextResponse.json(
        {
          success: false,
          error: 'Invalid verification link',
          message: 'Verification token is required'
        },
        { status: 400 }
      )
    }

    // Find user with this verification token
    const user = await prisma.user.findUnique({
      where: { verificationToken: token },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        tokenExpiresAt: true,
        name: true
      }
    })

    if (!user) {
      await logAuthEvent('suspicious_activity', request, {
        success: false,
        error: 'Invalid verification token used'
      })

      return NextResponse.json(
        {
          success: false,
          error: 'Invalid verification link',
          message: 'This verification link is invalid or has already been used'
        },
        { status: 400 }
      )
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json(
        {
          success: true,
          message: 'Email already verified',
          data: {
            email: user.email,
            verified: true
          }
        },
        { status: 200 }
      )
    }

    // Check if token has expired
    if (user.tokenExpiresAt && new Date() > user.tokenExpiresAt) {
      await logAuthEvent('suspicious_activity', request, {
        success: false,
        error: 'Expired verification token used',
        userId: user.id
      })

      return NextResponse.json(
        {
          success: false,
          error: 'Verification link expired',
          message: 'This verification link has expired. Please request a new one.'
        },
        { status: 400 }
      )
    }

    // Verify the email
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
        tokenExpiresAt: null,
        updatedAt: new Date()
      }
    })

    // Send welcome email
    const welcomeEmailSent = await emailService.sendWelcomeEmail(user.email, user.name)

    // Log successful verification
    await logAuthEvent('login_success', request, {
      success: true,
      userId: user.id,
      email: user.email,
      metadata: { 
        action: 'email_verification',
        previouslyVerified: false,
        welcomeEmailSent
      }
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Email verified successfully! Welcome to Hayl Energy AI.',
        data: {
          email: user.email,
          verified: true,
          name: user.name
        }
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Email verification error:', error)
    
    await logAuthEvent('suspicious_activity', request, {
      success: false,
      error: 'Email verification system error',
      metadata: { 
        errorMessage: error instanceof Error ? error.message : 'Unknown error' 
      }
    })

    return NextResponse.json(
      {
        success: false,
        error: 'Verification failed',
        message: 'An error occurred during email verification. Please try again.'
      },
      { status: 500 }
    )
  }
}

// Resend verification email endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email is required'
        },
        { status: 400 }
      )
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        name: true
      }
    })

    if (!user) {
      // Don't reveal if email exists or not for security
      return NextResponse.json(
        {
          success: true,
          message: 'If an account with that email exists, a verification email has been sent.'
        },
        { status: 200 }
      )
    }

    if (user.emailVerified) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email already verified'
        },
        { status: 400 }
      )
    }

    // Generate new verification token
    const verificationToken = crypto.randomUUID()
    const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken,
        tokenExpiresAt,
        updatedAt: new Date()
      }
    })

    // Send verification email
    const emailSent = await emailService.sendVerificationEmail(
      user.email,
      user.name,
      verificationToken
    )

    await logAuthEvent('signup_attempt', request, {
      success: true,
      userId: user.id,
      email: user.email,
      metadata: { 
        action: 'resend_verification',
        emailSent
      }
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Verification email sent successfully!'
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Resend verification error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to resend verification email'
      },
      { status: 500 }
    )
  }
}