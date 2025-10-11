import { NextRequest, NextResponse } from 'next/server'
import { EIAAPIClient } from '@/lib/services/eia-api'
import { EIA_CONFIG } from '@/lib/eia-config'

/**
 * GET /api/eia/generation
 * Fetch electricity generation data from EIA API
 *
 * Query params:
 * - region: Balancing authority code (e.g., 'PJM', 'MISO', 'CAISO')
 * - state: State code (e.g., 'VA', 'MD')
 * - limit: Max results (default: 5000)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const region = searchParams.get('region')
    const state = searchParams.get('state')
    const limit = parseInt(searchParams.get('limit') || '5000')

    console.log(`[EIA Generation] ========================================`)
    console.log(`[EIA Generation] Request received`)
    console.log(`[EIA Generation] Region: ${region}`)
    console.log(`[EIA Generation] State: ${state}`)
    console.log(`[EIA Generation] Limit: ${limit}`)
    console.log(`[EIA Generation] ========================================`)

    // Use hardcoded config fallback
    const apiKey = process.env.EIA_API_KEY || EIA_CONFIG.apiKey
    const client = new EIAAPIClient(apiKey)
    console.log(`[EIA Generation] Created EIA client`)

    console.log(`[EIA Generation] Calling EIA API for generation data...`)

    // Build facets for the query
    const facets: any = {
      sectorid: 'ALL' // All sectors
    }

    // Add location (state) filter if provided
    if (state) {
      facets.location = state
    }

    // Fetch generation data from EIA
    const result = await client.getElectricityGeneration({
      frequency: 'monthly',
      facets,
      start: '2024-01',
      length: limit
    })

    console.log(`[EIA Generation] EIA API response received`)
    console.log(`[EIA Generation] Response has data: ${!!result.response?.data}`)
    console.log(`[EIA Generation] Data count: ${result.response?.data?.length || 0}`)

    if (!result.response?.data) {
      console.log(`[EIA Generation] ERROR: No data in response`)
      return NextResponse.json({
        success: false,
        error: 'No generation data returned from EIA API',
        data: [],
        total: 0
      })
    }

    // Process and aggregate generation data by technology
    console.log(`[EIA Generation] Processing ${result.response.data.length} generation records...`)
    const techMap = new Map<string, number>()

    result.response.data.forEach((record: any) => {
      const fuelType = record.fuelTypeDescription || record.fuelType || 'Other'
      const generation = parseFloat(record.generation || 0)

      if (!techMap.has(fuelType)) {
        techMap.set(fuelType, generation)
      } else {
        techMap.set(fuelType, techMap.get(fuelType)! + generation)
      }
    })

    const generationByTech = Array.from(techMap.entries()).map(([tech, gen]) => ({
      technology: tech,
      generation: gen
    })).sort((a, b) => b.generation - a.generation)

    const totalGeneration = generationByTech.reduce((sum, item) => sum + item.generation, 0)

    console.log(`[EIA Generation] Aggregation complete:`)
    console.log(`  - Unique technologies: ${generationByTech.length}`)
    console.log(`  - Total generation: ${totalGeneration.toFixed(2)} MWh`)

    return NextResponse.json({
      success: true,
      data: generationByTech,
      stats: {
        totalGeneration,
        byTechnology: generationByTech.reduce((acc: any, item) => {
          acc[item.technology] = { generation: item.generation }
          return acc
        }, {})
      },
      filters: {
        region,
        state,
        limit
      },
      total: generationByTech.length
    })

  } catch (error) {
    console.error('[EIA Generation] ========================================')
    console.error('[EIA Generation] ERROR occurred:')
    console.error('[EIA Generation] Error message:', error instanceof Error ? error.message : String(error))
    console.error('[EIA Generation] Error stack:', error instanceof Error ? error.stack : 'N/A')
    console.error('[EIA Generation] ========================================')

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: [],
      total: 0
    }, { status: 500 })
  }
}
