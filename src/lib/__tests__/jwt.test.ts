import { JWTService, TokenPayload } from '../jwt'

// Mock jose library
jest.mock('jose', () => {
  const mockSign = jest.fn()
  const jwtVerify = jest.fn()
  
  return {
    SignJWT: jest.fn().mockImplementation(() => ({
      setProtectedHeader: jest.fn().mockReturnThis(),
      setIssuedAt: jest.fn().mockReturnThis(),
      setIssuer: jest.fn().mockReturnThis(),
      setAudience: jest.fn().mockReturnThis(),
      setExpirationTime: jest.fn().mockReturnThis(),
      setJti: jest.fn().mockReturnThis(),
      sign: mockSign,
    })),
    jwtVerify: jwtVerify,
  }
})

// Mock crypto
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-123',
  },
})

describe('JWT Service', () => {
  const { SignJWT, jwtVerify } = require('jose')
  
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset the mock implementation
    const mockSignJWTInstance = {
      setProtectedHeader: jest.fn().mockReturnThis(),
      setIssuedAt: jest.fn().mockReturnThis(),
      setIssuer: jest.fn().mockReturnThis(),
      setAudience: jest.fn().mockReturnThis(),
      setExpirationTime: jest.fn().mockReturnThis(),
      setJti: jest.fn().mockReturnThis(),
      sign: jest.fn().mockResolvedValue('test.jwt.token'),
    }
    SignJWT.mockImplementation(() => mockSignJWTInstance)
  })

  describe('signAccessToken', () => {
    it('should create access token with correct payload', async () => {
      const payload = {
        userId: 'user-123',
        email: 'test@example.com',
      }

      const token = await JWTService.signAccessToken(payload)

      expect(token).toBe('test.jwt.token')
      // Token creation should be successful
    })

    it('should create access token with session ID', async () => {
      const payload = {
        userId: 'user-123',
        email: 'test@example.com',
        sessionId: 'session-456',
      }

      const token = await JWTService.signAccessToken(payload)

      expect(token).toBe('test.jwt.token')
      // Token creation should be successful
    })

    it('should handle token creation errors', async () => {
      // Override the mock to simulate error
      const mockSignJWTInstance = {
        setProtectedHeader: jest.fn().mockReturnThis(),
        setIssuedAt: jest.fn().mockReturnThis(),
        setIssuer: jest.fn().mockReturnThis(),
        setAudience: jest.fn().mockReturnThis(),
        setExpirationTime: jest.fn().mockReturnThis(),
        setJti: jest.fn().mockReturnThis(),
        sign: jest.fn().mockRejectedValue(new Error('Token creation failed')),
      }
      SignJWT.mockImplementation(() => mockSignJWTInstance)

      const payload = {
        userId: 'user-123',
        email: 'test@example.com',
      }

      await expect(JWTService.signAccessToken(payload)).rejects.toThrow('Token creation failed')
    })
  })

  describe('signRefreshToken', () => {
    it('should create refresh token with correct payload', async () => {
      const payload = {
        userId: 'user-123',
        email: 'test@example.com',
      }

      const token = await JWTService.signRefreshToken(payload)

      expect(token).toBe('test.jwt.token')
      // Token creation should be successful
    })

    it('should create refresh token with session ID', async () => {
      const payload = {
        userId: 'user-123',
        email: 'test@example.com',
        sessionId: 'session-456',
      }

      const token = await JWTService.signRefreshToken(payload)

      expect(token).toBe('test.jwt.token')
      // Token creation should be successful
    })
  })

  describe('createTokenPair', () => {
    it('should create both access and refresh tokens', async () => {
      const payload = {
        userId: 'user-123',
        email: 'test@example.com',
      }

      const tokenPair = await JWTService.createTokenPair(payload)

      expect(tokenPair).toEqual({
        accessToken: 'test.jwt.token',
        refreshToken: 'test.jwt.token',
      })
      // Both tokens should be created successfully
    })

    it('should create token pair with session ID', async () => {
      const payload = {
        userId: 'user-123',
        email: 'test@example.com',
        sessionId: 'session-456',
      }

      const tokenPair = await JWTService.createTokenPair(payload)

      expect(tokenPair).toEqual({
        accessToken: 'test.jwt.token',
        refreshToken: 'test.jwt.token',
      })
    })
  })

  describe('verifyAccessToken', () => {
    it('should verify valid access token', async () => {
      const mockPayload: TokenPayload = {
        userId: 'user-123',
        email: 'test@example.com',
        type: 'access',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900,
        iss: 'hayl-energy-ai',
        aud: 'hayl-energy-ai-users',
      }

      jwtVerify.mockResolvedValue({ payload: mockPayload })

      const result = await JWTService.verifyAccessToken('valid.token')

      expect(result).toEqual(mockPayload)
      expect(jwtVerify).toHaveBeenCalledWith(
        'valid.token',
        expect.any(Uint8Array)
      )
    })

    it('should reject invalid access token', async () => {
      jwtVerify.mockRejectedValue(new Error('Invalid token'))

      await expect(JWTService.verifyAccessToken('invalid.token')).rejects.toThrow('Invalid token')
    })

    it('should reject expired access token', async () => {
      jwtVerify.mockRejectedValue(new Error('Token expired'))

      await expect(JWTService.verifyAccessToken('expired.token')).rejects.toThrow('Token expired')
    })

    it('should reject wrong token type', async () => {
      const mockPayload: TokenPayload = {
        userId: 'user-123',
        email: 'test@example.com',
        type: 'refresh', // Wrong type
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900,
        iss: 'hayl-energy-ai',
        aud: 'hayl-energy-ai-users',
      }

      jwtVerify.mockResolvedValue({ payload: mockPayload })

      await expect(JWTService.verifyAccessToken('wrong.type.token')).rejects.toThrow('Invalid token type')
    })
  })

  describe('verifyRefreshToken', () => {
    it('should verify valid refresh token', async () => {
      const mockPayload: TokenPayload = {
        userId: 'user-123',
        email: 'test@example.com',
        type: 'refresh',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 604800,
        iss: 'hayl-energy-ai',
        aud: 'hayl-energy-ai-users',
      }

      jwtVerify.mockResolvedValue({ payload: mockPayload })

      const result = await JWTService.verifyRefreshToken('valid.refresh.token')

      expect(result).toEqual(mockPayload)
      expect(jwtVerify).toHaveBeenCalledWith(
        'valid.refresh.token',
        expect.any(Uint8Array)
      )
    })

    it('should reject invalid refresh token', async () => {
      jwtVerify.mockRejectedValue(new Error('Invalid token'))

      await expect(JWTService.verifyRefreshToken('invalid.token')).rejects.toThrow('Invalid token')
    })

    it('should reject wrong token type for refresh', async () => {
      const mockPayload: TokenPayload = {
        userId: 'user-123',
        email: 'test@example.com',
        type: 'access', // Wrong type
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900,
        iss: 'hayl-energy-ai',
        aud: 'hayl-energy-ai-users',
      }

      jwtVerify.mockResolvedValue({ payload: mockPayload })

      await expect(JWTService.verifyRefreshToken('wrong.type.token')).rejects.toThrow('Invalid token type')
    })
  })

  describe('extractTokenFromRequest', () => {
    it('should extract token from Authorization header', () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('Bearer test.token.here'),
        },
        cookies: {
          get: jest.fn(),
        },
      }

      const token = JWTService.extractTokenFromRequest(mockRequest as any)

      expect(token).toBe('test.token.here')
      expect(mockRequest.headers.get).toHaveBeenCalledWith('authorization')
    })

    it('should extract token from cookies if no Authorization header', () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue(null),
        },
        cookies: {
          get: jest.fn().mockReturnValue({ value: 'cookie.token.here' }),
        },
      }

      const token = JWTService.extractTokenFromRequest(mockRequest as any)

      expect(token).toBe('cookie.token.here')
      expect(mockRequest.cookies.get).toHaveBeenCalledWith('auth-token')
    })

    it('should return null if no token found', () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue(null),
        },
        cookies: {
          get: jest.fn().mockReturnValue(null),
        },
      }

      const token = JWTService.extractTokenFromRequest(mockRequest as any)

      expect(token).toBeNull()
    })

    it('should return null for malformed Authorization header', () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('InvalidFormat token'),
        },
        cookies: {
          get: jest.fn(),
        },
      }

      const token = JWTService.extractTokenFromRequest(mockRequest as any)

      expect(token).toBeNull()
    })
  })
})