// Energy Market Data Types

export interface Utility {
  id: string
  name: string
  type: UtilityType
  state: string
  region: string
  logo?: string
  website?: string
  totalCapacity: number // MW
  customerCount: number
  serviceTerritory: ServiceTerritory
  regulatoryStatus: RegulatoryStatus
  parentCompany?: string
  established?: string
  headquarters?: string
}

export interface ServiceTerritory {
  counties: string[]
  cities: string[]
  totalArea: number // square miles
  population: number
  coordinates?: {
    latitude: number
    longitude: number
  }
}

export enum UtilityType {
  INVESTOR_OWNED = 'investor_owned',
  COOPERATIVE = 'cooperative',
  MUNICIPAL = 'municipal',
  PUBLIC_POWER = 'public_power',
  FEDERAL = 'federal'
}

export enum RegulatoryStatus {
  REGULATED = 'regulated',
  DEREGULATED = 'deregulated',
  HYBRID = 'hybrid'
}

export interface TechnologyMix {
  utilityId: string
  lastUpdated: string
  totalCapacity: number
  technologies: TechnologyCapacity[]
  retirements: PlannedRetirement[]
  additions: PlannedAddition[]
}

export interface TechnologyCapacity {
  technology: EnergyTechnology
  capacity: number // MW
  percentage: number
  facilities: number
  averageAge: number // years
  fuelCost?: number // $/MWh
}

export enum EnergyTechnology {
  COAL = 'coal',
  NATURAL_GAS = 'natural_gas',
  NUCLEAR = 'nuclear',
  SOLAR = 'solar',
  WIND = 'wind',
  HYDRO = 'hydro',
  BIOMASS = 'biomass',
  GEOTHERMAL = 'geothermal',
  STORAGE = 'storage',
  OTHER = 'other'
}

export interface PlannedRetirement {
  id: string
  facilityName: string
  technology: EnergyTechnology
  capacity: number
  plannedDate: string
  reason: string
  replacementPlan?: string
}

export interface PlannedAddition {
  id: string
  facilityName: string
  technology: EnergyTechnology
  capacity: number
  plannedDate: string
  status: ProjectStatus
  investment: number // millions USD
  location?: {
    county: string
    coordinates?: {
      latitude: number
      longitude: number
    }
  }
}

export enum ProjectStatus {
  PLANNING = 'planning',
  PERMITTING = 'permitting',
  CONSTRUCTION = 'construction',
  COMMISSIONING = 'commissioning',
  OPERATIONAL = 'operational',
  CANCELLED = 'cancelled'
}

// Virginia-specific interfaces
export interface VirginiaUtility extends Utility {
  sccJurisdiction: boolean
  virginiaCleanEconomyAct: boolean
  carbonFreeTarget?: string
  renewablePortfolioStandard?: number
}

export interface VirginiaRegion {
  name: string
  counties: string[]
  primaryUtilities: string[]
  population: number
  economicProfile: string[]
  energyProfile: {
    totalGeneration: number
    primarySources: EnergyTechnology[]
  }
}

// Chart and visualization interfaces
export interface ChartDataPoint {
  name: string
  value: number
  color?: string
  percentage?: number
}

export interface TimeSeriesData {
  date: string
  value: number
  technology?: EnergyTechnology
  utility?: string
}

export interface ComparisonData {
  utilities: Utility[]
  metrics: ComparisonMetric[]
  lastUpdated: string
}

export interface ComparisonMetric {
  name: string
  unit: string
  values: { [utilityId: string]: number | string }
  category: MetricCategory
}

export enum MetricCategory {
  CAPACITY = 'capacity',
  FINANCIAL = 'financial',
  OPERATIONAL = 'operational',
  ENVIRONMENTAL = 'environmental',
  CUSTOMERS = 'customers'
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  error?: string
  meta?: {
    total?: number
    page?: number
    limit?: number
    lastUpdated?: string
  }
}

export interface UtilityProfile {
  utility: Utility
  technologyMix: TechnologyMix
  financialMetrics: FinancialMetrics
  operationalMetrics: OperationalMetrics
  recentNews: NewsItem[]
  regulatoryFilings: RegulatoryFiling[]
}

export interface FinancialMetrics {
  revenue: number // millions USD
  netIncome: number
  rateBase: number
  capexPlanned: number
  lastReported: string
}

export interface OperationalMetrics {
  generationMWh: number
  salesMWh: number
  transmissionLines: number // miles
  distributionLines: number // miles
  substations: number
  peakDemand: number // MW
}

export interface NewsItem {
  id: string
  title: string
  summary: string
  url: string
  publishedDate: string
  source: string
  tags: string[]
}

export interface RegulatoryFiling {
  id: string
  title: string
  type: string
  filedDate: string
  status: string
  summary: string
  documentUrl?: string
}

// Filter and search interfaces
export interface UtilityFilters {
  states?: string[]
  types?: UtilityType[]
  technologies?: EnergyTechnology[]
  capacityRange?: {
    min: number
    max: number
  }
  customerRange?: {
    min: number
    max: number
  }
}

export interface SearchParams {
  query?: string
  filters?: UtilityFilters
  sortBy?: SortOption
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export enum SortOption {
  NAME = 'name',
  CAPACITY = 'totalCapacity',
  CUSTOMERS = 'customerCount',
  TYPE = 'type',
  STATE = 'state'
}

// Export functionality
export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv'
  includeCharts: boolean
  includeRawData: boolean
  dateRange?: {
    start: string
    end: string
  }
}

export interface ExportData {
  metadata: {
    generated: string
    title: string
    description: string
  }
  utilities: Utility[]
  comparisons?: ComparisonData
  charts?: ChartDataPoint[][]
  timeSeries?: TimeSeriesData[]
}