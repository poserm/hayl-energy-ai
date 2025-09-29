import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const utilityName = searchParams.get('utility')
    
    if (!utilityName) {
      return NextResponse.json({ error: 'Utility name required' }, { status: 400 })
    }

    console.log('🔍 Getting plants for utility:', utilityName)

    // Get plants for this utility
    const plants = await prisma.generators.findMany({
      where: {
        entity_name: {
          contains: utilityName,
          mode: 'insensitive'
        }
      },
      select: {
        plant_name: true,
        nameplate_capacity_mw: true
      }
    })

    console.log(`📊 Found ${plants.length} plants`)

    return NextResponse.json(plants)

  } catch (error) {
    console.error('❌ Error:', error)
    return NextResponse.json({ error: 'Failed to fetch plants' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}