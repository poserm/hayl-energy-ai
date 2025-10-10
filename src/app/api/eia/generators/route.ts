import { NextRequest, NextResponse } from 'next/server'
import { eiaClient } from '@/lib/services/eia-api'

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

    console.log(`[EIA Generators] Fetching generators - Region: ${region}, State: ${state}, Tech: ${technology}`)

    // Get generators from EIA
    const result = await eiaClient.getOperatingGenerators({
      frequency: 'monthly',
      balancing_authority: region || undefined,
      stateid: state || undefined,
      technology: technology || undefined,
      status: 'OP', // Operating only
      length: limit,
      // Get latest available data
      start: '2024-01'
    })

    if (!result.response?.data) {
      return NextResponse.json({
        success: false,
        error: 'No data returned from EIA API',
        generators: [],
        total: 0
      })
    }

    // Process and deduplicate generators by plantId
    const plantMap = new Map()

    result.response.data.forEach((gen: any) => {
      const plantId = gen.plantid
      const capacity = parseFloat(gen['nameplate-capacity-mw'] || 0)

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
        // Add generator to existing plant
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

    const generators = Array.from(plantMap.values())
      .filter(plant => plant.latitude && plant.longitude) // Only plants with coordinates
      .sort((a, b) => b.capacity - a.capacity) // Sort by capacity descending

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
    console.error('[EIA Generators] Error:', error)

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      generators: [],
      total: 0,
      help: {
        message: 'Make sure EIA_API_KEY is set in .env.local',
        example: 'GET /api/eia/generators?region=PJM&state=VA'
      }
    }, { status: 500 })
  }
}
