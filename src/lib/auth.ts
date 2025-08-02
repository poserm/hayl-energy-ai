import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
const alg = 'HS256'

export async function signToken(payload: { userId: string, email: string }) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as { userId: string, email: string, iat: number, exp: number }
  } catch {
    return null
  }
}

export async function getTokenFromRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  
  const cookieStore = await cookies()
  return cookieStore.get('auth-token')?.value
}

export async function getCurrentUser(request: NextRequest) {
  const token = await getTokenFromRequest(request)
  if (!token) return null
  
  return await verifyToken(token)
}