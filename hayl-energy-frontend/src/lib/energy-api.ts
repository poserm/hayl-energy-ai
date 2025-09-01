// Energy Data API Client
import { 
  Utility, 
  UtilityProfile, 
  TechnologyMix, 
  VirginiaUtility,
  VirginiaRegion,
  ComparisonData,
  TimeSeriesData,
  ApiResponse,
  UtilityFilters,
  SearchParams,
  ExportOptions 
} from '@/types/energy'

class EnergyDataClient {
  private baseURL: string
  private authApiUrl: string

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_ENERGY_API_URL || 'http://localhost:8001'
    this.authApiUrl = process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:3003'
  }

  // Authentication helper - gets JWT token from auth system
  private async getAuthToken(): Promise<string | null> {
    try {
      const response = await fetch(`${this.authApiUrl}/api/auth/me`, {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        return data.token || null
      }
      return null
    } catch (error) {
      console.error('Failed to get auth token:', error)
      return null
    }
  }

  // Generic request method with authentication
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const token = await this.getAuthToken()
      const url = `${this.baseURL}${endpoint}`
      
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      }

      const response = await fetch(url, {
        ...options,
        headers,
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return {
        success: true,
        data,
        meta: {
          lastUpdated: new Date().toISOString(),
        },
      }
    } catch (error) {
      console.error('API Request failed:', error)
      return {
        success: false,
        data: null as any,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // Virginia-specific utility endpoints
  async getVirginiaUtilities(): Promise<ApiResponse<VirginiaUtility[]>> {
    return this.request<VirginiaUtility[]>('/api/v1/virginia/utilities')
  }

  async getVirginiaRegions(): Promise<ApiResponse<VirginiaRegion[]>> {
    return this.request<VirginiaRegion[]>('/api/v1/virginia/regions')
  }

  async getVirginiaMarketOverview(): Promise<ApiResponse<any>> {
    return this.request<any>('/api/v1/virginia/market-overview')
  }

  // General utility endpoints
  async getAllUtilities(filters?: UtilityFilters): Promise<ApiResponse<Utility[]>> {
    const params = new URLSearchParams()
    
    if (filters?.states?.length) {
      params.append('states', filters.states.join(','))
    }
    if (filters?.types?.length) {
      params.append('types', filters.types.join(','))
    }
    if (filters?.technologies?.length) {
      params.append('technologies', filters.technologies.join(','))
    }
    if (filters?.capacityRange) {
      params.append('min_capacity', filters.capacityRange.min.toString())
      params.append('max_capacity', filters.capacityRange.max.toString())
    }

    const queryString = params.toString()
    const endpoint = `/api/v1/utilities${queryString ? `?${queryString}` : ''}`
    
    return this.request<Utility[]>(endpoint)
  }

  async searchUtilities(searchParams: SearchParams): Promise<ApiResponse<Utility[]>> {
    const params = new URLSearchParams()
    
    if (searchParams.query) {
      params.append('q', searchParams.query)
    }
    if (searchParams.sortBy) {
      params.append('sort', searchParams.sortBy)
    }
    if (searchParams.sortOrder) {
      params.append('order', searchParams.sortOrder)
    }
    if (searchParams.page) {
      params.append('page', searchParams.page.toString())
    }
    if (searchParams.limit) {
      params.append('limit', searchParams.limit.toString())
    }

    const endpoint = `/api/v1/utilities/search?${params.toString()}`
    return this.request<Utility[]>(endpoint)
  }

  async getUtilityProfile(utilityId: string): Promise<ApiResponse<UtilityProfile>> {
    return this.request<UtilityProfile>(`/api/v1/utilities/${utilityId}/profile`)
  }

  async getTechnologyMix(utilityId: string): Promise<ApiResponse<TechnologyMix>> {
    return this.request<TechnologyMix>(`/api/v1/utilities/${utilityId}/technology-mix`)
  }

  async getUtilityTimeSeries(
    utilityId: string, 
    metric: string,
    startDate?: string,
    endDate?: string
  ): Promise<ApiResponse<TimeSeriesData[]>> {
    const params = new URLSearchParams()
    params.append('metric', metric)
    
    if (startDate) params.append('start', startDate)
    if (endDate) params.append('end', endDate)

    const endpoint = `/api/v1/utilities/${utilityId}/timeseries?${params.toString()}`
    return this.request<TimeSeriesData[]>(endpoint)
  }

  // Comparison endpoints
  async compareUtilities(utilityIds: string[]): Promise<ApiResponse<ComparisonData>> {
    return this.request<ComparisonData>('/api/v1/utilities/compare', {
      method: 'POST',
      body: JSON.stringify({ utility_ids: utilityIds }),
    })
  }

  // Analytics endpoints
  async getMarketAnalytics(region?: string): Promise<ApiResponse<any>> {
    const params = region ? `?region=${region}` : ''
    return this.request<any>(`/api/v1/analytics/market${params}`)
  }

  async getTechnologyTrends(
    technology?: string,
    region?: string
  ): Promise<ApiResponse<TimeSeriesData[]>> {
    const params = new URLSearchParams()
    if (technology) params.append('technology', technology)
    if (region) params.append('region', region)

    const queryString = params.toString()
    const endpoint = `/api/v1/analytics/technology-trends${queryString ? `?${queryString}` : ''}`
    
    return this.request<TimeSeriesData[]>(endpoint)
  }

  async getGeographyData(state: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/geography/${state}`)
  }

  // Export functionality
  async exportUtilityData(
    utilityIds: string[],
    options: ExportOptions
  ): Promise<ApiResponse<Blob>> {
    const response = await fetch(`${this.baseURL}/api/v1/utilities/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(await this.getAuthToken() && { 
          Authorization: `Bearer ${await this.getAuthToken()}` 
        }),
      },
      body: JSON.stringify({
        utility_ids: utilityIds,
        ...options,
      }),
    })

    if (!response.ok) {
      return {
        success: false,
        data: null as any,
        error: `Export failed: ${response.statusText}`,
      }
    }

    const blob = await response.blob()
    return {
      success: true,
      data: blob,
    }
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return this.request<{ status: string; timestamp: string }>('/api/v1/health')
  }
}

// Export singleton instance
export const energyApi = new EnergyDataClient()

// Utility functions for common operations
export const energyApiUtils = {
  // Get utility logo URL with fallback
  getUtilityLogoUrl: (utility: Utility): string => {
    if (utility.logo) {
      // If it's already a full URL, return as-is
      if (utility.logo.startsWith('http')) {
        return utility.logo
      }
      // Otherwise, assume it's a local asset
      return `/logos/${utility.logo}`
    }
    
    // Fallback to placeholder
    return '/logos/placeholder.svg'
  },

  // Calculate logo size based on capacity
  getLogoSize: (capacity: number): number => {
    if (capacity > 10000) return 100      // Dominion Energy level
    if (capacity > 5000) return 80        // Large utilities
    if (capacity > 2000) return 70        // Medium utilities
    if (capacity > 1000) return 60        // Smaller utilities
    return 50                             // Cooperatives/Municipal
  },

  // Format capacity numbers
  formatCapacity: (capacity: number): string => {
    if (capacity >= 1000) {
      return `${(capacity / 1000).toFixed(1)}k MW`
    }
    return `${capacity} MW`
  },

  // Format customer count
  formatCustomers: (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(0)}k`
    }
    return count.toString()
  },

  // Get technology color for charts
  getTechnologyColor: (technology: string): string => {
    const colors: { [key: string]: string } = {
      coal: '#374151',
      natural_gas: '#3b82f6',
      nuclear: '#8b5cf6',
      solar: '#f59e0b',
      wind: '#10b981',
      hydro: '#06b6d4',
      biomass: '#84cc16',
      geothermal: '#ef4444',
      storage: '#f97316',
      other: '#6b7280',
    }
    return colors[technology] || colors.other
  },

  // Validate utility filters
  validateFilters: (filters: UtilityFilters): boolean => {
    if (filters.capacityRange && filters.capacityRange.min > filters.capacityRange.max) {
      return false
    }
    if (filters.customerRange && filters.customerRange.min > filters.customerRange.max) {
      return false
    }
    return true
  },
}

export default energyApi