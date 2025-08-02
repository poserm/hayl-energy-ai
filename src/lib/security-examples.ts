/**
 * Security Features Usage Examples
 * 
 * This file demonstrates how to use all the security utilities
 * created for the Hayl Energy AI application.
 */

import { NextRequest, NextResponse } from 'next/server'
import { JWTService } from './jwt'
import { createRateLimit, authRateLimit } from './rate-limit'
import { withCors, authCors } from './cors'
import { withSecurityHeaders, authSecurityHeaders } from './security-headers'
import { 
  sanitizeString, 
  sanitizeEmail, 
  authSanitizer
} from './sanitization'
import { passwordChecker } from './password-strength'
import { logAuthEvent, authLogger } from './auth-logger'

// Example 1: Basic JWT Usage
export async function exampleJWTUsage() {
  // Create token pair for a user
  const tokenPair = await JWTService.createTokenPair({
    userId: 'user-123',
    email: 'user@example.com'
  })

  console.log('Access Token:', tokenPair.accessToken)
  console.log('Refresh Token:', tokenPair.refreshToken)

  // Verify access token
  const payload = await JWTService.verifyAccessToken(tokenPair.accessToken)
  console.log('Token Payload:', payload)

  // Check if token is expiring soon
  if (payload && JWTService.isTokenExpiringSoon(payload)) {
    console.log('Token is expiring soon, should refresh')
  }
}

// Example 2: Rate Limiting Implementation
export async function exampleRateLimit(request: NextRequest) {
  // Create custom rate limiter
  const customRateLimit = createRateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 requests per minute
    onLimitReached: (req) => {
      console.log('Rate limit exceeded for:', req.headers.get('x-forwarded-for'))
    }
  })

  // Use rate limiting middleware
  return await customRateLimit.middleware(request, async () => {
    return NextResponse.json({ message: 'Request processed successfully' })
  })
}

// Example 3: CORS Configuration
export async function exampleCORS(request: NextRequest) {
  // Apply CORS to an API handler
  const handler = withCors(async (req: NextRequest) => {
    return NextResponse.json({ data: 'API response' })
  }, {
    origin: ['https://yourdomain.com', 'https://app.yourdomain.com'],
    credentials: true,
    methods: ['GET', 'POST']
  })

  return await handler(request)
}

// Example 4: Security Headers
export async function exampleSecurityHeaders(request: NextRequest) {
  // Apply security headers to response
  const handler = withSecurityHeaders(async (req: NextRequest) => {
    return NextResponse.json({ message: 'Secure response' })
  }, {
    contentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-inline'",
    xFrameOptions: 'DENY',
    strictTransportSecurity: 'max-age=31536000; includeSubDomains'
  })

  return await handler(request)
}

// Example 5: Input Sanitization
export function exampleInputSanitization() {
  // Sanitize user input
  const userInput = "<script>alert('xss')</script>Hello World!"
  const sanitized = sanitizeString(userInput)
  console.log('Sanitized:', sanitized) // "Hello World!"

  // Validate and sanitize email
  const email = "  USER@EXAMPLE.COM  "
  const cleanEmail = sanitizeEmail(email)
  console.log('Clean Email:', cleanEmail) // "user@example.com"

  // Sanitize object data
  const userData = {
    name: "<script>alert('hack')</script>John",
    email: "john@example.com",
    bio: "I love <b>coding</b> and <script>alert('xss')</script>"
  }
  const sanitizedData = authSanitizer.sanitizeObject(userData)
  console.log('Sanitized Data:', sanitizedData)
}

// Example 6: Password Strength Validation
export function examplePasswordValidation() {
  const password = "MySecureP@ss123"
  const result = passwordChecker.checkPassword(password, ['john', 'doe'])

  console.log('Password Score:', result.score)
  console.log('Password Strength:', result.strength)
  console.log('Is Valid:', result.isValid)
  console.log('Feedback:', result.feedback)
  console.log('Time to Crack:', result.timeToCrack)

  // Generate secure password
  const securePassword = passwordChecker.generateSecurePassword(16)
  console.log('Generated Password:', securePassword)
}

// Example 7: Authentication Logging
export async function exampleAuthLogging(request: NextRequest) {
  // Log authentication events
  await logAuthEvent('login_attempt', request, {
    success: false,
    email: 'user@example.com',
    error: 'Invalid password',
    duration: 150
  })

  // Get recent auth statistics
  const stats = authLogger.getAuthStats('day')
  console.log('Auth Stats:', stats)

  // Get recent security alerts
  const alerts = authLogger.getRecentAlerts(10)
  console.log('Recent Alerts:', alerts)
}

// Example 8: Complete Secure API Endpoint
export async function secureAPIEndpoint(request: NextRequest) {
  const startTime = Date.now()

  try {
    // 1. Apply rate limiting
    const rateLimitResult = await authRateLimit.middleware(request, async () => {
      return NextResponse.json({ success: true })
    })

    if (rateLimitResult.status === 429) {
      await logAuthEvent('rate_limit_exceeded', request, {
        success: false,
        error: 'Rate limit exceeded',
        duration: Date.now() - startTime
      })
      return rateLimitResult
    }

    // 2. Parse and sanitize input
    const body = await request.json()
    const sanitizedBody = authSanitizer.sanitizeObject(body)

    // 3. Validate input
    if (!sanitizedBody.email || !sanitizedBody.password) {
      return authSecurityHeaders.applyHeaders(NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      ))
    }

    // 4. Check password strength
    const passwordCheck = passwordChecker.checkPassword(sanitizedBody.password)
    if (!passwordCheck.isValid) {
      return authSecurityHeaders.applyHeaders(NextResponse.json(
        { 
          success: false, 
          error: 'Password does not meet requirements',
          details: passwordCheck.feedback 
        },
        { status: 400 }
      ))
    }

    // 5. Verify JWT token
    const { accessToken } = await JWTService.getTokenFromRequest(request)
    if (!accessToken) {
      return authSecurityHeaders.applyHeaders(NextResponse.json(
        { success: false, error: 'No token provided' },
        { status: 401 }
      ))
    }

    const tokenPayload = await JWTService.verifyAccessToken(accessToken)
    if (!tokenPayload) {
      await logAuthEvent('invalid_token', request, {
        success: false,
        error: 'Invalid token',
        duration: Date.now() - startTime
      })
      return authSecurityHeaders.applyHeaders(NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      ))
    }

    // 6. Process the request
    const result = { 
      message: 'Request processed successfully',
      userId: tokenPayload.userId 
    }

    // 7. Log successful operation
    await logAuthEvent('login_success', request, {
      success: true,
      userId: tokenPayload.userId,
      duration: Date.now() - startTime
    })

    // 8. Return secure response with headers
    return authSecurityHeaders.applyHeaders(NextResponse.json(
      { success: true, data: result },
      { status: 200 }
    ))

  } catch (error) {
    console.error('API Error:', error)
    await logAuthEvent('suspicious_activity', request, {
      success: false,
      error: 'Internal server error',
      metadata: { errorMessage: error instanceof Error ? error.message : 'Unknown error' },
      duration: Date.now() - startTime
    })

    return authSecurityHeaders.applyHeaders(NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    ))
  }
}

// Example 9: Protected Route with Multiple Security Layers
export function createProtectedRoute(handler: (request: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    // Layer 1: Rate limiting
    const rateLimited = await authRateLimit.middleware(request, async () => {
      // Layer 2: CORS
      const corsHandler = authCors.middleware(async (req) => {
        // Layer 3: Security headers
        const securityHandler = authSecurityHeaders.middleware(async (secReq) => {
          // Layer 4: Authentication
          const { accessToken } = await JWTService.getTokenFromRequest(secReq)
          if (!accessToken) {
            return NextResponse.json(
              { success: false, error: 'Authentication required' },
              { status: 401 }
            )
          }

          const tokenPayload = await JWTService.verifyAccessToken(accessToken)
          if (!tokenPayload) {
            return NextResponse.json(
              { success: false, error: 'Invalid token' },
              { status: 401 }
            )
          }

          // Add user info to request
          const requestWithUser = new NextRequest(secReq.url, {
            method: secReq.method,
            headers: {
              ...Object.fromEntries(secReq.headers.entries()),
              'x-user-id': tokenPayload.userId,
              'x-user-email': tokenPayload.email
            },
            body: secReq.body
          })

          // Layer 5: Execute the actual handler
          return await handler(requestWithUser)
        })
        return await securityHandler(req)
      })
      return await corsHandler(request)
    })

    return rateLimited
  }
}

// Example 10: Environment-specific Security Configuration
export function getSecurityConfig() {
  const isProduction = process.env.NODE_ENV === 'production'
  
  return {
    jwt: {
      accessTokenExpiry: isProduction ? '15m' : '1h',
      refreshTokenExpiry: isProduction ? '7d' : '30d',
      issuer: process.env.JWT_ISSUER || 'hayl-energy-ai',
      audience: process.env.JWT_AUDIENCE || 'hayl-energy-ai-users'
    },
    rateLimit: {
      authAttempts: isProduction ? 5 : 50,
      apiCalls: isProduction ? 100 : 1000,
      windowMs: isProduction ? 15 * 60 * 1000 : 60 * 1000
    },
    cors: {
      origins: isProduction 
        ? [process.env.NEXTAUTH_URL!, 'https://hayl-energy-ai.vercel.app']
        : ['http://localhost:3000', 'http://127.0.0.1:3000']
    },
    security: {
      enableHSTS: isProduction,
      enableCSP: true,
      strictMode: isProduction
    },
    logging: {
      enableExternalLogging: isProduction,
      logLevel: isProduction ? 'info' : 'debug',
      enableSecurityAlerts: true
    }
  }
}

// Export all examples for documentation
export const securityExamples = {
  exampleJWTUsage,
  exampleRateLimit,
  exampleCORS,
  exampleSecurityHeaders,
  exampleInputSanitization,
  examplePasswordValidation,
  exampleAuthLogging,
  secureAPIEndpoint,
  createProtectedRoute,
  getSecurityConfig
}