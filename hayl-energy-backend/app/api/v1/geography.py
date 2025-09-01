from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import func, distinct, and_, or_, text
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

from database import get_db
from models import Generator, Utility, ServiceTerritory, UtilitySales, OperationalData, User
from auth import get_current_user_optional

router = APIRouter(prefix="/geography", tags=["Geographic Analysis"])

class CountyData(BaseModel):
    county: str
    state: str
    total_capacity_mw: float
    utility_count: int
    dominant_technology: str
    generator_count: int

class ServiceTerritoryData(BaseModel):
    utility_name: str
    counties_served: List[str]
    total_capacity_mw: float
    geographic_footprint: str

@router.get("/virginia")
async def get_virginia_analysis(
    include_neighboring: bool = Query(True, description="Include neighboring state utilities serving VA"),
    county_detail: bool = Query(True, description="Include county-level breakdown"),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Comprehensive Virginia energy market geographic analysis"""
    
    # Virginia counties data
    if county_detail:
        virginia_counties_query = db.query(
            Generator.county,
            func.count(func.distinct(Generator.entity_name)).label('utility_count'),
            func.sum(Generator.nameplate_capacity_mw).label('total_capacity_mw'),
            func.count(Generator.id).label('generator_count'),
            func.count(func.distinct(Generator.technology)).label('technology_diversity'),
            func.count(func.distinct(Generator.plant_name)).label('plant_count'),
            func.avg(Generator.latitude).label('avg_latitude'),
            func.avg(Generator.longitude).label('avg_longitude')
        ).filter(
            Generator.plant_state == 'VA',
            Generator.source_sheet == 'operating',
            Generator.county.isnot(None),
            Generator.nameplate_capacity_mw.isnot(None)
        ).group_by(Generator.county).order_by(
            func.sum(Generator.nameplate_capacity_mw).desc()
        ).all()
        
        # Get dominant technology for each county
        county_tech_query = db.query(
            Generator.county,
            Generator.technology,
            func.sum(Generator.nameplate_capacity_mw).label('tech_capacity'),
            func.row_number().over(
                partition_by=Generator.county,
                order_by=func.sum(Generator.nameplate_capacity_mw).desc()
            ).label('tech_rank')
        ).filter(
            Generator.plant_state == 'VA',
            Generator.source_sheet == 'operating',
            Generator.county.isnot(None),
            Generator.technology.isnot(None)
        ).group_by(
            Generator.county,
            Generator.technology
        ).subquery()
        
        dominant_tech_by_county = db.query(
            county_tech_query.c.county,
            county_tech_query.c.technology,
            county_tech_query.c.tech_capacity
        ).filter(county_tech_query.c.tech_rank == 1).all()
        
        # Create county lookup for dominant technology
        county_dominant_tech = {
            tech.county: tech.technology for tech in dominant_tech_by_county
        }
        
        virginia_counties = []
        for county in virginia_counties_query:
            virginia_counties.append({
                'county': county.county,
                'state': 'VA',
                'total_capacity_mw': round(float(county.total_capacity_mw or 0), 1),
                'utility_count': county.utility_count,
                'generator_count': county.generator_count,
                'plant_count': county.plant_count,
                'technology_diversity': county.technology_diversity,
                'dominant_technology': county_dominant_tech.get(county.county, 'Unknown'),
                'location': {
                    'latitude': round(float(county.avg_latitude or 0), 4),
                    'longitude': round(float(county.avg_longitude or 0), 4)
                },
                'capacity_density_mw_per_facility': round(
                    float(county.total_capacity_mw or 0) / max(1, county.plant_count), 1
                )
            })
    else:
        virginia_counties = []
    
    # Virginia utilities with service territory analysis
    virginia_utilities_query = db.query(
        Generator.entity_name.label('utility_name'),
        func.count(func.distinct(Generator.county)).label('counties_served'),
        func.sum(Generator.nameplate_capacity_mw).label('total_capacity_mw'),
        func.count(Generator.id).label('generator_count'),
        func.count(func.distinct(Generator.plant_name)).label('plant_count'),
        func.string_agg(func.distinct(Generator.county), ', ').label('county_list'),
        func.avg(Generator.latitude).label('centroid_lat'),
        func.avg(Generator.longitude).label('centroid_lng')
    ).filter(
        Generator.plant_state == 'VA',
        Generator.source_sheet == 'operating',
        Generator.entity_name.isnot(None)
    ).group_by(Generator.entity_name).order_by(
        func.sum(Generator.nameplate_capacity_mw).desc()
    ).all()
    
    # Include neighboring utilities if requested
    neighboring_utilities = []
    if include_neighboring:
        neighboring_states = ['MD', 'WV', 'NC', 'KY', 'TN', 'DE', 'PA']
        
        # Find utilities in neighboring states that might serve Virginia market
        neighboring_query = db.query(
            Generator.entity_name.label('utility_name'),
            Generator.plant_state.label('state'),
            func.sum(Generator.nameplate_capacity_mw).label('total_capacity_mw'),
            func.count(func.distinct(Generator.county)).label('counties_served'),
            func.count(Generator.id).label('generator_count')
        ).filter(
            Generator.plant_state.in_(neighboring_states),
            Generator.source_sheet == 'operating',
            Generator.entity_name.isnot(None),
            # Filter for larger utilities that might serve interstate
            Generator.nameplate_capacity_mw >= 100  # Only significant generators
        ).group_by(
            Generator.entity_name,
            Generator.plant_state
        ).having(
            func.sum(Generator.nameplate_capacity_mw) >= 1000  # Only utilities with 1GW+
        ).order_by(
            func.sum(Generator.nameplate_capacity_mw).desc()
        ).limit(20).all()
        
        for util in neighboring_query:
            neighboring_utilities.append({
                'utility_name': util.utility_name,
                'home_state': util.state,
                'total_capacity_mw': round(float(util.total_capacity_mw or 0), 1),
                'counties_served': util.counties_served,
                'generator_count': util.generator_count,
                'potential_va_service': True,  # Assumption for large regional utilities
                'interstate_operator': True
            })
    
    # Virginia market service territories
    service_territories = []
    for util in virginia_utilities_query:
        counties_list = util.county_list.split(', ') if util.county_list else []
        
        # Determine geographic footprint
        if util.counties_served >= 10:
            footprint = "Statewide"
        elif util.counties_served >= 5:
            footprint = "Regional" 
        elif util.counties_served >= 2:
            footprint = "Multi-county"
        else:
            footprint = "Local"
        
        service_territories.append({
            'utility_name': util.utility_name,
            'counties_served': counties_list,
            'county_count': util.counties_served,
            'total_capacity_mw': round(float(util.total_capacity_mw or 0), 1),
            'generator_count': util.generator_count,
            'plant_count': util.plant_count,
            'geographic_footprint': footprint,
            'service_territory_centroid': {
                'latitude': round(float(util.centroid_lat or 0), 4),
                'longitude': round(float(util.centroid_lng or 0), 4)
            },
            'market_penetration': 'Primary' if util.counties_served >= 3 else 'Limited'
        })
    
    # Virginia energy infrastructure summary
    va_infrastructure_summary = db.query(
        func.sum(Generator.nameplate_capacity_mw).label('total_capacity_mw'),
        func.count(Generator.id).label('total_generators'),
        func.count(func.distinct(Generator.entity_name)).label('total_utilities'),
        func.count(func.distinct(Generator.county)).label('counties_with_generation'),
        func.count(func.distinct(Generator.plant_name)).label('total_plants'),
        func.count(func.distinct(Generator.technology)).label('technology_types'),
        func.min(Generator.operating_year).label('oldest_facility'),
        func.max(Generator.operating_year).label('newest_facility')
    ).filter(
        Generator.plant_state == 'VA',
        Generator.source_sheet == 'operating',
        Generator.nameplate_capacity_mw.isnot(None)
    ).first()
    
    # Regional grid connections and market participation
    # Get utilities that operate in Virginia and other states (interstate operators)
    interstate_operators_query = db.query(
        Generator.entity_name.label('utility_name'),
        func.count(func.distinct(Generator.plant_state)).label('states_operated'),
        func.string_agg(func.distinct(Generator.plant_state), ', ').label('state_list'),
        func.sum(
            case(
                (Generator.plant_state == 'VA', Generator.nameplate_capacity_mw),
                else_=0
            )
        ).label('va_capacity_mw'),
        func.sum(Generator.nameplate_capacity_mw).label('total_capacity_mw')
    ).filter(
        Generator.source_sheet == 'operating',
        Generator.entity_name.in_(
            # Utilities that operate in Virginia
            db.query(Generator.entity_name).filter(Generator.plant_state == 'VA').distinct()
        )
    ).group_by(Generator.entity_name).having(
        func.count(func.distinct(Generator.plant_state)) > 1
    ).order_by(func.sum(Generator.nameplate_capacity_mw).desc()).all()
    
    interstate_operators = []
    for operator in interstate_operators_query:
        va_capacity = float(operator.va_capacity_mw or 0)
        total_capacity = float(operator.total_capacity_mw or 0)
        va_percentage = (va_capacity / total_capacity * 100) if total_capacity > 0 else 0
        
        interstate_operators.append({
            'utility_name': operator.utility_name,
            'states_operated': operator.states_operated,
            'state_list': operator.state_list.split(', ') if operator.state_list else [],
            'virginia_capacity_mw': round(va_capacity, 1),
            'total_capacity_mw': round(total_capacity, 1),
            'virginia_percentage': round(va_percentage, 2),
            'regional_significance': 'High' if total_capacity >= 5000 else 'Medium' if total_capacity >= 1000 else 'Local'
        })
    
    return {
        'virginia_overview': {
            'total_capacity_mw': round(float(va_infrastructure_summary.total_capacity_mw or 0), 1),
            'total_generators': va_infrastructure_summary.total_generators,
            'total_utilities': va_infrastructure_summary.total_utilities,
            'counties_with_generation': va_infrastructure_summary.counties_with_generation,
            'total_plants': va_infrastructure_summary.total_plants,
            'technology_diversity': va_infrastructure_summary.technology_types,
            'infrastructure_age': {
                'oldest_facility_year': va_infrastructure_summary.oldest_facility,
                'newest_facility_year': va_infrastructure_summary.newest_facility,
                'infrastructure_span_years': (va_infrastructure_summary.newest_facility or 2025) - (va_infrastructure_summary.oldest_facility or 2025)
            },
            'analysis_includes_neighboring': include_neighboring
        },
        'county_analysis': {
            'total_counties_analyzed': len(virginia_counties),
            'counties': virginia_counties[:25] if county_detail else [],  # Top 25 counties by capacity
            'most_energy_dense_county': virginia_counties[0] if virginia_counties else None,
            'county_concentration': {
                'top_5_counties_share_percent': round(
                    sum(c['total_capacity_mw'] for c in virginia_counties[:5]) / 
                    sum(c['total_capacity_mw'] for c in virginia_counties) * 100, 2
                ) if virginia_counties else 0
            }
        },
        'service_territories': {
            'virginia_utilities': service_territories,
            'statewide_operators': [s for s in service_territories if s['geographic_footprint'] == 'Statewide'],
            'regional_operators': [s for s in service_territories if s['geographic_footprint'] == 'Regional'],
            'local_operators': [s for s in service_territories if s['geographic_footprint'] in ['Multi-county', 'Local']]
        },
        'interstate_connections': {
            'operators': interstate_operators,
            'total_interstate_operators': len(interstate_operators),
            'neighboring_utilities': neighboring_utilities if include_neighboring else [],
            'regional_integration_score': min(100, len(interstate_operators) * 10)  # Simple scoring
        },
        'geographic_insights': {
            'market_fragmentation': 'High' if va_infrastructure_summary.total_utilities > 20 else 'Medium' if va_infrastructure_summary.total_utilities > 10 else 'Low',
            'geographic_coverage': f"{va_infrastructure_summary.counties_with_generation} of 95 Virginia counties",
            'infrastructure_maturity': 'Mature' if (va_infrastructure_summary.newest_facility or 2025) - (va_infrastructure_summary.oldest_facility or 2025) > 50 else 'Developing',
            'regional_connectivity': 'High' if len(interstate_operators) >= 5 else 'Medium' if len(interstate_operators) >= 2 else 'Limited'
        }
    }