import sqlite3
import os

db_path = 'database/thunai_culture.db'
print(f"Checking database at: {os.path.abspath(db_path)}")

if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Get all tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = cursor.fetchall()
    print('\n=== All tables in database ===')
    for table in tables:
        print(f'  - {table[0]}')
    
    # Check if WFO tables exist
    wfo_tables = [t[0] for t in tables if 'wfo' in t[0].lower()]
    print(f'\n=== WFO-related tables: {len(wfo_tables)} ===')
    for wfo_table in wfo_tables:
        print(f'  - {wfo_table}')
    
    # If WFO tables exist, show their schema
    for wfo_table in wfo_tables:
        print(f'\n=== Schema for {wfo_table} ===')
        cursor.execute(f"PRAGMA table_info({wfo_table})")
        columns = cursor.fetchall()
        for col in columns:
            print(f'  {col[1]} {col[2]} (PK: {bool(col[5])}, NotNull: {bool(col[3])}, Default: {col[4]})')
    
    # Check sample data in WFO tables
    for wfo_table in wfo_tables:
        try:
            cursor.execute(f"SELECT COUNT(*) FROM {wfo_table}")
            count = cursor.fetchone()[0]
            print(f'\n=== Data count in {wfo_table}: {count} records ===')
            if count > 0:
                cursor.execute(f"SELECT * FROM {wfo_table} LIMIT 3")
                rows = cursor.fetchall()
                for i, row in enumerate(rows):
                    print(f'  Row {i+1}: {row}')
        except Exception as e:
            print(f'  Error reading {wfo_table}: {e}')
    
    conn.close()
else:
    print(f'❌ Database not found at: {os.path.abspath(db_path)}')