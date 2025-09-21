import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// State name to acronym mapping
const STATE_NAME_TO_ACRONYM: { [key: string]: string } = {
  'Alabama': 'AL',
  'Alaska': 'AK',
  'Arizona': 'AZ',
  'Arkansas': 'AR',
  'California': 'CA',
  'Colorado': 'CO',
  'Connecticut': 'CT',
  'Delaware': 'DE',
  'Florida': 'FL',
  'Georgia': 'GA',
  'Hawaii': 'HI',
  'Idaho': 'ID',
  'Illinois': 'IL',
  'Indiana': 'IN',
  'Iowa': 'IA',
  'Kansas': 'KS',
  'Kentucky': 'KY',
  'Louisiana': 'LA',
  'Maine': 'ME',
  'Maryland': 'MD',
  'Massachusetts': 'MA',
  'Michigan': 'MI',
  'Minnesota': 'MN',
  'Mississippi': 'MS',
  'Missouri': 'MO',
  'Montana': 'MT',
  'Nebraska': 'NE',
  'Nevada': 'NV',
  'New Hampshire': 'NH',
  'New Jersey': 'NJ',
  'New Mexico': 'NM',
  'New York': 'NY',
  'North Carolina': 'NC',
  'North Dakota': 'ND',
  'Ohio': 'OH',
  'Oklahoma': 'OK',
  'Oregon': 'OR',
  'Pennsylvania': 'PA',
  'Rhode Island': 'RI',
  'South Carolina': 'SC',
  'South Dakota': 'SD',
  'Tennessee': 'TN',
  'Texas': 'TX',
  'Utah': 'UT',
  'Vermont': 'VT',
  'Virginia': 'VA',
  'Washington': 'WA',
  'West Virginia': 'WV',
  'Wisconsin': 'WI',
  'Wyoming': 'WY',
  'District of Columbia': 'DC'
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const stateName = searchParams.get('state')
    const ownershipFilter = searchParams.get('ownership')
    
    if (!stateName) {
      return NextResponse.json({ error: 'State parameter is required' }, { status: 400 })
    }
    
    // Convert state name to acronym
    const stateAcronym = STATE_NAME_TO_ACRONYM[stateName]
    
    if (!stateAcronym) {
      return NextResponse.json({ error: `Invalid state name: ${stateName}. Available states: ${Object.keys(STATE_NAME_TO_ACRONYM).join(', ')}` }, { status: 400 })
    }
    
    console.log(`Fetching utilities for state: ${stateName} (${stateAcronym})`)
    if (ownershipFilter) {
      console.log(`Filtering by ownership type: ${ownershipFilter}`)
    }
    
    // Build where clause
    const whereClause: any = {
      state: stateAcronym
    }
    
    // Add ownership filter if provided
    if (ownershipFilter) {
      // Map dashboard categories to database values
      const ownershipMapping: { [key: string]: string[] } = {
        'INVESTOR OWNED': ['Investor Owned', 'Investor-Owned', 'IOU', 'Investor'],
        'COOPERATIVES': ['Cooperative', 'Co-op', 'Coop', 'Rural Electric Cooperative'],
        'MUNICIPALITIES': ['Municipal', 'Municipality', 'Public', 'City', 'Town']
      }
      
      const dbValues = ownershipMapping[ownershipFilter.toUpperCase()]
      if (dbValues) {
        whereClause.ownership_type = {
          in: dbValues
        }
      }
    }
    
    // Fetch utilities from Prisma database
    const utilities = await prisma.utilities.findMany({
      where: whereClause,
      select: {
        id: true,
        utility_name: true,
        state: true,
        ownership_type: true,
        total_capacity_mw: true,
        counties_served: true,
        market_position: true,
        logo_scale: true
      },
      orderBy: {
        total_capacity_mw: 'desc'
      }
    })
    
    console.log(`Found ${utilities.length} utilities for ${stateName}`)
    console.log('Raw utilities data:', utilities.map(u => ({ name: u.utility_name, ownership: u.ownership_type, capacity: u.total_capacity_mw })))
    
    // If no utilities found, let's see what states are actually in the database
    if (utilities.length === 0) {
      console.log('No utilities found, checking what states exist in database...')
      const availableStates = await prisma.utilities.findMany({
        select: { state: true },
        distinct: ['state']
      })
      console.log('Available states in database:', availableStates.map(s => s.state))
    }
    
    // Transform the data to match the expected format
    const transformedUtilities = utilities.map(utility => ({
      id: utility.id,
      name: utility.utility_name,
      state: utility.state,
      ownershipType: utility.ownership_type,
      totalCapacity: utility.total_capacity_mw || 0,
      countiesServed: utility.counties_served,
      marketPosition: utility.market_position,
      logoScale: utility.logo_scale
    }))
    
    return NextResponse.json({
      success: true,
      utilities: transformedUtilities,
      count: transformedUtilities.length,
      state: stateName,
      stateAcronym: stateAcronym
    })
    
  } catch (error) {
    console.error('Error fetching utilities by state:', error)
    return NextResponse.json(
      { error: 'Failed to fetch utilities', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}