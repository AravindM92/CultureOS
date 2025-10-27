/**
 * Culture OS Database Integration for Teams Bot
 * SQLite integration for Node.js Teams bot
 */

const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

class CultureOSDatabase {
    constructor() {
        // Path to our SQLite database
        this.dbPath = path.resolve(__dirname, '..', '..', '..', 'thunai_culture.db');
        this.db = null;
    }

    async connect() {
        if (!this.db) {
            this.db = await open({
                filename: this.dbPath,
                driver: sqlite3.Database
            });
            
            // Enable foreign key constraints
            await this.db.exec('PRAGMA foreign_keys = ON');
            console.log(`Connected to SQLite database: ${this.dbPath}`);
        }
        return this.db;
    }

    // ==========================================
    // USER MANAGEMENT
    // ==========================================

    async getUserByTeamsId(teamsUserId) {
        const db = await this.connect();
        return await db.get(
            'SELECT * FROM users WHERE teams_user_id = ?',
            [teamsUserId]
        );
    }

    async isAdmin(teamsUserId) {
        const db = await this.connect();
        const result = await db.get(`
            SELECT ur.is_admin 
            FROM users u 
            JOIN users_role ur ON u.roleid = ur.id 
            WHERE u.teams_user_id = ?
        `, [teamsUserId]);
        
        return result ? !!result.is_admin : false;
    }

    // ==========================================
    // MOMENTS MANAGEMENT
    // ==========================================

    async createMoment(adminTeamsId, userId, celebrationDate, momentType, title, description = null) {
        const db = await this.connect();
        
        // Get admin user
        const adminUser = await this.getUserByTeamsId(adminTeamsId);
        if (!adminUser || !await this.isAdmin(adminTeamsId)) {
            throw new Error('Only admins can create moments');
        }

        const result = await db.run(`
            INSERT INTO moments (user_id, celebration_date, moment_type, title, description, created_by)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [userId, celebrationDate, momentType, title, description, adminUser.id]);

        // Return the created moment
        return await db.get('SELECT * FROM moments WHERE id = ?', [result.lastID]);
    }

    async getMomentsForTomorrow() {
        const db = await this.connect();
        return await db.all(`
            SELECT m.*, u.name as celebrant_name, u.teams_user_id as celebrant_teams_id
            FROM moments m
            JOIN users u ON m.user_id = u.id
            WHERE m.status = 'active' 
            AND m.celebration_date = date('now', '+1 day')
            AND m.notified_at IS NULL
            ORDER BY m.celebration_date ASC
        `);
    }

    async markMomentNotified(momentId) {
        const db = await this.connect();
        await db.run(`
            UPDATE moments 
            SET notified_at = datetime('now') 
            WHERE id = ?
        `, [momentId]);
    }

    async markMomentCompleted(momentId) {
        const db = await this.connect();
        await db.run(`
            UPDATE moments 
            SET status = 'completed', completed_at = datetime('now') 
            WHERE id = ?
        `, [momentId]);
    }

    // ==========================================
    // GREETINGS MANAGEMENT
    // ==========================================

    async addGreeting(momentId, teamsUserId, greetingText) {
        const db = await this.connect();
        const user = await this.getUserByTeamsId(teamsUserId);
        
        if (!user) {
            return false;
        }

        try {
            await db.run(`
                INSERT INTO greetings (moment_id, user_id, greeting_text)
                VALUES (?, ?, ?)
            `, [momentId, user.id, greetingText]);
            return true;
        } catch (error) {
            // User already sent greeting for this moment (unique constraint)
            return false;
        }
    }

    async getGreetingsForMoment(momentId) {
        const db = await this.connect();
        return await db.all(`
            SELECT g.*, u.name as sender_name
            FROM greetings g
            JOIN users u ON g.user_id = u.id
            WHERE g.moment_id = ?
            ORDER BY g.created_at ASC
        `, [momentId]);
    }

    async getAllTeamMembers(excludeUserId = null) {
        const db = await this.connect();
        let query = 'SELECT * FROM users WHERE last_working_date IS NULL';
        let params = [];
        
        if (excludeUserId) {
            query += ' AND id != ?';
            params.push(excludeUserId);
        }
        
        return await db.all(query, params);
    }

    // ==========================================
    // UTILITY METHODS
    // ==========================================

    async testConnection() {
        try {
            const db = await this.connect();
            await db.get('SELECT COUNT(*) FROM users');
            return true;
        } catch (error) {
            console.error('Database connection failed:', error);
            return false;
        }
    }

    async close() {
        if (this.db) {
            await this.db.close();
            this.db = null;
        }
    }
}

// Export singleton instance
module.exports = new CultureOSDatabase();