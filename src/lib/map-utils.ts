// Map utilities for dynamic bounds and state coordinates
export interface MapBounds {
  north: number
  south: number
  east: number
  west: number
}

export interface StateCoordinates {
  center: [number, number] // [lat, lng]
  bounds: MapBounds
}

// State coordinate data with centers and bounds
export const STATE_COORDINATES: { [key: string]: StateCoordinates } = {
  'Virginia': {
    center: [37.5407, -77.4360],
    bounds: { north: 39.4660, south: 36.5407, east: -75.2416, west: -83.6753 }
  },
  'Texas': {
    center: [31.9686, -99.9018],
    bounds: { north: 36.5007, south: 25.8371, east: -93.5083, west: -106.6456 }
  },
  'California': {
    center: [36.7783, -119.4179],
    bounds: { north: 42.0095, south: 32.5343, east: -114.1315, west: -124.4096 }
  },
  'New York': {
    center: [42.1657, -74.9481],
    bounds: { north: 45.0153, south: 40.4774, east: -71.8560, west: -79.7624 }
  },
  'Florida': {
    center: [27.7663, -81.6868],
    bounds: { north: 31.0009, south: 24.9493, east: -80.0313, west: -87.6349 }
  },
  'Michigan': {
    center: [44.3467, -85.4102],
    bounds: { north: 48.2388, south: 41.6962, east: -82.4138, west: -90.4169 }
  },
  'Minnesota': {
    center: [45.6945, -93.9002],
    bounds: { north: 49.3845, south: 43.4995, east: -89.4920, west: -97.2394 }
  },
  'Massachusetts': {
    center: [42.2081, -71.0275],
    bounds: { north: 42.8867, south: 41.2376, east: -69.8588, west: -73.5081 }
  },
  'Delaware': {
    center: [39.3185, -75.5071],
    bounds: { north: 39.8394, south: 38.4512, east: -75.0489, west: -75.7887 }
  },
  'Illinois': {
    center: [40.3363, -89.0022],
    bounds: { north: 42.5083, south: 36.9540, east: -87.0199, west: -91.5133 }
  },
  'Indiana': {
    center: [39.8647, -86.2604],
    bounds: { north: 41.7606, south: 37.7554, east: -84.7840, west: -88.0157 }
  },
  'Kentucky': {
    center: [37.6681, -84.6701],
    bounds: { north: 39.1472, south: 36.4970, east: -81.9646, west: -89.5715 }
  },
  'Maryland': {
    center: [39.0639, -76.8021],
    bounds: { north: 39.7236, south: 37.9113, east: -75.0489, west: -79.4877 }
  },
  'New Jersey': {
    center: [40.3072, -74.5560],
    bounds: { north: 41.3574, south: 38.9280, east: -73.8934, west: -75.5597 }
  },
  'North Carolina': {
    center: [35.6301, -79.8064],
    bounds: { north: 36.5881, south: 33.7514, east: -75.4003, west: -84.3218 }
  },
  'Ohio': {
    center: [40.3888, -82.7649],
    bounds: { north: 41.9773, south: 38.4040, east: -80.5190, west: -84.8203 }
  },
  'Pennsylvania': {
    center: [40.5908, -77.2098],
    bounds: { north: 42.5147, south: 39.7198, east: -74.6895, west: -80.5190 }
  },
  'Tennessee': {
    center: [35.7478, -86.7923],
    bounds: { north: 36.6782, south: 34.9829, east: -81.6469, west: -90.3103 }
  },
  'West Virginia': {
    center: [38.4912, -80.9545],
    bounds: { north: 40.6386, south: 37.2017, east: -77.7190, west: -82.6446 }
  },
  'District of Columbia': {
    center: [38.8974, -77.0365],
    bounds: { north: 38.9958, south: 38.7916, east: -76.9093, west: -77.1197 }
  }
}

/**
 * Calculate optimal map bounds for multiple states
 */
export function calculateMapBounds(stateNames: string[]): [[number, number], [number, number]] {
  if (stateNames.length === 0) {
    // Default to US center if no states selected
    return [[39.8283, -98.5795], [39.8283, -98.5795]]
  }

  // If only one state, return its bounds with some padding
  if (stateNames.length === 1) {
    const state = STATE_COORDINATES[stateNames[0]]
    if (state) {
      const padding = 0.5 // degrees
      return [
        [state.bounds.south - padding, state.bounds.west - padding],
        [state.bounds.north + padding, state.bounds.east + padding]
      ]
    }
  }

  // For multiple states, calculate encompassing bounds
  let north = -90
  let south = 90
  let east = -180
  let west = 180

  stateNames.forEach(stateName => {
    const state = STATE_COORDINATES[stateName]
    if (state) {
      north = Math.max(north, state.bounds.north)
      south = Math.min(south, state.bounds.south)
      east = Math.max(east, state.bounds.east)
      west = Math.min(west, state.bounds.west)
    }
  })

  // Add padding for better visualization
  const latPadding = (north - south) * 0.1
  const lngPadding = (east - west) * 0.1

  return [
    [south - latPadding, west - lngPadding],
    [north + latPadding, east + lngPadding]
  ]
}

/**
 * Get center coordinates for a list of states
 */
export function getCenterCoordinates(stateNames: string[]): [number, number] {
  if (stateNames.length === 0) {
    return [39.8283, -98.5795] // US center
  }

  if (stateNames.length === 1) {
    const state = STATE_COORDINATES[stateNames[0]]
    return state ? state.center : [39.8283, -98.5795]
  }

  // Calculate average center for multiple states
  let totalLat = 0
  let totalLng = 0
  let validStates = 0

  stateNames.forEach(stateName => {
    const state = STATE_COORDINATES[stateName]
    if (state) {
      totalLat += state.center[0]
      totalLng += state.center[1]
      validStates++
    }
  })

  if (validStates === 0) {
    return [39.8283, -98.5795]
  }

  return [totalLat / validStates, totalLng / validStates]
}

/**
 * Get state bounds for a single state
 */
export function getStateBounds(stateName: string): [[number, number], [number, number]] | null {
  const state = STATE_COORDINATES[stateName]
  if (!state) return null

  return [
    [state.bounds.south, state.bounds.west],
    [state.bounds.north, state.bounds.east]
  ]
}

/**
 * Enhanced utility coordinates with better coverage for non-Virginia states
 */
export const getUtilityCoordinates = (utilityName: string, state: string): [number, number] => {
  // Virginia utility coordinates (same as before)
  const virginiaUtilityCoords: { [key: string]: [number, number] } = {
    'Virginia Electric & Power': [37.5407, -77.4360],
    'Dominion Energy': [37.5407, -77.4360],
    'Appalachian Power': [37.2692, -81.2826],
    'Old Dominion Electric Coop': [38.9072, -77.0369],
    'Doswell Ltd Partnership': [37.7749, -77.4457],
    'Tenaska Virginia Partners': [36.8508, -76.2859],
    'Potomac Energy Center': [38.9072, -77.0369],
    'AES': [37.4316, -78.6569],
    'Commonwealth Chesapeake': [36.8508, -76.2859],
    'USCE': [37.5407, -77.4360],
    'Middle River Power': [38.2904, -78.8448],
    'Urban Grid Solar': [37.5407, -77.4360],
    'Consolidated Edison': [37.5407, -77.4360],
    'WestRock': [37.2692, -81.2826],
    'Chesapeake Solar': [36.8508, -76.2859],
    'Bartonsville Energy': [37.5407, -77.4360],
    'Covanta': [38.9072, -77.0369],
    'Waverly Solar': [37.0271, -77.0947],
    'Veolia Energy': [37.5407, -77.4360],
    'International Paper': [36.7057, -76.2906],
  }

  // Check Virginia utilities first
  if (state === 'VA' || state === 'Virginia') {
    for (const [key, coords] of Object.entries(virginiaUtilityCoords)) {
      if (utilityName.toLowerCase().includes(key.toLowerCase()) || 
          key.toLowerCase().includes(utilityName.toLowerCase())) {
        return coords
      }
    }
  }

  // For other states, use state center with some randomization for multiple utilities
  const stateInfo = STATE_COORDINATES[state] || STATE_COORDINATES[Object.keys(STATE_COORDINATES).find(key => key.startsWith(state)) || '']
  
  if (stateInfo) {
    // Add slight randomization to avoid overlapping markers
    const randomOffset = 0.5 // degrees
    const offsetLat = (Math.random() - 0.5) * randomOffset
    const offsetLng = (Math.random() - 0.5) * randomOffset
    
    return [
      stateInfo.center[0] + offsetLat,
      stateInfo.center[1] + offsetLng
    ]
  }

  // Default fallback
  return [39.8283, -98.5795] // US center
}

/**
 * Enhanced generator coordinates with better state coverage
 */
export const getGeneratorCoordinates = (plantName: string, state: string, entityName?: string): [number, number] => {
  // Virginia generator coordinates (same as before)
  const virginiaGeneratorCoords: { [key: string]: [number, number] } = {
    'North Anna': [38.0623, -77.7889],
    'Surry': [37.1652, -76.8319],
    'Virginia City Hybrid Energy Center': [36.9485, -80.1467],
    'Chesterfield': [37.3770, -77.5047],
    'Doswell': [37.7749, -77.4457],
    'Greensville': [36.7007, -77.3836],
    'Possum Point': [38.5434, -77.2803],
    'Bremo Bluff': [37.7318, -78.2264],
    'Chesapeake': [36.7682, -76.2875],
    // Solar facilities
    'Altavista': [37.1115, -79.2892],
    'Warren County': [38.9175, -78.2022],
    'Bear Garden': [37.8021, -78.1392],
    'Gordonsville': [38.1368, -78.1858],
    'Massaponax': [38.4195, -77.5194],
    'Ashland': [37.7590, -77.4803],
    'Waverly': [37.0265, -77.0886],
    // Wind facilities
    'Highland County Wind': [38.5151, -79.5631],
    'Alleghany Wind': [37.8251, -79.9753],
    // Hydro
    'Gathright Dam': [37.9376, -79.8031],
    'Smith Mountain Lake': [37.1157, -79.5870],
    'Kerr Dam': [36.5765, -78.3969],
  }

  // Check Virginia generators first
  if (state === 'VA' || state === 'Virginia') {
    const plantLower = plantName.toLowerCase()
    for (const [key, coords] of Object.entries(virginiaGeneratorCoords)) {
      const keyLower = key.toLowerCase()
      if (plantLower.includes(keyLower) || keyLower.includes(plantLower) ||
          plantLower.replace(/\s+/g, '').includes(keyLower.replace(/\s+/g, '')) ||
          (entityName && entityName.toLowerCase().includes(keyLower))) {
        return coords
      }
    }
  }

  // For other states, use state center with randomization
  const stateInfo = STATE_COORDINATES[state] || STATE_COORDINATES[Object.keys(STATE_COORDINATES).find(key => key.startsWith(state)) || '']
  
  if (stateInfo) {
    // Add randomization within state bounds for realistic distribution
    const latRange = (stateInfo.bounds.north - stateInfo.bounds.south) * 0.3
    const lngRange = (stateInfo.bounds.east - stateInfo.bounds.west) * 0.3
    
    const offsetLat = (Math.random() - 0.5) * latRange
    const offsetLng = (Math.random() - 0.5) * lngRange
    
    return [
      stateInfo.center[0] + offsetLat,
      stateInfo.center[1] + offsetLng
    ]
  }

  return [39.8283, -98.5795] // US center fallback
}