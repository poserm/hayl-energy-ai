import { NextResponse } from 'next/server'

/**
 * Direct EIA API test - bypasses our client completely
 * GET /api/eia/test-direct
 */
export async function GET() {
  const apiKey = process.env.EIA_API_KEY

  const result: any = {
    timestamp: new Date().toISOString(),
    step1_envCheck: {
      hasApiKey: !!apiKey,
      keyLength: apiKey?.length || 0,
      keyPrefix: apiKey?.substring(0, 8) || 'NOT_SET',
    }
  }

  if (!apiKey) {
    result.error = 'EIA_API_KEY environment variable is not set'
    result.allEnvKeysWithEIA = Object.keys(process.env).filter(k => k.includes('EIA'))
    return NextResponse.json(result, { status: 500 })
  }

  // Try to make a direct fetch to EIA API
  try {
    const testUrl = `https://api.eia.gov/v2/electricity/operating-generator-capacity/data/?api_key=${apiKey}&frequency=monthly&data[0]=nameplate-capacity-mw&facets[balancing_authority_code][]=PJM&facets[status][]=OP&start=2024-01&length=10`

    result.step2_urlConstructed = {
      url: testUrl.replace(apiKey, 'API_KEY_HIDDEN'),
      urlLength: testUrl.length
    }

    console.log('[Test Direct] Making direct fetch to EIA API...')
    const response = await fetch(testUrl)

    result.step3_fetchResponse = {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    }

    if (!response.ok) {
      const errorText = await response.text()
      result.step4_error = {
        responseText: errorText.substring(0, 500),
        fullLength: errorText.length
      }
      return NextResponse.json(result, { status: response.status })
    }

    const data = await response.json()

    result.step4_success = {
      hasResponse: !!data.response,
      hasData: !!data.response?.data,
      dataCount: data.response?.data?.length || 0,
      total: data.response?.total,
      sampleGenerator: data.response?.data?.[0] || null
    }

    result.conclusion = 'SUCCESS - EIA API is accessible and returning data'

    return NextResponse.json(result)

  } catch (error) {
    result.step_error = {
      error: error instanceof Error ? error.message : String(error),
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      stack: error instanceof Error ? error.stack : null
    }
    result.conclusion = 'FAILED - Could not reach EIA API'
    return NextResponse.json(result, { status: 500 })
  }
}
