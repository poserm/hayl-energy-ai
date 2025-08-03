import { getCurrentUser, verifyToken, getTokenFromRequest, signToken } from '../auth'
import { NextRequest } from 'next/server'

// Mock jose library is already mocked globally
// Mock next/headers
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}))

describe('Auth Library', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getCurrentUser', () => {
    it('should return user data for valid token in Authorization header', async () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('Bearer valid.jwt.token'),
        },
      } as unknown as NextRequest

      // The global jose mock will return this payload
      const result = await getCurrentUser(mockRequest)

      // Based on global mock in jest.setup.js, it returns the mocked payload
      expect(result).toEqual({
        userId: 'test-user-id',
        email: 'test@example.com',
        type: 'access',
        iat: expect.any(Number),
        exp: expect.any(Number),
      })
      expect(mockRequest.headers.get).toHaveBeenCalledWith('authorization')
    })

    it('should return user data for valid token in cookies', async () => {
      const { cookies } = require('next/headers')
      
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue(null),
        },
      } as unknown as NextRequest

      // Mock cookies function to return cookie value
      cookies.mockResolvedValue({
        get: jest.fn().mockReturnValue({ value: 'cookie.jwt.token' }),
      })

      const result = await getCurrentUser(mockRequest)

      // Should return the mocked payload from global jose mock
      expect(result).toEqual({
        userId: 'test-user-id',
        email: 'test@example.com',
        type: 'access',
        iat: expect.any(Number),
        exp: expect.any(Number),
      })
    })

    it('should return null for missing token', async () => {
      const { cookies } = require('next/headers')
      
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue(null),
        },
      } as unknown as NextRequest

      // Mock cookies to return no auth token
      cookies.mockResolvedValue({
        get: jest.fn().mockReturnValue(null),
      })

      const result = await getCurrentUser(mockRequest)

      expect(result).toBeNull()
    })

    it('should return null for invalid Bearer token format', async () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('InvalidFormat token'),
        },
      } as unknown as NextRequest

      const result = await getCurrentUser(mockRequest)

      expect(result).toBeNull()
      expect(mockJWTService.verifyAccessToken).not.toHaveBeenCalled()
    })

    it('should return null for invalid token', async () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('Bearer invalid.token'),
        },
      } as unknown as NextRequest

      mockJWTService.verifyAccessToken.mockRejectedValue(new Error('Invalid token'))

      const result = await getCurrentUser(mockRequest)

      expect(result).toBeNull()
      expect(mockJWTService.verifyAccessToken).toHaveBeenCalledWith('invalid.token')
    })

    it('should return null for expired token', async () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('Bearer expired.token'),
        },
      } as unknown as NextRequest

      mockJWTService.verifyAccessToken.mockRejectedValue(new Error('Token expired'))

      const result = await getCurrentUser(mockRequest)

      expect(result).toBeNull()
      expect(mockJWTService.verifyAccessToken).toHaveBeenCalledWith('expired.token')
    })

    it('should handle malformed JWT tokens gracefully', async () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('Bearer malformed'),
        },
      } as unknown as NextRequest

      mockJWTService.verifyAccessToken.mockRejectedValue(new Error('Malformed token'))

      const result = await getCurrentUser(mockRequest)

      expect(result).toBeNull()
    })

    it('should handle empty Authorization header gracefully', async () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue(''),
        },
        cookies: {
          get: jest.fn().mockReturnValue(null),
        },
      } as unknown as NextRequest

      const result = await getCurrentUser(mockRequest)

      expect(result).toBeNull()
    })
  })
})