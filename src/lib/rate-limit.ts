import { NextRequest, NextResponse } from 'next/server'

interface RateLimitOptions {
  windowMs: number
  maxRequests: number
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  keyGenerator?: (request: NextRequest) => string | Promise<string>
  onLimitReached?: (request: NextRequest) => void
}

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

class MemoryStore {
  private store: RateLimitStore = {}

  increment(key: string, windowMs: number): { count: number; resetTime: number } {
    const now = Date.now()
    const resetTime = now + windowMs

    if (!this.store[key] || this.store[key].resetTime <= now) {
      this.store[key] = { count: 1, resetTime }
    } else {
      this.store[key].count++
    }

    // Clean up expired entries
    this.cleanup()

    return this.store[key]
  }

  private cleanup() {
    const now = Date.now()
    Object.keys(this.store).forEach(key => {
      if (this.store[key].resetTime <= now) {
        delete this.store[key]
      }
    })
  }
}

const store = new MemoryStore()

export function createRateLimit(options: RateLimitOptions) {
  const {
    windowMs,
    maxRequests,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    keyGenerator = defaultKeyGenerator,
    onLimitReached
  } = options

  const rateLimiter = {
    check: async (request: NextRequest): Promise<{ allowed: boolean; remaining: number; resetTime: number }> => {
      const key = await keyGenerator(request)
      const { count, resetTime } = store.increment(key, windowMs)

      const allowed = count <= maxRequests
      const remaining = Math.max(0, maxRequests - count)

      if (!allowed && onLimitReached) {
        onLimitReached(request)
      }

      return { allowed, remaining, resetTime }
    },

    middleware: async (
      request: NextRequest,
      handler: () => Promise<NextResponse>
    ): Promise<NextResponse> => {
      const { allowed, remaining, resetTime } = await rateLimiter.check(request)

      if (!allowed) {
        return new NextResponse(
          JSON.stringify({
            success: false,
            error: 'Too many requests',
            message: 'Rate limit exceeded. Please try again later.',
            retryAfter: Math.ceil((resetTime - Date.now()) / 1000)
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'X-RateLimit-Limit': maxRequests.toString(),
              'X-RateLimit-Remaining': remaining.toString(),
              'X-RateLimit-Reset': resetTime.toString(),
              'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString()
            }
          }
        )
      }

      try {
        const response = await handler()
        
        // Add rate limit headers to successful responses
        response.headers.set('X-RateLimit-Limit', maxRequests.toString())
        response.headers.set('X-RateLimit-Remaining', remaining.toString())
        response.headers.set('X-RateLimit-Reset', resetTime.toString())

        // Skip counting successful requests if configured
        if (skipSuccessfulRequests && response.ok) {
          // Note: In a production environment, you'd want to decrement the counter here
          // This is a simplified implementation
        }

        return response
      } catch (error) {
        // Skip counting failed requests if configured
        if (skipFailedRequests) {
          // Note: In a production environment, you'd want to decrement the counter here
          // This is a simplified implementation
        }
        throw error
      }
    }
  }

  return rateLimiter
}

function defaultKeyGenerator(request: NextRequest): string {
  // Try to get IP from various headers (for reverse proxy setups)
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const clientIp = request.headers.get('x-client-ip')
  
  let ip = forwarded?.split(',')[0]?.trim() || 
           realIp || 
           clientIp || 
           'unknown'

  // For development/local testing
  if (ip === '::1' || ip === '127.0.0.1') {
    ip = 'localhost'
  }

  return `rate_limit:${ip}`
}

// Predefined rate limiters for different use cases
export const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 login attempts per 15 minutes
  onLimitReached: (request) => {
    console.warn(`Rate limit exceeded for auth endpoint from IP: ${request.headers.get('x-forwarded-for') || 'unknown'}`)
  }
})

export const signupRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 3, // 3 signup attempts per hour
  onLimitReached: (request) => {
    console.warn(`Signup rate limit exceeded from IP: ${request.headers.get('x-forwarded-for') || 'unknown'}`)
  }
})

export const apiRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 API calls per 15 minutes
})

export const passwordResetRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 3, // 3 password reset attempts per hour
})

// Enhanced rate limiter with user-based limits
export function createUserRateLimit(options: RateLimitOptions & { userIdExtractor?: (request: NextRequest) => Promise<string | null> }) {
  const {
    userIdExtractor = async () => null,
    ...rateLimitOptions
  } = options

  return createRateLimit({
    ...rateLimitOptions,
    keyGenerator: async (request: NextRequest) => {
      const userId = await userIdExtractor(request)
      if (userId) {
        return `rate_limit:user:${userId}`
      }
      return defaultKeyGenerator(request)
    }
  } as RateLimitOptions)
}

// Utility to create IP + endpoint specific rate limiting
export function createEndpointRateLimit(endpoint: string, options: Omit<RateLimitOptions, 'keyGenerator'>) {
  return createRateLimit({
    ...options,
    keyGenerator: (request: NextRequest) => {
      const ip = defaultKeyGenerator(request).replace('rate_limit:', '')
      return `rate_limit:${endpoint}:${ip}`
    }
  })
}