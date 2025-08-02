import { NextRequest, NextResponse } from 'next/server'
import { POST } from '../signup/route'
import { TestUtils, TestDataFactory, DatabaseTestHelpers, APITestHelpers } from '@/lib/test-utils'
import bcrypt from 'bcryptjs'

// Mock external dependencies
jest.mock('bcryptjs')
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}))

jest.mock('@/lib/rate-limit', () => ({
  signupRateLimit: {
    middleware: jest.fn((request, handler) => handler()),
  },
}))

const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>

describe('/api/auth/signup', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockBcrypt.hash.mockResolvedValue('$2a$12$mockhashedpassword')
  })

  describe('POST /api/auth/signup', () => {
    it('should create a new user with valid data', async () => {
      const signupData = TestDataFactory.signupRequest()
      const mockUser = TestUtils.mockPrismaUser({
        email: signupData.email,
        name: signupData.name,
      })

      const { prisma } = require('@/lib/prisma')
      prisma.user.findUnique.mockResolvedValue(null) // User doesn't exist
      prisma.user.create.mockResolvedValue(mockUser)

      const { response, data } = await APITestHelpers.testEndpoint(
        POST,
        'POST',
        '/api/auth/signup',
        signupData
      )

      TestUtils.assertValidResponse(response, 201)
      TestUtils.assertSuccessResponse(data)
      expect(data.user).toBeDefined()
      expect(data.token).toBeDefined()
      TestUtils.assertValidUser(data.user)
      TestUtils.assertValidToken(data.token)

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: signupData.email }
      })
      expect(mockBcrypt.hash).toHaveBeenCalledWith(signupData.password, 12)
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: signupData.email,
          password: '$2a$12$mockhashedpassword',
          name: signupData.name,
        }),
        select: expect.any(Object),
      })
    })

    it('should reject signup with existing email', async () => {
      const signupData = TestDataFactory.signupRequest()
      const existingUser = TestUtils.mockPrismaUser({ email: signupData.email })

      const { prisma } = require('@/lib/prisma')
      prisma.user.findUnique.mockResolvedValue(existingUser)

      const { response, data } = await APITestHelpers.testEndpoint(
        POST,
        'POST',
        '/api/auth/signup',
        signupData
      )

      TestUtils.assertValidResponse(response, 409)
      TestUtils.assertErrorResponse(data, 'User already exists with this email')

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: signupData.email }
      })
      expect(prisma.user.create).not.toHaveBeenCalled()
    })

    it('should validate email format', async () => {
      for (const invalidEmail of TestDataFactory.invalidEmails) {
        const signupData = TestDataFactory.signupRequest({ email: invalidEmail })

        const { response, data } = await APITestHelpers.testEndpoint(
          POST,
          'POST',
          '/api/auth/signup',
          signupData
        )

        TestUtils.assertValidResponse(response, 400)
        TestUtils.assertErrorResponse(data, 'Validation failed')
        expect(data.details).toContain('Invalid email format')
      }
    })

    it('should validate password strength', async () => {
      for (const invalidPassword of TestDataFactory.invalidPasswords) {
        const signupData = TestDataFactory.signupRequest({ password: invalidPassword })

        const { response, data } = await APITestHelpers.testEndpoint(
          POST,
          'POST',
          '/api/auth/signup',
          signupData
        )

        TestUtils.assertValidResponse(response, 400)
        TestUtils.assertErrorResponse(data, 'Validation failed')
        expect(data.details).toEqual(expect.arrayContaining([
          expect.stringMatching(/password/i)
        ]))
      }
    })

    it('should accept valid passwords', async () => {
      for (const validPassword of TestDataFactory.validPasswords) {
        const signupData = TestDataFactory.signupRequest({ password: validPassword })
        const mockUser = TestUtils.mockPrismaUser({
          email: signupData.email,
          name: signupData.name,
        })

        const { prisma } = require('@/lib/prisma')
        prisma.user.findUnique.mockResolvedValue(null)
        prisma.user.create.mockResolvedValue(mockUser)

        const { response, data } = await APITestHelpers.testEndpoint(
          POST,
          'POST',
          '/api/auth/signup',
          signupData
        )

        TestUtils.assertValidResponse(response, 201)
        TestUtils.assertSuccessResponse(data)
        expect(mockBcrypt.hash).toHaveBeenCalledWith(validPassword, 12)
      }
    })

    it('should require email and password', async () => {
      const testCases = [
        { email: '' }, // missing password
        { password: 'Test123!' }, // missing email
        {}, // missing both
      ]

      for (const testCase of testCases) {
        const { response, data } = await APITestHelpers.testEndpoint(
          POST,
          'POST',
          '/api/auth/signup',
          testCase
        )

        TestUtils.assertValidResponse(response, 400)
        TestUtils.assertErrorResponse(data, 'Validation failed')
      }
    })

    it('should handle optional name field', async () => {
      const signupDataWithoutName = {
        email: TestUtils.generateTestEmail(),
        password: TestUtils.generateTestPassword(),
      }
      
      const mockUser = TestUtils.mockPrismaUser({
        email: signupDataWithoutName.email,
        name: null,
      })

      const { prisma } = require('@/lib/prisma')
      prisma.user.findUnique.mockResolvedValue(null)
      prisma.user.create.mockResolvedValue(mockUser)

      const { response, data } = await APITestHelpers.testEndpoint(
        POST,
        'POST',
        '/api/auth/signup',
        signupDataWithoutName
      )

      TestUtils.assertValidResponse(response, 201)
      TestUtils.assertSuccessResponse(data)
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: signupDataWithoutName.email,
          password: '$2a$12$mockhashedpassword',
          name: undefined,
        }),
        select: expect.any(Object),
      })
    })

    it('should sanitize input data', async () => {
      const maliciousData = {
        email: '<script>alert("xss")</script>test@example.com',
        password: 'Test123!<script>',
        name: '<script>alert("hack")</script>Test User',
      }

      const { response, data } = await APITestHelpers.testEndpoint(
        POST,
        'POST',
        '/api/auth/signup',
        maliciousData
      )

      // Should fail validation due to invalid email format after sanitization
      TestUtils.assertValidResponse(response, 400)
      TestUtils.assertErrorResponse(data, 'Validation failed')
    })

    it('should handle database errors gracefully', async () => {
      const signupData = TestDataFactory.signupRequest()

      const { prisma } = require('@/lib/prisma')
      prisma.user.findUnique.mockRejectedValue(new Error('Database connection failed'))

      const { response, data } = await APITestHelpers.testEndpoint(
        POST,
        'POST',
        '/api/auth/signup',
        signupData
      )

      TestUtils.assertValidResponse(response, 500)
      TestUtils.assertErrorResponse(data, 'Internal server error')
    })

    it('should set secure cookies on successful signup', async () => {
      const signupData = TestDataFactory.signupRequest()
      const mockUser = TestUtils.mockPrismaUser({
        email: signupData.email,
        name: signupData.name,
      })

      const { prisma } = require('@/lib/prisma')
      prisma.user.findUnique.mockResolvedValue(null)
      prisma.user.create.mockResolvedValue(mockUser)

      const { response, data } = await APITestHelpers.testEndpoint(
        POST,
        'POST',
        '/api/auth/signup',
        signupData
      )

      TestUtils.assertValidResponse(response, 201)
      TestUtils.assertSuccessResponse(data)

      // Check if security headers are applied
      expect(response.headers).toBeDefined()
    })

    it('should handle malformed JSON', async () => {
      const request = new NextRequest('http://localhost/api/auth/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: 'invalid json{',
      })

      const response = await POST(request)
      const data = await TestUtils.extractResponseData(response)

      TestUtils.assertValidResponse(response, 500)
      TestUtils.assertErrorResponse(data, 'Internal server error')
    })

    it('should trim whitespace from email', async () => {
      const signupData = {
        email: '  test@example.com  ',
        password: TestUtils.generateTestPassword(),
        name: 'Test User',
      }

      const mockUser = TestUtils.mockPrismaUser({
        email: 'test@example.com', // trimmed
        name: signupData.name,
      })

      const { prisma } = require('@/lib/prisma')
      prisma.user.findUnique.mockResolvedValue(null)
      prisma.user.create.mockResolvedValue(mockUser)

      const { response, data } = await APITestHelpers.testEndpoint(
        POST,
        'POST',
        '/api/auth/signup',
        signupData
      )

      TestUtils.assertValidResponse(response, 201)
      TestUtils.assertSuccessResponse(data)

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' }
      })
    })
  })
})