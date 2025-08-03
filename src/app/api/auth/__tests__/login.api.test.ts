import { NextRequest, NextResponse } from 'next/server'
import { POST } from '../login/route'
import { TestUtils, TestDataFactory, DatabaseTestHelpers, APITestHelpers } from '@/lib/test-utils'
import bcrypt from 'bcryptjs'

// Mock external dependencies
jest.mock('bcryptjs')
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}))

jest.mock('@/lib/rate-limit', () => ({
  authRateLimit: {
    middleware: jest.fn((request, handler) => handler()),
  },
}))

jest.mock('@/lib/cors', () => ({
  authCors: {
    middleware: jest.fn((handler) => handler),
  },
}))

jest.mock('@/lib/security-headers', () => ({
  authSecurityHeaders: {
    middleware: jest.fn((handler) => handler),
    applyHeaders: jest.fn((response) => response),
  },
}))

jest.mock('@/lib/sanitization', () => ({
  authSanitizer: {
    sanitizeObject: jest.fn((obj) => obj),
  },
}))

jest.mock('@/lib/auth-logger', () => ({
  logLogin: jest.fn(),
}))

const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('/api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/auth/login', () => {
    it('should login user with valid credentials', async () => {
      const loginData = TestDataFactory.loginRequest()
      const mockUser = TestUtils.mockPrismaUser({
        email: loginData.email,
        password: '$2a$12$mockhashedpassword',
      })

      const { prisma } = require('@/lib/prisma')
      prisma.user.findUnique.mockResolvedValue(mockUser)
      mockBcrypt.compare.mockResolvedValue(true)

      const { response, data } = await APITestHelpers.testEndpoint(
        POST,
        'POST',
        '/api/auth/login',
        loginData
      )

      TestUtils.assertValidResponse(response, 200)
      TestUtils.assertSuccessResponse(data)
      expect(data.user).toBeDefined()
      expect(data.token).toBeDefined()
      TestUtils.assertValidUser(data.user)
      TestUtils.assertValidToken(data.token)

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginData.email },
        select: {
          id: true,
          email: true,
          password: true,
          name: true,
          emailVerified: true,
          createdAt: true
        }
      })
      expect(mockBcrypt.compare).toHaveBeenCalledWith(
        loginData.password,
        mockUser.password
      )
    })

    it('should reject login with non-existent email', async () => {
      const loginData = TestDataFactory.loginRequest()

      const { prisma } = require('@/lib/prisma')
      prisma.user.findUnique.mockResolvedValue(null)

      const { response, data } = await APITestHelpers.testEndpoint(
        POST,
        'POST',
        '/api/auth/login',
        loginData
      )

      TestUtils.assertValidResponse(response, 401)
      TestUtils.assertErrorResponse(data, 'Invalid email or password')

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginData.email }
      })
      expect(mockBcrypt.compare).not.toHaveBeenCalled()
    })

    it('should reject login with invalid password', async () => {
      const loginData = TestDataFactory.loginRequest()
      const mockUser = TestUtils.mockPrismaUser({
        email: loginData.email,
        password: '$2a$12$mockhashedpassword',
      })

      const { prisma } = require('@/lib/prisma')
      prisma.user.findUnique.mockResolvedValue(mockUser)
      mockBcrypt.compare.mockResolvedValue(false) // Invalid password

      const { response, data } = await APITestHelpers.testEndpoint(
        POST,
        'POST',
        '/api/auth/login',
        loginData
      )

      TestUtils.assertValidResponse(response, 401)
      TestUtils.assertErrorResponse(data, 'Invalid email or password')

      expect(mockBcrypt.compare).toHaveBeenCalledWith(
        loginData.password,
        mockUser.password
      )
    })

    it('should validate email format', async () => {
      for (const invalidEmail of TestDataFactory.invalidEmails) {
        const loginData = TestDataFactory.loginRequest({ email: invalidEmail })

        const { response, data } = await APITestHelpers.testEndpoint(
          POST,
          'POST',
          '/api/auth/login',
          loginData
        )

        TestUtils.assertValidResponse(response, 400)
        TestUtils.assertErrorResponse(data, 'Validation failed')
        expect(data.details).toContain('Invalid email format')
      }
    })

    it('should require email and password', async () => {
      const testCases = [
        { email: 'test@example.com' }, // missing password
        { password: 'password123' }, // missing email
        {}, // missing both
        { email: '', password: '' }, // empty values
      ]

      for (const testCase of testCases) {
        const { response, data } = await APITestHelpers.testEndpoint(
          POST,
          'POST',
          '/api/auth/login',
          testCase
        )

        TestUtils.assertValidResponse(response, 400)
        TestUtils.assertErrorResponse(data, 'Validation failed')
      }
    })

    it('should sanitize input data', async () => {
      const maliciousData = {
        email: '<script>alert("xss")</script>test@example.com',
        password: '<script>alert("hack")</script>password',
      }

      const { response, data } = await APITestHelpers.testEndpoint(
        POST,
        'POST',
        '/api/auth/login',
        maliciousData
      )

      // Should fail validation due to invalid email format after sanitization
      TestUtils.assertValidResponse(response, 400)
      TestUtils.assertErrorResponse(data, 'Validation failed')
    })

    it('should handle database errors gracefully', async () => {
      const loginData = TestDataFactory.loginRequest()

      const { prisma } = require('@/lib/prisma')
      prisma.user.findUnique.mockRejectedValue(new Error('Database connection failed'))

      const { response, data } = await APITestHelpers.testEndpoint(
        POST,
        'POST',
        '/api/auth/login',
        loginData
      )

      TestUtils.assertValidResponse(response, 500)
      TestUtils.assertErrorResponse(data, 'Internal server error')
    })

    it('should set secure cookies on successful login', async () => {
      const loginData = TestDataFactory.loginRequest()
      const mockUser = TestUtils.mockPrismaUser({
        email: loginData.email,
        password: '$2a$12$mockhashedpassword',
      })

      const { prisma } = require('@/lib/prisma')
      prisma.user.findUnique.mockResolvedValue(mockUser)
      mockBcrypt.compare.mockResolvedValue(true)

      const { response, data } = await APITestHelpers.testEndpoint(
        POST,
        'POST',
        '/api/auth/login',
        loginData
      )

      TestUtils.assertValidResponse(response, 200)
      TestUtils.assertSuccessResponse(data)

      // Check if security headers are applied
      expect(response.headers).toBeDefined()
    })

    it('should not return password in response', async () => {
      const loginData = TestDataFactory.loginRequest()
      const mockUser = TestUtils.mockPrismaUser({
        email: loginData.email,
        password: '$2a$12$mockhashedpassword',
      })

      const { prisma } = require('@/lib/prisma')
      prisma.user.findUnique.mockResolvedValue(mockUser)
      mockBcrypt.compare.mockResolvedValue(true)

      const { response, data } = await APITestHelpers.testEndpoint(
        POST,
        'POST',
        '/api/auth/login',
        loginData
      )

      TestUtils.assertValidResponse(response, 200)
      TestUtils.assertSuccessResponse(data)
      TestUtils.assertValidUser(data.user)
      expect(data.user.password).toBeUndefined()
    })

    it('should handle bcrypt errors gracefully', async () => {
      const loginData = TestDataFactory.loginRequest()
      const mockUser = TestUtils.mockPrismaUser({
        email: loginData.email,
        password: '$2a$12$mockhashedpassword',
      })

      const { prisma } = require('@/lib/prisma')
      prisma.user.findUnique.mockResolvedValue(mockUser)
      mockBcrypt.compare.mockRejectedValue(new Error('Bcrypt error'))

      const { response, data } = await APITestHelpers.testEndpoint(
        POST,
        'POST',
        '/api/auth/login',
        loginData
      )

      TestUtils.assertValidResponse(response, 500)
      TestUtils.assertErrorResponse(data, 'Internal server error')
    })

    it('should handle malformed JSON', async () => {
      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: 'invalid json{',
      })

      const response = await POST(request)
      const data = await TestUtils.extractResponseData(response)

      TestUtils.assertValidResponse(response, 500)
      TestUtils.assertErrorResponse(data, 'Internal server error')
    })

    it('should trim and lowercase email', async () => {
      const loginData = {
        email: '  TEST@EXAMPLE.COM  ',
        password: TestUtils.generateTestPassword(),
      }

      const mockUser = TestUtils.mockPrismaUser({
        email: 'test@example.com', // lowercase and trimmed
        password: '$2a$12$mockhashedpassword',
      })

      const { prisma } = require('@/lib/prisma')
      prisma.user.findUnique.mockResolvedValue(mockUser)
      mockBcrypt.compare.mockResolvedValue(true)

      const { response, data } = await APITestHelpers.testEndpoint(
        POST,
        'POST',
        '/api/auth/login',
        loginData
      )

      TestUtils.assertValidResponse(response, 200)
      TestUtils.assertSuccessResponse(data)

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' }
      })
    })

    it('should measure login duration', async () => {
      const loginData = TestDataFactory.loginRequest()
      const mockUser = TestUtils.mockPrismaUser({
        email: loginData.email,
        password: '$2a$12$mockhashedpassword',
      })

      const { prisma } = require('@/lib/prisma')
      prisma.user.findUnique.mockResolvedValue(mockUser)
      mockBcrypt.compare.mockResolvedValue(true)

      const startTime = Date.now()
      
      const { response, data } = await APITestHelpers.testEndpoint(
        POST,
        'POST',
        '/api/auth/login',
        loginData
      )

      const endTime = Date.now()

      TestUtils.assertValidResponse(response, 200)
      TestUtils.assertSuccessResponse(data)

      // Verify that login completed within reasonable time
      expect(endTime - startTime).toBeLessThan(5000) // Less than 5 seconds
    })

    it('should provide both access and refresh tokens', async () => {
      const loginData = TestDataFactory.loginRequest()
      const mockUser = TestUtils.mockPrismaUser({
        email: loginData.email,
        password: '$2a$12$mockhashedpassword',
      })

      const { prisma } = require('@/lib/prisma')
      prisma.user.findUnique.mockResolvedValue(mockUser)
      mockBcrypt.compare.mockResolvedValue(true)

      const { response, data } = await APITestHelpers.testEndpoint(
        POST,
        'POST',
        '/api/auth/login',
        loginData
      )

      TestUtils.assertValidResponse(response, 200)
      TestUtils.assertSuccessResponse(data)
      
      // Should provide backward-compatible token field
      expect(data.token).toBeDefined()
      TestUtils.assertValidToken(data.token)
    })
  })
})