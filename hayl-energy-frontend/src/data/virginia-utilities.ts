// Virginia Energy Market Data and Utilities Configuration

import { VirginiaUtility, VirginiaRegion, UtilityType } from '@/types/energy'

// Major Virginia Utilities (with sample data structure)
export const virginiaUtilities: VirginiaUtility[] = [
  {
    id: 'dominion-energy-virginia',
    name: 'Dominion Energy Virginia',
    type: UtilityType.INVESTOR_OWNED,
    state: 'virginia',
    region: 'central-virginia',
    logo: 'dominion-energy.svg',
    website: 'https://dominionenergy.com',
    totalCapacity: 23400, // MW - approximate
    customerCount: 2700000,
    serviceTerritory: {
      counties: [
        'Richmond', 'Norfolk', 'Virginia Beach', 'Chesapeake', 'Newport News',
        'Hampton', 'Portsmouth', 'Suffolk', 'Williamsburg', 'Fredericksburg',
        'Charlottesville', 'Lynchburg', 'Danville', 'Petersburg', 'Hopewell',
        // Additional counties...
        'Henrico', 'Chesterfield', 'Fairfax', 'Prince William', 'Loudoun',
        'Stafford', 'Spotsylvania', 'Caroline', 'King George', 'Westmoreland'
      ],
      cities: ['Richmond', 'Norfolk', 'Virginia Beach', 'Chesapeake', 'Newport News'],
      totalArea: 30000,
      population: 2800000,
      coordinates: {
        latitude: 37.5407,
        longitude: -77.4360
      }
    },
    regulatoryStatus: 'regulated' as any,
    parentCompany: 'Dominion Energy, Inc.',
    established: '1909',
    headquarters: 'Richmond, VA',
    sccJurisdiction: true,
    virginiaCleanEconomyAct: true,
    carbonFreeTarget: '2045',
    renewablePortfolioStandard: 30
  },
  {
    id: 'appalachian-power',
    name: 'Appalachian Power Company',
    type: UtilityType.INVESTOR_OWNED,
    state: 'virginia',
    region: 'southwest-virginia',
    logo: 'appalachian-power.svg',
    website: 'https://appalachianpower.com',
    totalCapacity: 3100, // MW - approximate
    customerCount: 550000,
    serviceTerritory: {
      counties: [
        'Roanoke', 'Bristol', 'Blacksburg', 'Radford', 'Salem',
        'Pulaski', 'Tazewell', 'Bland', 'Wythe', 'Smyth',
        'Washington', 'Russell', 'Scott', 'Lee', 'Wise',
        'Dickenson', 'Buchanan'
      ],
      cities: ['Roanoke', 'Bristol', 'Blacksburg', 'Radford'],
      totalArea: 12000,
      population: 600000,
      coordinates: {
        latitude: 37.2710,
        longitude: -79.9414
      }
    },
    regulatoryStatus: 'regulated' as any,
    parentCompany: 'American Electric Power',
    established: '1926',
    headquarters: 'Charleston, WV',
    sccJurisdiction: true,
    virginiaCleanEconomyAct: true,
    carbonFreeTarget: '2045',
    renewablePortfolioStandard: 25
  },
  {
    id: 'novec',
    name: 'Northern Virginia Electric Cooperative',
    type: UtilityType.COOPERATIVE,
    state: 'virginia',
    region: 'northern-virginia',
    logo: 'novec.svg',
    website: 'https://novec.com',
    totalCapacity: 450, // MW - approximate (mostly purchase power)
    customerCount: 170000,
    serviceTerritory: {
      counties: [
        'Fairfax', 'Prince William', 'Loudoun', 'Stafford',
        'Fauquier', 'Clarke', 'Warren', 'Shenandoah'
      ],
      cities: ['Manassas', 'Manassas Park'],
      totalArea: 2000,
      population: 500000,
      coordinates: {
        latitude: 38.9072,
        longitude: -77.0369
      }
    },
    regulatoryStatus: 'regulated' as any,
    established: '1983',
    headquarters: 'Manassas, VA',
    sccJurisdiction: false, // Cooperatives have different regulation
    virginiaCleanEconomyAct: false,
    renewablePortfolioStandard: 15
  },
  {
    id: 'rappahannock-electric',
    name: 'Rappahannock Electric Cooperative',
    type: UtilityType.COOPERATIVE,
    state: 'virginia',
    region: 'central-northern-virginia',
    logo: 'rappahannock-electric.svg',
    website: 'https://myrec.coop',
    totalCapacity: 300, // MW - approximate
    customerCount: 170000,
    serviceTerritory: {
      counties: [
        'Spotsylvania', 'Orange', 'Culpeper', 'Madison', 'Rappahannock',
        'Fauquier', 'King George', 'Caroline', 'Essex', 'Westmoreland',
        'Richmond County', 'Northumberland', 'Lancaster'
      ],
      cities: [],
      totalArea: 3500,
      population: 400000,
      coordinates: {
        latitude: 38.2904,
        longitude: -77.4047
      }
    },
    regulatoryStatus: 'regulated' as any,
    established: '1938',
    headquarters: 'Fredericksburg, VA',
    sccJurisdiction: false,
    virginiaCleanEconomyAct: false,
    renewablePortfolioStandard: 10
  },
  {
    id: 'craig-botetourt-electric',
    name: 'Craig-Botetourt Electric Cooperative',
    type: UtilityType.COOPERATIVE,
    state: 'virginia',
    region: 'central-virginia',
    logo: 'craig-botetourt.svg',
    website: 'https://cbec.coop',
    totalCapacity: 25,
    customerCount: 13000,
    serviceTerritory: {
      counties: ['Craig', 'Botetourt', 'Roanoke', 'Bedford'],
      cities: [],
      totalArea: 800,
      population: 45000,
      coordinates: {
        latitude: 37.5276,
        longitude: -79.8731
      }
    },
    regulatoryStatus: 'regulated' as any,
    established: '1940',
    headquarters: 'New Castle, VA',
    sccJurisdiction: false,
    virginiaCleanEconomyAct: false
  },
  {
    id: 'danville-utilities',
    name: 'Danville Utilities',
    type: UtilityType.MUNICIPAL,
    state: 'virginia',
    region: 'south-central-virginia',
    logo: 'danville-utilities.svg',
    website: 'https://danvilleva.gov/utilities',
    totalCapacity: 50,
    customerCount: 25000,
    serviceTerritory: {
      counties: ['Danville City', 'Pittsylvania'],
      cities: ['Danville'],
      totalArea: 150,
      population: 40000,
      coordinates: {
        latitude: 36.5860,
        longitude: -79.3950
      }
    },
    regulatoryStatus: 'regulated' as any,
    established: '1928',
    headquarters: 'Danville, VA',
    sccJurisdiction: false,
    virginiaCleanEconomyAct: false
  }
]

// Virginia Regions for Geographic Analysis
export const virginiaRegions: VirginiaRegion[] = [
  {
    name: 'Northern Virginia',
    counties: [
      'Arlington', 'Fairfax', 'Loudoun', 'Prince William', 'Stafford',
      'Fauquier', 'Clarke', 'Warren', 'Shenandoah'
    ],
    primaryUtilities: ['novec', 'dominion-energy-virginia', 'rappahannock-electric'],
    population: 2800000,
    economicProfile: ['Technology', 'Government', 'Defense', 'Professional Services'],
    energyProfile: {
      totalGeneration: 5000,
      primarySources: ['natural_gas' as any, 'nuclear' as any, 'solar' as any]
    }
  },
  {
    name: 'Central Virginia',
    counties: [
      'Richmond', 'Henrico', 'Chesterfield', 'Hanover', 'Goochland',
      'Powhatan', 'Amelia', 'Cumberland', 'Prince Edward', 'Nottoway'
    ],
    primaryUtilities: ['dominion-energy-virginia'],
    population: 1500000,
    economicProfile: ['Government', 'Healthcare', 'Education', 'Manufacturing'],
    energyProfile: {
      totalGeneration: 8000,
      primarySources: ['nuclear' as any, 'natural_gas' as any, 'solar' as any, 'coal' as any]
    }
  },
  {
    name: 'Southwest Virginia',
    counties: [
      'Roanoke', 'Montgomery', 'Pulaski', 'Wythe', 'Smyth', 'Washington',
      'Russell', 'Tazewell', 'Buchanan', 'Dickenson', 'Wise', 'Lee', 'Scott'
    ],
    primaryUtilities: ['appalachian-power', 'craig-botetourt-electric'],
    population: 800000,
    economicProfile: ['Mining', 'Agriculture', 'Manufacturing', 'Education'],
    energyProfile: {
      totalGeneration: 6000,
      primarySources: ['coal' as any, 'natural_gas' as any, 'hydro' as any]
    }
  },
  {
    name: 'Tidewater/Hampton Roads',
    counties: [
      'Norfolk', 'Virginia Beach', 'Chesapeake', 'Newport News', 'Hampton',
      'Portsmouth', 'Suffolk', 'Williamsburg', 'York', 'James City'
    ],
    primaryUtilities: ['dominion-energy-virginia'],
    population: 1700000,
    economicProfile: ['Military', 'Shipbuilding', 'Port Operations', 'Tourism'],
    energyProfile: {
      totalGeneration: 4500,
      primarySources: ['nuclear' as any, 'natural_gas' as any, 'solar' as any]
    }
  }
]

// Virginia Energy Market Overview
export const virginiaEnergyOverview = {
  totalInstalledCapacity: 27325, // MW
  totalUtilities: 6,
  totalCustomers: 3625000,
  regulatoryBody: 'Virginia State Corporation Commission (SCC)',
  cleanEnergyTarget: '100% carbon-free by 2045',
  renewablePortfolioStandard: '30% by 2030',
  majorEnergyLaws: [
    'Virginia Clean Economy Act (2020)',
    'Grid Transformation and Security Act (2018)'
  ],
  keyEnergyTrends: [
    'Coal plant retirements',
    'Natural gas expansion',
    'Offshore wind development',
    'Solar growth',
    'Energy storage deployment',
    'Grid modernization'
  ],
  majorFacilities: [
    {
      name: 'North Anna Nuclear Plant',
      type: 'nuclear',
      capacity: 1838,
      owner: 'Dominion Energy'
    },
    {
      name: 'Surry Nuclear Plant',
      type: 'nuclear',
      capacity: 1676,
      owner: 'Dominion Energy'
    },
    {
      name: 'Coastal Virginia Offshore Wind',
      type: 'wind',
      capacity: 2640,
      owner: 'Dominion Energy',
      status: 'Under Construction'
    },
    {
      name: 'Greensville Power Station',
      type: 'natural_gas',
      capacity: 1588,
      owner: 'Dominion Energy'
    }
  ]
}

// Utility ownership type descriptions
export const utilityTypeDescriptions = {
  [UtilityType.INVESTOR_OWNED]: {
    name: 'Investor-Owned Utilities',
    description: 'Publicly traded companies regulated by the Virginia SCC',
    characteristics: [
      'Regulated by Virginia SCC',
      'Subject to Virginia Clean Economy Act',
      'Largest customer base',
      'Integrated resource planning'
    ]
  },
  [UtilityType.COOPERATIVE]: {
    name: 'Electric Cooperatives',
    description: 'Member-owned utilities serving rural and suburban areas',
    characteristics: [
      'Member-owned and controlled',
      'Non-profit operation',
      'Rural and suburban focus',
      'Different regulatory structure'
    ]
  },
  [UtilityType.MUNICIPAL]: {
    name: 'Municipal Utilities',
    description: 'City-owned utilities serving local communities',
    characteristics: [
      'City government owned',
      'Local control and governance',
      'Serve city boundaries',
      'Local rate setting'
    ]
  }
}

// Export utility helper functions
export const virginiaUtils = {
  getUtilitiesByRegion: (regionName: string) => {
    const region = virginiaRegions.find(r => r.name === regionName)
    if (!region) return []
    
    return virginiaUtilities.filter(utility => 
      region.primaryUtilities.includes(utility.id)
    )
  },

  getUtilitiesByType: (type: UtilityType) => {
    return virginiaUtilities.filter(utility => utility.type === type)
  },

  getTotalCapacityByType: (type: UtilityType) => {
    return virginiaUtilities
      .filter(utility => utility.type === type)
      .reduce((total, utility) => total + utility.totalCapacity, 0)
  },

  getTotalCustomersByType: (type: UtilityType) => {
    return virginiaUtilities
      .filter(utility => utility.type === type)
      .reduce((total, utility) => total + utility.customerCount, 0)
  },

  getRegionByCounty: (county: string) => {
    return virginiaRegions.find(region => 
      region.counties.includes(county)
    )
  },

  getLargestUtilities: (count: number = 5) => {
    return [...virginiaUtilities]
      .sort((a, b) => b.totalCapacity - a.totalCapacity)
      .slice(0, count)
  }
}