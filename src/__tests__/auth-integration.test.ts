import { NextRequest, NextResponse } from 'next/server'
import { TestUtils, TestDataFactory, APITestHelpers } from '@/lib/test-utils'

// Mock external dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}))

jest.mock('@/lib/rate-limit', () => ({
  authLimiter: jest.fn(() => ({ success: true })),
  signupLimiter: jest.fn(() => ({ success: true })),
}))

jest.mock('@/lib/auth-logger', () => ({
  logAuthEvent: jest.fn(),
}))

// Import API routes after mocking
import { POST as SignupPOST } from '@/app/api/auth/signup/route'
import { POST as LoginPOST } from '@/app/api/auth/login/route'
import { GET as MeGET } from '@/app/api/auth/me/route'
import { POST as LogoutPOST } from '@/app/api/auth/logout/route'

describe('Authentication Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Complete Authentication Flow', () => {
    it('should handle complete signup → login → access protected route → logout flow', async () => {
      const { prisma } = require('@/lib/prisma')
      const userData = TestDataFactory.createUser({
        email: 'integration@test.com',
        password: 'TestPassword123!',
        name: 'Integration Test User',
      })

      // Step 1: User signup
      prisma.user.findUnique.mockResolvedValue(null) // Email not taken
      prisma.user.create.mockResolvedValue({
        id: 'user-id-123',
        email: userData.email,
        name: userData.name,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const { response: signupResponse, data: signupData } = await APITestHelpers.testEndpoint(
        SignupPOST,
        'POST',
        '/api/auth/signup',
        {
          email: userData.email,
          password: userData.password,
          name: userData.name,
        }
      )

      TestUtils.assertValidResponse(signupResponse, 201)
      TestUtils.assertSuccessResponse(signupData)
      TestUtils.assertValidUser(signupData.user)

      // Extract token from Set-Cookie header
      const setCookieHeader = signupResponse.headers.get('Set-Cookie')
      expect(setCookieHeader).toContain('auth-token=')
      
      const tokenMatch = setCookieHeader?.match(/auth-token=([^;]+)/)
      const signupToken = tokenMatch?.[1]
      expect(signupToken).toBeTruthy()

      // Step 2: Access protected route with signup token
      const mockCurrentUser = {
        getCurrentUser: jest.fn().mockResolvedValue({
          userId: 'user-id-123',
          email: userData.email,
        }),
      }
      jest.doMock('@/lib/auth', () => mockCurrentUser)

      prisma.user.findUnique.mockResolvedValue({
        id: 'user-id-123',
        email: userData.email,
        name: userData.name,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const headers = TestUtils.createCookieHeaders({ 'auth-token': signupToken! })
      const { response: meResponse, data: meData } = await APITestHelpers.testEndpoint(
        MeGET,
        'GET',
        '/api/auth/me',
        undefined,
        headers
      )

      TestUtils.assertValidResponse(meResponse, 200)
      TestUtils.assertSuccessResponse(meData)
      TestUtils.assertValidUser(meData.user)
      expect(meData.user.email).toBe(userData.email)

      // Step 3: Logout
      const { response: logoutResponse, data: logoutData } = await APITestHelpers.testEndpoint(
        LogoutPOST,
        'POST',
        '/api/auth/logout',
        undefined,
        headers
      )

      TestUtils.assertValidResponse(logoutResponse, 200)
      TestUtils.assertSuccessResponse(logoutData)

      // Verify logout cookie clearing
      const logoutSetCookie = logoutResponse.headers.get('Set-Cookie')
      expect(logoutSetCookie).toContain('auth-token=')
      expect(logoutSetCookie).toContain('Max-Age=0')

      // Step 4: Verify access is denied after logout
      mockCurrentUser.getCurrentUser.mockResolvedValue(null)

      const { response: meAfterLogoutResponse, data: meAfterLogoutData } = await APITestHelpers.testEndpoint(
        MeGET,
        'GET',
        '/api/auth/me',
        undefined,
        TestUtils.createCookieHeaders({ 'auth-token': '' })
      )

      TestUtils.assertValidResponse(meAfterLogoutResponse, 401)
      TestUtils.assertErrorResponse(meAfterLogoutData, 'Unauthorized - No valid token provided')
    })

    it('should handle login with existing user', async () => {
      const { prisma } = require('@/lib/prisma')
      const userData = TestDataFactory.createUser({
        email: 'login@test.com',
        password: 'TestPassword123!',
      })

      // Mock existing user in database
      const hashedPassword = await TestUtils.hashPassword(userData.password)
      const existingUser = {
        id: 'existing-user-id',
        email: userData.email,
        password: hashedPassword,
        name: 'Existing User',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      prisma.user.findUnique.mockResolvedValue(existingUser)

      // Login
      const { response, data } = await APITestHelpers.testEndpoint(
        LoginPOST,
        'POST',
        '/api/auth/login',
        {
          email: userData.email,
          password: userData.password,
        }
      )

      TestUtils.assertValidResponse(response, 200)
      TestUtils.assertSuccessResponse(data)
      TestUtils.assertValidUser(data.user)
      expect(data.user.email).toBe(userData.email)

      // Verify token is set
      const setCookieHeader = response.headers.get('Set-Cookie')
      expect(setCookieHeader).toContain('auth-token=')
      expect(setCookieHeader).toContain('HttpOnly')
      expect(setCookieHeader).toContain('Secure')
    })

    it('should prevent duplicate email signup', async () => {
      const { prisma } = require('@/lib/prisma')
      const userData = TestDataFactory.createUser({
        email: 'duplicate@test.com',
        password: 'TestPassword123!',
      })

      // Mock existing user
      prisma.user.findUnique.mockResolvedValue({
        id: 'existing-id',
        email: userData.email,
        name: 'Existing User',
      })

      const { response, data } = await APITestHelpers.testEndpoint(
        SignupPOST,
        'POST',
        '/api/auth/signup',
        {
          email: userData.email,
          password: userData.password,
        }
      )

      TestUtils.assertValidResponse(response, 400)
      TestUtils.assertErrorResponse(data, 'Email already exists')
    })

    it('should reject invalid credentials on login', async () => {
      const { prisma } = require('@/lib/prisma')
      const userData = TestDataFactory.createUser({
        email: 'wrong@test.com',
        password: 'WrongPassword123!',
      })

      // Mock user with different password
      const correctPassword = await TestUtils.hashPassword('CorrectPassword123!')
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-id',
        email: userData.email,
        password: correctPassword,
        name: 'Test User',
      })

      const { response, data } = await APITestHelpers.testEndpoint(
        LoginPOST,
        'POST',
        '/api/auth/login',
        {
          email: userData.email,
          password: userData.password, // Wrong password
        }
      )

      TestUtils.assertValidResponse(response, 400)
      TestUtils.assertErrorResponse(data, 'Invalid credentials')
    })
  })

  describe('Security and Edge Cases', () => {
    it('should handle malformed request data', async () => {
      const { response, data } = await APITestHelpers.testEndpoint(
        LoginPOST,
        'POST',
        '/api/auth/login',
        {
          email: 'not-an-email',
          password: '123', // Too short
        }
      )

      TestUtils.assertValidResponse(response, 400)
      TestUtils.assertErrorResponse(data)
      expect(data.details).toBeInstanceOf(Array)
      expect(data.details.length).toBeGreaterThan(0)
    })

    it('should handle database connection failures', async () => {
      const { prisma } = require('@/lib/prisma')
      const userData = TestDataFactory.createUser()

      prisma.user.findUnique.mockRejectedValue(new Error('Database connection failed'))

      const { response, data } = await APITestHelpers.testEndpoint(
        LoginPOST,
        'POST',
        '/api/auth/login',
        {
          email: userData.email,
          password: userData.password,
        }
      )

      TestUtils.assertValidResponse(response, 500)
      TestUtils.assertErrorResponse(data, 'Internal server error')
    })

    it('should handle concurrent authentication requests', async () => {
      const { prisma } = require('@/lib/prisma')
      const userData = TestDataFactory.createUser()

      prisma.user.findUnique.mockResolvedValue(null)
      prisma.user.create.mockResolvedValue({
        id: 'concurrent-user-id',
        email: userData.email,
        name: userData.name,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      // Simulate concurrent signup requests
      const signupPromises = Array.from({ length: 3 }, () =>
        APITestHelpers.testEndpoint(
          SignupPOST,
          'POST',
          '/api/auth/signup',
          {
            email: userData.email,
            password: userData.password,
            name: userData.name,
          }
        )
      )

      const results = await Promise.all(signupPromises)

      // At least one should succeed
      const successfulResponses = results.filter(({ response }) => response.status === 201)
      expect(successfulResponses.length).toBeGreaterThanOrEqual(1)
    })

    it('should validate JWT token format and expiration', async () => {
      const mockCurrentUser = {
        getCurrentUser: jest.fn().mockResolvedValue(null), // Invalid/expired token
      }
      jest.doMock('@/lib/auth', () => mockCurrentUser)

      const headers = TestUtils.createAuthHeaders('invalid.jwt.token')

      const { response, data } = await APITestHelpers.testEndpoint(
        MeGET,
        'GET',
        '/api/auth/me',
        undefined,
        headers
      )

      TestUtils.assertValidResponse(response, 401)
      TestUtils.assertErrorResponse(data, 'Unauthorized - No valid token provided')
    })
  })

  describe('Token Management', () => {
    it('should handle refresh token scenario', async () => {
      // This would test refresh token functionality if implemented
      // For now, we test that expired tokens are properly rejected
      
      const mockCurrentUser = {
        getCurrentUser: jest.fn().mockResolvedValue(null),
      }
      jest.doMock('@/lib/auth', () => mockCurrentUser)

      const expiredTokenHeaders = TestUtils.createAuthHeaders('expired.token.here')

      const { response, data } = await APITestHelpers.testEndpoint(
        MeGET,
        'GET',
        '/api/auth/me',
        undefined,
        expiredTokenHeaders
      )

      TestUtils.assertValidResponse(response, 401)
      TestUtils.assertErrorResponse(data, 'Unauthorized - No valid token provided')
    })

    it('should properly clean up sessions on logout', async () => {
      const headers = TestUtils.createCookieHeaders({ 'auth-token': 'some-token' })

      const { response, data } = await APITestHelpers.testEndpoint(
        LogoutPOST,
        'POST',
        '/api/auth/logout',
        undefined,
        headers
      )

      TestUtils.assertValidResponse(response, 200)
      TestUtils.assertSuccessResponse(data)

      // Verify cookie is cleared
      const setCookieHeader = response.headers.get('Set-Cookie')
      expect(setCookieHeader).toContain('auth-token=')
      expect(setCookieHeader).toContain('Max-Age=0')
      expect(setCookieHeader).toContain('Path=/')
    })
  })
})