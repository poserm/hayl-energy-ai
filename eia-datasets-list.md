# EIA API Available Datasets

Based on EIA API v2 - https://api.eia.gov/v2

## Main Electricity Routes

### 1. **Electricity Sales to Ultimate Customers** (`retail-sales`)
- **Description**: Electricity sales to ultimate customer by state and sector
- **Data includes**:
  - Number of customers
  - Average price
  - Revenue
  - Megawatthours of sales
- **Sources**: Forms EIA-826, EIA-861, EIA-861M
- **Best for**: Pricing trends, customer counts, revenue analysis

---

### 2. **Electric Power Operations - Annual and Monthly** (`electric-power-operational-data`) ⭐ MOST USEFUL
- **Description**: Monthly and annual electric power operations by state, sector, and energy source
- **Source**: Form EIA-923
- **Frequency**: Monthly, Quarterly, Annual
- **Date Range**: 2001-01 to 2025-07 (current)

#### Available Data Types:
1. **generation** - Utility Scale Electricity Net Generation
2. **total-consumption** - Consumption of Fuels for Electricity Generation and Useful Thermal Output (Physical Units)
3. **consumption-for-eg** - Consumption of Fuels for Electricity Generation (Physical Units)
4. **consumption-uto** - Consumption of Fuels for Useful Thermal Output (Physical Units)
5. **total-consumption-btu** - Consumption of Fuels for Electricity Generation and Useful Thermal Output (BTUs)
6. **consumption-for-eg-btu** - Consumption of Fuels for Electricity Generation (BTUs)
7. **consumption-uto-btu** - Consumption of Fuels for Useful Thermal Output (BTUs)
8. **stocks** - Stocks of Fuel (Physical Units)
9. **receipts** - Receipts of Fuel (Physical Units)
10. **receipts-btu** - Receipts of Fuel (BTUs)
11. **cost** - Average Cost of Fuels (per Physical Unit)
12. **cost-per-btu** - Average Cost of Fuels (per BTU)
13. **sulfur-content** - Average Sulfur Content of Consumed Fuel
14. **ash-content** - Average Ash Content of Consumed Fuel
15. **heat-content** - Average Heat Content of Consumed Fuels

#### Filters (Facets):
- **location** - State / Census Region (e.g., 'VA', 'MD', 'US')
- **sectorid** - Sector (Electric Power, Commercial, Industrial, etc.)
- **fueltypeid** - Energy Source (SUN, WND, NG, COL, NUC, etc.)

**Best for**: Energy generation trends, fuel mix analysis, renewable growth tracking

---

### 3. **Electric Power Operations - Daily and Hourly** (`rto`)
- **Description**: Hourly and daily electric power operations by balancing authority
- **Source**: Form EIA-930
- **Best for**: Real-time grid operations, demand patterns, hourly generation

---

### 4. **State Specific Data** (`state-electricity-profiles`)
- **Description**: State-specific electricity data
- **Best for**: State-level comparisons, regional analysis

---

### 5. **Inventory of Operable Generators** (`operating-generator-capacity`)
- **Description**: Inventory of operable generators in the U.S.
- **Source**: Forms EIA-860, EIA-860M
- **Best for**: Power plant capacity, generator types, facility locations

---

### 6. **Electric Power Operations for Individual Power Plants** (`facility-fuel`)
- **Description**: Annual and monthly electric power operations for individual power plants, by energy source and prime mover
- **Source**: Form EIA-923
- **Best for**: Plant-specific analysis, facility-level generation tracking

---

## Fuel Type IDs (for filtering)

### Fossil Fuels
- `COL` - Coal (bituminous, subbituminous, lignite)
- `NG` - Natural Gas
- `PET` - Petroleum
- `OIL` - Oil

### Nuclear
- `NUC` - Nuclear

### Renewables
- `SUN` - Solar (photovoltaic and thermal)
- `WND` - Wind (onshore and offshore)
- `HYC` - Hydroelectric Conventional
- `HPS` - Hydroelectric Pumped Storage
- `GEO` - Geothermal
- `WAS` - Biomass/Waste

### Storage
- `MWH` - Batteries/Energy Storage

### Other
- `OTH` - Other
- `ALL` - All fuel types combined

---

## Sector IDs (for filtering)

- `ALL` - All Sectors
- `ELE` - Electric Power Sector
- `COM` - Commercial Sector
- `IND` - Industrial Sector
- `RES` - Residential Sector

---

## Common Dashboard Use Cases

### 1. **Energy Mix Pie Chart**
- Dataset: `electric-power-operational-data`
- Data: `generation`
- Filters: `location=VA`, `frequency=annual`, `start=2023`
- Group by: `fueltypeid`

### 2. **Renewable Growth Trend Line**
- Dataset: `electric-power-operational-data`
- Data: `generation`
- Filters: `location=VA`, `fueltypeid=SUN,WND,HYC`, `frequency=annual`, `start=2015`
- Chart: Multi-line chart over time

### 3. **State Comparison Bar Chart**
- Dataset: `electric-power-operational-data`
- Data: `generation`
- Filters: `location=VA,MD,NC,WV`, `frequency=annual`, `start=2023`
- Chart: Grouped bar chart by state

### 4. **Electricity Prices**
- Dataset: `retail-sales`
- Data: `price`
- Filters: `location=VA`, `frequency=monthly`
- Chart: Line chart showing price trends

### 5. **Fuel Cost Analysis**
- Dataset: `electric-power-operational-data`
- Data: `cost-per-btu`
- Filters: `location=VA`, `fueltypeid=NG,COL,NUC`
- Chart: Multi-line cost comparison

---

## API Endpoint Structure

```
Base URL: https://api.eia.gov/v2

Pattern: /electricity/{route}/data/

Example:
https://api.eia.gov/v2/electricity/electric-power-operational-data/data/
  ?api_key={YOUR_KEY}
  &frequency=annual
  &data[0]=generation
  &facets[location][]=VA
  &facets[fueltypeid][]=SUN
  &start=2020
  &end=2023
```

---

## Recommendations for Your Dashboard

**High Priority Datasets:**
1. ✅ `electric-power-operational-data` with `generation` - Core energy generation data
2. ✅ `retail-sales` with `price`, `sales` - Consumer pricing and usage
3. ✅ `operating-generator-capacity` - Power plant inventory

**Best Visualizations:**
- Virginia energy mix (fossil vs renewable)
- Solar/wind growth trends (2015-2024)
- Monthly generation patterns
- Price trends by sector
- Capacity by technology type
