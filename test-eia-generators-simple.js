/**
 * Get sample generator data with coordinates and capacity
 */

const EIA_API_KEY = 'uX9TuCfbi6hoJhdZZHl3jhZg1AqhNVrVI1fcyYec'
const EIA_BASE_URL = 'https://api.eia.gov/v2'

console.log('🔍 Testing Generator Data...\n')

async function testGenerators() {
  try {
    // Get generators with all needed fields
    const url = new URL(`${EIA_BASE_URL}/electricity/operating-generator-capacity/data/`)
    url.searchParams.append('api_key', EIA_API_KEY)
    url.searchParams.append('frequency', 'monthly')
    url.searchParams.append('data[0]', 'nameplate-capacity-mw')
    url.searchParams.append('data[1]', 'latitude')
    url.searchParams.append('data[2]', 'longitude')
    url.searchParams.append('facets[balancing_authority_code][]', 'PJM')
    url.searchParams.append('facets[stateid][]', 'VA')
    url.searchParams.append('start', '2023-12')
    url.searchParams.append('length', '10')
    url.searchParams.append('sort[0][column]', 'nameplate-capacity-mw')
    url.searchParams.append('sort[0][direction]', 'desc')

    console.log('Fetching PJM generators in Virginia...\n')

    const response = await fetch(url.toString())
    const data = await response.json()

    if (response.ok && data.response?.data?.length > 0) {
      console.log(`✅ Found ${data.response.data.length} generators`)
      console.log(`   Total available: ${data.response.total}\n`)

      console.log('Sample records:\n')
      data.response.data.slice(0, 3).forEach((gen, i) => {
        console.log(`${i + 1}.`, JSON.stringify(gen, null, 2))
        console.log('')
      })

      // Check what fields are available
      console.log('Available fields:', Object.keys(data.response.data[0]).join(', '))
    } else {
      console.log('Response:', JSON.stringify(data, null, 2))
    }

  } catch (error) {
    console.error('Error:', error.message)
  }
}

testGenerators()
