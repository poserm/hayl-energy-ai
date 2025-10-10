/**
 * EIA API Explorer - Let's find what endpoints and data are available
 */

const EIA_API_KEY = 'uX9TuCfbi6hoJhdZZHl3jhZg1AqhNVrVI1fcyYec'
const EIA_BASE_URL = 'https://api.eia.gov/v2'

console.log('🔍 Exploring EIA API...\n')

async function exploreEIA() {
  try {
    // First, let's explore what's available at the base electricity endpoint
    console.log('1. Checking base electricity routes...\n')

    let url = new URL(`${EIA_BASE_URL}/electricity/`)
    url.searchParams.append('api_key', EIA_API_KEY)

    let response = await fetch(url.toString())
    let data = await response.json()

    console.log('Electricity Routes:')
    console.log(JSON.stringify(data, null, 2))
    console.log('\n' + '='.repeat(60) + '\n')

    // Now let's check the electric-power-operational-data route
    console.log('2. Checking electric-power-operational-data route...\n')

    url = new URL(`${EIA_BASE_URL}/electricity/electric-power-operational-data/`)
    url.searchParams.append('api_key', EIA_API_KEY)

    response = await fetch(url.toString())
    data = await response.json()

    console.log('Electric Power Operational Data:')
    console.log(JSON.stringify(data, null, 2))
    console.log('\n' + '='.repeat(60) + '\n')

    // Try a simple data request without filters
    console.log('3. Trying simple data request...\n')

    url = new URL(`${EIA_BASE_URL}/electricity/electric-power-operational-data/data/`)
    url.searchParams.append('api_key', EIA_API_KEY)
    url.searchParams.append('frequency', 'annual')
    url.searchParams.append('data[0]', 'generation')
    url.searchParams.append('sort[0][column]', 'period')
    url.searchParams.append('sort[0][direction]', 'desc')
    url.searchParams.append('length', '5')

    console.log('URL:', url.toString().substring(0, 120) + '...\n')

    response = await fetch(url.toString())

    if (response.ok) {
      data = await response.json()
      console.log('✅ Success! Got data:')
      console.log('Total records:', data.response?.data?.length)
      console.log('\nFirst record:')
      console.log(JSON.stringify(data.response?.data?.[0], null, 2))

      // Check the facets in the response
      if (data.response?.facets) {
        console.log('\n📋 Available facets in response:')
        console.log(JSON.stringify(data.response.facets, null, 2))
      }
    } else {
      const error = await response.text()
      console.log('❌ Error:', response.status, error)
    }

  } catch (error) {
    console.error('Error:', error.message)
  }
}

exploreEIA()
