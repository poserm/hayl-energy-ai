/**
 * Discover ALL EIA API Datasets
 */

const EIA_API_KEY = 'uX9TuCfbi6hoJhdZZHl3jhZg1AqhNVrVI1fcyYec'
const EIA_BASE_URL = 'https://api.eia.gov/v2'

console.log('🔍 Discovering ALL EIA API Datasets...\n')
console.log('='.repeat(60))

async function discoverAllDatasets() {
  try {
    // Get top-level routes
    console.log('\n📁 Top-Level EIA Datasets:\n')

    const url = new URL(`${EIA_BASE_URL}/`)
    url.searchParams.append('api_key', EIA_API_KEY)

    const response = await fetch(url.toString())
    const data = await response.json()

    if (data.response?.routes) {
      console.log(`Found ${data.response.routes.length} main dataset categories:\n`)

      data.response.routes.forEach((route, index) => {
        console.log(`${(index + 1).toString().padStart(2)}. ${route.name}`)
        console.log(`    ID: ${route.id}`)
        console.log(`    Description: ${route.description}`)
        console.log('')
      })

      console.log('='.repeat(60))
      console.log('\n💡 To explore a specific dataset category, we can query:')
      console.log(`   https://api.eia.gov/v2/{dataset-id}/`)
      console.log('\nFor example:')
      console.log('   - /electricity/ (we already explored this)')
      console.log('   - /coal/')
      console.log('   - /natural-gas/')
      console.log('   - /petroleum/')
      console.log('   - /nuclear-outages/')
      console.log('   - /renewable/')
      console.log('')
    }

  } catch (error) {
    console.error('Error:', error.message)
  }
}

discoverAllDatasets()
