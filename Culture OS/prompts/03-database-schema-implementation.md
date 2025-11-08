# Database Schema Implementation - CultureOS

## Overview
Complete SQLite database schema for CultureOS with all tables, relationships, indexes, constraints, and sample data for testing team culture management workflows.

## 🗄️ **Database Architecture**

### **Design Principles**
- **Single SQLite File**: `thunai_culture.db` - portable and easy to manage
- **Relational Design**: Proper foreign keys and relationships
- **Data Integrity**: Constraints, checks, and validation
- **Performance**: Strategic indexes for fast queries
- **Extensibility**: Designed for future feature additions

### **Core Entities**
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    Users    │◄──►│   Moments   │◄──►│  Greetings  │
│   (Admin)   │    │(Celebrations│    │ (Messages)  │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Accolades   │    │   Gossips   │    │   Quests    │
│(Recognition)│    │  (Updates)  │    │ (Challenges)│
└─────────────┘    └─────────────┘    └─────────────┘
```

## 📋 **Complete Database Schema**

### **File: database_complete.sql**
```sql
-- ==================================================
-- THUNAI CULTURE OS - COMPLETE DATABASE SETUP
-- SQLite Database Schema for Moments & Greetings
-- ==================================================

-- ==========================================
-- 1. CORE TABLES
-- ==========================================

-- Users table for admin permissions and user management
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    teams_user_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 2. MOMENTS TABLES  
-- ==========================================

-- Moments table for storing personal celebrations
CREATE TABLE IF NOT EXISTS moments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    person_name TEXT NOT NULL,
    moment_type TEXT NOT NULL CHECK (moment_type IN ('birthday', 'work_anniversary', 'lwd', 'promotion', 'new_hire', 'achievement', 'other')),
    moment_date DATE NOT NULL,
    description TEXT,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    notification_sent BOOLEAN DEFAULT FALSE,
    tags TEXT, -- JSON array of tags
    user_id INTEGER, -- Foreign key to users table
    FOREIGN KEY (created_by) REFERENCES users(teams_user_id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Greetings table for storing different greeting messages
CREATE TABLE IF NOT EXISTS greetings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    moment_type TEXT NOT NULL,
    greeting_text TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CHECK (moment_type IN ('birthday', 'work_anniversary', 'lwd', 'promotion', 'new_hire', 'achievement', 'other'))
);

-- ==========================================
-- 3. EXTENDED CULTURE TABLES
-- ==========================================

-- Accolades table for team recognition and achievements
CREATE TABLE IF NOT EXISTS accolades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipient_name TEXT NOT NULL,
    recipient_user_id INTEGER,
    nominator_name TEXT NOT NULL,
    nominator_user_id INTEGER,
    accolade_type TEXT NOT NULL CHECK (accolade_type IN ('excellence', 'innovation', 'collaboration', 'leadership', 'customer_service', 'other')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    impact_description TEXT,
    visibility TEXT DEFAULT 'team' CHECK (visibility IN ('private', 'team', 'organization')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'featured', 'archived')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recipient_user_id) REFERENCES users(id),
    FOREIGN KEY (nominator_user_id) REFERENCES users(id)
);

-- Gossips table for team updates and informal news
CREATE TABLE IF NOT EXISTS gossips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author_name TEXT NOT NULL,
    author_user_id INTEGER,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    gossip_type TEXT DEFAULT 'general' CHECK (gossip_type IN ('general', 'project_update', 'personal_news', 'company_news', 'fun_fact')),
    mood TEXT CHECK (mood IN ('positive', 'neutral', 'exciting', 'informative')),
    visibility TEXT DEFAULT 'team' CHECK (visibility IN ('private', 'team', 'organization')),
    is_anonymous BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_user_id) REFERENCES users(id)
);

-- Quests table for team challenges and activities
CREATE TABLE IF NOT EXISTS quests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    creator_name TEXT NOT NULL,
    creator_user_id INTEGER,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    quest_type TEXT NOT NULL CHECK (quest_type IN ('team_building', 'skill_challenge', 'fun_activity', 'charity', 'innovation', 'other')),
    difficulty_level TEXT DEFAULT 'medium' CHECK (difficulty_level IN ('easy', 'medium', 'hard', 'expert')),
    estimated_duration TEXT, -- e.g., "30 minutes", "1 week"
    max_participants INTEGER,
    current_participants INTEGER DEFAULT 0,
    reward_description TEXT,
    start_date DATE,
    end_date DATE,
    status TEXT DEFAULT 'open' CHECK (status IN ('draft', 'open', 'in_progress', 'completed', 'cancelled')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_user_id) REFERENCES users(id)
);

-- Thoughts table for team reflections and insights
CREATE TABLE IF NOT EXISTS thoughts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author_name TEXT NOT NULL,
    author_user_id INTEGER,
    title TEXT,
    content TEXT NOT NULL,
    thought_type TEXT DEFAULT 'reflection' CHECK (thought_type IN ('reflection', 'idea', 'feedback', 'suggestion', 'learning', 'gratitude')),
    mood TEXT CHECK (mood IN ('positive', 'neutral', 'thoughtful', 'excited', 'grateful')),
    is_anonymous BOOLEAN DEFAULT FALSE,
    visibility TEXT DEFAULT 'team' CHECK (visibility IN ('private', team', 'organization')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_user_id) REFERENCES users(id)
);

-- ==========================================
-- 4. INDEXES FOR PERFORMANCE
-- ==========================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_teams_id ON users(teams_user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);

-- Moments indexes
CREATE INDEX IF NOT EXISTS idx_moments_type ON moments(moment_type);
CREATE INDEX IF NOT EXISTS idx_moments_date ON moments(moment_date);
CREATE INDEX IF NOT EXISTS idx_moments_created_by ON moments(created_by);
CREATE INDEX IF NOT EXISTS idx_moments_user_id ON moments(user_id);
CREATE INDEX IF NOT EXISTS idx_moments_active ON moments(is_active);
CREATE INDEX IF NOT EXISTS idx_moments_notification ON moments(notification_sent);

-- Greetings indexes
CREATE INDEX IF NOT EXISTS idx_greetings_type ON greetings(moment_type);
CREATE INDEX IF NOT EXISTS idx_greetings_active ON greetings(is_active);

-- Accolades indexes
CREATE INDEX IF NOT EXISTS idx_accolades_recipient ON accolades(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_accolades_nominator ON accolades(nominator_user_id);
CREATE INDEX IF NOT EXISTS idx_accolades_type ON accolades(accolade_type);
CREATE INDEX IF NOT EXISTS idx_accolades_status ON accolades(status);

-- Gossips indexes
CREATE INDEX IF NOT EXISTS idx_gossips_author ON gossips(author_user_id);
CREATE INDEX IF NOT EXISTS idx_gossips_type ON gossips(gossip_type);
CREATE INDEX IF NOT EXISTS idx_gossips_visibility ON gossips(visibility);

-- Quests indexes
CREATE INDEX IF NOT EXISTS idx_quests_creator ON quests(creator_user_id);
CREATE INDEX IF NOT EXISTS idx_quests_type ON quests(quest_type);
CREATE INDEX IF NOT EXISTS idx_quests_status ON quests(status);
CREATE INDEX IF NOT EXISTS idx_quests_dates ON quests(start_date, end_date);

-- Thoughts indexes
CREATE INDEX IF NOT EXISTS idx_thoughts_author ON thoughts(author_user_id);
CREATE INDEX IF NOT EXISTS idx_thoughts_type ON thoughts(thought_type);
CREATE INDEX IF NOT EXISTS idx_thoughts_visibility ON thoughts(visibility);

-- ==========================================
-- 5. SAMPLE DATA FOR TESTING
-- ==========================================

-- Sample Users
INSERT OR IGNORE INTO users (teams_user_id, name, email, is_admin) VALUES 
('admin@company.com', 'Admin User', 'admin@company.com', TRUE),
('sarah.johnson@company.com', 'Sarah Johnson', 'sarah.johnson@company.com', FALSE),
('mike.chen@company.com', 'Mike Chen', 'mike.chen@company.com', FALSE),
('lisa.rodriguez@company.com', 'Lisa Rodriguez', 'lisa.rodriguez@company.com', FALSE),
('john.smith@company.com', 'John Smith', 'john.smith@company.com', FALSE),
('anna.kowalski@company.com', 'Anna Kowalski', 'anna.kowalski@company.com', FALSE);

-- Sample Moments
INSERT OR IGNORE INTO moments (person_name, moment_type, moment_date, description, created_by, user_id) VALUES 
('Sarah Johnson', 'birthday', '2025-11-15', 'Sarah''s birthday celebration', 'admin@company.com', 2),
('Mike Chen', 'work_anniversary', '2025-11-20', '5 year work anniversary', 'admin@company.com', 3),
('Lisa Rodriguez', 'promotion', '2025-11-10', 'Promoted to Senior Developer', 'admin@company.com', 4),
('John Smith', 'new_hire', '2025-11-05', 'Welcome John to the team!', 'admin@company.com', 5),
('Anna Kowalski', 'achievement', '2025-11-12', 'Completed AWS Certification', 'admin@company.com', 6);

-- Sample Greetings
INSERT OR IGNORE INTO greetings (moment_type, greeting_text) VALUES 
('birthday', '🎉 Happy Birthday! Hope your special day is filled with joy and celebration!'),
('birthday', '🎂 Wishing you a fantastic birthday and an amazing year ahead!'),
('birthday', '🎈 Happy Birthday! May all your wishes come true today!'),
('work_anniversary', '🎊 Congratulations on your work anniversary! Thank you for your dedication!'),
('work_anniversary', '🏆 Amazing milestone! Thank you for being such a valuable team member!'),
('promotion', '🚀 Congratulations on your well-deserved promotion!'),
('promotion', '⭐ So proud of your achievement! You''ve earned this promotion!'),
('new_hire', '👋 Welcome to the team! We''re excited to have you aboard!'),
('new_hire', '🎯 Welcome! Looking forward to working with you!'),
('achievement', '🏅 Outstanding achievement! Your hard work has paid off!'),
('achievement', '💪 Congratulations! This is a fantastic accomplishment!');

-- Sample Accolades
INSERT OR IGNORE INTO accolades (recipient_name, recipient_user_id, nominator_name, nominator_user_id, accolade_type, title, description, impact_description, status) VALUES 
('Sarah Johnson', 2, 'Mike Chen', 3, 'excellence', 'Code Quality Champion', 'Sarah consistently delivers high-quality code with excellent documentation', 'Reduced bug reports by 40% in her module', 'approved'),
('Lisa Rodriguez', 4, 'Admin User', 1, 'leadership', 'Mentorship Excellence', 'Lisa has been mentoring junior developers with patience and skill', 'Helped 3 junior developers level up their skills', 'featured'),
('Mike Chen', 3, 'Sarah Johnson', 2, 'collaboration', 'Team Player Award', 'Always willing to help teammates and share knowledge', 'Improved team collaboration and knowledge sharing', 'approved');

-- Sample Gossips
INSERT OR IGNORE INTO gossips (author_name, author_user_id, title, content, gossip_type, mood, visibility) VALUES 
('Sarah Johnson', 2, 'New Coffee Machine!', 'Did you know we''re getting a fancy new coffee machine next week? ☕', 'company_news', 'exciting', 'team'),
('Mike Chen', 3, 'Weekend Hackathon Success', 'Our team won 2nd place in the weekend hackathon! 🏆', 'project_update', 'positive', 'team'),
('Admin User', 1, 'Team Lunch Announcement', 'Don''t forget about our team lunch this Friday at the Italian place downtown!', 'general', 'positive', 'team');

-- Sample Quests
INSERT OR IGNORE INTO quests (creator_name, creator_user_id, title, description, quest_type, difficulty_level, estimated_duration, max_participants, reward_description, start_date, end_date, status) VALUES 
('Admin User', 1, 'Learn a New Technology', 'Pick a technology you''ve never used and build a small project with it', 'skill_challenge', 'medium', '2 weeks', 10, 'Recognition in team meeting + $50 gift card', '2025-11-01', '2025-11-15', 'open'),
('Sarah Johnson', 2, 'Office Plant Care Challenge', 'Help keep our office plants healthy and thriving!', 'team_building', 'easy', '1 month', 5, 'Green thumb certificate + plant for your desk', '2025-11-01', '2025-12-01', 'in_progress'),
('Mike Chen', 3, 'Code Golf Competition', 'Write the shortest possible solution to solve the weekly coding challenge', 'fun_activity', 'hard', '1 week', 8, 'Code golf champion title', '2025-11-10', '2025-11-17', 'open');

-- Sample Thoughts
INSERT OR IGNORE INTO thoughts (author_name, author_user_id, title, content, thought_type, mood, visibility) VALUES 
('Lisa Rodriguez', 4, 'Gratitude for Team Support', 'I''m really grateful for how supportive everyone has been during my recent project challenges. This team is amazing!', 'gratitude', 'grateful', 'team'),
('John Smith', 5, 'Learning Reflection', 'After my first month here, I''ve learned so much about our tech stack. The documentation and mentorship have been incredible.', 'reflection', 'thoughtful', 'team'),
('Anna Kowalski', 6, 'Process Improvement Idea', 'What if we had a weekly ''learning share'' where someone presents a cool technique or tool they discovered?', 'idea', 'excited', 'team');

-- ==========================================
-- 6. VIEWS FOR COMMON QUERIES
-- ==========================================

-- Active moments with user information
CREATE VIEW IF NOT EXISTS active_moments_view AS
SELECT 
    m.*,
    u.name as user_name,
    u.email as user_email
FROM moments m
LEFT JOIN users u ON m.user_id = u.id
WHERE m.is_active = TRUE;

-- Upcoming celebrations (next 30 days)
CREATE VIEW IF NOT EXISTS upcoming_celebrations AS
SELECT 
    m.*,
    u.name as user_name,
    u.email as user_email,
    (julianday(m.moment_date) - julianday('now')) as days_until
FROM moments m
LEFT JOIN users u ON m.user_id = u.id
WHERE m.is_active = TRUE 
AND m.moment_date >= date('now')
AND m.moment_date <= date('now', '+30 days')
ORDER BY m.moment_date ASC;

-- Team engagement summary
CREATE VIEW IF NOT EXISTS team_engagement_summary AS
SELECT 
    COUNT(DISTINCT u.id) as total_users,
    COUNT(DISTINCT m.id) as total_moments,
    COUNT(DISTINCT a.id) as total_accolades,
    COUNT(DISTINCT g.id) as total_gossips,
    COUNT(DISTINCT q.id) as total_quests,
    COUNT(DISTINCT t.id) as total_thoughts
FROM users u
LEFT JOIN moments m ON u.id = m.user_id
LEFT JOIN accolades a ON u.id = a.recipient_user_id OR u.id = a.nominator_user_id
LEFT JOIN gossips g ON u.id = g.author_user_id
LEFT JOIN quests q ON u.id = q.creator_user_id
LEFT JOIN thoughts t ON u.id = t.author_user_id;

-- ==========================================
-- 7. TRIGGERS FOR DATA CONSISTENCY
-- ==========================================

-- Update timestamp triggers
CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
    AFTER UPDATE ON users
BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_moments_timestamp 
    AFTER UPDATE ON moments
BEGIN
    UPDATE moments SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_greetings_timestamp 
    AFTER UPDATE ON greetings
BEGIN
    UPDATE greetings SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- ==========================================
-- 8. UTILITY QUERIES FOR VALIDATION
-- ==========================================

-- Check database integrity
-- SELECT name FROM sqlite_master WHERE type='table';
-- SELECT COUNT(*) as user_count FROM users;
-- SELECT COUNT(*) as moment_count FROM moments;
-- SELECT COUNT(*) as greeting_count FROM greetings;

-- Test relationships
-- SELECT m.*, u.name FROM moments m JOIN users u ON m.user_id = u.id;

-- ==========================================
-- DATABASE SETUP COMPLETE
-- ==========================================
```

## 🔧 **Database Operations**

### **Initialization Script**
```python
# database_init.py
import sqlite3
import os

def initialize_database():
    """Initialize the CultureOS database with schema and sample data"""
    
    db_path = "thunai_culture.db"
    
    # Remove existing database if it exists (for fresh start)
    if os.path.exists(db_path):
        os.remove(db_path)
        print(f"Removed existing database: {db_path}")
    
    # Create new database
    conn = sqlite3.connect(db_path)
    print(f"Created new database: {db_path}")
    
    # Read and execute schema
    with open("database_complete.sql", "r") as f:
        schema = f.read()
    
    conn.executescript(schema)
    conn.commit()
    
    print("✅ Database schema created successfully!")
    print("✅ Sample data inserted successfully!")
    
    # Verify setup
    cursor = conn.execute("SELECT COUNT(*) FROM users")
    user_count = cursor.fetchone()[0]
    
    cursor = conn.execute("SELECT COUNT(*) FROM moments") 
    moment_count = cursor.fetchone()[0]
    
    print(f"📊 Database contains {user_count} users and {moment_count} moments")
    
    conn.close()

if __name__ == "__main__":
    initialize_database()
```

### **Database Validation Script**
```python
# database_check.py
import sqlite3

def check_database_health():
    """Check database health and relationships"""
    
    conn = sqlite3.connect("thunai_culture.db")
    cursor = conn.cursor()
    
    print("🔍 Database Health Check")
    print("=" * 40)
    
    # Table counts
    tables = ['users', 'moments', 'greetings', 'accolades', 'gossips', 'quests', 'thoughts']
    
    for table in tables:
        cursor.execute(f"SELECT COUNT(*) FROM {table}")
        count = cursor.fetchone()[0]
        print(f"{table:12}: {count:3} records")
    
    print("\n🔗 Relationship Validation")
    print("=" * 40)
    
    # Check moments with users
    cursor.execute("""
        SELECT COUNT(*) as orphaned_moments 
        FROM moments m 
        LEFT JOIN users u ON m.user_id = u.id 
        WHERE m.user_id IS NOT NULL AND u.id IS NULL
    """)
    orphaned = cursor.fetchone()[0]
    print(f"Orphaned moments: {orphaned}")
    
    # Check upcoming celebrations
    cursor.execute("SELECT * FROM upcoming_celebrations LIMIT 3")
    upcoming = cursor.fetchall()
    print(f"Upcoming celebrations: {len(upcoming)}")
    
    # Check admin users
    cursor.execute("SELECT COUNT(*) FROM users WHERE is_admin = TRUE")
    admins = cursor.fetchone()[0]
    print(f"Admin users: {admins}")
    
    conn.close()
    print("\n✅ Database health check complete!")

if __name__ == "__main__":
    check_database_health()
```

## 📊 **Sample Queries**

### **Common Operations**
```sql
-- Get all active moments for this month
SELECT * FROM moments 
WHERE is_active = TRUE 
AND strftime('%Y-%m', moment_date) = strftime('%Y-%m', 'now');

-- Get user with their moments
SELECT u.name, u.email, m.moment_type, m.moment_date, m.description
FROM users u
LEFT JOIN moments m ON u.id = m.user_id
WHERE u.teams_user_id = 'sarah.johnson@company.com';

-- Get greetings for birthdays
SELECT * FROM greetings 
WHERE moment_type = 'birthday' AND is_active = TRUE;

-- Get team engagement stats
SELECT * FROM team_engagement_summary;

-- Get moments needing notifications
SELECT * FROM moments 
WHERE notification_sent = FALSE AND is_active = TRUE;
```

## 🚀 **Usage Instructions**

### **Setup Database**
```bash
# Method 1: Direct SQL execution
sqlite3 thunai_culture.db < database_complete.sql

# Method 2: Python script
python database_init.py

# Method 3: Via FastAPI (automatic on startup)
# Database is created automatically when FastAPI starts
```

### **Verify Setup**
```bash
# Check database file
ls -la thunai_culture.db

# Run validation script
python database_check.py

# Connect and explore
sqlite3 thunai_culture.db
.tables
.schema users
SELECT * FROM upcoming_celebrations;
.quit
```

### **Backup & Migration**
```bash
# Backup database
cp thunai_culture.db thunai_culture_backup_$(date +%Y%m%d).db

# Export schema only
sqlite3 thunai_culture.db .schema > schema_backup.sql

# Export data only  
sqlite3 thunai_culture.db .dump > full_backup.sql
```

---
**Next Step**: Set up DevOps and configuration (see `04-devops-configuration-implementation.md`)