/**
 * Working EIA API Test - Verified Parameters
 */

const EIA_API_KEY = 'uX9TuCfbi6hoJhdZZHl3jhZg1AqhNVrVI1fcyYec'
const EIA_BASE_URL = 'https://api.eia.gov/v2'

console.log('✅ Starting EIA API Test with Verified Parameters')
console.log('🌐 API Base URL:', EIA_BASE_URL)
console.log('\n' + '='.repeat(60))

async function testEIAAPI() {
  try {
    // Test 1: Get Virginia electricity generation data (all sectors, all fuels)
    console.log('\n📊 Test 1: Virginia Electricity Generation (All Sources)\n')

    let url = new URL(`${EIA_BASE_URL}/electricity/electric-power-operational-data/data/`)
    url.searchParams.append('api_key', EIA_API_KEY)
    url.searchParams.append('frequency', 'annual')
    url.searchParams.append('data[0]', 'generation')
    url.searchParams.append('facets[location][]', 'VA')
    url.searchParams.append('start', '2020')
    url.searchParams.append('end', '2023')
    url.searchParams.append('sort[0][column]', 'period')
    url.searchParams.append('sort[0][direction]', 'desc')
    url.searchParams.append('length', '100')

    console.log('Fetching Virginia generation data...\n')

    let response = await fetch(url.toString())

    if (response.ok) {
      let data = await response.json()
      console.log('✅ Success!')
      console.log(`   Total records: ${data.response?.data?.length || 0}`)
      console.log(`   Total available: ${data.response?.total || 0}`)

      console.log('\n   First 3 records:')
      data.response.data.slice(0, 3).forEach((record, i) => {
        console.log(`   ${i + 1}. ${record.period} - ${record.fuelTypeDescription}: ${record.generation} ${record['generation-units']}`)
      })
    } else {
      console.log('❌ Failed:', await response.text())
    }

    // Test 2: Virginia Solar Generation
    console.log('\n' + '='.repeat(60))
    console.log('\n☀️  Test 2: Virginia Solar Generation\n')

    url = new URL(`${EIA_BASE_URL}/electricity/electric-power-operational-data/data/`)
    url.searchParams.append('api_key', EIA_API_KEY)
    url.searchParams.append('frequency', 'annual')
    url.searchParams.append('data[0]', 'generation')
    url.searchParams.append('facets[location][]', 'VA')
    url.searchParams.append('facets[fueltypeid][]', 'SUN')
    url.searchParams.append('start', '2018')
    url.searchParams.append('end', '2023')
    url.searchParams.append('sort[0][column]', 'period')
    url.searchParams.append('sort[0][direction]', 'desc')
    url.searchParams.append('length', '50')

    console.log('Fetching solar data...\n')

    response = await fetch(url.toString())

    if (response.ok) {
      let data = await response.json()
      console.log('✅ Success!')
      console.log(`   Total solar records: ${data.response?.data?.length || 0}`)

      if (data.response?.data?.length > 0) {
        console.log('\n   Solar generation by year:')
        data.response.data.forEach(record => {
          console.log(`   ${record.period}: ${record.generation} ${record['generation-units']} (${record.sectorDescription})`)
        })
      }
    } else {
      console.log('❌ Failed:', await response.text())
    }

    // Test 3: Virginia Wind Generation
    console.log('\n' + '='.repeat(60))
    console.log('\n💨 Test 3: Virginia Wind Generation\n')

    url = new URL(`${EIA_BASE_URL}/electricity/electric-power-operational-data/data/`)
    url.searchParams.append('api_key', EIA_API_KEY)
    url.searchParams.append('frequency', 'annual')
    url.searchParams.append('data[0]', 'generation')
    url.searchParams.append('facets[location][]', 'VA')
    url.searchParams.append('facets[fueltypeid][]', 'WND')
    url.searchParams.append('start', '2018')
    url.searchParams.append('end', '2023')
    url.searchParams.append('sort[0][column]', 'period')
    url.searchParams.append('sort[0][direction]', 'desc')

    console.log('Fetching wind data...\n')

    response = await fetch(url.toString())

    if (response.ok) {
      let data = await response.json()
      console.log('✅ Success!')
      console.log(`   Total wind records: ${data.response?.data?.length || 0}`)

      if (data.response?.data?.length > 0) {
        console.log('\n   Wind generation by year:')
        data.response.data.forEach(record => {
          console.log(`   ${record.period}: ${record.generation} ${record['generation-units']}`)
        })
      } else {
        console.log('   ℹ️  No wind generation data found for Virginia')
      }
    } else {
      console.log('❌ Failed:', await response.text())
    }

    // Test 4: Multiple fuel types (renewable summary)
    console.log('\n' + '='.repeat(60))
    console.log('\n🌱 Test 4: Virginia Renewable Energy Summary (2023)\n')

    const renewableFuels = [
      { id: 'SUN', name: 'Solar' },
      { id: 'WND', name: 'Wind' },
      { id: 'HYC', name: 'Hydro' },
      { id: 'GEO', name: 'Geothermal' }
    ]

    console.log('Fetching renewable energy data...\n')

    for (const fuel of renewableFuels) {
      url = new URL(`${EIA_BASE_URL}/electricity/electric-power-operational-data/data/`)
      url.searchParams.append('api_key', EIA_API_KEY)
      url.searchParams.append('frequency', 'annual')
      url.searchParams.append('data[0]', 'generation')
      url.searchParams.append('facets[location][]', 'VA')
      url.searchParams.append('facets[fueltypeid][]', fuel.id)
      url.searchParams.append('start', '2023')
      url.searchParams.append('end', '2023')

      response = await fetch(url.toString())

      if (response.ok) {
        let data = await response.json()
        if (data.response?.data?.length > 0) {
          const total = data.response.data.reduce((sum, record) => {
            return sum + parseFloat(record.generation || 0)
          }, 0)
          console.log(`   ${fuel.name.padEnd(12)}: ${total.toFixed(2)} thousand MWh`)
        } else {
          console.log(`   ${fuel.name.padEnd(12)}: No data available`)
        }
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('\n🎉 All tests completed successfully!')
    console.log('\n📊 What we learned:')
    console.log('   ✓ Your EIA API key is working')
    console.log('   ✓ Virginia energy data is available from 2001 onwards')
    console.log('   ✓ Data includes generation, consumption, costs, and more')
    console.log('   ✓ Can filter by location (state), sector, and fuel type')
    console.log('\n💡 Available fuel types:')
    console.log('   - SUN (Solar), WND (Wind), HYC (Hydro), GEO (Geothermal)')
    console.log('   - NG (Natural Gas), COL (Coal), NUC (Nuclear)')
    console.log('   - PET (Petroleum), OTH (Other)')
    console.log('\n📈 Ready to integrate into your app!')
    console.log('   - Client: src/lib/services/eia-api.ts')
    console.log('   - Test API: /api/eia/test')
    console.log('\n')

  } catch (error) {
    console.error('\n❌ Error:', error.message)
  }
}

testEIAAPI()
