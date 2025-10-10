import { NextRequest, NextResponse } from 'next/server'

/**
 * Simplified generators endpoint for debugging
 * GET /api/eia/generators-simple
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const region = searchParams.get('region') || 'PJM'
  const limit = 100 // Small limit for testing

  console.log('='.repeat(80))
  console.log('[Generators Simple] START')
  console.log('[Generators Simple] Region:', region)
  console.log('[Generators Simple] Limit:', limit)

  // Step 1: Check environment variable
  const apiKey = process.env.EIA_API_KEY
  console.log('[Generators Simple] Step 1 - Env Check:')
  console.log('  - Has API Key:', !!apiKey)
  console.log('  - Key Length:', apiKey?.length || 0)
  console.log('  - Key Prefix:', apiKey?.substring(0, 8) || 'NOT_SET')

  if (!apiKey) {
    console.log('[Generators Simple] ERROR: No API key found')
    console.log('[Generators Simple] All env vars with EIA:', Object.keys(process.env).filter(k => k.includes('EIA')))
    return NextResponse.json({
      success: false,
      error: 'EIA_API_KEY not found in environment',
      step: 'env_check',
      debug: {
        allEiaKeys: Object.keys(process.env).filter(k => k.includes('EIA')),
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV,
      }
    }, { status: 500 })
  }

  // Step 2: Build URL
  const baseUrl = 'https://api.eia.gov/v2'
  const endpoint = '/electricity/operating-generator-capacity/data/'
  const params = new URLSearchParams({
    'api_key': apiKey,
    'frequency': 'monthly',
    'data[0]': 'nameplate-capacity-mw',
    'data[1]': 'latitude',
    'data[2]': 'longitude',
    'facets[balancing_authority_code][]': region,
    'facets[status][]': 'OP',
    'start': '2024-01',
    'length': String(limit),
    'sort[0][column]': 'nameplate-capacity-mw',
    'sort[0][direction]': 'desc'
  })

  const url = `${baseUrl}${endpoint}?${params.toString()}`
  const safeUrl = url.replace(apiKey, 'API_KEY_HIDDEN')
  console.log('[Generators Simple] Step 2 - URL Built:')
  console.log('  - URL (safe):', safeUrl)

  // Step 3: Make request
  try {
    console.log('[Generators Simple] Step 3 - Making fetch request...')
    const response = await fetch(url)

    console.log('[Generators Simple] Response received:')
    console.log('  - Status:', response.status)
    console.log('  - Status Text:', response.statusText)
    console.log('  - OK:', response.ok)

    if (!response.ok) {
      const errorText = await response.text()
      console.log('[Generators Simple] ERROR Response:')
      console.log('  - Error Text:', errorText.substring(0, 200))
      return NextResponse.json({
        success: false,
        error: `EIA API returned ${response.status}`,
        step: 'api_request',
        debug: {
          status: response.status,
          statusText: response.statusText,
          errorPreview: errorText.substring(0, 200)
        }
      }, { status: response.status })
    }

    const data = await response.json()
    console.log('[Generators Simple] Step 4 - Parse response:')
    console.log('  - Has response:', !!data.response)
    console.log('  - Has data:', !!data.response?.data)
    console.log('  - Data count:', data.response?.data?.length || 0)

    if (!data.response?.data) {
      console.log('[Generators Simple] ERROR: No data in response')
      return NextResponse.json({
        success: false,
        error: 'No data in EIA API response',
        step: 'parse_response',
        debug: {
          hasResponse: !!data.response,
          responseKeys: data.response ? Object.keys(data.response) : []
        }
      }, { status: 500 })
    }

    // Step 5: Process data (simplified)
    const generators = data.response.data.slice(0, 10).map((gen: any) => ({
      plantName: gen.plantName,
      technology: gen.technology,
      capacity: parseFloat(gen['nameplate-capacity-mw'] || 0),
      state: gen.stateid,
      latitude: parseFloat(gen.latitude),
      longitude: parseFloat(gen.longitude),
    }))

    console.log('[Generators Simple] Step 5 - Processed:')
    console.log('  - Generators:', generators.length)
    console.log('  - Sample:', generators[0])
    console.log('[Generators Simple] SUCCESS')
    console.log('='.repeat(80))

    return NextResponse.json({
      success: true,
      message: 'Successfully fetched EIA data',
      generators,
      total: data.response.data.length,
      rawTotal: data.response.total,
      debug: {
        region,
        limit,
        apiKeyLength: apiKey.length,
        dataReceived: data.response.data.length
      }
    })

  } catch (error) {
    console.log('[Generators Simple] EXCEPTION:')
    console.log('  - Error:', error)
    console.log('  - Type:', error instanceof Error ? error.constructor.name : typeof error)
    console.log('  - Message:', error instanceof Error ? error.message : String(error))
    console.log('='.repeat(80))

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      step: 'exception',
      debug: {
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        errorMessage: error instanceof Error ? error.message : String(error)
      }
    }, { status: 500 })
  }
}
