// Simple test script to verify GeoJSON data loading and deduplication
const testGeoJSONDeduplication = () => {
  // Simulate the data processing logic from our component
  const mockGeoData = {
    features: [
      {
        properties: { NAME: 'Virginia', name: 'Virginia' },
        geometry: { type: 'Polygon', coordinates: [[[-83, 36], [-75, 36], [-75, 38]]] }
      },
      {
        properties: { NAME: 'Virginia' }, // Duplicate
        geometry: { type: 'Polygon', coordinates: [[[-83, 36], [-75, 36], [-75, 38]]] }
      },
      {
        properties: { name: 'Pennsylvania' },
        geometry: { type: 'Polygon', coordinates: [[[-80, 39], [-75, 39], [-75, 42]]] }
      },
      {
        properties: { NAME: 'Ohio' },
        geometry: { type: 'Polygon', coordinates: [[[-84, 38], [-80, 38], [-80, 42]]] }
      }
    ]
  }

  // Apply our deduplication logic
  const uniqueStates = new Map()
  const cleanedFeatures = []
  
  mockGeoData.features.forEach((feature) => {
    const stateName = feature.properties.NAME || feature.properties.name
    
    if (!stateName || !feature.geometry) {
      console.warn('Skipping invalid feature:', feature)
      return
    }
    
    if (!uniqueStates.has(stateName)) {
      const cleanedFeature = {
        ...feature,
        properties: {
          ...feature.properties,
          name: stateName,
          NAME: stateName
        }
      }
      
      uniqueStates.set(stateName, cleanedFeature)
      cleanedFeatures.push(cleanedFeature)
    } else {
      console.warn('Duplicate state found, skipping:', stateName)
    }
  })

  console.log('Original features:', mockGeoData.features.length)
  console.log('Cleaned features:', cleanedFeatures.length)
  console.log('State names:', cleanedFeatures.map(f => f.properties.name).sort())
  
  return cleanedFeatures.length === 3 && 
         cleanedFeatures.every(f => f.properties.name && f.properties.NAME)
}

// Run the test
const testPassed = testGeoJSONDeduplication()
console.log('Test passed:', testPassed)