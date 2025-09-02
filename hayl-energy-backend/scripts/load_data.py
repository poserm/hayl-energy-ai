#!/usr/bin/env python3
"""
Data Loading Script for Hayl Energy AI Backend

This script loads data from Excel files into the PostgreSQL database.
It processes generator data, utility information, and service territory data.
"""

import os
import sys
import pandas as pd
from pathlib import Path
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from tqdm import tqdm
import logging

# Add the app directory to Python path
sys.path.append(str(Path(__file__).parent.parent / "app"))

from database import DATABASE_URL, Base
from models import Generator, Utility, ServiceTerritory, UtilitySales, OperationalData

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class DataLoader:
    def __init__(self, database_url: str = None):
        self.database_url = database_url or DATABASE_URL
        self.engine = create_engine(self.database_url)
        self.SessionLocal = sessionmaker(bind=self.engine)
        
    def create_tables(self):
        """Create database tables"""
        logger.info("Creating database tables...")
        Base.metadata.create_all(bind=self.engine)
        logger.info("✅ Database tables created")

    def load_generator_data(self, excel_path: str):
        """Load generator data from Excel file"""
        logger.info(f"Loading generator data from {excel_path}")
        
        if not os.path.exists(excel_path):
            logger.error(f"File not found: {excel_path}")
            return
        
        try:
            # Read all sheets from the Excel file
            excel_file = pd.ExcelFile(excel_path)
            logger.info(f"Found sheets: {excel_file.sheet_names}")
            
            db = self.SessionLocal()
            
            for sheet_name in excel_file.sheet_names:
                if any(keyword in sheet_name.lower() for keyword in ['operating', 'planned', 'retired']):
                    logger.info(f"Processing sheet: {sheet_name}")
                    
                    # Read the sheet (skip first 2 header rows)
                    df = pd.read_excel(excel_path, sheet_name=sheet_name, skiprows=2)
                    logger.info(f"Loaded {len(df)} rows from {sheet_name}")
                    
                    # Determine source sheet type
                    if 'operating' in sheet_name.lower():
                        source_sheet = 'operating'
                    elif 'planned' in sheet_name.lower():
                        source_sheet = 'planned'
                    elif 'retired' in sheet_name.lower():
                        source_sheet = 'retired'
                    else:
                        source_sheet = 'unknown'
                    
                    # Process in chunks for better memory management
                    chunk_size = 1000
                    for i in tqdm(range(0, len(df), chunk_size), desc=f"Processing {sheet_name}"):
                        chunk = df.iloc[i:i+chunk_size]
                        self._process_generator_chunk(db, chunk, source_sheet)
            
            db.commit()
            db.close()
            logger.info("✅ Generator data loaded successfully")
            
        except Exception as e:
            logger.error(f"Error loading generator data: {e}")
            db.rollback()
            db.close()
            
    def _process_generator_chunk(self, db, df_chunk, source_sheet):
        """Process a chunk of generator data"""
        for _, row in df_chunk.iterrows():
            try:
                generator = Generator(
                    source_sheet=source_sheet,
                    entity_id=self._safe_int(row.get('Entity ID')),
                    entity_name=self._safe_str(row.get('Entity Name')),
                    plant_id=self._safe_int(row.get('Plant ID')),
                    plant_name=self._safe_str(row.get('Plant Name')),
                    plant_state=self._safe_str(row.get('Plant State')),
                    county=self._safe_str(row.get('County')),
                    balancing_authority_code=self._safe_str(row.get('Balancing Authority Code')),
                    sector=self._safe_str(row.get('Sector')),
                    generator_id=self._safe_str(row.get('Generator ID')),
                    unit_code=self._safe_str(row.get('Unit Code')),
                    nameplate_capacity_mw=self._safe_float(row.get('Nameplate Capacity (MW)')),
                    net_summer_capacity_mw=self._safe_float(row.get('Net Summer Capacity (MW)')),
                    net_winter_capacity_mw=self._safe_float(row.get('Net Winter Capacity (MW)')),
                    technology=self._safe_str(row.get('Technology')),
                    energy_source_code=self._safe_str(row.get('Energy Source Code')),
                    prime_mover_code=self._safe_str(row.get('Prime Mover Code')),
                    operating_month=self._safe_int(row.get('Operating Month')),
                    operating_year=self._safe_int(row.get('Operating Year')),
                    planned_operation_month=self._safe_int(row.get('Planned Operation Month')),
                    planned_operation_year=self._safe_int(row.get('Planned Operation Year')),
                    planned_retirement_year=self._safe_str(row.get('Planned Retirement Year')),
                    retirement_month=self._safe_int(row.get('Retirement Month')),
                    retirement_year=self._safe_int(row.get('Retirement Year')),
                    status=self._safe_str(row.get('Status')),
                    latitude=self._safe_float(row.get('Latitude')),
                    longitude=self._safe_float(row.get('Longitude'))
                )
                
                db.add(generator)
                
            except Exception as e:
                logger.warning(f"Error processing generator row: {e}")
                continue
                
    def load_utility_data(self, excel_path: str):
        """Load utility data from Excel file"""
        logger.info(f"Loading utility data from {excel_path}")
        
        if not os.path.exists(excel_path):
            logger.error(f"File not found: {excel_path}")
            return
            
        try:
            df = pd.read_excel(excel_path)
            logger.info(f"Loaded {len(df)} utility records")
            
            db = self.SessionLocal()
            
            for _, row in tqdm(df.iterrows(), total=len(df), desc="Processing utilities"):
                try:
                    utility = Utility(
                        utility_number=self._safe_int(row.get('Utility Number')),
                        utility_name=self._safe_str(row.get('Utility Name')),
                        state=self._safe_str(row.get('State')),
                        ownership_type=self._safe_str(row.get('Ownership Type')),
                        nerc_region=self._safe_str(row.get('NERC Region')),
                        # Add other utility fields as needed
                        generation=self._safe_str(row.get('Generation')),
                        transmission=self._safe_str(row.get('Transmission')),
                        distribution=self._safe_str(row.get('Distribution'))
                    )
                    
                    db.add(utility)
                    
                except Exception as e:
                    logger.warning(f"Error processing utility row: {e}")
                    continue
            
            db.commit()
            db.close()
            logger.info("✅ Utility data loaded successfully")
            
        except Exception as e:
            logger.error(f"Error loading utility data: {e}")
    
    def load_service_territory_data(self, excel_path: str):
        """Load service territory data from Excel file"""
        logger.info(f"Loading service territory data from {excel_path}")
        
        if not os.path.exists(excel_path):
            logger.error(f"File not found: {excel_path}")
            return
            
        try:
            df = pd.read_excel(excel_path)
            logger.info(f"Loaded {len(df)} service territory records")
            
            db = self.SessionLocal()
            
            for _, row in tqdm(df.iterrows(), total=len(df), desc="Processing service territories"):
                try:
                    territory = ServiceTerritory(
                        utility_number=self._safe_int(row.get('Utility Number')),
                        utility_name=self._safe_str(row.get('Utility Name')),
                        state=self._safe_str(row.get('State')),
                        county=self._safe_str(row.get('County'))
                    )
                    
                    db.add(territory)
                    
                except Exception as e:
                    logger.warning(f"Error processing service territory row: {e}")
                    continue
            
            db.commit()
            db.close()
            logger.info("✅ Service territory data loaded successfully")
            
        except Exception as e:
            logger.error(f"Error loading service territory data: {e}")

    def _safe_str(self, value):
        """Safely convert value to string"""
        if pd.isna(value):
            return None
        return str(value).strip() if str(value).strip() else None
    
    def _safe_int(self, value):
        """Safely convert value to integer"""
        if pd.isna(value):
            return None
        try:
            return int(float(value))
        except (ValueError, TypeError):
            return None
    
    def _safe_float(self, value):
        """Safely convert value to float"""
        if pd.isna(value):
            return None
        try:
            return float(value)
        except (ValueError, TypeError):
            return None
    
    def get_data_summary(self):
        """Get summary of loaded data"""
        logger.info("Getting data summary...")
        
        db = self.SessionLocal()
        
        try:
            generator_count = db.query(Generator).count()
            utility_count = db.query(Utility).count()
            territory_count = db.query(ServiceTerritory).count()
            
            # Virginia-specific stats
            va_generator_count = db.query(Generator).filter(Generator.plant_state == 'VA').count()
            
            # Operating vs planned vs retired
            operating_count = db.query(Generator).filter(Generator.source_sheet == 'operating').count()
            planned_count = db.query(Generator).filter(Generator.source_sheet == 'planned').count()
            retired_count = db.query(Generator).filter(Generator.source_sheet == 'retired').count()
            
            logger.info(f"""
            📊 DATA SUMMARY:
            ================
            Total Generators: {generator_count:,}
            - Operating: {operating_count:,}
            - Planned: {planned_count:,}
            - Retired: {retired_count:,}
            
            Virginia Generators: {va_generator_count:,}
            Total Utilities: {utility_count:,}
            Service Territories: {territory_count:,}
            """)
            
        except Exception as e:
            logger.error(f"Error getting data summary: {e}")
        finally:
            db.close()

def main():
    """Main data loading function"""
    # Define data paths - adjust these paths to match your data location
    data_directory = Path(__file__).parent.parent / "data"
    
    # Expected data files (copy from original database project)
    generator_file = data_directory / "april_generator2025_1.xlsx"
    utility_file = data_directory / "Utility_Data_2023.xlsx"
    territory_file = data_directory / "Service_Territory_2023.xlsx"
    sales_file = data_directory / "Sales_Ult_Cust_2023.xlsx"
    operational_file = data_directory / "Operational_Data_2023.xlsx"
    
    logger.info("🚀 Starting Hayl Energy AI Data Loading Process")
    logger.info(f"Data directory: {data_directory}")
    
    # Initialize data loader
    loader = DataLoader()
    
    # Create tables
    loader.create_tables()
    
    # Load data files
    if generator_file.exists():
        logger.info("📁 Loading generator data...")
        loader.load_generator_data(str(generator_file))
    else:
        logger.warning(f"Generator file not found: {generator_file}")
    
    if utility_file.exists():
        logger.info("📁 Loading utility data...")
        loader.load_utility_data(str(utility_file))
    else:
        logger.warning(f"Utility file not found: {utility_file}")
        
    if territory_file.exists():
        logger.info("📁 Loading service territory data...")
        loader.load_service_territory_data(str(territory_file))
    else:
        logger.warning(f"Service territory file not found: {territory_file}")
    
    # Get summary
    loader.get_data_summary()
    
    logger.info("✅ Data loading process completed!")
    logger.info("""
    🚀 Next Steps:
    ==============
    1. Start the FastAPI server: uvicorn main:app --reload
    2. Visit http://localhost:8000/docs for API documentation
    3. Test Virginia utilities: http://localhost:8000/api/v1/virginia/utilities
    4. Check market overview: http://localhost:8000/api/v1/analytics/market-overview
    """)

if __name__ == "__main__":
    main()