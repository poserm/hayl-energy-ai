import { NextResponse } from 'next/server'

/**
 * Comprehensive environment variable diagnostic endpoint
 * GET /api/eia/test-env
 */
export async function GET() {
  // Try multiple ways to access the environment variable
  const methods = {
    direct: process.env.EIA_API_KEY,
    bracket: process.env['EIA_API_KEY'],
    uppercase: process.env.EIA_API_KEY,
    // Check for common typos
    withUnderscore: process.env['EIA_API_KEY'],
    lowercase: process.env['eia_api_key'],
    // Check Vercel-specific patterns
    vercelPattern: process.env['EIA_API_KEY'],
  }

  // Get all env var keys
  const allKeys = Object.keys(process.env).sort()
  const eiaKeys = allKeys.filter(k => k.toLowerCase().includes('eia'))
  const apiKeys = allKeys.filter(k => k.toLowerCase().includes('api'))

  // Check if any variation exists
  const hasAnyEiaKey = eiaKeys.length > 0
  const hasExactKey = allKeys.includes('EIA_API_KEY')

  // Runtime environment info
  const runtimeInfo = {
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    vercelUrl: process.env.VERCEL_URL,
    isVercel: !!process.env.VERCEL,
    vercelGitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA,
  }

  // The key diagnostic
  const diagnostic = {
    status: hasExactKey ? 'FOUND' : 'MISSING',
    hasExactKey,
    hasAnyEiaKey,
    eiaRelatedKeys: eiaKeys,
    apiRelatedKeys: apiKeys,
    totalEnvVars: allKeys.length,

    // Show first 10 chars if exists
    keyValue: methods.direct ? `${methods.direct.substring(0, 10)}...` : 'NOT_FOUND',
    keyLength: methods.direct?.length || 0,

    accessMethods: {
      direct: !!methods.direct,
      bracket: !!methods.bracket,
      uppercase: !!methods.uppercase,
      lowercase: !!methods.lowercase,
    },

    runtimeInfo,

    // Sample of all env keys (first 50)
    sampleEnvKeys: allKeys.slice(0, 50),
  }

  return NextResponse.json(diagnostic, {
    headers: {
      'Cache-Control': 'no-store, must-revalidate',
    }
  })
}
