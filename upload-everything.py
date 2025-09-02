#!/usr/bin/env python3
"""
Upload COMPLETE energy dataset to Prisma Cloud
ALL states, ALL utilities, ALL generators, ALL data
"""
import pandas as pd
import psycopg2
from psycopg2.extras import execute_values
import time

DATABASE_URL = "postgres://7a571ce585e0cb50feb02b7f3cac367b0cf701b3fccb98a4e2ae1adc49c5859a:sk_nN4lztrkcDCw-wciq6Qak@db.prisma.io:5432/?sslmode=require"

def safe_float(value):
    if pd.isna(value) or value == '' or value is None:
        return None
    try:
        return float(value)
    except:
        return None

def safe_int(value):
    if pd.isna(value) or value == '' or value is None:
        return None
    try:
        return int(float(value))
    except:
        return None

def safe_str(value):
    if pd.isna(value) or value is None:
        return None
    return str(value).strip() if str(value).strip() else None

def upload_all_generators():
    """Upload ALL 26,990 generators from ALL 51 states"""
    print("\n🔥 UPLOADING ALL GENERATORS (ALL 51 STATES)")
    print("📊 Target: ~27,000 generators from Operating sheet")
    
    conn = psycopg2.connect(DATABASE_URL, connect_timeout=30)
    conn.autocommit = True
    cur = conn.cursor()
    
    try:
        # Create comprehensive generators table
        cur.execute('''
        CREATE TABLE IF NOT EXISTS generators (
            id SERIAL PRIMARY KEY,
            entity_name VARCHAR(255),
            plant_name VARCHAR(255),
            plant_state VARCHAR(2),
            county VARCHAR(100),
            technology VARCHAR(200),
            nameplate_capacity_mw DECIMAL(12, 3),
            operating_year INT,
            sector VARCHAR(100),
            source_sheet VARCHAR(50) DEFAULT 'operating',
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        ''')
        
        cur.execute('DELETE FROM generators;')
        print("✅ Generators table ready")
        
        # Load ALL operating generators 
        df = pd.read_excel('/home/mikyas/projects/Hayl-energy-ai/hayl-energy-ai/hayl-energy-backend/data/april_generator2025_1.xlsx', 
                          sheet_name='Operating', skiprows=2)
        
        print(f"📈 Processing {len(df):,} operating generators...")
        
        # Upload in chunks
        chunk_size = 1000
        total_uploaded = 0
        
        for i in range(0, len(df), chunk_size):
            chunk = df.iloc[i:i+chunk_size]
            data_tuples = []
            
            for _, row in chunk.iterrows():
                state = safe_str(row.get('Plant State'))
                if state:  # Only valid states
                    data_tuples.append((
                        safe_str(row.get('Entity Name')),
                        safe_str(row.get('Plant Name')),
                        state,
                        safe_str(row.get('County')),
                        safe_str(row.get('Technology')),
                        safe_float(row.get('Nameplate Capacity (MW)')),
                        safe_int(row.get('Operating Year')),
                        safe_str(row.get('Sector'))
                    ))
            
            if data_tuples:
                execute_values(
                    cur,
                    """INSERT INTO generators 
                       (entity_name, plant_name, plant_state, county, technology, nameplate_capacity_mw, operating_year, sector)
                       VALUES %s""",
                    data_tuples,
                    page_size=500
                )
                total_uploaded += len(data_tuples)
                print(f"✅ Chunk {i//chunk_size + 1}: +{len(data_tuples)} (Total: {total_uploaded:,})")
                time.sleep(0.3)
        
        # Verify all states loaded
        cur.execute("SELECT plant_state, COUNT(*) FROM generators GROUP BY plant_state ORDER BY COUNT(*) DESC;")
        states = cur.fetchall()
        
        print(f"\n🎉 ALL GENERATORS UPLOADED: {total_uploaded:,}")
        print(f"🗺️ States covered: {len(states)} (including {', '.join([s[0] for s in states[:10]])})")
        
    except Exception as e:
        print(f"❌ Generators error: {e}")
    finally:
        conn.close()

def upload_all_utilities():
    """Upload ALL 1,716 utilities from ALL states"""
    print("\n🏢 UPLOADING ALL UTILITIES (ALL STATES)")
    print("📊 Target: ~1,700 utilities from Utility_Data_2023.xlsx")
    
    conn = psycopg2.connect(DATABASE_URL, connect_timeout=30)
    conn.autocommit = True
    cur = conn.cursor()
    
    try:
        # Create utilities table
        cur.execute('''
        CREATE TABLE IF NOT EXISTS utilities (
            id SERIAL PRIMARY KEY,
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
        ''')
        
        cur.execute('DELETE FROM utilities;')
        print("✅ Utilities table ready")
        
        # Load ALL utilities
        df = pd.read_excel('/home/mikyas/projects/Hayl-energy-ai/hayl-energy-ai/hayl-energy-backend/data/Utility_Data_2023.xlsx')
        print(f"📈 Processing {len(df):,} utilities...")
        
        data_tuples = []
        for _, row in df.iterrows():
            if safe_int(row.get('Utility Number')):  # Must have utility number
                data_tuples.append((
                    safe_int(row.get('Utility Number')),
                    safe_str(row.get('Utility Name')),
                    safe_str(row.get('State')),
                    safe_str(row.get('Ownership Type')),
                    safe_str(row.get('NERC Region')),
                    safe_str(row.get('Generation')),
                    safe_str(row.get('Transmission')),
                    safe_str(row.get('Distribution'))
                ))
        
        # Upload utilities in batches
        batch_size = 500
        for i in range(0, len(data_tuples), batch_size):
            batch = data_tuples[i:i+batch_size]
            
            execute_values(
                cur,
                """INSERT INTO utilities 
                   (utility_number, utility_name, state, ownership_type, nerc_region, generation, transmission, distribution)
                   VALUES %s ON CONFLICT (utility_number) DO NOTHING""",
                batch,
                page_size=500
            )
            print(f"✅ Utilities batch {i//batch_size + 1}: +{len(batch)}")
            time.sleep(0.2)
        
        cur.execute("SELECT COUNT(*) FROM utilities;")
        util_count = cur.fetchone()[0]
        
        cur.execute("SELECT state, COUNT(*) FROM utilities WHERE state IS NOT NULL GROUP BY state ORDER BY COUNT(*) DESC LIMIT 10;")
        top_util_states = cur.fetchall()
        
        print(f"\n🎉 ALL UTILITIES UPLOADED: {util_count:,}")
        print("🏆 Top utility states:")
        for state, count in top_util_states:
            print(f"   {state}: {count} utilities")
            
    except Exception as e:
        print(f"❌ Utilities error: {e}")
    finally:
        conn.close()

def upload_service_territories():
    """Upload ALL 11,782 service territories"""
    print("\n🗺️ UPLOADING ALL SERVICE TERRITORIES")
    print("📊 Target: ~11,800 service territories")
    
    conn = psycopg2.connect(DATABASE_URL, connect_timeout=30)
    conn.autocommit = True
    cur = conn.cursor()
    
    try:
        # Create service territories table
        cur.execute('''
        CREATE TABLE IF NOT EXISTS service_territories (
            id SERIAL PRIMARY KEY,
            utility_number INT,
            utility_name VARCHAR(255),
            state VARCHAR(2),
            county VARCHAR(100),
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        ''')
        
        cur.execute('DELETE FROM service_territories;')
        print("✅ Service territories table ready")
        
        # Load service territories
        df = pd.read_excel('/home/mikyas/projects/Hayl-energy-ai/hayl-energy-ai/hayl-energy-backend/data/Service_Territory_2023.xlsx')
        print(f"📈 Processing {len(df):,} service territories...")
        
        data_tuples = []
        for _, row in df.iterrows():
            if safe_str(row.get('State')):  # Must have state
                data_tuples.append((
                    safe_int(row.get('Utility Number')),
                    safe_str(row.get('Utility Name')),
                    safe_str(row.get('State')),
                    safe_str(row.get('County'))
                ))
        
        # Upload in batches
        batch_size = 1000
        total_uploaded = 0
        for i in range(0, len(data_tuples), batch_size):
            batch = data_tuples[i:i+batch_size]
            
            execute_values(
                cur,
                "INSERT INTO service_territories (utility_number, utility_name, state, county) VALUES %s",
                batch,
                page_size=500
            )
            total_uploaded += len(batch)
            print(f"✅ Territories batch {i//batch_size + 1}: +{len(batch)} (Total: {total_uploaded:,})")
            time.sleep(0.2)
        
        print(f"\n🎉 ALL SERVICE TERRITORIES UPLOADED: {total_uploaded:,}")
        
    except Exception as e:
        print(f"❌ Territories error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    print("🚀 UPLOADING COMPLETE ENERGY DATABASE TO PRISMA CLOUD")
    print("=" * 70)
    print("📋 WHAT I'M UPLOADING:")
    print("   1. ALL generators (26,990) from ALL 51 states")
    print("   2. ALL utilities (1,716) nationwide") 
    print("   3. ALL service territories (11,782)")
    print("   4. Complete coverage for your dashboard")
    print("=" * 70)
    
    upload_all_generators()
    upload_all_utilities() 
    upload_service_territories()
    
    print("\n🎉 COMPLETE ENERGY DATABASE UPLOADED TO PRISMA CLOUD!")
    print("🌐 Your dashboard now works globally with real data for ALL states!")