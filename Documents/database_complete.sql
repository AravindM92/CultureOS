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
    moment_id INTEGER, -- Foreign key to moments table
    user_id TEXT, -- Teams user ID who sent the greeting
    greeting_from_name TEXT, -- Name of person sending greeting
    FOREIGN KEY (moment_id) REFERENCES moments(id),
    FOREIGN KEY (user_id) REFERENCES users(teams_user_id)
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
CREATE INDEX IF NOT EXISTS idx_greetings_moment ON greetings(moment_id);
CREATE INDEX IF NOT EXISTS idx_greetings_user ON greetings(user_id);

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
INSERT OR IGNORE INTO moments (person_name, moment_type, moment_date, description, created_by, user_id) VALUES
('John Doe', 'birthday', '2025-11-15', 'Johns birthday celebration', 'admin_teams_id', 3),
('Jane Smith', 'work_anniversary', '2025-11-20', '5 years at the company', 'admin_teams_id', 4),
('Mike Johnson', 'promotion', '2025-11-10', 'Promoted to Senior Developer', 'admin_teams_id', 5),
('Sarah Wilson', 'new_hire', '2025-11-01', 'Welcome to the team!', 'admin_teams_id', NULL),
('David Brown', 'lwd', '2025-12-15', 'Last working day - retirement', 'admin_teams_id', NULL),
('Aravind M', 'birthday', '2025-11-25', 'Aravind birthday coming up', 'admin_teams_id', 2),
('John Doe', 'achievement', '2025-11-12', 'Completed certification program', 'admin_teams_id', 3),
('Jane Smith', 'achievement', '2025-11-18', 'Led successful project delivery', 'admin_teams_id', 4);

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

-- Insert sample user greetings (actual greetings sent by users for specific moments)
INSERT OR IGNORE INTO greetings (moment_id, user_id, greeting_text, moment_type, greeting_from_name, is_active) VALUES
(1, 'user2_teams_id', 'Happy Birthday John! Hope you have an amazing day! 🎉', 'birthday', 'Jane Smith', TRUE),
(1, 'user3_teams_id', 'Wishing you a fantastic birthday John! 🎂', 'birthday', 'Mike Johnson', TRUE),
(2, 'user1_teams_id', 'Congratulations Jane on 5 years! Amazing milestone! 🏆', 'work_anniversary', 'John Doe', TRUE),
(2, 'admin_teams_id', 'Thank you Jane for your incredible dedication over these 5 years! 🌟', 'work_anniversary', 'Admin User', TRUE),
(3, 'user1_teams_id', 'Well deserved promotion Mike! Congrats! 🚀', 'promotion', 'John Doe', TRUE),
(3, 'user2_teams_id', 'So happy for you Mike! Your hard work paid off! 💪', 'promotion', 'Jane Smith', TRUE),
(7, 'user2_teams_id', 'Great job on the certification John! 📜', 'achievement', 'Jane Smith', TRUE),
(8, 'user1_teams_id', 'Fantastic project leadership Jane! 👏', 'achievement', 'John Doe', TRUE);

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

-- View for moments with greeting counts
CREATE VIEW IF NOT EXISTS moments_with_greetings AS
SELECT 
    m.*,
    u.name as created_by_name,
    COUNT(g.id) as greeting_count,
    GROUP_CONCAT(g.greeting_from_name, ', ') as greeting_senders
FROM moments m
LEFT JOIN users u ON m.created_by = u.teams_user_id
LEFT JOIN greetings g ON m.id = g.moment_id AND g.is_active = TRUE
WHERE m.is_active = TRUE
GROUP BY m.id
ORDER BY m.moment_date DESC;

-- View for user greeting activity
CREATE VIEW IF NOT EXISTS user_greeting_activity AS
SELECT 
    u.name,
    u.teams_user_id,
    COUNT(g.id) as greetings_sent,
    COUNT(DISTINCT g.moment_id) as moments_greeted,
    MAX(g.created_at) as last_greeting_date
FROM users u
LEFT JOIN greetings g ON u.teams_user_id = g.user_id AND g.is_active = TRUE
GROUP BY u.id, u.name, u.teams_user_id
ORDER BY greetings_sent DESC;

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

CREATE TRIGGER IF NOT EXISTS update_greetings_timestamp 
    AFTER UPDATE ON greetings
BEGIN
    UPDATE greetings SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- ==========================================
-- SETUP COMPLETE
-- ==========================================

-- Display setup summary
SELECT 'Database setup completed successfully!' as message;
SELECT 'Users created: ' || COUNT(*) as user_count FROM users;
SELECT 'Moments created: ' || COUNT(*) as moment_count FROM moments;
SELECT 'Greetings created: ' || COUNT(*) as greeting_count FROM greetings;