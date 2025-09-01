from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import func, distinct, and_, or_, text, case
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime, timedelta

from database import get_db
from models import Generator, Utility, ServiceTerritory, UtilitySales, OperationalData, User
from auth import get_current_user_optional

router = APIRouter(prefix="/analytics", tags=["Energy Market Analytics"])

class CapacityTrendData(BaseModel):
    year: int
    total_capacity_mw: float
    additions_mw: float
    retirements_mw: float
    net_change_mw: float
    technology_breakdown: Dict[str, float]

class MarketOverviewData(BaseModel):
    total_capacity_mw: float
    total_utilities: int
    total_generators: int
    dominant_technology: str
    clean_energy_percentage: float
    geographic_distribution: Dict[str, float]

@router.get("/capacity-trends")
async def get_capacity_trends(
    state: Optional[str] = Query(None, description="Filter by state (e.g., 'VA', 'CA')"),
    technology: Optional[str] = Query(None, description="Filter by technology type"),
    start_year: int = Query(2010, description="Start year for trend analysis"),
    end_year: int = Query(2025, description="End year for trend analysis"),
    virginia_focus: bool = Query(True, description="Prioritize Virginia data in analysis"),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Get historical capacity development trends with Virginia emphasis"""
    
    # Build base filters
    base_filters = [
        Generator.operating_year.between(start_year, end_year),
        Generator.nameplate_capacity_mw.isnot(None),
        Generator.operating_year.isnot(None)
    ]
    
    if state:
        base_filters.append(Generator.plant_state == state.upper())
    elif virginia_focus:
        # Include Virginia and neighboring states that serve Virginia market
        base_filters.append(
            Generator.plant_state.in_(['VA', 'MD', 'WV', 'NC', 'KY', 'TN'])
        )
    
    if technology:
        base_filters.append(Generator.technology.ilike(f"%{technology}%"))
    
    # Get yearly capacity additions (operating generators)
    additions_query = db.query(
        Generator.operating_year.label('year'),
        func.sum(Generator.nameplate_capacity_mw).label('capacity_added_mw'),
        func.count(Generator.id).label('units_added'),
        Generator.technology,
        Generator.plant_state
    ).filter(
        and_(*base_filters),
        Generator.source_sheet == 'operating'
    ).group_by(
        Generator.operating_year,
        Generator.technology,
        Generator.plant_state
    ).all()
    
    # Get yearly capacity retirements
    retirement_filters = base_filters.copy()
    retirement_filters.extend([
        Generator.retirement_year.between(start_year, end_year),
        Generator.retirement_year.isnot(None)
    ])
    
    retirements_query = db.query(
        Generator.retirement_year.label('year'),
        func.sum(Generator.nameplate_capacity_mw).label('capacity_retired_mw'),
        func.count(Generator.id).label('units_retired'),
        Generator.technology,
        Generator.plant_state
    ).filter(
        and_(*retirement_filters),
        Generator.source_sheet == 'retired'
    ).group_by(
        Generator.retirement_year,
        Generator.technology,
        Generator.plant_state
    ).all()
    
    # Process data by year
    yearly_data = {}
    
    # Process additions
    for addition in additions_query:
        year = addition.year
        if year not in yearly_data:
            yearly_data[year] = {
                'year': year,
                'additions_mw': 0,
                'retirements_mw': 0,
                'technology_additions': {},
                'state_breakdown': {},
                'units_added': 0,
                'units_retired': 0
            }
        
        capacity = float(addition.capacity_added_mw or 0)
        yearly_data[year]['additions_mw'] += capacity
        yearly_data[year]['units_added'] += addition.units_added
        
        # Technology breakdown
        tech = addition.technology or 'Unknown'
        if tech not in yearly_data[year]['technology_additions']:
            yearly_data[year]['technology_additions'][tech] = 0
        yearly_data[year]['technology_additions'][tech] += capacity
        
        # State breakdown (Virginia priority)
        state = addition.plant_state or 'Unknown'
        if state not in yearly_data[year]['state_breakdown']:
            yearly_data[year]['state_breakdown'][state] = {'additions': 0, 'retirements': 0}
        yearly_data[year]['state_breakdown'][state]['additions'] += capacity
    
    # Process retirements
    for retirement in retirements_query:
        year = retirement.year
        if year not in yearly_data:
            yearly_data[year] = {
                'year': year,
                'additions_mw': 0,
                'retirements_mw': 0,
                'technology_additions': {},
                'state_breakdown': {},
                'units_added': 0,
                'units_retired': 0
            }
        
        capacity = float(retirement.capacity_retired_mw or 0)
        yearly_data[year]['retirements_mw'] += capacity
        yearly_data[year]['units_retired'] += retirement.units_retired
        
        # State breakdown
        state = retirement.plant_state or 'Unknown'
        if state not in yearly_data[year]['state_breakdown']:
            yearly_data[year]['state_breakdown'][state] = {'additions': 0, 'retirements': 0}
        yearly_data[year]['state_breakdown'][state]['retirements'] += capacity
    
    # Calculate cumulative capacity and trends
    capacity_trends = []
    cumulative_capacity = 0
    
    for year in sorted(yearly_data.keys()):
        data = yearly_data[year]
        additions = data['additions_mw']
        retirements = data['retirements_mw']
        net_change = additions - retirements
        cumulative_capacity += net_change
        
        # Top 3 technologies for the year
        top_technologies = sorted(
            data['technology_additions'].items(),
            key=lambda x: x[1],
            reverse=True
        )[:3]
        
        capacity_trends.append({
            'year': year,
            'cumulative_capacity_mw': round(cumulative_capacity, 1),
            'annual_additions_mw': round(additions, 1),
            'annual_retirements_mw': round(retirements, 1),
            'net_change_mw': round(net_change, 1),
            'units_added': data['units_added'],
            'units_retired': data['units_retired'],
            'top_technologies': [
                {'technology': tech, 'capacity_mw': round(cap, 1)}
                for tech, cap in top_technologies
            ],
            'virginia_share_mw': round(
                data['state_breakdown'].get('VA', {}).get('additions', 0), 1
            ) if virginia_focus else 0,
            'growth_rate_percent': round(
                (net_change / max(1, cumulative_capacity - net_change)) * 100, 2
            )
        })
    
    # Calculate overall trends
    total_additions = sum(data['additions_mw'] for data in yearly_data.values())
    total_retirements = sum(data['retirements_mw'] for data in yearly_data.values())
    
    # Technology trends over entire period
    all_tech_additions = {}
    for data in yearly_data.values():
        for tech, capacity in data['technology_additions'].items():
            if tech not in all_tech_additions:
                all_tech_additions[tech] = 0
            all_tech_additions[tech] += capacity
    
    return {
        'capacity_trends': capacity_trends,
        'summary': {
            'analysis_period': f"{start_year}-{end_year}",
            'total_additions_mw': round(total_additions, 1),
            'total_retirements_mw': round(total_retirements, 1),
            'net_capacity_change_mw': round(total_additions - total_retirements, 1),
            'avg_annual_additions_mw': round(total_additions / max(1, len(yearly_data)), 1),
            'dominant_technology': max(all_tech_additions.items(), key=lambda x: x[1])[0] if all_tech_additions else 'None',
            'total_years_analyzed': len(yearly_data),
            'virginia_focused': virginia_focus,
            'geographic_filter': state or ('Virginia + Neighbors' if virginia_focus else 'National')
        },
        'technology_breakdown': {
            tech: round(capacity, 1)
            for tech, capacity in sorted(all_tech_additions.items(), key=lambda x: x[1], reverse=True)
        }
    }

@router.get("/market-overview")
async def get_market_overview(
    region: Optional[str] = Query(None, description="Focus region (virginia, southeast, national)"),
    include_planned: bool = Query(False, description="Include planned capacity"),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Get comprehensive energy market overview with regional flexibility"""
    
    # Define regional filters
    region_filters = {
        'virginia': ['VA'],
        'southeast': ['VA', 'NC', 'SC', 'GA', 'FL', 'TN', 'KY', 'WV', 'MD', 'DE'],
        'pjm': ['VA', 'MD', 'DE', 'NJ', 'PA', 'OH', 'WV', 'KY', 'NC', 'TN', 'IL', 'IN', 'MI'],
        'national': None  # No filter for national
    }
    
    # Build base query filters
    base_filters = [
        Generator.nameplate_capacity_mw.isnot(None),
        Generator.entity_name.isnot(None)
    ]
    
    # Add source sheet filter
    if include_planned:
        base_filters.append(Generator.source_sheet.in_(['operating', 'planned']))
    else:
        base_filters.append(Generator.source_sheet == 'operating')
    
    # Add regional filter
    if region and region.lower() in region_filters:
        states = region_filters[region.lower()]
        if states:
            base_filters.append(Generator.plant_state.in_(states))
    
    # Get overall market statistics
    market_stats = db.query(
        func.sum(Generator.nameplate_capacity_mw).label('total_capacity_mw'),
        func.count(Generator.id).label('total_generators'),
        func.count(func.distinct(Generator.entity_name)).label('total_utilities'),
        func.count(func.distinct(Generator.plant_state)).label('states_covered'),
        func.count(func.distinct(Generator.technology)).label('technologies_used'),
        func.avg(Generator.nameplate_capacity_mw).label('avg_generator_size_mw')
    ).filter(and_(*base_filters)).first()
    
    # Get technology breakdown
    technology_stats = db.query(
        Generator.technology,
        Generator.energy_source_code,
        func.sum(Generator.nameplate_capacity_mw).label('capacity_mw'),
        func.count(Generator.id).label('generator_count'),
        func.avg(Generator.nameplate_capacity_mw).label('avg_size_mw'),
        func.count(func.distinct(Generator.plant_state)).label('states_present')
    ).filter(
        and_(*base_filters),
        Generator.technology.isnot(None)
    ).group_by(
        Generator.technology,
        Generator.energy_source_code
    ).order_by(
        func.sum(Generator.nameplate_capacity_mw).desc()
    ).all()
    
    # Get state-level breakdown
    state_stats = db.query(
        Generator.plant_state.label('state'),
        func.sum(Generator.nameplate_capacity_mw).label('capacity_mw'),
        func.count(Generator.id).label('generator_count'),
        func.count(func.distinct(Generator.entity_name)).label('utility_count'),
        func.count(func.distinct(Generator.technology)).label('technology_diversity')
    ).filter(
        and_(*base_filters),
        Generator.plant_state.isnot(None)
    ).group_by(Generator.plant_state).order_by(
        func.sum(Generator.nameplate_capacity_mw).desc()
    ).limit(20).all()  # Top 20 states
    
    # Get utility concentration (top utilities by capacity)
    utility_stats = db.query(
        Generator.entity_name.label('utility_name'),
        Generator.plant_state.label('primary_state'),
        func.sum(Generator.nameplate_capacity_mw).label('capacity_mw'),
        func.count(Generator.id).label('generator_count'),
        func.count(func.distinct(Generator.plant_state)).label('states_operated'),
        func.count(func.distinct(Generator.technology)).label('technology_diversity')
    ).filter(
        and_(*base_filters)
    ).group_by(
        Generator.entity_name,
        Generator.plant_state
    ).order_by(
        func.sum(Generator.nameplate_capacity_mw).desc()
    ).limit(15).all()  # Top 15 utilities
    
    # Calculate clean energy metrics
    clean_sources = ['SUN', 'WND', 'WAT', 'GEO', 'BIO', 'WAS', 'NUC']
    renewable_sources = ['SUN', 'WND', 'WAT', 'GEO', 'BIO', 'WAS']
    
    total_capacity = float(market_stats.total_capacity_mw or 0)
    
    clean_capacity = sum(
        float(tech.capacity_mw or 0) for tech in technology_stats
        if tech.energy_source_code in clean_sources
    )
    
    renewable_capacity = sum(
        float(tech.capacity_mw or 0) for tech in technology_stats
        if tech.energy_source_code in renewable_sources
    )
    
    # Process technology data
    technology_breakdown = []
    for tech in technology_stats:
        capacity_mw = float(tech.capacity_mw or 0)
        percentage = (capacity_mw / total_capacity * 100) if total_capacity > 0 else 0
        
        # Categorize energy source
        source_category = "Unknown"
        if tech.energy_source_code in renewable_sources:
            source_category = "Renewable"
        elif tech.energy_source_code in ['NUC']:
            source_category = "Nuclear"
        elif tech.energy_source_code in ['NG', 'COL', 'PET', 'OIL']:
            source_category = "Fossil"
        
        technology_breakdown.append({
            'technology': tech.technology,
            'energy_source_code': tech.energy_source_code,
            'category': source_category,
            'capacity_mw': round(capacity_mw, 1),
            'percentage': round(percentage, 2),
            'generator_count': tech.generator_count,
            'avg_unit_size_mw': round(float(tech.avg_size_mw or 0), 1),
            'geographic_presence': tech.states_present
        })
    
    # Process state data with Virginia prioritization
    state_breakdown = []
    virginia_data = None
    
    for state in state_stats:
        capacity_mw = float(state.capacity_mw or 0)
        state_percentage = (capacity_mw / total_capacity * 100) if total_capacity > 0 else 0
        
        state_info = {
            'state': state.state,
            'capacity_mw': round(capacity_mw, 1),
            'percentage_of_market': round(state_percentage, 2),
            'generator_count': state.generator_count,
            'utility_count': state.utility_count,
            'technology_diversity': state.technology_diversity,
            'avg_utility_size_mw': round(capacity_mw / max(1, state.utility_count), 1)
        }
        
        if state.state == 'VA':
            virginia_data = state_info
        
        state_breakdown.append(state_info)
    
    # Sort states with Virginia first if present
    if virginia_data:
        state_breakdown = [virginia_data] + [s for s in state_breakdown if s['state'] != 'VA']
    
    # Process utility data
    utility_breakdown = [
        {
            'utility_name': util.utility_name,
            'primary_state': util.primary_state,
            'capacity_mw': round(float(util.capacity_mw or 0), 1),
            'market_share_percent': round(
                (float(util.capacity_mw or 0) / total_capacity * 100), 2
            ) if total_capacity > 0 else 0,
            'generator_count': util.generator_count,
            'states_operated': util.states_operated,
            'technology_diversity': util.technology_diversity,
            'geographic_footprint': 'Multi-state' if util.states_operated > 1 else 'Single-state'
        }
        for util in utility_stats
    ]
    
    return {
        'market_overview': {
            'region': region or 'national',
            'includes_planned_capacity': include_planned,
            'total_capacity_mw': round(total_capacity, 1),
            'total_generators': market_stats.total_generators,
            'total_utilities': market_stats.total_utilities,
            'states_covered': market_stats.states_covered,
            'technologies_in_use': market_stats.technologies_used,
            'avg_generator_size_mw': round(float(market_stats.avg_generator_size_mw or 0), 1)
        },
        'clean_energy_metrics': {
            'clean_energy_capacity_mw': round(clean_capacity, 1),
            'clean_energy_percentage': round((clean_capacity / total_capacity * 100), 2) if total_capacity > 0 else 0,
            'renewable_capacity_mw': round(renewable_capacity, 1),
            'renewable_percentage': round((renewable_capacity / total_capacity * 100), 2) if total_capacity > 0 else 0,
            'nuclear_capacity_mw': round(clean_capacity - renewable_capacity, 1),
            'fossil_capacity_mw': round(total_capacity - clean_capacity, 1)
        },
        'technology_landscape': {
            'dominant_technology': technology_breakdown[0]['technology'] if technology_breakdown else 'None',
            'technology_count': len(technology_breakdown),
            'most_diverse_technology': max(technology_breakdown, key=lambda x: x['geographic_presence'])['technology'] if technology_breakdown else 'None',
            'breakdown': technology_breakdown[:15]  # Top 15 technologies
        },
        'geographic_distribution': {
            'top_states': state_breakdown[:10],  # Top 10 states
            'virginia_position': next((i + 1 for i, s in enumerate(state_breakdown) if s['state'] == 'VA'), None),
            'market_concentration': {
                'top_5_states_share_percent': round(
                    sum(s['percentage_of_market'] for s in state_breakdown[:5]), 2
                ),
                'herfindahl_index': round(
                    sum(s['percentage_of_market'] ** 2 for s in state_breakdown) / 100, 2
                )
            }
        },
        'utility_landscape': {
            'top_utilities': utility_breakdown[:10],  # Top 10 utilities
            'market_concentration': {
                'top_5_utilities_share_percent': round(
                    sum(u['market_share_percent'] for u in utility_breakdown[:5]), 2
                ),
                'total_multi_state_utilities': len([u for u in utility_breakdown if u['geographic_footprint'] == 'Multi-state'])
            }
        }
    }