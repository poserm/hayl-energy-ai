import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Parse utility ID (format: STATE_HASH)
    const [stateCode, nameHash] = id.split('_')
    if (!stateCode || !nameHash) {
      return NextResponse.json({ error: 'Invalid utility ID format' }, { status: 400 })
    }

    // Get all utilities in the state to find the matching one
    const stateUtilities = await prisma.generators.groupBy({
      by: ['entity_name'],
      where: {
        plant_state: stateCode.toUpperCase(),
        entity_name: { not: null }
      },
      _sum: {
        nameplate_capacity_mw: true
      }
    })

    // Find the utility that matches the hash
    const targetUtility = stateUtilities.find(util => {
      const utilHash = Math.abs((util.entity_name || '').split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % 100000
      return utilHash.toString() === nameHash
    })

    if (!targetUtility) {
      return NextResponse.json({ error: 'Utility not found' }, { status: 404 })
    }

    const utilityName = targetUtility.entity_name!

    // Get basic utility information with separate queries
    const basicInfo = await prisma.generators.groupBy({
      by: ['entity_name', 'plant_state'],
      where: {
        entity_name: utilityName,
        plant_state: stateCode.toUpperCase()
      },
      _sum: {
        nameplate_capacity_mw: true
      },
      _count: {
        id: true
      },
      _avg: {
        nameplate_capacity_mw: true
      }
    })

    // Get plant count separately
    const plantCount = await prisma.generators.groupBy({
      by: ['plant_name'],
      where: {
        entity_name: utilityName,
        plant_state: stateCode.toUpperCase(),
        plant_name: { not: null }
      }
    })

    // Get technology breakdown
    const technologyMix = await prisma.generators.groupBy({
      by: ['technology'],
      where: {
        entity_name: utilityName,
        plant_state: stateCode.toUpperCase(),
        technology: { not: null }
      },
      _sum: {
        nameplate_capacity_mw: true
      },
      _count: {
        id: true
      },
      orderBy: {
        _sum: {
          nameplate_capacity_mw: 'desc'
        }
      }
    })

    // Get plant details
    const plants = await prisma.generators.groupBy({
      by: ['plant_name', 'county'],
      where: {
        entity_name: utilityName,
        plant_state: stateCode.toUpperCase(),
        plant_name: { not: null },
        county: { not: null }
      },
      _sum: {
        nameplate_capacity_mw: true
      },
      _count: {
        id: true
      },
      orderBy: {
        _sum: {
          nameplate_capacity_mw: 'desc'
        }
      }
    })

    // Try to get additional data (with error handling)
    let operationalData: any = null
    let salesData: any = null
    let territories: any[] = []

    try {
      operationalData = await prisma.operational_data.findFirst({
        where: {
          utility_name: { contains: utilityName, mode: 'insensitive' },
          state: stateCode.toUpperCase()
        },
        orderBy: { data_year: 'desc' }
      })
    } catch (e) {
      console.warn('Operational data not available')
    }

    try {
      salesData = await prisma.utility_sales.findFirst({
        where: {
          utility_name: { contains: utilityName, mode: 'insensitive' },
          state: stateCode.toUpperCase()
        },
        orderBy: { data_year: 'desc' }
      })
    } catch (e) {
      console.warn('Sales data not available')
    }

    try {
      territories = await prisma.service_territories.findMany({
        where: {
          utility_name: { contains: utilityName, mode: 'insensitive' },
          state: stateCode.toUpperCase()
        },
        select: {
          county: true,
          state: true
        }
      })
    } catch (e) {
      console.warn('Service territories not available')
    }

    const utility = basicInfo[0]
    if (!utility) {
      return NextResponse.json({ error: 'Utility data not found' }, { status: 404 })
    }

    const totalCapacity = Number(utility._sum.nameplate_capacity_mw || 0)

    // Process technology mix
    const processedTechMix = technologyMix.map(tech => {
      const capacity = Number(tech._sum.nameplate_capacity_mw || 0)
      const percentage = totalCapacity > 0 ? (capacity / totalCapacity * 100) : 0
      
      // Simple color coding
      const getColorCode = (technology: string) => {
        const tech = technology?.toLowerCase() || ''
        if (tech.includes('solar')) return '#f59e0b'
        if (tech.includes('wind')) return '#06b6d4'
        if (tech.includes('natural gas') || tech.includes('gas')) return '#3b82f6'
        if (tech.includes('nuclear')) return '#10b981'
        if (tech.includes('coal')) return '#6b7280'
        if (tech.includes('hydro')) return '#0ea5e9'
        return '#64748b'
      }

      return {
        technology: tech.technology,
        capacityMw: Math.round(capacity * 10) / 10,
        percentage: Math.round(percentage * 100) / 100,
        colorCode: getColorCode(tech.technology || ''),
        count: tech._count.id
      }
    })

    // Calculate energy categories
    const renewableCapacity = processedTechMix
      .filter(tech => {
        const t = tech.technology?.toLowerCase() || ''
        return t.includes('solar') || t.includes('wind') || t.includes('hydro') || t.includes('geothermal')
      })
      .reduce((sum, tech) => sum + tech.capacityMw, 0)
    
    const fossilCapacity = processedTechMix
      .filter(tech => {
        const t = tech.technology?.toLowerCase() || ''
        return t.includes('gas') || t.includes('coal') || t.includes('petroleum')
      })
      .reduce((sum, tech) => sum + tech.capacityMw, 0)
    
    const nuclearCapacity = processedTechMix
      .filter(tech => tech.technology?.toLowerCase().includes('nuclear'))
      .reduce((sum, tech) => sum + tech.capacityMw, 0)

    const cleanEnergyPercentage = totalCapacity > 0 ? 
      ((renewableCapacity + nuclearCapacity) / totalCapacity * 100) : 0

    // Process plants data
    const facilitiesData = plants.slice(0, 20).map(plant => ({
      plantName: plant.plant_name,
      county: plant.county,
      capacityMw: Math.round(Number(plant._sum.nameplate_capacity_mw || 0) * 10) / 10,
      generatorCount: plant._count.id
    }))

    const result = {
      utility_info: {
        id: id,
        utilityName: utilityName,
        state: stateCode.toUpperCase(),
        ownershipType: 'Electric Utility',
        totalCapacityMw: Math.round(totalCapacity * 10) / 10,
        totalGenerators: utility._count.id,
        totalPlants: plantCount.length,
        avgGeneratorSizeMw: Math.round(Number(utility._avg.nameplate_capacity_mw || 0) * 10) / 10
      },
      energy_portfolio: {
        technologyMix: processedTechMix,
        energyCategories: {
          renewable: {
            capacityMw: Math.round(renewableCapacity * 10) / 10,
            percentage: Math.round((renewableCapacity / totalCapacity * 100) * 100) / 100
          },
          fossil: {
            capacityMw: Math.round(fossilCapacity * 10) / 10,
            percentage: Math.round((fossilCapacity / totalCapacity * 100) * 100) / 100
          },
          nuclear: {
            capacityMw: Math.round(nuclearCapacity * 10) / 10,
            percentage: Math.round((nuclearCapacity / totalCapacity * 100) * 100) / 100
          }
        },
        cleanEnergyPercentage: Math.round(cleanEnergyPercentage * 100) / 100,
        dominantTechnology: processedTechMix[0]?.technology || 'Unknown'
      },
      facilities: facilitiesData,
      service_territory: territories.map(t => t.county).filter(Boolean),
      operational_metrics: operationalData ? {
        year: operationalData.data_year,
        summerPeakDemandMw: Number(operationalData.summer_peak_demand_mw || 0),
        winterPeakDemandMw: Number(operationalData.winter_peak_demand_mw || 0),
        netGenerationMwh: Number(operationalData.net_generation_mwh || 0),
        totalRevenueMillion: Number(operationalData.total_revenue_thousands || 0) / 1000
      } : null,
      customer_metrics: salesData ? {
        year: salesData.data_year,
        totalCustomers: Number(salesData.total_customers_count || 0),
        totalSalesMwh: Number(salesData.total_sales_mwh || 0),
        totalRevenueMillion: Number(salesData.total_revenue_thousands || 0) / 1000,
        sectors: {
          residential: {
            customers: Number(salesData.residential_customers_count || 0),
            salesMwh: Number(salesData.residential_sales_mwh || 0),
            revenueMillion: Number(salesData.residential_revenue_thousands || 0) / 1000
          },
          commercial: {
            customers: Number(salesData.commercial_customers_count || 0),
            salesMwh: Number(salesData.commercial_sales_mwh || 0),
            revenueMillion: Number(salesData.commercial_revenue_thousands || 0) / 1000
          },
          industrial: {
            customers: Number(salesData.industrial_customers_count || 0),
            salesMwh: Number(salesData.industrial_sales_mwh || 0),
            revenueMillion: Number(salesData.industrial_revenue_thousands || 0) / 1000
          }
        }
      } : null
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching utility profile:', error)
    return NextResponse.json({ error: 'Failed to fetch utility profile' }, { status: 500 })
  }
}