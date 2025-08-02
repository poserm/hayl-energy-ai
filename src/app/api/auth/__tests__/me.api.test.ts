import { NextRequest, NextResponse } from 'next/server'
import { GET } from '../me/route'
import { TestUtils, TestDataFactory, APITestHelpers } from '@/lib/test-utils'

// Mock external dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}))

jest.mock('@/lib/auth', () => ({
  getCurrentUser: jest.fn(),
}))

describe('/api/auth/me', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/auth/me', () => {
    it('should return user data for valid token', async () => {
      const mockUser = TestUtils.mockPrismaUser()
      const { getCurrentUser } = require('@/lib/auth')
      const { prisma } = require('@/lib/prisma')

      getCurrentUser.mockResolvedValue({
        userId: mockUser.id,
        email: mockUser.email,
      })
      prisma.user.findUnique.mockResolvedValue(mockUser)

      const { accessToken } = await TestUtils.createTestTokens(mockUser.id, mockUser.email)
      const headers = TestUtils.createAuthHeaders(accessToken)

      const { response, data } = await APITestHelpers.testEndpoint(
        GET,
        'GET',
        '/api/auth/me',
        undefined,
        headers
      )

      TestUtils.assertValidResponse(response, 200)
      TestUtils.assertSuccessResponse(data)
      TestUtils.assertValidUser(data.user)
      expect(data.user.id).toBe(mockUser.id)
      expect(data.user.email).toBe(mockUser.email)
      expect(data.user.password).toBeUndefined()

      expect(getCurrentUser).toHaveBeenCalled()
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        select: expect.objectContaining({
          id: true,
          email: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        }),
      })
    })

    it('should reject request without token', async () => {
      const { getCurrentUser } = require('@/lib/auth')
      getCurrentUser.mockResolvedValue(null)

      const { response, data } = await APITestHelpers.testEndpoint(
        GET,
        'GET',
        '/api/auth/me'
      )

      TestUtils.assertValidResponse(response, 401)
      TestUtils.assertErrorResponse(data, 'Unauthorized - No valid token provided')

      expect(getCurrentUser).toHaveBeenCalled()
    })

    it('should reject request with invalid token', async () => {
      const { getCurrentUser } = require('@/lib/auth')
      getCurrentUser.mockResolvedValue(null)

      const headers = TestUtils.createAuthHeaders('invalid.token.here')

      const { response, data } = await APITestHelpers.testEndpoint(
        GET,
        'GET',
        '/api/auth/me',
        undefined,
        headers
      )

      TestUtils.assertValidResponse(response, 401)
      TestUtils.assertErrorResponse(data, 'Unauthorized - No valid token provided')

      expect(getCurrentUser).toHaveBeenCalled()
    })

    it('should handle user not found in database', async () => {
      const mockUserId = 'non-existent-user-id'
      const { getCurrentUser } = require('@/lib/auth')
      const { prisma } = require('@/lib/prisma')

      getCurrentUser.mockResolvedValue({
        userId: mockUserId,
        email: 'test@example.com',
      })
      prisma.user.findUnique.mockResolvedValue(null)

      const { accessToken } = await TestUtils.createTestTokens(mockUserId, 'test@example.com')
      const headers = TestUtils.createAuthHeaders(accessToken)

      const { response, data } = await APITestHelpers.testEndpoint(
        GET,
        'GET',
        '/api/auth/me',
        undefined,
        headers
      )

      TestUtils.assertValidResponse(response, 404)
      TestUtils.assertErrorResponse(data, 'User not found')

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUserId },
        select: expect.any(Object),
      })
    })

    it('should handle database errors gracefully', async () => {
      const mockUser = TestUtils.mockPrismaUser()
      const { getCurrentUser } = require('@/lib/auth')
      const { prisma } = require('@/lib/prisma')

      getCurrentUser.mockResolvedValue({
        userId: mockUser.id,
        email: mockUser.email,
      })
      prisma.user.findUnique.mockRejectedValue(new Error('Database connection failed'))

      const { accessToken } = await TestUtils.createTestTokens(mockUser.id, mockUser.email)
      const headers = TestUtils.createAuthHeaders(accessToken)

      const { response, data } = await APITestHelpers.testEndpoint(
        GET,
        'GET',
        '/api/auth/me',
        undefined,
        headers
      )

      TestUtils.assertValidResponse(response, 500)
      TestUtils.assertErrorResponse(data, 'Internal server error')
    })

    it('should work with cookie-based authentication', async () => {
      const mockUser = TestUtils.mockPrismaUser()
      const { getCurrentUser } = require('@/lib/auth')
      const { prisma } = require('@/lib/prisma')

      getCurrentUser.mockResolvedValue({
        userId: mockUser.id,
        email: mockUser.email,
      })
      prisma.user.findUnique.mockResolvedValue(mockUser)

      const { accessToken } = await TestUtils.createTestTokens(mockUser.id, mockUser.email)
      const headers = TestUtils.createCookieHeaders({ 'auth-token': accessToken })

      const { response, data } = await APITestHelpers.testEndpoint(
        GET,
        'GET',
        '/api/auth/me',
        undefined,
        headers
      )

      TestUtils.assertValidResponse(response, 200)
      TestUtils.assertSuccessResponse(data)
      TestUtils.assertValidUser(data.user)
    })

    it('should handle malformed token gracefully', async () => {
      const { getCurrentUser } = require('@/lib/auth')
      getCurrentUser.mockResolvedValue(null)

      const headers = TestUtils.createAuthHeaders('not.a.jwt')

      const { response, data } = await APITestHelpers.testEndpoint(
        GET,
        'GET',
        '/api/auth/me',
        undefined,
        headers
      )

      TestUtils.assertValidResponse(response, 401)
      TestUtils.assertErrorResponse(data, 'Unauthorized - No valid token provided')
    })

    it('should return all expected user fields', async () => {
      const mockUser = TestUtils.mockPrismaUser({
        name: 'Test User',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02'),
      })
      
      const { getCurrentUser } = require('@/lib/auth')
      const { prisma } = require('@/lib/prisma')

      getCurrentUser.mockResolvedValue({
        userId: mockUser.id,
        email: mockUser.email,
      })
      prisma.user.findUnique.mockResolvedValue(mockUser)

      const { accessToken } = await TestUtils.createTestTokens(mockUser.id, mockUser.email)
      const headers = TestUtils.createAuthHeaders(accessToken)

      const { response, data } = await APITestHelpers.testEndpoint(
        GET,
        'GET',
        '/api/auth/me',
        undefined,
        headers
      )

      TestUtils.assertValidResponse(response, 200)
      TestUtils.assertSuccessResponse(data)
      
      expect(data.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        createdAt: mockUser.createdAt.toISOString(),
        updatedAt: mockUser.updatedAt.toISOString(),
      })
    })

    it('should handle expired token', async () => {
      const { getCurrentUser } = require('@/lib/auth')
      getCurrentUser.mockResolvedValue(null) // Expired tokens return null

      // Create an expired token
      const expiredPayload = TestUtils.createExpiredToken('user-id', 'test@example.com')
      const headers = TestUtils.createAuthHeaders('expired.token.here')

      const { response, data } = await APITestHelpers.testEndpoint(
        GET,
        'GET',
        '/api/auth/me',
        undefined,
        headers
      )

      TestUtils.assertValidResponse(response, 401)
      TestUtils.assertErrorResponse(data, 'Unauthorized - No valid token provided')
    })

    it('should not expose sensitive user information', async () => {
      const mockUser = TestUtils.mockPrismaUser()
      const { getCurrentUser } = require('@/lib/auth')
      const { prisma } = require('@/lib/prisma')

      getCurrentUser.mockResolvedValue({
        userId: mockUser.id,
        email: mockUser.email,
      })
      prisma.user.findUnique.mockResolvedValue(mockUser)

      const { accessToken } = await TestUtils.createTestTokens(mockUser.id, mockUser.email)
      const headers = TestUtils.createAuthHeaders(accessToken)

      const { response, data } = await APITestHelpers.testEndpoint(
        GET,
        'GET',
        '/api/auth/me',
        undefined,
        headers
      )

      TestUtils.assertValidResponse(response, 200)
      TestUtils.assertSuccessResponse(data)
      
      // Ensure password is not included in the select
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        select: expect.not.objectContaining({
          password: true,
        }),
      })
      
      // Ensure password is not in response
      expect(data.user.password).toBeUndefined()
    })
  })
})