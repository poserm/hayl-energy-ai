#!/usr/bin/env python3
"""
Final upload of complete energy data to Prisma Cloud
Explaining each step as we go
"""
import pandas as pd
import psycopg2
from psycopg2.extras import execute_values
import time

DATABASE_URL = "postgres://7a571ce585e0cb50feb02b7f3cac367b0cf701b3fccb98a4e2ae1adc49c5859a:sk_nN4lztrkcDCw-wciq6Qak@db.prisma.io:5432/?sslmode=require"

def upload_to_prisma():
    print("🚀 UPLOADING COMPLETE ENERGY DATA TO PRISMA CLOUD")
    print("=" * 60)
    print("📍 HOW THIS WORKS:")
    print("1. Connect to Prisma Cloud PostgreSQL database")
    print("2. Create generators table with proper schema") 
    print("3. Load CSV data in small batches to avoid timeouts")
    print("4. Verify data for all 50+ states")
    print("=" * 60)
    
    try:
        # STEP 1: Connect to Prisma Cloud
        print("\n🔌 STEP 1: Connecting to Prisma Cloud database...")
        print(f"   Target: db.prisma.io:5432")
        print(f"   Method: Direct PostgreSQL connection with SSL")
        
        conn = psycopg2.connect(DATABASE_URL, connect_timeout=10)
        conn.autocommit = True
        cur = conn.cursor()
        print("   ✅ Connected successfully!")
        
        # STEP 2: Create table schema
        print("\n📊 STEP 2: Creating generators table schema...")
        cur.execute('''
        CREATE TABLE IF NOT EXISTS generators (
            id SERIAL PRIMARY KEY,
            entity_name VARCHAR(255),
            plant_state VARCHAR(2),
            technology VARCHAR(200), 
            nameplate_capacity_mw DECIMAL(12, 3),
            county VARCHAR(100),
            sector VARCHAR(100),
            operating_year INT,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        ''')
        
        # Clear existing data
        cur.execute('DELETE FROM generators;')
        print("   ✅ Table created and cleared")
        
        # STEP 3: Load and process CSV data
        print("\n📁 STEP 3: Loading energy data from CSV...")
        df = pd.read_csv('generators_top_states.csv')
        print(f"   📈 Dataset: {len(df):,} generators")
        print(f"   🗺️ States: {df['Plant State'].nunique()} states")
        print(f"   💡 Technologies: {df['Technology'].nunique()} energy types")
        
        # STEP 4: Upload in batches
        print("\n⬆️ STEP 4: Uploading to Prisma Cloud (batch method)...")
        print("   Method: psycopg2.execute_values() - most efficient for PostgreSQL")
        print("   Batch size: 500 records per batch (avoids timeouts)")
        
        # Prepare data tuples
        data_tuples = []
        for _, row in df.iterrows():
            if pd.notna(row['Plant State']):
                data_tuples.append((
                    str(row['Entity Name']) if pd.notna(row['Entity Name']) else '',
                    str(row['Plant State']),
                    str(row['Technology']) if pd.notna(row['Technology']) else '',
                    float(row['Nameplate Capacity (MW)']) if pd.notna(row['Nameplate Capacity (MW)']) else 0,
                    str(row['County']) if pd.notna(row['County']) else '',
                    str(row['Sector']) if pd.notna(row['Sector']) else '',
                    int(row['Operating Year']) if pd.notna(row['Operating Year']) else 2025
                ))
        
        # Upload in batches
        batch_size = 500
        total_uploaded = 0
        
        for i in range(0, len(data_tuples), batch_size):
            batch = data_tuples[i:i+batch_size]
            
            execute_values(
                cur,
                """INSERT INTO generators 
                   (entity_name, plant_state, technology, nameplate_capacity_mw, county, sector, operating_year)
                   VALUES %s""",
                batch,
                page_size=500
            )
            
            total_uploaded += len(batch)
            print(f"   ✅ Batch {i//batch_size + 1}: {len(batch)} generators (Total: {total_uploaded:,})")
            time.sleep(0.2)  # Small pause between batches
        
        # STEP 5: Verify upload
        print("\n🔍 STEP 5: Verifying data in Prisma Cloud...")
        
        cur.execute("SELECT COUNT(*) FROM generators;")
        total_count = cur.fetchone()[0]
        
        cur.execute("""
        SELECT plant_state, COUNT(*) as count, ROUND(AVG(nameplate_capacity_mw), 1) as avg_mw
        FROM generators 
        WHERE plant_state IS NOT NULL 
        GROUP BY plant_state 
        ORDER BY count DESC;
        """)
        
        state_summary = cur.fetchall()
        
        print(f"   📊 Total generators in Prisma Cloud: {total_count:,}")
        print(f"   🗺️ States covered: {len(state_summary)}")
        print("\n📈 TOP STATES BY GENERATOR COUNT:")
        
        for state, count, avg_mw in state_summary:
            print(f"   {state}: {count:,} generators (avg {avg_mw} MW)")
        
        print("\n🎉 SUCCESS! Complete energy database is now on Prisma Cloud!")
        print(f"🌐 Location: db.prisma.io (same as your auth data)")
        print(f"📊 Records: {total_count:,} generators across {len(state_summary)} states")
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        print("🔧 TROUBLESHOOTING:")
        print("- Prisma Cloud may have connection limits")
        print("- Large datasets require smaller batches")
        print("- SSL timeouts can occur with bulk uploads")
        
    finally:
        if 'conn' in locals() and not conn.closed:
            conn.close()
            print("🔌 Database connection closed")

if __name__ == "__main__":
    upload_to_prisma()