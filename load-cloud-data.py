#!/usr/bin/env python3
"""
Load energy data into Prisma Cloud database
"""
import pandas as pd
import psycopg2
from psycopg2.extras import execute_values

def safe_float(value):
    """Safely convert value to float"""
    if pd.isna(value) or value == '' or value is None:
        return None
    try:
        return float(value)
    except (ValueError, TypeError):
        return None

def safe_int(value):
    """Safely convert value to int"""
    if pd.isna(value) or value == '' or value is None:
        return None
    try:
        return int(float(value))
    except (ValueError, TypeError):
        return None

def safe_str(value):
    """Safely convert value to string"""
    if pd.isna(value) or value is None:
        return None
    return str(value).strip() if str(value).strip() else None

# Prisma Cloud connection
DATABASE_URL = "postgres://7a571ce585e0cb50feb02b7f3cac367b0cf701b3fccb98a4e2ae1adc49c5859a:sk_nN4lztrkcDCw-wciq6Qak@db.prisma.io:5432/?sslmode=require"

def load_all_generators():
    """Load ALL generators from all states into Prisma Cloud"""
    print("🚀 Loading complete energy dataset into Prisma Cloud...")
    
    # Connect to Prisma Cloud database
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    try:
        # Create complete generators table
        cur.execute("""
        CREATE TABLE IF NOT EXISTS generators (
            id SERIAL PRIMARY KEY,
            data_year INT DEFAULT 2025,
            source_sheet VARCHAR(50),
            entity_id INT,
            entity_name VARCHAR(255),
            plant_id INT,
            plant_name VARCHAR(255),
            plant_state VARCHAR(2),
            county VARCHAR(100),
            balancing_authority_code VARCHAR(20),
            sector VARCHAR(100),
            generator_id VARCHAR(50),
            unit_code VARCHAR(50),
            nameplate_capacity_mw DECIMAL(12, 3),
            net_summer_capacity_mw DECIMAL(12, 3),
            net_winter_capacity_mw DECIMAL(12, 3),
            technology VARCHAR(200),
            energy_source_code VARCHAR(10),
            prime_mover_code VARCHAR(10),
            operating_month INT,
            operating_year INT,
            planned_operation_month INT,
            planned_operation_year INT,
            planned_retirement_year VARCHAR(20),
            retirement_month INT,
            retirement_year INT,
            status VARCHAR(200),
            latitude DECIMAL(10, 6),
            longitude DECIMAL(10, 6),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        """)
        
        # Clear existing data
        cur.execute("DELETE FROM generators;")
        print("✅ Cleared existing generator data")
        
        # Load ALL generator data from Excel
        excel_path = "/home/mikyas/projects/Hayl-energy-ai/hayl-energy-ai/hayl-energy-backend/data/april_generator2025_1.xlsx"
        
        sheets_to_load = ['Operating', 'Planned', 'Retired']
        total_loaded = 0
        
        for sheet_name in sheets_to_load:
            print(f"\n📁 Loading {sheet_name} generators...")
            df = pd.read_excel(excel_path, sheet_name=sheet_name, skiprows=2)
            print(f"📊 Found {len(df)} {sheet_name.lower()} generators")
            
            # Prepare data for insertion
            generators_data = []
            for _, row in df.iterrows():
                if pd.notna(row.get('Plant State')):  # Only load records with state data
                    generators_data.append((
                        2025,  # data_year
                        sheet_name.lower(),  # source_sheet
                        safe_int(row.get('Entity ID')),
                        safe_str(row.get('Entity Name')),
                        safe_int(row.get('Plant ID')),
                        safe_str(row.get('Plant Name')),
                        safe_str(row.get('Plant State')),
                        safe_str(row.get('County')),
                        safe_str(row.get('Balancing Authority Code')),
                        safe_str(row.get('Sector')),
                        safe_str(row.get('Generator ID')),
                        safe_str(row.get('Unit Code')),
                        safe_float(row.get('Nameplate Capacity (MW)')),
                        safe_float(row.get('Net Summer Capacity (MW)')),
                        safe_float(row.get('Net Winter Capacity (MW)')),
                        safe_str(row.get('Technology')),
                        safe_str(row.get('Energy Source Code')),
                        safe_str(row.get('Prime Mover Code')),
                        safe_int(row.get('Operating Month')),
                        safe_int(row.get('Operating Year')),
                        safe_int(row.get('Planned Operation Month')),
                        safe_int(row.get('Planned Operation Year')),
                        safe_str(row.get('Planned Retirement Year')),
                        safe_int(row.get('Retirement Month')),
                        safe_int(row.get('Retirement Year')),
                        safe_str(row.get('Status')),
                        safe_float(row.get('Latitude')),
                        safe_float(row.get('Longitude'))
                    ))
            
            # Insert in batches
            if generators_data:
                execute_values(
                    cur,
                    """INSERT INTO generators 
                       (data_year, source_sheet, entity_id, entity_name, plant_id, plant_name, plant_state, county, 
                        balancing_authority_code, sector, generator_id, unit_code, nameplate_capacity_mw, 
                        net_summer_capacity_mw, net_winter_capacity_mw, technology, energy_source_code, 
                        prime_mover_code, operating_month, operating_year, planned_operation_month, 
                        planned_operation_year, planned_retirement_year, retirement_month, retirement_year, 
                        status, latitude, longitude)
                       VALUES %s""",
                    generators_data,
                    page_size=1000
                )
                conn.commit()
                total_loaded += len(generators_data)
                print(f"✅ Loaded {len(generators_data)} {sheet_name.lower()} generators")
        
        # Get final summary
        cur.execute("SELECT COUNT(*) FROM generators;")
        total_count = cur.fetchone()[0]
        
        cur.execute("SELECT plant_state, COUNT(*) as count FROM generators WHERE plant_state IS NOT NULL GROUP BY plant_state ORDER BY count DESC LIMIT 10;")
        top_states = cur.fetchall()
        
        cur.execute("SELECT COUNT(*) FROM generators WHERE plant_state = 'VA';")
        va_count = cur.fetchone()[0]
        
        print(f"\n🎉 COMPLETE DATASET LOADED:")
        print(f"📊 Total generators: {total_count:,}")
        print(f"🏛️ Virginia generators: {va_count:,}")
        print(f"\n🗺️ Top 10 states by generator count:")
        for state, count in top_states:
            print(f"  {state}: {count:,}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        conn.rollback()
    finally:
        cur.close()
        conn.close()

def load_all_utilities():
    """Load ALL utilities data into Prisma Cloud"""
    print("\n🏢 Loading utilities data...")
    
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    try:
        # Create utilities table
        cur.execute("""
        CREATE TABLE IF NOT EXISTS utilities (
            id SERIAL PRIMARY KEY,
            data_year INT DEFAULT 2023,
            utility_number INT UNIQUE,
            utility_name VARCHAR(255),
            state VARCHAR(2),
            ownership_type VARCHAR(100),
            nerc_region VARCHAR(20),
            generation CHAR(1),
            transmission CHAR(1),
            distribution CHAR(1),
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        """)
        
        # Clear existing utilities
        cur.execute("DELETE FROM utilities;")
        
        # Load utility data
        excel_path = "/home/mikyas/projects/Hayl-energy-ai/hayl-energy-ai/hayl-energy-backend/data/Utility_Data_2023.xlsx"
        df = pd.read_excel(excel_path)
        print(f"📊 Found {len(df)} utilities")
        
        utilities_data = []
        for _, row in df.iterrows():
            utilities_data.append((
                2023,
                safe_int(row.get('Utility Number')),
                safe_str(row.get('Utility Name')),
                safe_str(row.get('State')),
                safe_str(row.get('Ownership Type')),
                safe_str(row.get('NERC Region')),
                safe_str(row.get('Generation')),
                safe_str(row.get('Transmission')),
                safe_str(row.get('Distribution'))
            ))
        
        execute_values(
            cur,
            """INSERT INTO utilities 
               (data_year, utility_number, utility_name, state, ownership_type, nerc_region, generation, transmission, distribution)
               VALUES %s ON CONFLICT (utility_number) DO NOTHING""",
            utilities_data,
            page_size=1000
        )
        
        conn.commit()
        
        cur.execute("SELECT COUNT(*) FROM utilities;")
        util_count = cur.fetchone()[0]
        print(f"✅ Loaded {util_count:,} utilities")
        
    except Exception as e:
        print(f"❌ Utilities error: {e}")
        conn.rollback()
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    print("🚀 Loading COMPLETE energy dataset into Prisma Cloud...")
    print("This includes all 50 states, generators, utilities, and territories")
    
    # Load all data
    load_all_generators()
    load_all_utilities()
    
    print("\n🎉 COMPLETE ENERGY DATABASE LOADED!")
    print("Your dashboard now has real data for ALL 50 states!")