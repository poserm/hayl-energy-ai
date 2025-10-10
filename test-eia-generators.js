/**
 * Explore EIA Operating Generator Capacity Dataset
 * This should have plant locations, capacity, technology, and balancing authority regions
 */

const EIA_API_KEY = 'uX9TuCfbi6hoJhdZZHl3jhZg1AqhNVrVI1fcyYec'
const EIA_BASE_URL = 'https://api.eia.gov/v2'

console.log('🔍 Exploring EIA Operating Generator Capacity Dataset...\n')
console.log('='.repeat(60))

async function exploreGenerators() {
  try {
    // First, explore the dataset structure
    console.log('\n1. Getting dataset structure...\n')

    let url = new URL(`${EIA_BASE_URL}/electricity/operating-generator-capacity/`)
    url.searchParams.append('api_key', EIA_API_KEY)

    let response = await fetch(url.toString())
    let data = await response.json()

    console.log('Dataset Info:')
    console.log('Name:', data.response?.name)
    console.log('Description:', data.response?.description)
    console.log('\nAvailable Frequencies:', data.response?.frequency?.map(f => f.id).join(', '))

    if (data.response?.facets) {
      console.log('\n📋 Available Facets (Filters):')
      data.response.facets.forEach(facet => {
        console.log(`   - ${facet.id}: ${facet.description}`)
      })
    }

    if (data.response?.data) {
      console.log('\n📊 Available Data Fields:')
      Object.entries(data.response.data).forEach(([key, value]) => {
        console.log(`   - ${key}: ${value.alias || value}`)
      })
    }

    // Now let's get some actual generator data
    console.log('\n' + '='.repeat(60))
    console.log('\n2. Fetching sample generator data...\n')

    url = new URL(`${EIA_BASE_URL}/electricity/operating-generator-capacity/data/`)
    url.searchParams.append('api_key', EIA_API_KEY)
    url.searchParams.append('frequency', 'annual')
    url.searchParams.append('data[0]', 'nameplate-capacity-mw')
    url.searchParams.append('start', '2023')
    url.searchParams.append('end', '2023')
    url.searchParams.append('sort[0][column]', 'nameplate-capacity-mw')
    url.searchParams.append('sort[0][direction]', 'desc')
    url.searchParams.append('length', '5')

    response = await fetch(url.toString())
    data = await response.json()

    if (data.response?.data?.length > 0) {
      console.log('✅ Sample Generator Records:\n')
      console.log('Available fields in each record:', Object.keys(data.response.data[0]).join(', '))
      console.log('\nTop 5 Generators by Capacity:\n')

      data.response.data.forEach((gen, i) => {
        console.log(`${i + 1}. ${gen.plantName || gen['plant-name'] || 'Unknown'}`)
        console.log(`   Capacity: ${gen['nameplate-capacity-mw']} MW`)
        console.log(`   Technology: ${gen.technology || gen['technology-description'] || 'N/A'}`)
        console.log(`   State: ${gen.stateid || gen.state || 'N/A'}`)
        console.log(`   Balancing Authority: ${gen['balancing-authority-code'] || gen.balanceauth || 'N/A'}`)
        console.log(`   Latitude: ${gen.latitude || 'N/A'}`)
        console.log(`   Longitude: ${gen.longitude || 'N/A'}`)
        console.log('')
      })
    }

    // Check what balancing authorities are available
    console.log('='.repeat(60))
    console.log('\n3. Checking available Balancing Authorities (Regions)...\n')

    url = new URL(`${EIA_BASE_URL}/electricity/operating-generator-capacity/data/`)
    url.searchParams.append('api_key', EIA_API_KEY)
    url.searchParams.append('frequency', 'annual')
    url.searchParams.append('data[0]', 'nameplate-capacity-mw')
    url.searchParams.append('start', '2023')
    url.searchParams.append('length', '100')

    response = await fetch(url.toString())
    data = await response.json()

    if (data.response?.data) {
      const balancingAuthorities = [...new Set(
        data.response.data
          .map(d => d['balancing-authority-code'] || d.balanceauth)
          .filter(Boolean)
      )].sort()

      console.log(`Found ${balancingAuthorities.length} unique Balancing Authorities in sample:`)
      console.log(balancingAuthorities.slice(0, 20).join(', '))
      console.log('')

      // Check if PJM and MISO are in there
      const hasPJM = balancingAuthorities.some(ba => ba.includes('PJM'))
      const hasMISO = balancingAuthorities.some(ba => ba.includes('MISO'))

      console.log(`✓ Has PJM region: ${hasPJM ? 'YES' : 'NO'}`)
      console.log(`✓ Has MISO region: ${hasMISO ? 'YES' : 'NO'}`)
    }

  } catch (error) {
    console.error('Error:', error.message)
  }
}

exploreGenerators()
