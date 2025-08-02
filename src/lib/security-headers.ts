import { NextRequest, NextResponse } from 'next/server'

interface SecurityHeadersOptions {
  contentSecurityPolicy?: string | boolean
  xFrameOptions?: 'DENY' | 'SAMEORIGIN' | string | boolean
  xContentTypeOptions?: boolean
  referrerPolicy?: string | boolean
  permissionsPolicy?: string | boolean
  strictTransportSecurity?: string | boolean
  xXSSProtection?: boolean
  expectCertificateTransparency?: boolean
  crossOriginEmbedderPolicy?: string | boolean
  crossOriginOpenerPolicy?: string | boolean
  crossOriginResourcePolicy?: string | boolean
}

const DEFAULT_SECURITY_HEADERS: Required<SecurityHeadersOptions> = {
  contentSecurityPolicy: process.env.NODE_ENV === 'development' 
    ? "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; connect-src 'self' https: ws: wss:;"
    : "default-src 'self'; script-src 'self' 'unsafe-inline' https://vercel.live; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https:; frame-ancestors 'none';",
  xFrameOptions: 'DENY',
  xContentTypeOptions: true,
  referrerPolicy: 'strict-origin-when-cross-origin',
  permissionsPolicy: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=()',
  strictTransportSecurity: process.env.NODE_ENV === 'production' 
    ? 'max-age=31536000; includeSubDomains; preload'
    : false,
  xXSSProtection: true,
  expectCertificateTransparency: process.env.NODE_ENV === 'production',
  crossOriginEmbedderPolicy: 'credentialless',
  crossOriginOpenerPolicy: 'same-origin',
  crossOriginResourcePolicy: 'same-origin'
}

export class SecurityHeaders {
  private options: Required<SecurityHeadersOptions>

  constructor(options: SecurityHeadersOptions = {}) {
    this.options = { ...DEFAULT_SECURITY_HEADERS, ...options }
  }

  private setHeader(response: NextResponse, name: string, value: string | boolean) {
    if (value === false) return
    if (value === true) {
      // For boolean true values, use a default header value
      switch (name) {
        case 'X-Content-Type-Options':
          response.headers.set(name, 'nosniff')
          break
        case 'X-XSS-Protection':
          response.headers.set(name, '1; mode=block')
          break
        case 'Expect-Certificate-Transparency':
          response.headers.set(name, 'max-age=86400, enforce')
          break
        default:
          response.headers.set(name, '1')
      }
    } else {
      response.headers.set(name, value)
    }
  }

  applyHeaders(response: NextResponse): NextResponse {
    // Content Security Policy
    if (this.options.contentSecurityPolicy) {
      this.setHeader(response, 'Content-Security-Policy', this.options.contentSecurityPolicy)
    }

    // X-Frame-Options
    if (this.options.xFrameOptions) {
      this.setHeader(response, 'X-Frame-Options', this.options.xFrameOptions)
    }

    // X-Content-Type-Options
    if (this.options.xContentTypeOptions) {
      this.setHeader(response, 'X-Content-Type-Options', this.options.xContentTypeOptions)
    }

    // Referrer Policy
    if (this.options.referrerPolicy) {
      this.setHeader(response, 'Referrer-Policy', this.options.referrerPolicy)
    }

    // Permissions Policy
    if (this.options.permissionsPolicy) {
      this.setHeader(response, 'Permissions-Policy', this.options.permissionsPolicy)
    }

    // Strict Transport Security (HTTPS only)
    if (this.options.strictTransportSecurity) {
      this.setHeader(response, 'Strict-Transport-Security', this.options.strictTransportSecurity)
    }

    // X-XSS-Protection
    if (this.options.xXSSProtection) {
      this.setHeader(response, 'X-XSS-Protection', this.options.xXSSProtection)
    }

    // Expect Certificate Transparency
    if (this.options.expectCertificateTransparency) {
      this.setHeader(response, 'Expect-Certificate-Transparency', this.options.expectCertificateTransparency)
    }

    // Cross-Origin Embedder Policy
    if (this.options.crossOriginEmbedderPolicy) {
      this.setHeader(response, 'Cross-Origin-Embedder-Policy', this.options.crossOriginEmbedderPolicy)
    }

    // Cross-Origin Opener Policy
    if (this.options.crossOriginOpenerPolicy) {
      this.setHeader(response, 'Cross-Origin-Opener-Policy', this.options.crossOriginOpenerPolicy)
    }

    // Cross-Origin Resource Policy
    if (this.options.crossOriginResourcePolicy) {
      this.setHeader(response, 'Cross-Origin-Resource-Policy', this.options.crossOriginResourcePolicy)
    }

    // Additional security headers
    response.headers.set('X-DNS-Prefetch-Control', 'off')
    response.headers.set('X-Download-Options', 'noopen')
    response.headers.set('X-Permitted-Cross-Domain-Policies', 'none')

    return response
  }

  middleware(handler: (request: NextRequest) => Promise<NextResponse>) {
    return async (request: NextRequest): Promise<NextResponse> => {
      const response = await handler(request)
      return this.applyHeaders(response)
    }
  }
}

// Create default security headers instance
export const defaultSecurityHeaders = new SecurityHeaders()

// Convenience function for applying security headers
export function withSecurityHeaders(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options?: SecurityHeadersOptions
) {
  const securityHeaders = options ? new SecurityHeaders(options) : defaultSecurityHeaders
  return securityHeaders.middleware(handler)
}

// Specific configurations for different environments/routes

// Development-friendly headers (more permissive CSP)
export const developmentSecurityHeaders = new SecurityHeaders({
  contentSecurityPolicy: "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; connect-src 'self' https: ws: wss: http://localhost:*;",
  strictTransportSecurity: false,
  expectCertificateTransparency: false
})

// Production security headers (strict)
export const productionSecurityHeaders = new SecurityHeaders({
  contentSecurityPolicy: "default-src 'self'; script-src 'self' 'sha256-YOUR_SCRIPT_HASH_HERE'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https:; frame-ancestors 'none'; base-uri 'self'; object-src 'none';",
  strictTransportSecurity: 'max-age=63072000; includeSubDomains; preload',
  expectCertificateTransparency: true
})

// API-specific security headers
export const apiSecurityHeaders = new SecurityHeaders({
  contentSecurityPolicy: "default-src 'none'",
  xFrameOptions: 'DENY',
  crossOriginResourcePolicy: 'same-site',
  crossOriginOpenerPolicy: 'same-origin'
})

// Auth-specific security headers (extra strict for sensitive operations)
export const authSecurityHeaders = new SecurityHeaders({
  contentSecurityPolicy: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';",
  xFrameOptions: 'DENY',
  strictTransportSecurity: process.env.NODE_ENV === 'production' 
    ? 'max-age=31536000; includeSubDomains; preload'
    : false,
  crossOriginResourcePolicy: 'same-origin',
  crossOriginOpenerPolicy: 'same-origin',
  crossOriginEmbedderPolicy: 'require-corp'
})

// Utility functions for CSP management
export class CSPBuilder {
  private directives: Record<string, string[]> = {}

  directive(name: string, values: string[]): this {
    this.directives[name] = values
    return this
  }

  defaultSrc(sources: string[]): this {
    return this.directive('default-src', sources)
  }

  scriptSrc(sources: string[]): this {
    return this.directive('script-src', sources)
  }

  styleSrc(sources: string[]): this {
    return this.directive('style-src', sources)
  }

  imgSrc(sources: string[]): this {
    return this.directive('img-src', sources)
  }

  connectSrc(sources: string[]): this {
    return this.directive('connect-src', sources)
  }

  fontSrc(sources: string[]): this {
    return this.directive('font-src', sources)
  }

  frameSrc(sources: string[]): this {
    return this.directive('frame-src', sources)
  }

  frameAncestors(sources: string[]): this {
    return this.directive('frame-ancestors', sources)
  }

  objectSrc(sources: string[]): this {
    return this.directive('object-src', sources)
  }

  mediaSrc(sources: string[]): this {
    return this.directive('media-src', sources)
  }

  build(): string {
    return Object.entries(this.directives)
      .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
      .join('; ')
  }
}

// Helper to create CSP hash for inline scripts
export function createCSPHash(content: string, algorithm: 'sha256' | 'sha384' | 'sha512' = 'sha256'): string {
  const crypto = require('crypto')
  const hash = crypto.createHash(algorithm).update(content).digest('base64')
  return `'${algorithm}-${hash}'`
}

// Security headers for specific content types
export function getSecurityHeadersForContentType(contentType: string): SecurityHeadersOptions {
  switch (true) {
    case contentType.includes('application/json'):
      return {
        contentSecurityPolicy: "default-src 'none'",
        xContentTypeOptions: true,
        xFrameOptions: 'DENY'
      }
    
    case contentType.includes('text/html'):
      return DEFAULT_SECURITY_HEADERS
    
    case contentType.includes('image/'):
      return {
        contentSecurityPolicy: "default-src 'none'",
        xContentTypeOptions: true,
        crossOriginResourcePolicy: 'cross-origin'
      }
    
    default:
      return {
        xContentTypeOptions: true,
        xFrameOptions: 'DENY'
      }
  }
}

// Validate security headers configuration
export function validateSecurityHeaders(options: SecurityHeadersOptions): { valid: boolean; warnings: string[] } {
  const warnings: string[] = []

  // Check for common CSP issues
  if (typeof options.contentSecurityPolicy === 'string') {
    if (options.contentSecurityPolicy.includes("'unsafe-inline'") && 
        options.contentSecurityPolicy.includes("'unsafe-eval'")) {
      warnings.push("CSP contains both 'unsafe-inline' and 'unsafe-eval' which reduces security")
    }
    
    if (!options.contentSecurityPolicy.includes('frame-ancestors')) {
      warnings.push("CSP missing 'frame-ancestors' directive")
    }
  }

  // Check HSTS in production
  if (process.env.NODE_ENV === 'production' && !options.strictTransportSecurity) {
    warnings.push("HSTS should be enabled in production")
  }

  // Check for permissive X-Frame-Options
  if (options.xFrameOptions && 
      typeof options.xFrameOptions === 'string' && 
      !['DENY', 'SAMEORIGIN'].includes(options.xFrameOptions.toUpperCase())) {
    warnings.push("X-Frame-Options should be 'DENY' or 'SAMEORIGIN' for better security")
  }

  return {
    valid: warnings.length === 0,
    warnings
  }
}