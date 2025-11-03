import sqlite3
import os

# Use relative path to database
db_path = "database/thunai_culture.db"

if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("📊 DATABASE STATUS:")
    print("=" * 50)
    
    # Check users
    cursor.execute("SELECT COUNT(*) FROM users")
    user_count = cursor.fetchone()[0]
    print(f"👥 Users: {user_count}")
    
    if user_count > 0:
        cursor.execute("SELECT name, email, is_admin FROM users LIMIT 5")
        for row in cursor.fetchall():
            admin_status = "👑 Admin" if row[2] else "👤 User"
            print(f"   • {row[0]} ({row[1]}) - {admin_status}")
    
    # Check moments
    cursor.execute("SELECT COUNT(*) FROM moments")
    moment_count = cursor.fetchone()[0]
    print(f"\n🎉 Moments: {moment_count}")
    
    if moment_count > 0:
        cursor.execute("SELECT person_name, moment_type, moment_date FROM moments ORDER BY id DESC LIMIT 5")
        for row in cursor.fetchall():
            print(f"   • {row[0]} - {row[1]} ({row[2]})")
    
    # Check greetings
    cursor.execute("SELECT COUNT(*) FROM greetings")
    greeting_count = cursor.fetchone()[0]
    print(f"\n💝 Greetings: {greeting_count}")
    
    conn.close()
    print("\n✅ Database check complete!")
else:
    print(f"❌ Database not found at: {db_path}")