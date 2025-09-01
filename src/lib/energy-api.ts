interface EnergyApiResponse<T> {
  data: T
  success: boolean
  message?: string
}

interface UtilityData {
  id: string
  utilityName: string
  state: string
  ownershipType: string
  nameplateCapacityMw: number
  logoScale: number
  sizeCategory: string
  serviceTerritory: string[]
  customersCount: number
}

interface TechnologyMix {
  technology: string
  capacityMw: number
  percentage: number
  colorCode: string
  count: number
}

interface UtilityProfile {
  id: string
  utilityName: string
  state: string
  ownershipType: string
  totalCapacityMw: number
  customersCount: number
  serviceCounties: string[]
  technologyMix: TechnologyMix[]
  operatingUnits: number
  plannedUnits: number
  retiredUnits: number
}

class EnergyApiClient {
  private baseURL: string
  
  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_ENERGY_API_URL || 'http://localhost:8001'
  }
  
  private async getAuthToken(): Promise<string | null> {
    if (typeof window === 'undefined') return null
    
    try {
      const response = await fetch('/api/auth/token', {
        credentials: 'include'
      })
      if (response.ok) {
        const { token } = await response.json()
        return token
      }
    } catch (error) {
      console.warn('Failed to get auth token:', error)
    }
    return null
  }
  
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getAuthToken()
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    }
    
    const response = await fetch(`${this.baseURL}${endpoint}`, config)
    
    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Energy API Error: ${response.status} - ${error}`)
    }
    
    return response.json()
  }
  
  // Virginia-specific endpoints
  async getVirginiaUtilities(): Promise<UtilityData[]> {
    const response = await this.request<EnergyApiResponse<UtilityData[]>>('/api/v1/virginia/utilities')
    return response.data
  }
  
  async getVirginiaTechnologyMix(): Promise<TechnologyMix[]> {
    const response = await this.request<EnergyApiResponse<TechnologyMix[]>>('/api/v1/virginia/technology-mix')
    return response.data
  }
  
  // Utility analysis
  async getUtilityProfile(id: string): Promise<UtilityProfile> {
    const response = await this.request<EnergyApiResponse<UtilityProfile>>(`/api/v1/utilities/${id}/profile`)
    return response.data
  }
  
  async getUtilityTechnologyMix(id: string): Promise<TechnologyMix[]> {
    const response = await this.request<EnergyApiResponse<TechnologyMix[]>>(`/api/v1/utilities/${id}/technology-mix`)
    return response.data
  }
  
  // Market analytics
  async getCapacityTrends(state?: string): Promise<any[]> {
    const endpoint = state 
      ? `/api/v1/analytics/capacity-trends?state=${state}`
      : '/api/v1/analytics/capacity-trends'
    const response = await this.request<EnergyApiResponse<any[]>>(endpoint)
    return response.data
  }
  
  async getMarketOverview(): Promise<any> {
    const response = await this.request<EnergyApiResponse<any>>('/api/v1/analytics/market-overview')
    return response.data
  }
  
  // Utility comparison
  async compareUtilities(utilityIds: string[]): Promise<UtilityProfile[]> {
    const response = await this.request<EnergyApiResponse<UtilityProfile[]>>('/api/v1/utilities/compare', {
      method: 'POST',
      body: JSON.stringify({ utility_ids: utilityIds })
    })
    return response.data
  }
  
  // Geographic analysis
  async getVirginiaAnalysis(): Promise<any> {
    const response = await this.request<EnergyApiResponse<any>>('/api/v1/geography/virginia')
    return response.data
  }
}

export const energyApi = new EnergyApiClient()

// Static fallback data for development
export const virginiaUtilitiesStatic: UtilityData[] = [
  {
    id: 'dominion-energy',
    utilityName: 'Dominion Energy Virginia',
    state: 'VA',
    ownershipType: 'Investor Owned',
    nameplateCapacityMw: 23400,
    logoScale: 100,
    sizeCategory: 'Largest company',
    serviceTerritory: ['Northern VA', 'Central VA', 'Tidewater'],
    customersCount: 2700000
  },
  {
    id: 'appalachian-power',
    utilityName: 'Appalachian Power Company',
    state: 'VA',
    ownershipType: 'Investor Owned', 
    nameplateCapacityMw: 3100,
    logoScale: 80,
    sizeCategory: 'Major utility',
    serviceTerritory: ['Southwest VA'],
    customersCount: 530000
  },
  {
    id: 'novec',
    utilityName: 'Northern Virginia Electric Cooperative',
    state: 'VA',
    ownershipType: 'Cooperative',
    nameplateCapacityMw: 1200,
    logoScale: 70,
    sizeCategory: 'Regional utility',
    serviceTerritory: ['Northern VA counties'],
    customersCount: 170000
  },
  {
    id: 'rec',
    utilityName: 'Rappahannock Electric Cooperative',
    state: 'VA',
    ownershipType: 'Cooperative',
    nameplateCapacityMw: 800,
    logoScale: 60,
    sizeCategory: 'Regional utility',
    serviceTerritory: ['Central VA'],
    customersCount: 175000
  },
  {
    id: 'shenandoah-valley',
    utilityName: 'Shenandoah Valley Electric Cooperative',
    state: 'VA',
    ownershipType: 'Cooperative',
    nameplateCapacityMw: 400,
    logoScale: 50,
    sizeCategory: 'Local utility',
    serviceTerritory: ['Shenandoah Valley'],
    customersCount: 50000
  }
]

export const technologyColors = {
  'Coal': '#8B4513',
  'Natural Gas': '#4169E1', 
  'Nuclear': '#FFD700',
  'Solar': '#FFA500',
  'Wind': '#00CED1',
  'Hydroelectric': '#0000FF',
  'Battery Storage': '#9932CC',
  'Biomass': '#228B22',
  'Geothermal': '#DC143C',
  'Other': '#808080'
}

export type { UtilityData, TechnologyMix, UtilityProfile }