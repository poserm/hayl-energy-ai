import { NextResponse } from 'next/server'

/**
 * Debug endpoint to check environment variables
 * GET /api/eia/debug
 */
export async function GET() {
  return NextResponse.json({
    hasEiaApiKey: !!process.env.EIA_API_KEY,
    eiaApiKeyLength: process.env.EIA_API_KEY?.length || 0,
    eiaApiKeyPrefix: process.env.EIA_API_KEY?.substring(0, 10) || 'NOT_SET',
    hasNextPublicEiaUrl: !!process.env.NEXT_PUBLIC_EIA_API_URL,
    eiaUrl: process.env.NEXT_PUBLIC_EIA_API_URL || 'NOT_SET',
    nodeEnv: process.env.NODE_ENV,
    allEnvKeys: Object.keys(process.env).filter(k => k.includes('EIA')).sort()
  })
}
