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

    // Process and aggregate by Plant ID
    // Each plantId = one distinct physical plant
    // Sum nameplate capacity for all generator IDs under that plant
    console.log(`[EIA Generators] Processing ${result.response.data.length} generators...`)
    const plantMap = new Map()

    result.response.data.forEach((gen: any) => {
      const plantId = gen.plantid
      const capacity = parseFloat(gen['nameplate-capacity-mw'] || 0)

      if (!plantId) return

      if (!plantMap.has(plantId)) {
        // First generator for this plant
        plantMap.set(plantId, {
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
        const plant = plantMap.get(plantId)
        plant.capacity += capacity
        plant.generatorCount += 1
        plant.generators.push({
          id: gen.generatorid,
          capacity: capacity,
          technology: gen.technology
        })
      }
    })

    const allPlants = Array.from(plantMap.values())
    const plantsWithCoords = allPlants.filter(plant => {
      const hasLat = plant.latitude && !isNaN(plant.latitude)
      const hasLng = plant.longitude && !isNaN(plant.longitude)
      return hasLat && hasLng
    })
    const generators = plantsWithCoords.sort((a, b) => b.capacity - a.capacity)

    console.log(`[EIA Generators] Aggregation results:`)
    console.log(`  - Total generators processed: ${result.response.data.length}`)
    console.log(`  - Unique plants (by plantId): ${allPlants.length}`)
    console.log(`  - Plants with valid coordinates: ${generators.length}`)
    console.log(`  - Plants filtered out (no coords): ${allPlants.length - generators.length}`)
    if (generators.length > 0) {
      console.log(`  - Sample plant:`, {
        name: generators[0].plantName,
        capacity: generators[0].capacity,
        generatorCount: generators[0].generatorCount,
        lat: generators[0].latitude,
        lng: generators[0].longitude
      })
    }

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
      rawTotal: result.response.total,
      debug: {
        generatorsReceived: result.response.data.length,
        uniquePlants: allPlants.length,
        plantsWithCoords: generators.length,
        plantsFiltered: allPlants.length - generators.length
      }
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
