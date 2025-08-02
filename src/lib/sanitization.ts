import { NextRequest } from 'next/server'

interface SanitizationOptions {
  allowHtml?: boolean
  maxLength?: number
  trimWhitespace?: boolean
  removeControlChars?: boolean
  normalizeUnicode?: boolean
  preventXSS?: boolean
  preventSQLInjection?: boolean
  allowedTags?: string[]
  allowedAttributes?: string[]
}

const DEFAULT_SANITIZATION_OPTIONS: SanitizationOptions = {
  allowHtml: false,
  maxLength: 10000,
  trimWhitespace: true,
  removeControlChars: true,
  normalizeUnicode: true,
  preventXSS: true,
  preventSQLInjection: true,
  allowedTags: [],
  allowedAttributes: []
}

export class InputSanitizer {
  private options: SanitizationOptions

  constructor(options: SanitizationOptions = {}) {
    this.options = { ...DEFAULT_SANITIZATION_OPTIONS, ...options }
  }

  sanitizeString(input: string): string {
    if (typeof input !== 'string') {
      return ''
    }

    let sanitized = input

    // Trim whitespace
    if (this.options.trimWhitespace) {
      sanitized = sanitized.trim()
    }

    // Remove control characters (except newline, carriage return, and tab)
    if (this.options.removeControlChars) {
      sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    }

    // Normalize Unicode
    if (this.options.normalizeUnicode) {
      sanitized = sanitized.normalize('NFC')
    }

    // Limit length
    if (this.options.maxLength && sanitized.length > this.options.maxLength) {
      sanitized = sanitized.substring(0, this.options.maxLength)
    }

    // Prevent XSS
    if (this.options.preventXSS) {
      sanitized = this.preventXSS(sanitized)
    }

    // Prevent SQL Injection
    if (this.options.preventSQLInjection) {
      sanitized = this.preventSQLInjection(sanitized)
    }

    // Handle HTML
    if (!this.options.allowHtml) {
      sanitized = this.stripHTML(sanitized)
    } else {
      sanitized = this.sanitizeHTML(sanitized)
    }

    return sanitized
  }

  private preventXSS(input: string): string {
    // HTML encode dangerous characters
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .replace(/`/g, '&#96;')
      .replace(/=/g, '&#61;')
  }

  private preventSQLInjection(input: string): string {
    // Remove or escape common SQL injection patterns
    return input
      .replace(/('|(\\'))+/g, '') // Remove single quotes and escaped quotes
      .replace(/("|(\\")+)/g, '') // Remove double quotes and escaped quotes
      .replace(/;/g, '') // Remove semicolons
      .replace(/--/g, '') // Remove SQL comments
      .replace(/\/\*/g, '') // Remove start of multi-line comments
      .replace(/\*\//g, '') // Remove end of multi-line comments
      .replace(/\bUNION\b/gi, '') // Remove UNION keyword
      .replace(/\bSELECT\b/gi, '') // Remove SELECT keyword
      .replace(/\bINSERT\b/gi, '') // Remove INSERT keyword
      .replace(/\bUPDATE\b/gi, '') // Remove UPDATE keyword
      .replace(/\bDELETE\b/gi, '') // Remove DELETE keyword
      .replace(/\bDROP\b/gi, '') // Remove DROP keyword
      .replace(/\bCREATE\b/gi, '') // Remove CREATE keyword
      .replace(/\bALTER\b/gi, '') // Remove ALTER keyword
      .replace(/\bEXEC\b/gi, '') // Remove EXEC keyword
      .replace(/\bSCRIPT\b/gi, '') // Remove SCRIPT keyword
  }

  private stripHTML(input: string): string {
    // Remove all HTML tags
    return input.replace(/<[^>]*>/g, '')
  }

  private sanitizeHTML(input: string): string {
    // Simple HTML sanitization - in production, use a library like DOMPurify
    const allowedTags = this.options.allowedTags || ['b', 'i', 'em', 'strong', 'p', 'br']
    const allowedAttributes = this.options.allowedAttributes || []

    // Remove script tags completely
    let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    
    // Remove dangerous event handlers
    sanitized = sanitized.replace(/\bon\w+\s*=/gi, '')
    
    // Remove javascript: protocols
    sanitized = sanitized.replace(/javascript:/gi, '')
    
    // Remove data: URLs (can contain scripts)
    sanitized = sanitized.replace(/data:\s*[^;]+;[^,]+,/gi, '')

    // If specific tags are allowed, remove others
    if (allowedTags.length > 0) {
      const tagPattern = new RegExp(`<(?!\/?(${allowedTags.join('|')})\b)[^>]*>`, 'gi')
      sanitized = sanitized.replace(tagPattern, '')
    }

    // Remove disallowed attributes
    if (allowedAttributes.length > 0) {
      const attrPattern = new RegExp(`\\s(?!${allowedAttributes.join('|')})[\\w-]+\\s*=\\s*"[^"]*"`, 'gi')
      sanitized = sanitized.replace(attrPattern, '')
    }

    return sanitized
  }

  sanitizeObject(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj
    }

    if (typeof obj === 'string') {
      return this.sanitizeString(obj)
    }

    if (typeof obj === 'number' || typeof obj === 'boolean') {
      return obj
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item))
    }

    if (typeof obj === 'object') {
      const sanitized: any = {}
      for (const [key, value] of Object.entries(obj)) {
        // Sanitize the key as well
        const sanitizedKey = this.sanitizeString(key)
        sanitized[sanitizedKey] = this.sanitizeObject(value)
      }
      return sanitized
    }

    return obj
  }

  // Validate and sanitize email addresses
  sanitizeEmail(email: string): string | null {
    if (typeof email !== 'string') return null

    // Basic sanitization
    let sanitized = email.toLowerCase().trim()

    // Remove dangerous characters
    sanitized = sanitized.replace(/[<>"'();\\]/g, '')

    // Validate email format
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
    
    if (!emailRegex.test(sanitized)) {
      return null
    }

    // Additional checks for suspicious patterns
    if (sanitized.includes('..') || 
        sanitized.startsWith('.') || 
        sanitized.endsWith('.') ||
        sanitized.includes('@.') ||
        sanitized.includes('.@')) {
      return null
    }

    return sanitized
  }

  // Sanitize URLs
  sanitizeURL(url: string): string | null {
    if (typeof url !== 'string') return null

    try {
      const parsed = new URL(url)
      
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return null
      }

      // Remove dangerous characters from the URL
      const sanitized = url.replace(/[<>"'();\\]/g, '')
      
      // Validate the sanitized URL
      new URL(sanitized) // This will throw if invalid
      
      return sanitized
    } catch {
      return null
    }
  }

  // Sanitize phone numbers
  sanitizePhoneNumber(phone: string): string | null {
    if (typeof phone !== 'string') return null

    // Remove all non-digit characters except + at the beginning
    let sanitized = phone.replace(/[^\d+]/g, '')
    
    // Ensure + is only at the beginning
    if (sanitized.includes('+')) {
      const parts = sanitized.split('+')
      sanitized = '+' + parts.join('')
    }

    // Basic validation (adjust regex based on your requirements)
    const phoneRegex = /^(\+\d{1,3}[- ]?)?\d{10,14}$/
    
    if (!phoneRegex.test(sanitized)) {
      return null
    }

    return sanitized
  }

  // Sanitize JSON data
  sanitizeJSON(jsonString: string): any {
    try {
      const parsed = JSON.parse(jsonString)
      return this.sanitizeObject(parsed)
    } catch {
      return null
    }
  }
}

// Specific sanitizers for different use cases
export class AuthInputSanitizer extends InputSanitizer {
  constructor() {
    super({
      allowHtml: false,
      maxLength: 500,
      preventXSS: true,
      preventSQLInjection: true,
      trimWhitespace: true,
      removeControlChars: true
    })
  }
}

export class SearchInputSanitizer extends InputSanitizer {
  constructor() {
    super({
      allowHtml: false,
      maxLength: 1000,
      preventXSS: true,
      preventSQLInjection: false, // Search might need special characters
      trimWhitespace: true,
      removeControlChars: true
    })
  }
}

export class ContentSanitizer extends InputSanitizer {
  constructor() {
    super({
      allowHtml: true,
      allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'a'],
      allowedAttributes: ['href', 'title'],
      maxLength: 50000,
      preventXSS: true,
      preventSQLInjection: true,
      trimWhitespace: true
    })
  }
}

// Create default instances
export const defaultSanitizer = new InputSanitizer()
export const authSanitizer = new AuthInputSanitizer()
export const searchSanitizer = new SearchInputSanitizer()
export const contentSanitizer = new ContentSanitizer()

// Convenience functions
export function sanitizeString(input: string, options?: SanitizationOptions): string {
  const sanitizer = options ? new InputSanitizer(options) : defaultSanitizer
  return sanitizer.sanitizeString(input)
}

export function sanitizeObject(obj: any, options?: SanitizationOptions): any {
  const sanitizer = options ? new InputSanitizer(options) : defaultSanitizer
  return sanitizer.sanitizeObject(obj)
}

export function sanitizeEmail(email: string): string | null {
  return defaultSanitizer.sanitizeEmail(email)
}

export function sanitizeURL(url: string): string | null {
  return defaultSanitizer.sanitizeURL(url)
}

export function sanitizePhoneNumber(phone: string): string | null {
  return defaultSanitizer.sanitizePhoneNumber(phone)
}

// Middleware for request sanitization
export function createSanitizationMiddleware(sanitizer: InputSanitizer = defaultSanitizer) {
  return async (request: NextRequest) => {
    // Get the request body if it exists
    if (request.body) {
      try {
        const contentType = request.headers.get('content-type')
        
        if (contentType?.includes('application/json')) {
          const body = await request.json()
          const sanitizedBody = sanitizer.sanitizeObject(body)
          
          // Create a new request with sanitized body
          return new NextRequest(request.url, {
            method: request.method,
            headers: request.headers,
            body: JSON.stringify(sanitizedBody)
          })
        }
        
        if (contentType?.includes('application/x-www-form-urlencoded')) {
          const formData = await request.formData()
          const sanitizedData = new FormData()
          
          for (const [key, value] of formData.entries()) {
            const sanitizedKey = sanitizer.sanitizeString(key)
            const sanitizedValue = typeof value === 'string' 
              ? sanitizer.sanitizeString(value)
              : value
            sanitizedData.append(sanitizedKey, sanitizedValue)
          }
          
          return new NextRequest(request.url, {
            method: request.method,
            headers: request.headers,
            body: sanitizedData
          })
        }
      } catch (error) {
        console.error('Failed to sanitize request:', error)
      }
    }
    
    return request
  }
}

// Rate limiting for sanitization (prevent abuse)
const sanitizationAttempts = new Map<string, { count: number; resetTime: number }>()

export function checkSanitizationRateLimit(ip: string, maxAttempts = 100, windowMs = 60000): boolean {
  const now = Date.now()
  const record = sanitizationAttempts.get(ip)
  
  if (!record || record.resetTime <= now) {
    sanitizationAttempts.set(ip, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  if (record.count >= maxAttempts) {
    return false
  }
  
  record.count++
  return true
}

// Input validation patterns
export const VALIDATION_PATTERNS = {
  email: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
  phone: /^(\+\d{1,3}[- ]?)?\d{10,14}$/,
  url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  username: /^[a-zA-Z0-9_-]{3,20}$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  hexColor: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
}

// Utility to validate input against patterns
export function validateInput(input: string, pattern: RegExp | keyof typeof VALIDATION_PATTERNS): boolean {
  if (typeof pattern === 'string') {
    pattern = VALIDATION_PATTERNS[pattern]
  }
  return pattern.test(input)
}

// Export types for external use
export type { SanitizationOptions }