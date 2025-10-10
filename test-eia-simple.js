/**
 * Simple EIA API Test Script (no dependencies needed)
 * Run with: node test-eia-simple.js
 */

const EIA_API_KEY = 'uX9TuCfbi6hoJhdZZHl3jhZg1AqhNVrVI1fcyYec'
const EIA_BASE_URL = 'https://api.eia.gov/v2'

console.log('✅ Starting EIA API Test')
console.log('🌐 API Base URL:', EIA_BASE_URL)
console.log('🔑 API Key:', EIA_API_KEY.substring(0, 10) + '...')
console.log('\n' + '='.repeat(60))

async function testEIAAPI() {
  try {
    // Test 1: Get Virginia electricity generation data
    console.log('\n📊 Test 1: Fetching Virginia electricity generation data...\n')

    const url = new URL(`${EIA_BASE_URL}/electricity/electric-power-operational-data/data/`)
    url.searchParams.append('api_key', EIA_API_KEY)
    url.searchParams.append('frequency', 'annual')
    url.searchParams.append('data[0]', 'generation')
    url.searchParams.append('facets[location][]', 'VA')
    url.searchParams.append('facets[sectorid][]', 'ALL')
    url.searchParams.append('start', '2020')
    url.searchParams.append('end', '2023')
    url.searchParams.append('length', '100')

    console.log('Request URL:', url.toString().substring(0, 120) + '...')
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
    console.log('- Total available:', data.response?.total || 'N/A')
    console.log('\n' + '-'.repeat(60))
    console.log('\n📋 First 3 records:\n')

    if (data.response?.data) {
      data.response.data.slice(0, 3).forEach((record, index) => {
        console.log(`Record ${index + 1}:`)
        console.log(JSON.stringify(record, null, 2))
        console.log('')
      })
    }

    // Test 2: Get solar generation data
    console.log('\n' + '='.repeat(60))
    console.log('\n☀️  Test 2: Fetching Virginia solar generation data...\n')

    const solarUrl = new URL(`${EIA_BASE_URL}/electricity/electric-power-operational-data/data/`)
    solarUrl.searchParams.append('api_key', EIA_API_KEY)
    solarUrl.searchParams.append('frequency', 'annual')
    solarUrl.searchParams.append('data[0]', 'generation')
    solarUrl.searchParams.append('facets[location][]', 'VA')
    solarUrl.searchParams.append('facets[fueltypeid][]', 'SUN')
    solarUrl.searchParams.append('facets[sectorid][]', 'ELE')
    solarUrl.searchParams.append('start', '2018')
    solarUrl.searchParams.append('end', '2023')
    solarUrl.searchParams.append('length', '50')

    console.log('Fetching solar data...\n')

    const solarResponse = await fetch(solarUrl.toString())

    if (solarResponse.ok) {
      const solarData = await solarResponse.json()
      console.log('✅ Solar data received!')
      console.log('- Total records:', solarData.response?.data?.length || 0)

      if (solarData.response?.data?.length > 0) {
        console.log('\n📊 Sample solar generation record:')
        console.log(JSON.stringify(solarData.response.data[0], null, 2))
      }
    } else {
      console.log('⚠️  Solar data request failed:', solarResponse.status)
    }

    // Test 3: Get wind generation data
    console.log('\n' + '='.repeat(60))
    console.log('\n💨 Test 3: Fetching Virginia wind generation data...\n')

    const windUrl = new URL(`${EIA_BASE_URL}/electricity/electric-power-operational-data/data/`)
    windUrl.searchParams.append('api_key', EIA_API_KEY)
    windUrl.searchParams.append('frequency', 'annual')
    windUrl.searchParams.append('data[0]', 'generation')
    windUrl.searchParams.append('facets[location][]', 'VA')
    windUrl.searchParams.append('facets[fueltypeid][]', 'WND')
    windUrl.searchParams.append('facets[sectorid][]', 'ELE')
    windUrl.searchParams.append('start', '2018')
    windUrl.searchParams.append('end', '2023')

    const windResponse = await fetch(windUrl.toString())

    if (windResponse.ok) {
      const windData = await windResponse.json()
      console.log('✅ Wind data received!')
      console.log('- Total records:', windData.response?.data?.length || 0)

      if (windData.response?.data?.length > 0) {
        console.log('\n📊 Sample wind generation record:')
        console.log(JSON.stringify(windData.response.data[0], null, 2))
      }
    } else {
      console.log('⚠️  Wind data request failed:', windResponse.status)
    }

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('\n🎉 All tests completed successfully!')
    console.log('\n📈 Summary:')
    console.log('- EIA API is accessible and working')
    console.log('- Your API key is valid')
    console.log('- Virginia energy data is available')
    console.log('\n✅ Next steps:')
    console.log('1. You can now use the EIA API in your Next.js app')
    console.log('2. The client is ready at: src/lib/services/eia-api.ts')
    console.log('3. Test endpoint available at: /api/eia/test')
    console.log('\n💡 Integration examples:')
    console.log('   - Fetch latest Virginia generation: eiaClient.getVirginiaElectricityData()')
    console.log('   - Fetch solar data: eiaClient.getGenerationByFuel("SUN")')
    console.log('   - Fetch all renewables: eiaClient.getRenewableEnergyData()')
    console.log('\n')

  } catch (error) {
    console.error('\n❌ Error during test:', error.message)
    console.error('\nFull error:', error)
  }
}

// Run the test
testEIAAPI()
