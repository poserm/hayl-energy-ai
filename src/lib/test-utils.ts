import { NextRequest, NextResponse } from 'next/server'
import { JWTService } from './jwt'
import bcrypt from 'bcryptjs'

// Test utilities for API testing
export class TestUtils {
  static createMockRequest(
    method: string,
    url: string,
    body?: any,
    headers: Record<string, string> = {}
  ): NextRequest {
    const requestHeaders = new Headers()
    Object.entries(headers).forEach(([key, value]) => {
      requestHeaders.set(key, value)
    })

    const requestInit: RequestInit = {
      method,
      headers: requestHeaders,
    }

    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      requestInit.body = JSON.stringify(body)
      requestHeaders.set('content-type', 'application/json')
    }

    // Convert relative URL to absolute URL for NextRequest
    const absoluteUrl = url.startsWith('http') ? url : `http://localhost:3000${url}`
    return new NextRequest(absoluteUrl, requestInit as any)
  }

  static async createTestUser(email: string, password: string, name?: string) {
    const hashedPassword = await bcrypt.hash(password, 12)
    return {
      email,
      password: hashedPassword,
      name,
      id: 'test-user-id',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }

  static async createTestTokens(userId: string, email: string) {
    return await JWTService.createTokenPair({ userId, email })
  }

  static async extractResponseData(response: NextResponse) {
    const text = await response.text()
    try {
      return JSON.parse(text)
    } catch {
      return { text }
    }
  }

  static createAuthHeaders(token: string) {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  }

  static createCookieHeaders(cookies: Record<string, string>) {
    const cookieString = Object.entries(cookies)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ')
    return { 'Cookie': cookieString }
  }

  static async waitFor(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  static generateTestEmail(prefix = 'test') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`
  }

  static generateTestPassword() {
    return 'TestPassword123!'
  }

  static mockPrismaUser(overrides: Partial<any> = {}) {
    return {
      id: 'test-user-id',
      email: 'test@example.com',
      password: '$2a$12$mockhashedpassword',
      name: 'Test User',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }
  }

  static createExpiredToken(userId: string, email: string) {
    // Create a token that expires immediately
    const payload = {
      userId,
      email,
      type: 'access' as const,
      iat: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      exp: Math.floor(Date.now() / 1000) - 1, // 1 second ago
    }
    return payload
  }

  static async simulateNetworkDelay(ms = 100) {
    await this.waitFor(ms)
  }

  static createMockFormData(data: Record<string, string>) {
    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value)
    })
    return formData
  }

  static assertValidResponse(response: any, expectedStatus = 200) {
    expect(response).toBeDefined()
    expect(response.status).toBe(expectedStatus)
  }

  static assertSuccessResponse(data: any) {
    expect(data).toBeDefined()
    expect(data.success).toBe(true)
  }

  static assertErrorResponse(data: any, expectedError?: string) {
    expect(data).toBeDefined()
    expect(data.success).toBe(false)
    expect(data.error).toBeDefined()
    if (expectedError) {
      expect(data.error).toBe(expectedError)
    }
  }

  static assertValidToken(token: string) {
    expect(token).toBeDefined()
    expect(typeof token).toBe('string')
    expect(token.length).toBeGreaterThan(0)
    expect(token.split('.').length).toBe(3) // JWT format
  }

  static assertValidUser(user: any) {
    expect(user).toBeDefined()
    expect(user.id).toBeDefined()
    expect(user.email).toBeDefined()
    expect(user.createdAt).toBeDefined()
    expect(user.password).toBeUndefined() // Should never return password
  }

  static async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 12)
  }
}

// Mock implementations for testing
export const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  $disconnect: jest.fn(),
}

export const mockBcrypt = {
  hash: jest.fn(),
  compare: jest.fn(),
}

export const mockJWT = {
  createTokenPair: jest.fn(),
  verifyAccessToken: jest.fn(),
  verifyRefreshToken: jest.fn(),
  signAccessToken: jest.fn(),
  signRefreshToken: jest.fn(),
}

// Test data factories
export const TestDataFactory = {
  user: (overrides: Partial<any> = {}) => ({
    id: `user-${Math.random().toString(36).substr(2, 9)}`,
    email: TestUtils.generateTestEmail(),
    password: TestUtils.generateTestPassword(),
    name: 'Test User',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  createUser: (overrides: Partial<any> = {}) => ({
    id: `user-${Math.random().toString(36).substr(2, 9)}`,
    email: TestUtils.generateTestEmail(),
    password: TestUtils.generateTestPassword(),
    name: 'Test User',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  loginRequest: (overrides: Partial<any> = {}) => ({
    email: TestUtils.generateTestEmail(),
    password: TestUtils.generateTestPassword(),
    ...overrides,
  }),

  signupRequest: (overrides: Partial<any> = {}) => ({
    email: TestUtils.generateTestEmail(),
    password: TestUtils.generateTestPassword(),
    name: 'Test User',
    ...overrides,
  }),

  invalidPasswords: [
    '', // empty
    'short', // too short
    'nouppercase', // no uppercase
    'NOLOWERCASE', // no lowercase
    'NoNumbers', // no numbers
    'NoSpecial123', // no special characters
    'password123', // common password
  ],

  validPasswords: [
    'ValidPassword123!',
    'StrongP@ssw0rd',
    'MySecure123#',
    'Test1234567!',
  ],

  invalidEmails: [
    '', // empty
    'invalid', // no @
    '@invalid.com', // starts with @
    'invalid@', // ends with @
    'invalid@.com', // @ followed by dot
    'invalid.@com', // dot before @
    'invalid..test@example.com', // double dots
  ],

  validEmails: [
    'test@example.com',
    'user.name@domain.co.uk',
    'test+tag@example.org',
    'user123@test-domain.com',
  ],
}

// Database test helpers
export const DatabaseTestHelpers = {
  async clearUsers() {
    if ((global as any).testPrisma) {
      await (global as any).testPrisma.user.deleteMany()
    }
  },

  async createTestUser(userData: any) {
    if ((global as any).testPrisma) {
      const hashedPassword = await bcrypt.hash(userData.password, 12)
      return await (global as any).testPrisma.user.create({
        data: {
          ...userData,
          password: hashedPassword,
        },
      })
    }
    return TestDataFactory.user(userData)
  },

  async findUserByEmail(email: string) {
    if ((global as any).testPrisma) {
      return await (global as any).testPrisma.user.findUnique({
        where: { email },
      })
    }
    return null
  },
}

// API test helpers
export const APITestHelpers = {
  async testEndpoint(
    handler: (request: NextRequest) => Promise<NextResponse>,
    method: string,
    url: string,
    body?: any,
    headers?: Record<string, string>
  ) {
    const request = TestUtils.createMockRequest(method, url, body, headers)
    const response = await handler(request)
    const data = await TestUtils.extractResponseData(response)
    return { response, data }
  },

  async testAuthenticatedEndpoint(
    handler: (request: NextRequest) => Promise<NextResponse>,
    method: string,
    url: string,
    userId: string,
    email: string,
    body?: any
  ) {
    const { accessToken } = await TestUtils.createTestTokens(userId, email)
    const headers = TestUtils.createAuthHeaders(accessToken)
    return this.testEndpoint(handler, method, url, body, headers)
  },

  async testRateLimitedEndpoint(
    handler: (request: NextRequest) => Promise<NextResponse>,
    method: string,
    url: string,
    maxRequests: number,
    body?: any
  ) {
    const results = []
    for (let i = 0; i < maxRequests + 2; i++) {
      const result = await this.testEndpoint(handler, method, url, body)
      results.push(result)
      await TestUtils.waitFor(10) // Small delay between requests
    }
    return results
  },
}

export default TestUtils