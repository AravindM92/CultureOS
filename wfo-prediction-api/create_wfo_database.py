"""
Create WFO Tables and Sample Data
================================
Script to create WFO tables in existing thunai_culture.db and insert sample data
"""

import sqlite3
from datetime import date, datetime, timedelta
import os

# Database path
DB_PATH = os.path.join("..", "database", "thunai_culture.db")

def create_wfo_tables():
    """Create WFO tables in existing database"""
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Create WFO Availability table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS wfo_availability (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            week_start_date DATE NOT NULL,
            monday_status TEXT CHECK(monday_status IN ('office', 'home', 'hybrid', 'leave')),
            tuesday_status TEXT CHECK(tuesday_status IN ('office', 'home', 'hybrid', 'leave')),
            wednesday_status TEXT CHECK(wednesday_status IN ('office', 'home', 'hybrid', 'leave')),
            thursday_status TEXT CHECK(thursday_status IN ('office', 'home', 'hybrid', 'leave')),
            friday_status TEXT CHECK(friday_status IN ('office', 'home', 'hybrid', 'leave')),
            office_days_count INTEGER DEFAULT 0,
            is_compliant BOOLEAN DEFAULT FALSE,
            collection_method TEXT NOT NULL CHECK(collection_method IN ('weekly', 'daily')),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, week_start_date)
        )
        """)
        
        # Create WFO Collection Attempts table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS wfo_collection_attempts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            week_start_date DATE NOT NULL,
            attempt_type TEXT NOT NULL CHECK(attempt_type IN ('weekly_friday', 'weekly_monday_followup', 'daily')),
            attempt_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            response_received BOOLEAN DEFAULT FALSE,
            response_data TEXT,
            success BOOLEAN DEFAULT FALSE,
            reason TEXT
        )
        """)
        
        # Create WFO Scheduled Messages table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS wfo_scheduled_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            message_type TEXT NOT NULL CHECK(message_type IN ('weekly_friday', 'weekly_monday_followup', 'daily_evening')),
            scheduled_for DATETIME NOT NULL,
            week_target DATE NOT NULL,
            status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'sent', 'completed', 'cancelled')),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            sent_at DATETIME,
            completed_at DATETIME
        )
        """)
        
        # Create indexes for performance
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_wfo_availability_user_week ON wfo_availability(user_id, week_start_date)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_wfo_attempts_user_week ON wfo_collection_attempts(user_id, week_start_date)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_wfo_scheduled_user ON wfo_scheduled_messages(user_id)")
        
        print("✅ WFO tables created successfully in thunai_culture.db")
        
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        raise
    finally:
        conn.commit()
        conn.close()

def insert_sample_data():
    """Insert sample data for testing"""
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Get current week start (Monday)
        today = date.today()
        days_since_monday = today.weekday()
        current_week_start = today - timedelta(days=days_since_monday)
        next_week_start = current_week_start + timedelta(days=7)
        
        # Sample users
        sample_users = [
            "test_user_1",
            "test_user_2", 
            "test_user_3",
            "muthu.aravindan"  # Your user for testing
        ]
        
        # Sample WFO availability data
        sample_availability = [
            # User 1 - Needs collection (only 1 day planned)
            (sample_users[0], str(next_week_start), None, 'office', None, None, None, 1, False, 'weekly'),
            
            # User 2 - Has sufficient data (4 days planned)  
            (sample_users[1], str(next_week_start), 'office', 'office', 'home', 'office', 'office', 4, True, 'weekly'),
            
            # User 3 - Partial data (2 days, needs more)
            (sample_users[2], str(next_week_start), 'office', None, 'office', None, None, 2, False, 'daily'),
            
            # Your user - No data (needs collection)
            (sample_users[3], str(next_week_start), None, None, None, None, None, 0, False, 'weekly')
        ]
        
        for data in sample_availability:
            cursor.execute("""
            INSERT OR REPLACE INTO wfo_availability 
            (user_id, week_start_date, monday_status, tuesday_status, wednesday_status, thursday_status, friday_status, office_days_count, is_compliant, collection_method)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, data)
        
        # Sample collection attempts
        sample_attempts = [
            (sample_users[0], str(next_week_start), 'weekly_friday', datetime.now() - timedelta(hours=2), False, None, False, 'No response received'),
            (sample_users[2], str(next_week_start), 'daily', datetime.now() - timedelta(hours=1), True, 'Monday and Wednesday office', True, 'Successfully collected partial data')
        ]
        
        for attempt in sample_attempts:
            cursor.execute("""
            INSERT INTO wfo_collection_attempts
            (user_id, week_start_date, attempt_type, attempt_timestamp, response_received, response_data, success, reason)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, attempt)
        
        # Sample scheduled messages  
        tomorrow_8pm = datetime.combine(date.today() + timedelta(days=1), datetime.strptime("20:00", "%H:%M").time())
        friday_8pm = datetime.combine(current_week_start + timedelta(days=4), datetime.strptime("20:00", "%H:%M").time())
        
        sample_scheduled = [
            (sample_users[0], 'daily_evening', str(tomorrow_8pm), str(next_week_start), 'pending'),
            (sample_users[3], 'weekly_friday', str(friday_8pm), str(next_week_start), 'pending')
        ]
        
        for scheduled in sample_scheduled:
            cursor.execute("""
            INSERT INTO wfo_scheduled_messages
            (user_id, message_type, scheduled_for, week_target, status) 
            VALUES (?, ?, ?, ?, ?)
            """, scheduled)
        
        print("✅ Sample data inserted successfully")
        print(f"📊 Sample scenarios created:")
        print(f"   - {sample_users[0]}: Needs collection (1/3 days)")
        print(f"   - {sample_users[1]}: Has sufficient data (4/3 days)")  
        print(f"   - {sample_users[2]}: Partial data (2/3 days)")
        print(f"   - {sample_users[3]}: No data (0/3 days)")
        
    except Exception as e:
        print(f"❌ Error inserting sample data: {e}")
        raise
    finally:
        conn.commit()
        conn.close()

if __name__ == "__main__":
    print("🚀 Creating WFO tables and sample data...")
    create_wfo_tables()
    insert_sample_data()
    print("✅ WFO database setup complete!")