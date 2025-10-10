import { NextResponse } from 'next/server'

/**
 * Debug endpoint to check environment variables
 * GET /api/eia/debug
 */
export async function GET() {
  const hasKey = !!process.env.EIA_API_KEY
  const keyLength = process.env.EIA_API_KEY?.length || 0

  return NextResponse.json({
    status: hasKey ? 'OK' : 'ERROR',
    message: hasKey
      ? 'EIA_API_KEY is configured correctly'
      : 'EIA_API_KEY is NOT SET - Please configure in Vercel Environment Variables',
    environment: {
      hasEiaApiKey: hasKey,
      eiaApiKeyLength: keyLength,
      eiaApiKeyPrefix: process.env.EIA_API_KEY?.substring(0, 10) || 'NOT_SET',
      hasNextPublicEiaUrl: !!process.env.NEXT_PUBLIC_EIA_API_URL,
      eiaUrl: process.env.NEXT_PUBLIC_EIA_API_URL || 'https://api.eia.gov/v2',
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV || 'not-vercel',
    },
    allEnvKeysWithEIA: Object.keys(process.env).filter(k => k.includes('EIA')).sort(),
    allEnvKeysCount: Object.keys(process.env).length,
    timestamp: new Date().toISOString(),
    help: hasKey ? null : {
      steps: [
        '1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables',
        '2. Add or edit: EIA_API_KEY',
        '3. Make sure to check ALL THREE boxes: Production, Preview, Development',
        '4. Click Save',
        '5. Redeploy your application',
        '6. Test this endpoint again'
      ]
    }
  })
}
