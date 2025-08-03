// API Test Setup
const { PrismaClient } = require('@prisma/client')

// Mock environment variables for API tests
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only-32-characters-long'
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key-for-testing-only-32-chars'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/hayl_energy_ai_test'
process.env.NEXTAUTH_URL = 'http://localhost:3000'
process.env.NODE_ENV = 'test'

// Mock jose library
jest.mock('jose', () => ({
  SignJWT: jest.fn().mockImplementation(() => ({
    setProtectedHeader: jest.fn().mockReturnThis(),
    setIssuedAt: jest.fn().mockReturnThis(),
    setIssuer: jest.fn().mockReturnThis(),
    setAudience: jest.fn().mockReturnThis(),
    setExpirationTime: jest.fn().mockReturnThis(),
    setJti: jest.fn().mockReturnThis(),
    sign: jest.fn().mockResolvedValue('mock.jwt.token'),
  })),
  jwtVerify: jest.fn().mockResolvedValue({
    payload: {
      userId: 'test-user-id',
      email: 'test@example.com',
      type: 'access',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 900, // 15 minutes
    },
  }),
  JWTPayload: {},
}))

// Global test database instance
let prisma

beforeAll(async () => {
  // Initialize test database
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

  // Clean up database before tests
  try {
    await prisma.user.deleteMany()
  } catch (error) {
    // Ignore if tables don't exist yet
    console.log('Database cleanup skipped (tables may not exist yet)')
  }
})

afterAll(async () => {
  // Clean up after all tests
  if (prisma) {
    try {
      await prisma.user.deleteMany()
    } catch (error) {
      // Ignore cleanup errors
    }
    await prisma.$disconnect()
  }
})

beforeEach(async () => {
  // Clean up before each test
  if (prisma) {
    try {
      await prisma.user.deleteMany()
    } catch (error) {
      // Ignore if tables don't exist
    }
  }
})

// Make prisma available globally for tests
global.testPrisma = prisma

// Mock Web APIs for Node.js environment
const { TextEncoder, TextDecoder } = require('util')

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock fetch API
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    status: 200,
    headers: new Map(),
  })
)

// Mock URL for NextRequest
const { URL, URLSearchParams } = require('url')
global.URL = URL
global.URLSearchParams = URLSearchParams

// Mock Headers
global.Headers = class Headers extends Map {
  constructor(init) {
    super()
    if (init) {
      if (typeof init === 'object') {
        for (const [key, value] of Object.entries(init)) {
          this.set(key, value)
        }
      }
    }
  }
  
  get(name) {
    return super.get(name.toLowerCase())
  }
  
  set(name, value) {
    return super.set(name.toLowerCase(), String(value))
  }
  
  has(name) {
    return super.has(name.toLowerCase())
  }
  
  delete(name) {
    return super.delete(name.toLowerCase())
  }
  
  append(name, value) {
    const existing = this.get(name)
    if (existing) {
      this.set(name, existing + ', ' + value)
    } else {
      this.set(name, String(value))
    }
  }
}

// Mock Request
global.Request = class Request {
  constructor(input, init = {}) {
    Object.defineProperty(this, 'url', {
      value: typeof input === 'string' ? input : input.url,
      writable: false,
      configurable: true
    })
    this.method = init.method || 'GET'
    this.headers = new Headers(init.headers)
    this.body = init.body || null
    this._bodyText = typeof init.body === 'string' ? init.body : null
  }
  
  async json() {
    if (this._bodyText) {
      return JSON.parse(this._bodyText)
    }
    return null
  }
  
  async text() {
    return this._bodyText || ''
  }
  
  clone() {
    return new Request(this.url, {
      method: this.method,
      headers: this.headers,
      body: this.body
    })
  }
}

// Mock Response
global.Response = class Response {
  constructor(body, init = {}) {
    this.body = body
    this.status = init.status || 200
    this.statusText = init.statusText || 'OK'
    this.headers = new Headers(init.headers)
    this.ok = this.status >= 200 && this.status < 300
  }
  
  async json() {
    if (typeof this.body === 'string') {
      return JSON.parse(this.body)
    }
    return this.body
  }
  
  async text() {
    if (typeof this.body === 'object') {
      return JSON.stringify(this.body)
    }
    return String(this.body || '')
  }
  
  clone() {
    return new Response(this.body, {
      status: this.status,
      statusText: this.statusText,
      headers: this.headers
    })
  }
  
  static json(data, init) {
    return new Response(JSON.stringify(data), {
      ...init,
      headers: {
        'content-type': 'application/json',
        ...init?.headers
      }
    })
  }
}

// Mock NextRequest and NextResponse for API tests
global.mockNextRequest = (method, url, body, headers = {}) => {
  return {
    method,
    url,
    headers: new Headers(headers),
    json: async () => body,
    cookies: new Map(),
  }
}

global.mockNextResponse = {
  json: (data, init) => ({
    json: async () => data,
    status: init?.status || 200,
    headers: new Headers(),
    cookies: {
      set: jest.fn(),
    },
  }),
}


jest.setTimeout(30000) // Longer timeout for database operations