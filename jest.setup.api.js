// API Test Setup
const { PrismaClient } = require('@prisma/client')

// Mock environment variables for API tests
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only-32-characters-long'
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key-for-testing-only-32-chars'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/hayl_energy_ai_test'
process.env.NEXTAUTH_URL = 'http://localhost:3000'
process.env.NODE_ENV = 'test'

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

// Mock NextRequest and NextResponse for API tests
global.mockNextRequest = (method, url, body, headers = {}) => {
  return {
    method,
    url,
    headers: new Map(Object.entries(headers)),
    json: async () => body,
    cookies: new Map(),
  }
}

global.mockNextResponse = {
  json: (data, init) => ({
    json: async () => data,
    status: init?.status || 200,
    headers: new Map(),
    cookies: {
      set: jest.fn(),
    },
  }),
}

// Mock fetch for external API calls
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
)

jest.setTimeout(30000) // Longer timeout for database operations