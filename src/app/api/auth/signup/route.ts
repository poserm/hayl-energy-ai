import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { validateSignupData } from '@/lib/validation'
import { emailService } from '@/lib/email-service'
import { logAuthEvent } from '@/lib/auth-logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const validation = validateSignupData(body)
    if (!validation.isValid) {
      await logAuthEvent('signup_attempt', request, {
        success: false,
        error: 'Validation failed',
        metadata: { errors: validation.errors }
      })

      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed', 
          details: validation.errors 
        },
        { status: 400 }
      )
    }
    
    const { email, password, name } = validation.data!
    
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })
    
    if (existingUser) {
      await logAuthEvent('signup_attempt', request, {
        success: false,
        error: 'Email already exists',
        email,
        metadata: { duplicateEmail: true }
      })

      return NextResponse.json(
        { 
          success: false, 
          error: 'User already exists with this email' 
        },
        { status: 409 }
      )
    }
    
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)
    
    // Generate verification token
    const verificationToken = crypto.randomUUID()
    const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        emailVerified: false,
        verificationToken,
        tokenExpiresAt
      },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        createdAt: true
      }
    })
    
    // Send verification email
    let emailSent = false
    try {
      emailSent = await emailService.sendVerificationEmail(
        user.email,
        user.name,
        verificationToken
      )
    } catch (emailError) {
      console.error('Email sending failed:', emailError)
      // Continue with signup even if email fails
    }
    
    // Log successful signup attempt
    try {
      await logAuthEvent('signup_attempt', request, {
        success: true,
        userId: user.id,
        email: user.email,
        metadata: { 
          emailSent,
          requiresVerification: true 
        }
      })
    } catch (logError) {
      console.error('Logging failed:', logError)
      // Continue with response even if logging fails
    }
    
    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully! Please check your email to verify your account.',
        data: {
          email: user.email,
          name: user.name,
          emailVerified: user.emailVerified,
          emailSent
        }
      },
      { status: 201 }
    )
    
  } catch (error) {
    console.error('Signup error:', error)
    
    await logAuthEvent('signup_attempt', request, {
      success: false,
      error: 'Internal server error',
      metadata: { 
        errorMessage: error instanceof Error ? error.message : 'Unknown error' 
      }
    })
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}