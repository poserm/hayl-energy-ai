import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { validateLoginData } from '@/lib/validation'
import { JWTService } from '@/lib/jwt'
import { authRateLimit } from '@/lib/rate-limit'
import { authCors } from '@/lib/cors'
import { authSecurityHeaders } from '@/lib/security-headers'
import { authSanitizer } from '@/lib/sanitization'
import { logLogin } from '@/lib/auth-logger'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Apply rate limiting
    const rateLimitResult = await authRateLimit.middleware(request, async () => {
      // Apply CORS and security headers
      const corsHandler = authCors.middleware(async (req) => {
        const securityHandler = authSecurityHeaders.middleware(async (secReq) => {
          return NextResponse.json({ success: true })
        })
        return await securityHandler(req)
      })
      return await corsHandler(request)
    })

    if (rateLimitResult.status === 429) {
      await logLogin(request, false, { 
        error: 'Rate limit exceeded',
        duration: Date.now() - startTime 
      })
      return rateLimitResult
    }

    const body = await request.json()
    const sanitizedBody = authSanitizer.sanitizeObject(body)
    
    const validation = validateLoginData(sanitizedBody)
    if (!validation.isValid) {
      await logLogin(request, false, { 
        error: 'Validation failed',
        metadata: { errors: validation.errors },
        duration: Date.now() - startTime 
      })
      return authSecurityHeaders.applyHeaders(NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed', 
          details: validation.errors 
        },
        { status: 400 }
      ))
    }
    
    const { email, password } = validation.data!
    
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        emailVerified: true,
        createdAt: true
      }
    })
    
    if (!user) {
      await logLogin(request, false, { 
        email,
        error: 'User not found',
        duration: Date.now() - startTime 
      })
      return authSecurityHeaders.applyHeaders(NextResponse.json(
        { 
          success: false, 
          error: 'Invalid email or password' 
        },
        { status: 401 }
      ))
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password)
    
    if (!isPasswordValid) {
      await logLogin(request, false, { 
        userId: user.id,
        email: user.email,
        error: 'Invalid password',
        duration: Date.now() - startTime 
      })
      return authSecurityHeaders.applyHeaders(NextResponse.json(
        { 
          success: false, 
          error: 'Invalid email or password' 
        },
        { status: 401 }
      ))
    }

    // Check if email is verified
    if (!user.emailVerified) {
      await logLogin(request, false, { 
        userId: user.id,
        email: user.email,
        error: 'Email not verified',
        duration: Date.now() - startTime 
      })
      return authSecurityHeaders.applyHeaders(NextResponse.json(
        { 
          success: false, 
          error: 'Please verify your email before logging in',
          code: 'EMAIL_NOT_VERIFIED',
          data: {
            email: user.email,
            requiresVerification: true
          }
        },
        { status: 403 }
      ))
    }
    
    // Create token pair with new JWT service
    const { accessToken, refreshToken } = await JWTService.createTokenPair({ 
      userId: user.id, 
      email: user.email 
    })
    
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt
    }
    
    // Log successful login
    await logLogin(request, true, { 
      userId: user.id,
      email: user.email,
      duration: Date.now() - startTime 
    })
    
    const response = authSecurityHeaders.applyHeaders(NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        user: userResponse,
        token: accessToken // Keep backward compatibility
      },
      { status: 200 }
    ))
    
    // Set both access and refresh tokens
    response.cookies.set('access-token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 // 15 minutes
    })
    
    response.cookies.set('refresh-token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })
    
    // Keep legacy cookie for backward compatibility
    response.cookies.set('auth-token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 // 15 minutes
    })
    
    return response
    
  } catch (error) {
    console.error('Login error:', error)
    await logLogin(request, false, { 
      error: 'Internal server error',
      metadata: { errorMessage: error instanceof Error ? error.message : 'Unknown error' },
      duration: Date.now() - startTime 
    })
    return authSecurityHeaders.applyHeaders(NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    ))
  }
}