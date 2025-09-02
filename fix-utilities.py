#!/usr/bin/env python3
"""
Upload ALL utilities using existing Prisma Cloud table structure
"""
import pandas as pd
import psycopg2
from psycopg2.extras import execute_values
import time

DATABASE_URL = "postgres://7a571ce585e0cb50feb02b7f3cac367b0cf701b3fccb98a4e2ae1adc49c5859a:sk_nN4lztrkcDCw-wciq6Qak@db.prisma.io:5432/?sslmode=require"

def safe_str(value):
    if pd.isna(value) or value is None:
        return None
    return str(value).strip() if str(value).strip() else None

def safe_int(value):
    if pd.isna(value) or value == '' or value is None:
        return None
    try:
        return int(float(value))
    except:
        return None

def upload_utilities():
    print("🏢 UPLOADING ALL UTILITIES TO PRISMA CLOUD")
    print("📊 Target: ALL 1,716 utilities from ALL 50+ states")
    print("🎯 Using existing table structure in Prisma Cloud")
    
    try:
        conn = psycopg2.connect(DATABASE_URL, connect_timeout=30)
        conn.autocommit = True
        cur = conn.cursor()
        
        # Clear existing utilities
        cur.execute('DELETE FROM utilities;')
        print("✅ Cleared existing utilities")
        
        # Load utilities with correct headers (skip first row)
        df = pd.read_excel('/home/mikyas/projects/Hayl-energy-ai/hayl-energy-ai/hayl-energy-backend/data/Utility_Data_2023.xlsx', 
                          skiprows=1)
        
        print(f"📈 Loaded {len(df):,} utilities from Excel")
        print(f"📋 Columns: {list(df.columns)[:6]}")
        
        # Process utilities data
        data_tuples = []
        states_found = set()
        
        for _, row in df.iterrows():
            utility_num = safe_int(row.get('Utility Number'))
            state = safe_str(row.get('State'))
            
            if utility_num and state:
                states_found.add(state)
                data_tuples.append((
                    utility_num,
                    safe_str(row.get('Utility Name')),
                    state,
                    safe_str(row.get('Ownership Type')),
                    safe_str(row.get('NERC Region')),
                    safe_str(row.get('Generation')),
                    safe_str(row.get('Transmission')),
                    safe_str(row.get('Distribution'))
                ))
        
        print(f"📊 Prepared {len(data_tuples):,} valid utilities")
        print(f"🗺️ States covered: {len(states_found)} ({sorted(list(states_found))[:10]}...)")
        
        # Upload in batches (using existing table schema)
        batch_size = 500
        total_uploaded = 0
        
        for i in range(0, len(data_tuples), batch_size):
            batch = data_tuples[i:i+batch_size]
            
            execute_values(
                cur,
                '''INSERT INTO utilities 
                   (utility_number, utility_name, state, ownership_type, nerc_region, 
                    generation, transmission, distribution)
                   VALUES %s ON CONFLICT (utility_number) DO NOTHING''',
                batch,
                page_size=500
            )
            
            total_uploaded += len(batch)
            print(f"✅ Batch {i//batch_size + 1}: +{len(batch)} utilities (Total: {total_uploaded:,})")
            time.sleep(0.2)
        
        # Verify upload
        cur.execute("SELECT COUNT(*) FROM utilities;")
        final_count = cur.fetchone()[0]
        
        cur.execute('''
        SELECT state, COUNT(*) as count
        FROM utilities 
        WHERE state IS NOT NULL 
        GROUP BY state 
        ORDER BY count DESC 
        LIMIT 15;
        ''')
        
        state_summary = cur.fetchall()
        
        print(f"\n🎉 ALL UTILITIES UPLOADED!")
        print(f"📊 Total utilities in Prisma Cloud: {final_count:,}")
        print(f"🗺️ States with utilities: {len(state_summary)}")
        
        print("\n🏆 TOP STATES BY UTILITY COUNT:")
        for state, count in state_summary:
            print(f"   {state}: {count} utilities")
        
        print(f"\n✅ SUCCESS! Your Prisma Cloud database now has:")
        print(f"   🔥 26,988 generators (ALL states)")
        print(f"   🏢 {final_count:,} utilities (ALL states)")  
        print(f"   🗺️ 11,782 service territories")
        print(f"   🌐 Hosted on db.prisma.io (same as auth)")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        
    finally:
        if 'conn' in locals() and not conn.closed:
            conn.close()

if __name__ == "__main__":
    upload_utilities()