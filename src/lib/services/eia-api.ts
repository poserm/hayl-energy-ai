/**
 * EIA (Energy Information Administration) API Client
 * Official API Documentation: https://www.eia.gov/opendata/documentation.php
 */

export interface EIAResponse<T = any> {
  response: {
    data: T[]
    total?: number
  }
  request?: {
    command: string
    params: Record<string, any>
  }
}

export interface EIASeries {
  period: string
  value: number | null
  units?: string
}

export interface EIADataset {
  seriesId: string
  name: string
  units?: string
  frequency?: string
  data: EIASeries[]
  description?: string
}

export class EIAAPIClient {
  private baseURL: string
  private apiKey: string

  constructor(apiKey?: string, baseURL?: string) {
    this.apiKey = apiKey || process.env.EIA_API_KEY || ''
    this.baseURL = baseURL || process.env.NEXT_PUBLIC_EIA_API_URL || 'https://api.eia.gov/v2'
  }

  /**
   * Make a generic request to the EIA API
   */
  private async makeRequest<T = any>(
    endpoint: string,
    params: Record<string, any> = {}
  ): Promise<EIAResponse<T>> {
    // Check for API key at request time, not construction time
    if (!this.apiKey) {
      throw new Error('EIA_API_KEY is required. Please set it in your environment variables.')
    }

    const url = new URL(`${this.baseURL}${endpoint}`)

    // Add API key and additional parameters
    url.searchParams.append('api_key', this.apiKey)
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value))
      }
    })

    console.log(`[EIA API] Requesting: ${url.pathname}`)

    try {
      const response = await fetch(url.toString())

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`EIA API Error (${response.status}): ${errorText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('[EIA API] Request failed:', error)
      throw error
    }
  }

  /**
   * Get electricity generation data by fuel type
   * @param frequency 'monthly' | 'annual' | 'quarterly'
   * @param facets Filter by state, sector, fuel type, etc.
   */
  async getElectricityGeneration(params: {
    frequency?: 'monthly' | 'annual' | 'quarterly'
    start?: string // Format: YYYY-MM
    end?: string
    facets?: {
      location?: string // e.g., 'VA' for Virginia (state code)
      sectorid?: string // e.g., 'ALL', 'ELE', 'COM', 'IND'
      fueltypeid?: string // e.g., 'ALL', 'NG', 'COL', 'SUN', 'WND'
    }
    length?: number // Number of results
    offset?: number // Pagination offset
  } = {}) {
    const { frequency = 'monthly', facets = {}, length = 5000, offset = 0, start, end } = params

    const queryParams: Record<string, any> = {
      frequency,
      'data[0]': 'generation',
      length,
      offset,
    }

    // Add facets
    Object.entries(facets).forEach(([key, value]) => {
      if (value) {
        queryParams[`facets[${key}][]`] = value
      }
    })

    // Add date range if provided
    if (start) queryParams['start'] = start
    if (end) queryParams['end'] = end

    return this.makeRequest('/electricity/electric-power-operational-data/data/', queryParams)
  }

  /**
   * Get state-level electricity data
   */
  async getStateElectricityData(stateCode: string, params: {
    frequency?: 'monthly' | 'annual'
    start?: string
    end?: string
  } = {}) {
    return this.getElectricityGeneration({
      ...params,
      facets: {
        location: stateCode,
        sectorid: 'ALL',
      }
    })
  }

  /**
   * Get Virginia-specific electricity generation data
   */
  async getVirginiaElectricityData(params: {
    frequency?: 'monthly' | 'annual'
    start?: string
    end?: string
  } = {}) {
    return this.getStateElectricityData('VA', params)
  }

  /**
   * Get electricity generation by fuel type
   */
  async getGenerationByFuel(fuelTypeId: string, params: {
    frequency?: 'monthly' | 'annual'
    location?: string
    start?: string
    end?: string
  } = {}) {
    const { location, ...otherParams } = params

    return this.getElectricityGeneration({
      ...otherParams,
      facets: {
        fueltypeid: fuelTypeId,
        location: location,
        sectorid: 'ELE', // Electric power sector
      }
    })
  }

  /**
   * Get renewable energy data
   */
  async getRenewableEnergyData(params: {
    frequency?: 'monthly' | 'annual'
    location?: string
    start?: string
    end?: string
  } = {}) {
    // EIA renewable fuel types: SUN (Solar), WND (Wind), HYC (Hydro), GEO (Geothermal)
    const renewableFuels = ['SUN', 'WND', 'HYC', 'GEO']

    const requests = renewableFuels.map(fuel =>
      this.getGenerationByFuel(fuel, params)
    )

    return Promise.all(requests)
  }

  /**
   * Get list of available datasets
   */
  async getAvailableDatasets() {
    return this.makeRequest('/electricity/')
  }

  /**
   * Get electricity retail sales data
   */
  async getRetailSales(params: {
    frequency?: 'monthly' | 'annual'
    location?: string
    sectorid?: string
    start?: string
    end?: string
  } = {}) {
    const { frequency = 'monthly', location, sectorid, start, end } = params

    const queryParams: Record<string, any> = {
      frequency,
      'data[0]': 'revenue',
      'data[1]': 'sales',
      'data[2]': 'price',
      'data[3]': 'customers',
    }

    // Add facets if provided
    if (location) queryParams['facets[location][]'] = location
    if (sectorid) queryParams['facets[sectorid][]'] = sectorid
    if (start) queryParams['start'] = start
    if (end) queryParams['end'] = end

    return this.makeRequest('/electricity/retail-sales/data/', queryParams)
  }

  /**
   * Get operating generator capacity data
   */
  async getOperatingGenerators(params: {
    frequency?: 'monthly' | 'annual'
    balancing_authority?: string // e.g., 'PJM', 'MISO', 'CAISO'
    stateid?: string // e.g., 'VA', 'MD'
    technology?: string // e.g., 'Nuclear', 'Solar', 'Natural Gas'
    status?: string // e.g., 'OP' for operating
    start?: string
    end?: string
    length?: number
    offset?: number
  } = {}) {
    const {
      frequency = 'monthly',
      balancing_authority,
      stateid,
      technology,
      status = 'OP', // Default to operating generators
      length = 5000,
      offset = 0,
      start,
      end
    } = params

    const queryParams: Record<string, any> = {
      frequency,
      'data[0]': 'nameplate-capacity-mw',
      'data[1]': 'latitude',
      'data[2]': 'longitude',
      'data[3]': 'net-generation-mwh',
      length,
      offset,
      'sort[0][column]': 'nameplate-capacity-mw',
      'sort[0][direction]': 'desc'
    }

    // Add facets
    if (balancing_authority) {
      queryParams['facets[balancing_authority_code][]'] = balancing_authority
    }
    if (stateid) {
      queryParams['facets[stateid][]'] = stateid
    }
    if (technology) {
      queryParams['facets[technology][]'] = technology
    }
    if (status) {
      queryParams['facets[status][]'] = status
    }

    // Add date range if provided
    if (start) queryParams['start'] = start
    if (end) queryParams['end'] = end

    return this.makeRequest('/electricity/operating-generator-capacity/data/', queryParams)
  }

  /**
   * Get generators for a specific balancing authority (ISO/RTO region)
   */
  async getGeneratorsByRegion(region: string, params: {
    start?: string
    technology?: string
    limit?: number
  } = {}) {
    // Get the latest month of data
    const now = new Date()
    const latestMonth = `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}`

    return this.getOperatingGenerators({
      frequency: 'monthly',
      balancing_authority: region,
      start: params.start || latestMonth,
      technology: params.technology,
      length: params.limit || 5000
    })
  }

  /**
   * Get coal data
   */
  async getCoalData(params: {
    frequency?: 'monthly' | 'annual' | 'quarterly'
    start?: string
    end?: string
  } = {}) {
    return this.makeRequest('/coal/data/', {
      frequency: params.frequency || 'monthly',
      ...params
    })
  }

  /**
   * Get natural gas data
   */
  async getNaturalGasData(params: {
    frequency?: 'monthly' | 'annual'
    start?: string
    end?: string
  } = {}) {
    return this.makeRequest('/natural-gas/data/', {
      frequency: params.frequency || 'monthly',
      ...params
    })
  }
}

// Default export with environment variables
export const eiaClient = new EIAAPIClient()

// Fuel type mappings for easy reference
export const FUEL_TYPES = {
  ALL: 'ALL',
  COAL: 'COL',
  NATURAL_GAS: 'NG',
  NUCLEAR: 'NUC',
  SOLAR: 'SUN',
  WIND: 'WND',
  HYDRO: 'HYC',
  GEOTHERMAL: 'GEO',
  PETROLEUM: 'PET',
  OTHER: 'OTH',
} as const

// Sector mappings
export const SECTORS = {
  ALL: 'ALL',
  ELECTRIC_POWER: 'ELE',
  COMMERCIAL: 'COM',
  INDUSTRIAL: 'IND',
  RESIDENTIAL: 'RES',
} as const
