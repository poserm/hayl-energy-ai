from fastapi import APIRouter, Depends, Query, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import func, distinct, and_, or_, text
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

from database import get_db
from models import Generator, Utility, ServiceTerritory, UtilitySales, OperationalData, User
from auth import get_current_user_optional

router = APIRouter(prefix="/utilities", tags=["Utility Operations"])

class UtilityComparison(BaseModel):
    utility_name: str
    state: str
    total_capacity_mw: float
    technology_diversity: int
    dominant_technology: str
    clean_energy_percentage: float
    operational_years: int

@router.get("/{utility_id}/profile")
async def get_utility_profile(
    utility_id: str,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Get comprehensive utility profile and analysis"""
    
    try:
        state_code, name_hash = utility_id.split('_')
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid utility ID format")
    
    # Get all utilities in the state to find the match
    utility_query = db.query(
        Generator.entity_name.label('utility_name'),
        Generator.plant_state.label('state'),
        Generator.sector.label('ownership_type'),
        func.count(Generator.id).label('total_generators'),
        func.sum(Generator.nameplate_capacity_mw).label('total_capacity_mw'),
        func.count(func.distinct(Generator.technology)).label('technology_diversity'),
        func.count(func.distinct(Generator.plant_name)).label('total_plants'),
        func.count(func.distinct(Generator.county)).label('counties_served'),
        func.min(Generator.operating_year).label('first_operation_year'),
        func.max(Generator.operating_year).label('latest_operation_year'),
        func.avg(Generator.nameplate_capacity_mw).label('avg_generator_size_mw'),
        func.string_agg(func.distinct(Generator.technology), ', ').label('technologies')
    ).filter(
        Generator.entity_name.isnot(None),
        Generator.plant_state == state_code.upper(),
        Generator.source_sheet == 'operating'
    ).group_by(
        Generator.entity_name,
        Generator.plant_state,
        Generator.sector
    ).all()
    
    # Find matching utility
    matching_utility = None
    for util in utility_query:
        if str(abs(hash(util.utility_name)) % 100000) == name_hash:
            matching_utility = util
            break
    
    if not matching_utility:
        raise HTTPException(status_code=404, detail="Utility not found")
    
    utility_name = matching_utility.utility_name
    total_capacity = float(matching_utility.total_capacity_mw or 0)
    
    # Get detailed plant information
    plants_query = db.query(
        Generator.plant_name,
        Generator.county,
        func.count(Generator.id).label('generator_count'),
        func.sum(Generator.nameplate_capacity_mw).label('plant_capacity_mw'),
        func.string_agg(func.distinct(Generator.technology), ', ').label('technologies'),
        func.min(Generator.operating_year).label('oldest_generator'),
        func.max(Generator.operating_year).label('newest_generator'),
        func.avg(Generator.latitude).label('avg_latitude'),
        func.avg(Generator.longitude).label('avg_longitude')
    ).filter(
        Generator.entity_name == utility_name,
        Generator.plant_state == state_code.upper(),
        Generator.source_sheet == 'operating'
    ).group_by(
        Generator.plant_name,
        Generator.county
    ).order_by(
        func.sum(Generator.nameplate_capacity_mw).desc()
    ).all()
    
    # Get year-over-year capacity additions
    capacity_timeline = db.query(
        Generator.operating_year,
        func.count(Generator.id).label('generators_added'),
        func.sum(Generator.nameplate_capacity_mw).label('capacity_added_mw'),
        func.string_agg(func.distinct(Generator.technology), ', ').label('technologies_added')
    ).filter(
        Generator.entity_name == utility_name,
        Generator.plant_state == state_code.upper(),
        Generator.source_sheet == 'operating',
        Generator.operating_year.isnot(None)
    ).group_by(
        Generator.operating_year
    ).order_by(Generator.operating_year).all()
    
    # Calculate market position
    state_utilities = db.query(
        Generator.entity_name,
        func.sum(Generator.nameplate_capacity_mw).label('capacity')
    ).filter(
        Generator.plant_state == state_code.upper(),
        Generator.source_sheet == 'operating',
        Generator.nameplate_capacity_mw.isnot(None)
    ).group_by(Generator.entity_name).order_by(
        func.sum(Generator.nameplate_capacity_mw).desc()
    ).all()
    
    utility_rank = next((i + 1 for i, util in enumerate(state_utilities) 
                        if util.entity_name == utility_name), 0)
    
    state_total_capacity = sum(float(u.capacity or 0) for u in state_utilities)
    market_share = (total_capacity / state_total_capacity * 100) if state_total_capacity > 0 else 0
    
    return {
        "utility_info": {
            "id": utility_id,
            "utility_name": utility_name,
            "state": state_code.upper(),
            "ownership_type": matching_utility.ownership_type,
            "total_capacity_mw": total_capacity,
            "total_generators": matching_utility.total_generators,
            "total_plants": matching_utility.total_plants,
            "counties_served": matching_utility.counties_served,
            "technology_diversity": matching_utility.technology_diversity,
            "avg_generator_size_mw": round(float(matching_utility.avg_generator_size_mw or 0), 1),
            "operational_span": {
                "first_operation_year": matching_utility.first_operation_year,
                "latest_operation_year": matching_utility.latest_operation_year,
                "years_in_operation": (matching_utility.latest_operation_year or 2025) - (matching_utility.first_operation_year or 2025)
            }
        },
        "market_position": {
            "state_ranking": utility_rank,
            "market_share_percent": round(market_share, 2),
            "total_state_utilities": len(state_utilities),
            "competitive_tier": (
                "dominant" if market_share >= 25 else
                "major" if market_share >= 10 else
                "regional" if market_share >= 5 else
                "local"
            )
        },
        "facilities": [
            {
                "plant_name": plant.plant_name,
                "county": plant.county,
                "capacity_mw": round(float(plant.plant_capacity_mw or 0), 1),
                "generator_count": plant.generator_count,
                "technologies": plant.technologies,
                "vintage_range": {
                    "oldest": plant.oldest_generator,
                    "newest": plant.newest_generator
                },
                "location": {
                    "latitude": round(float(plant.avg_latitude or 0), 4),
                    "longitude": round(float(plant.avg_longitude or 0), 4)
                }
            }
            for plant in plants_query[:20]  # Top 20 plants
        ],
        "capacity_development": [
            {
                "year": timeline.operating_year,
                "generators_added": timeline.generators_added,
                "capacity_added_mw": round(float(timeline.capacity_added_mw or 0), 1),
                "technologies": timeline.technologies_added
            }
            for timeline in capacity_timeline
        ]
    }

@router.get("/{utility_id}/technology-mix")
async def get_utility_technology_mix(
    utility_id: str,
    include_planned: bool = Query(False, description="Include planned generators"),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Get detailed technology mix breakdown for a utility"""
    
    try:
        state_code, name_hash = utility_id.split('_')
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid utility ID format")
    
    # Find utility name
    utility_query = db.query(Generator.entity_name).filter(
        Generator.plant_state == state_code.upper()
    ).group_by(Generator.entity_name).all()
    
    utility_name = None
    for util in utility_query:
        if str(abs(hash(util.entity_name)) % 100000) == name_hash:
            utility_name = util.entity_name
            break
    
    if not utility_name:
        raise HTTPException(status_code=404, detail="Utility not found")
    
    # Build filter conditions
    filter_conditions = [
        Generator.entity_name == utility_name,
        Generator.plant_state == state_code.upper(),
        Generator.technology.isnot(None),
        Generator.nameplate_capacity_mw.isnot(None)
    ]
    
    if include_planned:
        filter_conditions.append(Generator.source_sheet.in_(['operating', 'planned']))
    else:
        filter_conditions.append(Generator.source_sheet == 'operating')
    
    # Get technology breakdown
    tech_mix_query = db.query(
        Generator.technology,
        Generator.energy_source_code,
        Generator.prime_mover_code,
        func.count(Generator.id).label('unit_count'),
        func.sum(Generator.nameplate_capacity_mw).label('total_capacity_mw'),
        func.avg(Generator.nameplate_capacity_mw).label('avg_unit_size_mw'),
        func.min(Generator.nameplate_capacity_mw).label('min_unit_size_mw'),
        func.max(Generator.nameplate_capacity_mw).label('max_unit_size_mw'),
        func.min(Generator.operating_year).label('oldest_unit_year'),
        func.max(Generator.operating_year).label('newest_unit_year'),
        func.count(func.distinct(Generator.plant_name)).label('plants_with_technology')
    ).filter(and_(*filter_conditions)).group_by(
        Generator.technology,
        Generator.energy_source_code,
        Generator.prime_mover_code
    ).order_by(
        func.sum(Generator.nameplate_capacity_mw).desc()
    ).all()
    
    total_capacity = sum(float(tech.total_capacity_mw or 0) for tech in tech_mix_query)
    
    # Energy source categories for analysis
    renewable_sources = ['SUN', 'WND', 'WAT', 'GEO', 'BIO', 'WAS']
    fossil_sources = ['NG', 'COL', 'PET', 'OIL', 'GAS']
    nuclear_sources = ['NUC']
    
    def categorize_energy_source(source_code: str) -> str:
        if not source_code:
            return "Unknown"
        if source_code in renewable_sources:
            return "Renewable"
        elif source_code in fossil_sources:
            return "Fossil"
        elif source_code in nuclear_sources:
            return "Nuclear"
        else:
            return "Other"
    
    # Process technology mix data
    technology_breakdown = []
    category_totals = {"Renewable": 0, "Fossil": 0, "Nuclear": 0, "Other": 0}
    
    for tech in tech_mix_query:
        capacity_mw = float(tech.total_capacity_mw or 0)
        percentage = (capacity_mw / total_capacity * 100) if total_capacity > 0 else 0
        category = categorize_energy_source(tech.energy_source_code)
        category_totals[category] += capacity_mw
        
        tech_data = {
            "technology": tech.technology,
            "energy_source_code": tech.energy_source_code,
            "prime_mover_code": tech.prime_mover_code,
            "category": category,
            "capacity_mw": round(capacity_mw, 1),
            "percentage_of_portfolio": round(percentage, 2),
            "unit_count": tech.unit_count,
            "plants_with_technology": tech.plants_with_technology,
            "unit_size_stats": {
                "average_mw": round(float(tech.avg_unit_size_mw or 0), 1),
                "minimum_mw": round(float(tech.min_unit_size_mw or 0), 1),
                "maximum_mw": round(float(tech.max_unit_size_mw or 0), 1)
            },
            "vintage": {
                "oldest_unit": tech.oldest_unit_year,
                "newest_unit": tech.newest_unit_year,
                "age_span_years": (tech.newest_unit_year or 2025) - (tech.oldest_unit_year or 2025) if tech.oldest_unit_year else 0
            }
        }
        technology_breakdown.append(tech_data)
    
    # Calculate category percentages
    category_percentages = {
        category: round((capacity / total_capacity * 100), 2) if total_capacity > 0 else 0
        for category, capacity in category_totals.items()
    }
    
    return {
        "utility_id": utility_id,
        "total_capacity_mw": round(total_capacity, 1),
        "technology_count": len(technology_breakdown),
        "includes_planned": include_planned,
        "energy_portfolio_summary": {
            "renewable_percentage": category_percentages["Renewable"],
            "fossil_percentage": category_percentages["Fossil"],
            "nuclear_percentage": category_percentages["Nuclear"],
            "other_percentage": category_percentages["Other"],
            "clean_energy_percentage": category_percentages["Renewable"] + category_percentages["Nuclear"]
        },
        "category_breakdown": {
            category: {
                "capacity_mw": round(capacity, 1),
                "percentage": category_percentages[category]
            }
            for category, capacity in category_totals.items()
        },
        "technology_details": technology_breakdown,
        "portfolio_analysis": {
            "diversified": len(technology_breakdown) >= 5,
            "renewable_leader": category_percentages["Renewable"] >= 50,
            "fossil_dependent": category_percentages["Fossil"] >= 70,
            "nuclear_operator": category_percentages["Nuclear"] > 0,
            "dominant_technology": technology_breakdown[0]["technology"] if technology_breakdown else "None"
        }
    }

@router.post("/compare")
async def compare_utilities(
    utility_ids: List[str] = Query(..., description="List of utility IDs to compare"),
    metrics: List[str] = Query(["capacity", "technology_mix", "efficiency"], description="Comparison metrics"),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Compare multiple utilities across various metrics"""
    
    if len(utility_ids) < 2:
        raise HTTPException(status_code=400, detail="At least 2 utilities required for comparison")
    
    if len(utility_ids) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 utilities can be compared at once")
    
    utilities_data = []
    
    for utility_id in utility_ids:
        try:
            state_code, name_hash = utility_id.split('_')
        except ValueError:
            continue  # Skip invalid IDs
        
        # Get utility basic info
        utility_query = db.query(
            Generator.entity_name.label('utility_name'),
            Generator.plant_state.label('state'),
            Generator.sector.label('ownership_type'),
            func.count(Generator.id).label('total_generators'),
            func.sum(Generator.nameplate_capacity_mw).label('total_capacity_mw'),
            func.count(func.distinct(Generator.technology)).label('technology_diversity'),
            func.count(func.distinct(Generator.plant_name)).label('total_plants'),
            func.min(Generator.operating_year).label('first_operation_year'),
            func.max(Generator.operating_year).label('latest_operation_year')
        ).filter(
            Generator.entity_name.isnot(None),
            Generator.plant_state == state_code.upper(),
            Generator.source_sheet == 'operating'
        ).group_by(
            Generator.entity_name,
            Generator.plant_state,
            Generator.sector
        ).all()
        
        # Find matching utility
        matching_utility = None
        for util in utility_query:
            if str(abs(hash(util.utility_name)) % 100000) == name_hash:
                matching_utility = util
                break
        
        if not matching_utility:
            continue  # Skip not found utilities
        
        utility_name = matching_utility.utility_name
        total_capacity = float(matching_utility.total_capacity_mw or 0)
        
        # Get technology mix for clean energy percentage
        tech_query = db.query(
            Generator.energy_source_code,
            func.sum(Generator.nameplate_capacity_mw).label('capacity')
        ).filter(
            Generator.entity_name == utility_name,
            Generator.plant_state == state_code.upper(),
            Generator.source_sheet == 'operating',
            Generator.energy_source_code.isnot(None)
        ).group_by(Generator.energy_source_code).all()
        
        # Calculate clean energy percentage
        clean_sources = ['SUN', 'WND', 'WAT', 'GEO', 'BIO', 'WAS', 'NUC']
        clean_capacity = sum(float(tech.capacity or 0) for tech in tech_query 
                           if tech.energy_source_code in clean_sources)
        clean_percentage = (clean_capacity / total_capacity * 100) if total_capacity > 0 else 0
        
        # Get dominant technology
        dominant_tech_query = db.query(
            Generator.technology,
            func.sum(Generator.nameplate_capacity_mw).label('capacity')
        ).filter(
            Generator.entity_name == utility_name,
            Generator.plant_state == state_code.upper(),
            Generator.source_sheet == 'operating'
        ).group_by(Generator.technology).order_by(
            func.sum(Generator.nameplate_capacity_mw).desc()
        ).first()
        
        dominant_technology = dominant_tech_query.technology if dominant_tech_query else "Unknown"
        
        utilities_data.append({
            "utility_id": utility_id,
            "utility_name": utility_name,
            "state": state_code.upper(),
            "ownership_type": matching_utility.ownership_type,
            "total_capacity_mw": round(total_capacity, 1),
            "total_generators": matching_utility.total_generators,
            "total_plants": matching_utility.total_plants,
            "technology_diversity": matching_utility.technology_diversity,
            "clean_energy_percentage": round(clean_percentage, 2),
            "dominant_technology": dominant_technology,
            "operational_span": {
                "years": (matching_utility.latest_operation_year or 2025) - (matching_utility.first_operation_year or 2025),
                "first_year": matching_utility.first_operation_year,
                "latest_year": matching_utility.latest_operation_year
            },
            "efficiency_metrics": {
                "avg_plant_size_mw": round(total_capacity / matching_utility.total_plants, 1) if matching_utility.total_plants > 0 else 0,
                "avg_generator_size_mw": round(total_capacity / matching_utility.total_generators, 1) if matching_utility.total_generators > 0 else 0
            }
        })
    
    if not utilities_data:
        raise HTTPException(status_code=404, detail="No valid utilities found for comparison")
    
    # Generate comparison insights
    max_capacity = max(util["total_capacity_mw"] for util in utilities_data)
    max_diversity = max(util["technology_diversity"] for util in utilities_data)
    max_clean = max(util["clean_energy_percentage"] for util in utilities_data)
    
    comparison_insights = {
        "largest_utility": next(util for util in utilities_data if util["total_capacity_mw"] == max_capacity),
        "most_diverse": next(util for util in utilities_data if util["technology_diversity"] == max_diversity),
        "cleanest_portfolio": next(util for util in utilities_data if util["clean_energy_percentage"] == max_clean),
        "total_combined_capacity_mw": sum(util["total_capacity_mw"] for util in utilities_data),
        "capacity_range": {
            "min_mw": min(util["total_capacity_mw"] for util in utilities_data),
            "max_mw": max_capacity,
            "ratio": round(max_capacity / min(util["total_capacity_mw"] for util in utilities_data), 1)
        },
        "geographic_spread": len(set(util["state"] for util in utilities_data))
    }
    
    return {
        "comparison_id": f"comp_{len(utility_ids)}_{hash(''.join(utility_ids)) % 10000}",
        "utilities": utilities_data,
        "insights": comparison_insights,
        "metrics_included": metrics,
        "comparison_date": "2025-01-01",  # Current date for API versioning
        "utilities_compared": len(utilities_data)
    }