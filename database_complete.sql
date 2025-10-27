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
    FOREIGN KEY (created_by) REFERENCES users(teams_user_id)
);

-- Greetings table for storing different greeting messages
CREATE TABLE IF NOT EXISTS greetings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    moment_type TEXT NOT NULL,
    greeting_text TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 3. INDEXES
-- ==========================================

-- Index for faster moment queries
CREATE INDEX IF NOT EXISTS idx_moments_date ON moments(moment_date);
CREATE INDEX IF NOT EXISTS idx_moments_type ON moments(moment_type);
CREATE INDEX IF NOT EXISTS idx_moments_person ON moments(person_name);
CREATE INDEX IF NOT EXISTS idx_moments_active ON moments(is_active);

-- Index for faster user queries
CREATE INDEX IF NOT EXISTS idx_users_teams_id ON users(teams_user_id);
CREATE INDEX IF NOT EXISTS idx_users_admin ON users(is_admin);

-- Index for faster greeting queries
CREATE INDEX IF NOT EXISTS idx_greetings_type ON greetings(moment_type);
CREATE INDEX IF NOT EXISTS idx_greetings_active ON greetings(is_active);

-- ==========================================
-- 4. SAMPLE DATA
-- ==========================================

-- Insert admin users
INSERT OR IGNORE INTO users (teams_user_id, name, email, is_admin) VALUES
('admin_teams_id', 'Admin User', 'admin@company.com', TRUE),
('aravindm@28ypnx.onmicrosoft.com', 'Aravind M', 'aravindm@28ypnx.onmicrosoft.com', TRUE),
('user1_teams_id', 'John Doe', 'john.doe@company.com', FALSE),
('user2_teams_id', 'Jane Smith', 'jane.smith@company.com', FALSE),
('user3_teams_id', 'Mike Johnson', 'mike.johnson@company.com', FALSE);

-- Insert sample moments
INSERT OR IGNORE INTO moments (person_name, moment_type, moment_date, description, created_by) VALUES
('John Doe', 'birthday', '2025-11-15', 'Johns birthday celebration', 'admin_teams_id'),
('Jane Smith', 'work_anniversary', '2025-11-20', '5 years at the company', 'admin_teams_id'),
('Mike Johnson', 'promotion', '2025-11-10', 'Promoted to Senior Developer', 'admin_teams_id'),
('Sarah Wilson', 'new_hire', '2025-11-01', 'Welcome to the team!', 'admin_teams_id'),
('David Brown', 'lwd', '2025-12-15', 'Last working day - retirement', 'admin_teams_id');

-- Insert greeting templates
INSERT OR IGNORE INTO greetings (moment_type, greeting_text) VALUES
('birthday', 'Happy Birthday, {person_name}! 🎉 Hope you have a wonderful day filled with joy and celebration!'),
('birthday', 'Wishing {person_name} a very Happy Birthday! 🎂 May this new year bring you happiness and success!'),
('birthday', '🎈 Happy Birthday to {person_name}! Hope your special day is as amazing as you are!'),

('work_anniversary', 'Congratulations {person_name} on your work anniversary! 🎊 Thank you for your dedication and hard work!'),
('work_anniversary', 'Happy Work Anniversary, {person_name}! 🏆 Your contributions make our team stronger every day!'),
('work_anniversary', '🌟 Celebrating {person_name}s work anniversary! Thank you for being an amazing colleague!'),

('promotion', 'Congratulations {person_name} on your well-deserved promotion! 🚀 Wishing you continued success!'),
('promotion', '🎯 Way to go, {person_name}! Your promotion is a testament to your hard work and dedication!'),

('new_hire', 'Welcome to the team, {person_name}! 👋 Were excited to have you aboard and look forward to working together!'),
('new_hire', 'A warm welcome to {person_name}! 🤝 Were thrilled you joined our team!'),

('lwd', 'Wishing {person_name} all the best on their last working day! 🌅 Thank you for all your contributions!'),
('lwd', 'Farewell {person_name}! 👋 Your impact will be remembered. Best wishes for your next adventure!'),

('achievement', 'Congratulations {person_name} on your amazing achievement! 🏅 Your hard work has paid off!'),
('achievement', '🌟 Outstanding work, {person_name}! Your achievement is truly inspiring!'),

('other', 'Celebrating {person_name} today! 🎉 Wishing you all the best!');

-- ==========================================
-- 5. VIEWS
-- ==========================================

-- View for upcoming moments (next 30 days)
CREATE VIEW IF NOT EXISTS upcoming_moments AS
SELECT 
    m.*,
    u.name as created_by_name,
    u.email as created_by_email,
    CASE 
        WHEN DATE(m.moment_date) = DATE('now') THEN 'Today'
        WHEN DATE(m.moment_date) = DATE('now', '+1 day') THEN 'Tomorrow'
        ELSE CAST((JULIANDAY(m.moment_date) - JULIANDAY('now')) AS INTEGER) || ' days'
    END as days_until
FROM moments m
LEFT JOIN users u ON m.created_by = u.teams_user_id
WHERE m.is_active = TRUE 
    AND DATE(m.moment_date) >= DATE('now')
    AND DATE(m.moment_date) <= DATE('now', '+30 days')
ORDER BY m.moment_date ASC;

-- View for todays moments
CREATE VIEW IF NOT EXISTS todays_moments AS
SELECT 
    m.*,
    u.name as created_by_name,
    g.greeting_text
FROM moments m
LEFT JOIN users u ON m.created_by = u.teams_user_id
LEFT JOIN greetings g ON m.moment_type = g.moment_type AND g.is_active = TRUE
WHERE m.is_active = TRUE 
    AND DATE(m.moment_date) = DATE('now');

-- View for moment statistics
CREATE VIEW IF NOT EXISTS moment_stats AS
SELECT 
    moment_type,
    COUNT(*) as total_count,
    COUNT(CASE WHEN DATE(moment_date) >= DATE('now') THEN 1 END) as upcoming_count,
    COUNT(CASE WHEN DATE(moment_date) = DATE('now') THEN 1 END) as today_count
FROM moments 
WHERE is_active = TRUE
GROUP BY moment_type
ORDER BY total_count DESC;

-- ==========================================
-- 6. TRIGGERS (Optional)
-- ==========================================

-- Trigger to update the updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_moments_timestamp 
    AFTER UPDATE ON moments
BEGIN
    UPDATE moments SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
    AFTER UPDATE ON users
BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- ==========================================
-- SETUP COMPLETE
-- ==========================================

-- Display setup summary
SELECT 'Database setup completed successfully!' as message;
SELECT 'Users created: ' || COUNT(*) as user_count FROM users;
SELECT 'Moments created: ' || COUNT(*) as moment_count FROM moments;
SELECT 'Greetings created: ' || COUNT(*) as greeting_count FROM greetings;