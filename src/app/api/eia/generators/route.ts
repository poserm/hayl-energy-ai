import { NextRequest, NextResponse } from 'next/server'
import { EIAAPIClient } from '@/lib/services/eia-api'
import { EIA_CONFIG } from '@/lib/eia-config'

/**
 * GET /api/eia/generators
 * Fetch operating generators from EIA API
 *
 * Query params:
 * - region: Balancing authority code (e.g., 'PJM', 'MISO', 'CAISO')
 * - state: State code (e.g., 'VA', 'MD')
 * - technology: Technology type (e.g., 'Nuclear', 'Solar')
 * - limit: Max results (default: 5000)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const region = searchParams.get('region')
    const state = searchParams.get('state')
    const technology = searchParams.get('technology')
    const limit = parseInt(searchParams.get('limit') || '5000')

    console.log(`[EIA Generators] ========================================`)
    console.log(`[EIA Generators] Request received`)
    console.log(`[EIA Generators] Region: ${region}`)
    console.log(`[EIA Generators] State: ${state}`)
    console.log(`[EIA Generators] Technology: ${technology}`)
    console.log(`[EIA Generators] Limit: ${limit}`)
    console.log(`[EIA Generators] Using hardcoded config (temporary workaround)`)
    console.log(`[EIA Generators] ========================================`)

    // TEMPORARY WORKAROUND: Use hardcoded config
    // Try env var first, fall back to config file
    const apiKey = process.env.EIA_API_KEY || EIA_CONFIG.apiKey

    console.log(`[EIA Generators] API key source: ${process.env.EIA_API_KEY ? 'environment' : 'config file'}`)
    console.log(`[EIA Generators] API key available: ${!!apiKey}`)

    const client = new EIAAPIClient(apiKey)
    console.log(`[EIA Generators] Created EIA client`)

    // Get generators from EIA
    console.log(`[EIA Generators] Calling EIA API...`)
    const result = await client.getOperatingGenerators({
      frequency: 'monthly',
      balancing_authority: region || undefined,
      stateid: state || undefined,
      technology: technology || undefined,
      status: 'OP', // Operating only
      length: limit,
      // Get latest available data
      start: '2024-01'
    })
    console.log(`[EIA Generators] EIA API response received`)
    console.log(`[EIA Generators] Response has data: ${!!result.response?.data}`)
    console.log(`[EIA Generators] Data count: ${result.response?.data?.length || 0}`)

    if (!result.response?.data) {
      console.log(`[EIA Generators] ERROR: No data in response`)
      console.log(`[EIA Generators] Full response:`, JSON.stringify(result, null, 2))
      return NextResponse.json({
        success: false,
        error: 'No data returned from EIA API',
        generators: [],
        total: 0,
        debug: {
          hasResponse: !!result.response,
          responseKeys: result.response ? Object.keys(result.response) : []
        }
      })
    }

    // Process and deduplicate generators by plant NAME (not ID)
    // This properly sums all units/generators for plants with the same name
    console.log(`[EIA Generators] Processing ${result.response.data.length} generators...`)
    const plantMap = new Map()

    result.response.data.forEach((gen: any) => {
      // Use plant name as the key for aggregation
      const plantKey = gen.plantName || `unknown-${gen.plantid}`
      const capacity = parseFloat(gen['nameplate-capacity-mw'] || 0)

      if (!plantMap.has(plantKey)) {
        // First generator for this plant
        plantMap.set(plantKey, {
          plantId: gen.plantid,
          plantName: gen.plantName,
          entityId: gen.entityid,
          entityName: gen.entityName,
          latitude: parseFloat(gen.latitude),
          longitude: parseFloat(gen.longitude),
          technology: gen.technology,
          energySource: gen.energy_source_code,
          energySourceDesc: gen['energy-source-desc'],
          balancingAuthority: gen.balancing_authority_code,
          balancingAuthorityName: gen['balancing-authority-name'],
          state: gen.stateid,
          stateName: gen.stateName,
          sector: gen.sector,
          sectorName: gen.sectorName,
          status: gen.status,
          statusDesc: gen.statusDescription,
          capacity: capacity,
          generatorCount: 1,
          generators: [{
            id: gen.generatorid,
            capacity: capacity,
            technology: gen.technology
          }]
        })
      } else {
        // Add generator to existing plant - SUM THE CAPACITY
        const plant = plantMap.get(plantKey)
        plant.capacity += capacity
        plant.generatorCount += 1
        plant.generators.push({
          id: gen.generatorid,
          capacity: capacity,
          technology: gen.technology
        })
      }
    })

    const generators = Array.from(plantMap.values())
      .filter(plant => plant.latitude && plant.longitude) // Only plants with coordinates
      .sort((a, b) => b.capacity - a.capacity) // Sort by capacity descending

    console.log(`[EIA Generators] Processed ${generators.length} unique plants`)
    console.log(`[EIA Generators] Plants with coordinates: ${generators.length}`)

    // Calculate statistics
    const stats = {
      totalPlants: generators.length,
      totalCapacity: generators.reduce((sum, gen) => sum + gen.capacity, 0),
      byTechnology: generators.reduce((acc: any, gen) => {
        const tech = gen.technology || 'Other'
        if (!acc[tech]) {
          acc[tech] = { count: 0, capacity: 0 }
        }
        acc[tech].count += 1
        acc[tech].capacity += gen.capacity
        return acc
      }, {}),
      byState: generators.reduce((acc: any, gen) => {
        const state = gen.state || 'Unknown'
        if (!acc[state]) {
          acc[state] = { count: 0, capacity: 0 }
        }
        acc[state].count += 1
        acc[state].capacity += gen.capacity
        return acc
      }, {})
    }

    return NextResponse.json({
      success: true,
      generators,
      stats,
      filters: {
        region,
        state,
        technology,
        limit
      },
      total: generators.length,
      rawTotal: result.response.total
    })

  } catch (error) {
    console.error('[EIA Generators] ========================================')
    console.error('[EIA Generators] ERROR occurred:')
    console.error('[EIA Generators] Error type:', error instanceof Error ? 'Error' : typeof error)
    console.error('[EIA Generators] Error message:', error instanceof Error ? error.message : String(error))
    console.error('[EIA Generators] Error stack:', error instanceof Error ? error.stack : 'N/A')
    console.error('[EIA Generators] ========================================')

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      generators: [],
      total: 0,
      debug: {
        hasApiKey: !!process.env.EIA_API_KEY,
        apiKeyLength: process.env.EIA_API_KEY?.length || 0,
        errorType: error instanceof Error ? error.constructor.name : typeof error
      },
      help: {
        message: 'Make sure EIA_API_KEY is set in environment variables',
        example: 'GET /api/eia/generators?region=PJM&state=VA'
      }
    }, { status: 500 })
  }
}
