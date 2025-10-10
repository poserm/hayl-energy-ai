import { NextRequest, NextResponse } from 'next/server'
import { eiaClient, FUEL_TYPES } from '@/lib/services/eia-api'

/**
 * Test endpoint for EIA API integration
 * GET /api/eia/test
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const testType = searchParams.get('type') || 'virginia'

    console.log(`[EIA Test] Running test type: ${testType}`)

    let result: any

    switch (testType) {
      case 'virginia':
        // Test Virginia electricity data
        result = await eiaClient.getVirginiaElectricityData({
          frequency: 'annual',
          start: '2020',
          end: '2023'
        })
        break

      case 'solar':
        // Test solar generation data for Virginia
        result = await eiaClient.getGenerationByFuel(FUEL_TYPES.SOLAR, {
          frequency: 'annual',
          location: 'VA',
          start: '2020',
          end: '2023'
        })
        break

      case 'renewables':
        // Test renewable energy data
        result = await eiaClient.getRenewableEnergyData({
          frequency: 'annual',
          location: 'VA',
          start: '2020',
          end: '2023'
        })
        break

      case 'generation':
        // Test all generation data for Virginia
        result = await eiaClient.getElectricityGeneration({
          frequency: 'annual',
          facets: {
            location: 'VA',
            sectorid: 'ELE'
          },
          start: '2020',
          end: '2023',
          length: 100
        })
        break

      case 'retail-sales':
        // Test retail sales data
        result = await eiaClient.getRetailSales({
          frequency: 'annual',
          location: 'VA',
          start: '2020',
          end: '2023'
        })
        break

      case 'datasets':
        // List available datasets
        result = await eiaClient.getAvailableDatasets()
        break

      default:
        return NextResponse.json({
          error: 'Invalid test type',
          available_types: [
            'virginia',
            'solar',
            'renewables',
            'generation',
            'retail-sales',
            'datasets'
          ]
        }, { status: 400 })
    }

    // Format response with summary
    const response = {
      success: true,
      test_type: testType,
      timestamp: new Date().toISOString(),
      data_summary: {
        total_records: result?.response?.data?.length || 0,
        first_record: result?.response?.data?.[0] || null,
        sample_records: result?.response?.data?.slice(0, 5) || []
      },
      full_response: result
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('[EIA Test] Error:', error)

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : null,
      help: {
        message: 'Make sure EIA_API_KEY is set in .env.local',
        example: 'EIA_API_KEY=your_api_key_here'
      }
    }, { status: 500 })
  }
}
