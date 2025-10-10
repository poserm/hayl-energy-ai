import { NextResponse } from 'next/server'

/**
 * Show deployment and environment information
 * GET /api/eia/deployment-info
 */
export async function GET() {
  return NextResponse.json({
    deployment: {
      vercelEnv: process.env.VERCEL_ENV || 'not-vercel',
      vercelUrl: process.env.VERCEL_URL || 'not-vercel',
      vercelGitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
      vercelGitCommitMessage: process.env.VERCEL_GIT_COMMIT_MESSAGE || 'unknown',
      vercelGitCommitRef: process.env.VERCEL_GIT_COMMIT_REF || 'unknown',
      isVercel: !!process.env.VERCEL,
    },
    environment: {
      nodeEnv: process.env.NODE_ENV,
      hasEiaApiKey: !!process.env.EIA_API_KEY,
      eiaApiKeyLength: process.env.EIA_API_KEY?.length || 0,
      totalEnvVars: Object.keys(process.env).length,
    },
    timestamp: new Date().toISOString(),
    message: process.env.EIA_API_KEY
      ? '✅ EIA_API_KEY is present'
      : '❌ EIA_API_KEY is MISSING - Check Vercel Settings',
  })
}
