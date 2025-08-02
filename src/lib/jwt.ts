import { SignJWT, jwtVerify, JWTPayload } from 'jose'
import { cookies } from 'next/headers'

const accessTokenSecret = new TextEncoder().encode(process.env.JWT_SECRET!)
const refreshTokenSecret = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!)
const alg = 'HS256'

export interface TokenPayload extends JWTPayload {
  userId: string
  email: string
  type: 'access' | 'refresh'
  sessionId?: string
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
}

export class JWTService {
  private static readonly ACCESS_TOKEN_EXPIRES = '15m'
  private static readonly REFRESH_TOKEN_EXPIRES = '7d'
  private static readonly ISSUER = 'hayl-energy-ai'
  private static readonly AUDIENCE = 'hayl-energy-ai-users'

  static async signAccessToken(payload: { userId: string; email: string; sessionId?: string }): Promise<string> {
    return await new SignJWT({
      ...payload,
      type: 'access'
    } as TokenPayload)
      .setProtectedHeader({ alg })
      .setIssuedAt()
      .setIssuer(this.ISSUER)
      .setAudience(this.AUDIENCE)
      .setExpirationTime(this.ACCESS_TOKEN_EXPIRES)
      .setJti(crypto.randomUUID())
      .sign(accessTokenSecret)
  }

  static async signRefreshToken(payload: { userId: string; email: string; sessionId?: string }): Promise<string> {
    return await new SignJWT({
      ...payload,
      type: 'refresh'
    } as TokenPayload)
      .setProtectedHeader({ alg })
      .setIssuedAt()
      .setIssuer(this.ISSUER)
      .setAudience(this.AUDIENCE)
      .setExpirationTime(this.REFRESH_TOKEN_EXPIRES)
      .setJti(crypto.randomUUID())
      .sign(refreshTokenSecret)
  }

  static async createTokenPair(payload: { userId: string; email: string }): Promise<TokenPair> {
    const sessionId = crypto.randomUUID()
    const tokenPayload = { ...payload, sessionId }

    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken(tokenPayload),
      this.signRefreshToken(tokenPayload)
    ])

    return { accessToken, refreshToken }
  }

  static async verifyAccessToken(token: string): Promise<TokenPayload | null> {
    try {
      const { payload } = await jwtVerify(token, accessTokenSecret, {
        issuer: this.ISSUER,
        audience: this.AUDIENCE
      })
      
      const tokenPayload = payload as TokenPayload
      if (tokenPayload.type !== 'access') {
        return null
      }
      
      return tokenPayload
    } catch (error) {
      console.error('Access token verification failed:', error)
      return null
    }
  }

  static async verifyRefreshToken(token: string): Promise<TokenPayload | null> {
    try {
      const { payload } = await jwtVerify(token, refreshTokenSecret, {
        issuer: this.ISSUER,
        audience: this.AUDIENCE
      })
      
      const tokenPayload = payload as TokenPayload
      if (tokenPayload.type !== 'refresh') {
        return null
      }
      
      return tokenPayload
    } catch (error) {
      console.error('Refresh token verification failed:', error)
      return null
    }
  }

  static async verifyToken(token: string, type: 'access' | 'refresh' = 'access'): Promise<TokenPayload | null> {
    return type === 'access' 
      ? await this.verifyAccessToken(token)
      : await this.verifyRefreshToken(token)
  }

  static async getTokenFromRequest(request: Request): Promise<{ accessToken?: string; refreshToken?: string }> {
    // Check Authorization header for access token
    const authHeader = request.headers.get('authorization')
    const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined

    // Check cookies for both tokens
    const cookieStore = await cookies()
    const accessTokenFromCookie = cookieStore.get('access-token')?.value
    const refreshTokenFromCookie = cookieStore.get('refresh-token')?.value

    return {
      accessToken: accessToken || accessTokenFromCookie,
      refreshToken: refreshTokenFromCookie
    }
  }

  static generateSecureSecret(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }

  static isTokenExpired(payload: TokenPayload): boolean {
    if (!payload.exp) return true
    return Date.now() >= payload.exp * 1000
  }

  static isTokenExpiringSoon(payload: TokenPayload, bufferMinutes = 5): boolean {
    if (!payload.exp) return true
    const bufferMs = bufferMinutes * 60 * 1000
    return Date.now() >= (payload.exp * 1000 - bufferMs)
  }

  static extractTokenInfo(token: string): { header: any; payload: TokenPayload } | null {
    try {
      const parts = token.split('.')
      if (parts.length !== 3) return null

      const header = JSON.parse(atob(parts[0]))
      const payload = JSON.parse(atob(parts[1])) as TokenPayload

      return { header, payload }
    } catch {
      return null
    }
  }
}

// Legacy compatibility functions
export const signToken = JWTService.signAccessToken
export const verifyToken = JWTService.verifyAccessToken
export const getTokenFromRequest = JWTService.getTokenFromRequest