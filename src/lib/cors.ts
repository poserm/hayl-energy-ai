import { NextRequest, NextResponse } from 'next/server'

interface CorsOptions {
  origin?: string | string[] | ((origin: string) => boolean)
  methods?: string[]
  allowedHeaders?: string[]
  exposedHeaders?: string[]
  credentials?: boolean
  maxAge?: number
  preflightContinue?: boolean
  optionsSuccessStatus?: number
}

const DEFAULT_CORS_OPTIONS: CorsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.NEXTAUTH_URL!, 'https://hayl-energy-ai.vercel.app']
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-API-Key',
    'X-Client-Version',
    'Accept',
    'Origin',
    'Cache-Control'
  ],
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
    'X-Total-Count'
  ],
  credentials: true,
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 200
}

export class CorsHandler {
  private options: CorsOptions

  constructor(options: CorsOptions = {}) {
    this.options = { ...DEFAULT_CORS_OPTIONS, ...options }
  }

  private isOriginAllowed(origin: string): boolean {
    if (!this.options.origin) return false

    if (typeof this.options.origin === 'string') {
      return this.options.origin === '*' || this.options.origin === origin
    }

    if (Array.isArray(this.options.origin)) {
      return this.options.origin.includes(origin) || this.options.origin.includes('*')
    }

    if (typeof this.options.origin === 'function') {
      return this.options.origin(origin)
    }

    return false
  }

  private setCorsHeaders(response: NextResponse, request: NextRequest): NextResponse {
    const origin = request.headers.get('origin')
    
    // Set origin header
    if (origin && this.isOriginAllowed(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin)
    } else if (this.options.origin === '*') {
      response.headers.set('Access-Control-Allow-Origin', '*')
    }

    // Set credentials
    if (this.options.credentials) {
      response.headers.set('Access-Control-Allow-Credentials', 'true')
    }

    // Set allowed methods
    if (this.options.methods) {
      response.headers.set('Access-Control-Allow-Methods', this.options.methods.join(', '))
    }

    // Set allowed headers
    if (this.options.allowedHeaders) {
      response.headers.set('Access-Control-Allow-Headers', this.options.allowedHeaders.join(', '))
    }

    // Set exposed headers
    if (this.options.exposedHeaders) {
      response.headers.set('Access-Control-Expose-Headers', this.options.exposedHeaders.join(', '))
    }

    // Set max age for preflight
    if (this.options.maxAge) {
      response.headers.set('Access-Control-Max-Age', this.options.maxAge.toString())
    }

    return response
  }

  handleRequest(request: NextRequest): NextResponse | null {
    const origin = request.headers.get('origin')
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      const response = new NextResponse(null, { 
        status: this.options.optionsSuccessStatus || 200 
      })
      
      return this.setCorsHeaders(response, request)
    }

    // For non-preflight requests, we'll set headers in the middleware wrapper
    return null
  }

  middleware(handler: (request: NextRequest) => Promise<NextResponse>) {
    return async (request: NextRequest): Promise<NextResponse> => {
      // Handle preflight requests first
      const preflightResponse = this.handleRequest(request)
      if (preflightResponse) {
        return preflightResponse
      }

      // Process the actual request
      const response = await handler(request)
      
      // Add CORS headers to the response
      return this.setCorsHeaders(response, request)
    }
  }
}

// Create default CORS handler
export const defaultCorsHandler = new CorsHandler()

// Convenience function for API routes
export function withCors(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options?: CorsOptions
) {
  const corsHandler = options ? new CorsHandler(options) : defaultCorsHandler
  return corsHandler.middleware(handler)
}

// Environment-specific CORS configurations
export const developmentCors = new CorsHandler({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH']
})

export const productionCors = new CorsHandler({
  origin: [
    process.env.NEXTAUTH_URL!,
    'https://hayl-energy-ai.vercel.app',
    'https://www.hayl-energy-ai.com'
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  maxAge: 86400
})

export const apiCors = new CorsHandler({
  origin: process.env.NODE_ENV === 'production' ? ['https://hayl.energy'] : ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-API-Key',
    'X-Requested-With'
  ],
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset'
  ]
})

// Utility to validate CORS configuration
export function validateCorsConfig(options: CorsOptions): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Validate origin
  if (options.origin) {
    if (typeof options.origin === 'string' && options.origin !== '*') {
      try {
        new URL(options.origin)
      } catch {
        errors.push('Invalid origin URL format')
      }
    } else if (Array.isArray(options.origin)) {
      options.origin.forEach(origin => {
        if (typeof origin === 'string' && origin !== '*') {
          try {
            new URL(origin)
          } catch {
            errors.push(`Invalid origin URL format: ${origin}`)
          }
        }
      })
    }
  }

  // Validate methods
  const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD']
  if (options.methods) {
    options.methods.forEach(method => {
      if (!validMethods.includes(method.toUpperCase())) {
        errors.push(`Invalid HTTP method: ${method}`)
      }
    })
  }

  // Validate max age
  if (options.maxAge !== undefined && (options.maxAge < 0 || !Number.isInteger(options.maxAge))) {
    errors.push('maxAge must be a non-negative integer')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

// Security-focused CORS for authentication endpoints
export const authCors = new CorsHandler({
  origin: (origin: string) => {
    // Allow same-origin requests
    if (!origin) return true
    
    // In development, allow localhost
    if (process.env.NODE_ENV === 'development') {
      return origin.includes('localhost') || origin.includes('127.0.0.1')
    }
    
    // In production, only allow specific domains
    const allowedDomains = [
      process.env.NEXTAUTH_URL!,
      'https://hayl-energy-ai.vercel.app',
      'https://www.hayl-energy-ai.com'
    ].filter(Boolean)
    
    return allowedDomains.some(domain => origin.startsWith(domain))
  },
  credentials: true,
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-Requested-With'],
  maxAge: 300 // 5 minutes for auth endpoints
})

// Logging CORS violations
export function logCorsViolation(request: NextRequest, reason: string) {
  const origin = request.headers.get('origin')
  const userAgent = request.headers.get('user-agent')
  
  console.warn('CORS Violation:', {
    timestamp: new Date().toISOString(),
    origin,
    method: request.method,
    url: request.url,
    userAgent,
    reason
  })
  
  // In production, you might want to send this to a monitoring service
  if (process.env.NODE_ENV === 'production') {
    // Example: send to monitoring service
    // monitoringService.track('cors_violation', { origin, reason, url: request.url })
  }
}