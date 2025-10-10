/**
 * Standalone EIA API Test Script
 * Run with: node test-eia-api.js
 */

require('dotenv').config({ path: '.env.local' })

const EIA_API_KEY = process.env.EIA_API_KEY
const EIA_BASE_URL = process.env.NEXT_PUBLIC_EIA_API_URL || 'https://api.eia.gov/v2'

if (!EIA_API_KEY) {
  console.error('❌ Error: EIA_API_KEY not found in .env.local')
  process.exit(1)
}

console.log('✅ EIA API Key found:', EIA_API_KEY.substring(0, 10) + '...')
console.log('🌐 API Base URL:', EIA_BASE_URL)
console.log('\n' + '='.repeat(60))

async function testEIAAPI() {
  try {
    // Test 1: Get Virginia electricity generation data
    console.log('\n📊 Test 1: Fetching Virginia electricity generation data...\n')

    const url = new URL(`${EIA_BASE_URL}/electricity/electric-power-operational-data/data/`)
    url.searchParams.append('api_key', EIA_API_KEY)
    url.searchParams.append('frequency', 'annual')
    url.searchParams.append('data[0]', 'generation')
    url.searchParams.append('facets[stateid][]', 'VA')
    url.searchParams.append('facets[sectorid][]', 'ALL')
    url.searchParams.append('start', '2020')
    url.searchParams.append('end', '2023')
    url.searchParams.append('length', '100')

    console.log('Request URL:', url.toString())
    console.log('\nFetching data...\n')

    const response = await fetch(url.toString())

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ API Request failed:', response.status, response.statusText)
      console.error('Error details:', errorText)
      return
    }

    const data = await response.json()

    console.log('✅ Success! Received data from EIA API\n')
    console.log('Response structure:')
    console.log('- Total records:', data.response?.data?.length || 0)
    console.log('- API version:', data.request?.api_version || 'v2')
    console.log('\n' + '-'.repeat(60))
    console.log('\nFirst 5 records:\n')

    if (data.response?.data) {
      data.response.data.slice(0, 5).forEach((record, index) => {
        console.log(`${index + 1}.`, JSON.stringify(record, null, 2))
      })
    }

    // Test 2: Get solar generation data
    console.log('\n' + '='.repeat(60))
    console.log('\n☀️ Test 2: Fetching Virginia solar generation data...\n')

    const solarUrl = new URL(`${EIA_BASE_URL}/electricity/electric-power-operational-data/data/`)
    solarUrl.searchParams.append('api_key', EIA_API_KEY)
    solarUrl.searchParams.append('frequency', 'annual')
    solarUrl.searchParams.append('data[0]', 'generation')
    solarUrl.searchParams.append('facets[stateid][]', 'VA')
    solarUrl.searchParams.append('facets[fueltypeid][]', 'SUN')
    solarUrl.searchParams.append('facets[sectorid][]', 'ELE')
    solarUrl.searchParams.append('start', '2018')
    solarUrl.searchParams.append('end', '2023')
    solarUrl.searchParams.append('length', '50')

    const solarResponse = await fetch(solarUrl.toString())

    if (solarResponse.ok) {
      const solarData = await solarResponse.json()
      console.log('✅ Solar data received!')
      console.log('- Total records:', solarData.response?.data?.length || 0)

      if (solarData.response?.data?.length > 0) {
        console.log('\nSample solar generation record:')
        console.log(JSON.stringify(solarData.response.data[0], null, 2))
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('\n🎉 All tests completed successfully!')
    console.log('\nNext steps:')
    console.log('1. Start your dev server: npm run dev')
    console.log('2. Visit: http://localhost:3000/api/eia/test')
    console.log('3. Try different test types:')
    console.log('   - http://localhost:3000/api/eia/test?type=virginia')
    console.log('   - http://localhost:3000/api/eia/test?type=solar')
    console.log('   - http://localhost:3000/api/eia/test?type=renewables')
    console.log('   - http://localhost:3000/api/eia/test?type=generation')
    console.log('\n')

  } catch (error) {
    console.error('\n❌ Error during test:', error.message)
    console.error('\nFull error:', error)
  }
}

// Run the test
testEIAAPI()
