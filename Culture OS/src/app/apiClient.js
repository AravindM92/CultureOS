/**
 * Thunai API Client for Teams Bot
 * Replaces direct SQLite access with HTTP API calls
 */

const axios = require('axios');

class ThunaiAPIClient {
    constructor(baseURL = 'http://127.0.0.1:8000/api/v1') {
        this.baseURL = baseURL;
        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    // ==========================================
    // USER MANAGEMENT
    // ==========================================

    async getUserByTeamsId(teamsUserId) {
        try {
            // Since we don't have teams_user_id search in API yet, get all users and filter
            const response = await this.client.get('/users');
            const users = response.data;
            return users.find(user => user.teams_user_id === teamsUserId) || null;
        } catch (error) {
            console.error('Error getting user by Teams ID:', error.message);
            return null;
        }
    }

    async isAdmin(teamsUserId) {
        try {
            const user = await this.getUserByTeamsId(teamsUserId);
            if (!user) return false;
            
            // Check if user has admin role (roleid 1 is admin based on sample data)
            return user.roleid === 1;
        } catch (error) {
            console.error('Error checking admin status:', error.message);
            return false;
        }
    }

    async getAllUsers() {
        try {
            const response = await this.client.get('/users');
            return response.data;
        } catch (error) {
            console.error('Error getting all users:', error.message);
            return [];
        }
    }

    // ==========================================
    // MOMENT ANALYSIS & CREATION
    // ==========================================

    async analyzeMomentText(text) {
        try {
            const response = await this.client.post('/moment-analysis/parse', { text });
            return response.data;
        } catch (error) {
            console.error('Error analyzing moment text:', error.message);
            return null;
        }
    }

    async createMoment(momentData) {
        try {
            const response = await this.client.post('/moments', momentData);
            return response.data;
        } catch (error) {
            console.error('Error creating moment:', error.message);
            return null;
        }
    }

    async createMomentFromText(adminTeamsId, momentText) {
        try {
            // 1. Analyze the moment text
            const analysis = await this.analyzeMomentText(momentText);
            if (!analysis) {
                throw new Error('Failed to analyze moment text');
            }

            // 2. Get admin user
            const adminUser = await this.getUserByTeamsId(adminTeamsId);
            if (!adminUser || !await this.isAdmin(adminTeamsId)) {
                throw new Error('Only admins can create moments');
            }

            // 3. Find celebrant user if name was detected
            let celebrantUser = null;
            if (analysis.celebrant_name) {
                const allUsers = await this.getAllUsers();
                celebrantUser = allUsers.find(user => 
                    user.name.toLowerCase().includes(analysis.celebrant_name.toLowerCase())
                );
            }

            // 4. Parse celebration date
            let celebrationDate = new Date();
            if (analysis.celebration_date) {
                // Simple date parsing - can be enhanced
                const dateStr = analysis.celebration_date.toLowerCase();
                if (dateStr.includes('tomorrow')) {
                    celebrationDate = new Date(Date.now() + 24*60*60*1000);
                } else if (dateStr.includes('today')) {
                    celebrationDate = new Date();
                } else {
                    // Try to parse the date string
                    const parsed = new Date(analysis.celebration_date);
                    if (!isNaN(parsed.getTime())) {
                        celebrationDate = parsed;
                    }
                }
            }

            // 5. Set notification days based on category
            const notificationDays = {
                'welcome': 1,
                'celebration': 1,
                'farewell': 7
            }[analysis.category] || 1;

            // 6. Create moment
            const momentData = {
                user_id: celebrantUser?.id || adminUser.id,
                celebration_date: celebrationDate.toISOString().split('T')[0],
                moment_type: analysis.moment_type,
                moment_category: analysis.category,
                title: analysis.celebrant_name ? 
                    `${analysis.celebrant_name}'s ${analysis.moment_type.replace('_', ' ')}` : 
                    `${analysis.moment_type.replace('_', ' ')}`,
                description: momentText,
                created_by: adminUser.id,
                celebrant_user_id: celebrantUser?.id || null,
                notification_days: notificationDays
            };

            return await this.createMoment(momentData);

        } catch (error) {
            console.error('Error creating moment from text:', error.message);
            throw error;
        }
    }

    // ==========================================
    // MOMENT QUERIES
    // ==========================================

    async getMomentsForNotification(targetDate = null) {
        try {
            const date = targetDate || new Date().toISOString().split('T')[0];
            const response = await this.client.get(`/moments/notifications/${date}`);
            return response.data;
        } catch (error) {
            console.error('Error getting moments for notification:', error.message);
            return [];
        }
    }

    async getUpcomingMoments(days = 7) {
        try {
            const response = await this.client.get(`/moments/upcoming/${days}`);
            return response.data;
        } catch (error) {
            console.error('Error getting upcoming moments:', error.message);
            return [];
        }
    }

    async getMomentsByCategory(category) {
        try {
            const response = await this.client.get(`/moments/category/${category}`);
            return response.data;
        } catch (error) {
            console.error(`Error getting ${category} moments:`, error.message);
            return [];
        }
    }

    async markMomentNotified(momentId) {
        try {
            const response = await this.client.post(`/moments/${momentId}/notify`);
            return response.data;
        } catch (error) {
            console.error('Error marking moment as notified:', error.message);
            return null;
        }
    }

    async markMomentCompleted(momentId) {
        try {
            const response = await this.client.post(`/moments/${momentId}/complete`);
            return response.data;
        } catch (error) {
            console.error('Error marking moment as completed:', error.message);
            return null;
        }
    }

    // ==========================================
    // GREETINGS MANAGEMENT
    // ==========================================

    async addGreeting(momentId, teamsUserId, greetingText) {
        try {
            const user = await this.getUserByTeamsId(teamsUserId);
            if (!user) {
                console.error('User not found for Teams ID:', teamsUserId);
                return false;
            }

            const greetingData = {
                moment_id: momentId,
                user_id: user.id,
                greeting_text: greetingText
            };

            const response = await this.client.post('/greetings', greetingData);
            return response.data;
        } catch (error) {
            console.error('Error adding greeting:', error.message);
            return false;
        }
    }

    async getGreetingsForMoment(momentId) {
        try {
            const response = await this.client.get(`/greetings/moment/${momentId}`);
            return response.data;
        } catch (error) {
            console.error('Error getting greetings for moment:', error.message);
            return [];
        }
    }

    // ==========================================
    // UTILITY METHODS
    // ==========================================

    async testConnection() {
        try {
            // Use axios directly for health check since it's outside /api/v1
            const response = await axios.get('http://127.0.0.1:8000/health');
            return response.data.status === 'healthy';
        } catch (error) {
            console.error('API connection test failed:', error.message);
            return false;
        }
    }

    // ==========================================
    // ENHANCED WORKFLOW METHODS
    // ==========================================

    async processNewMoment(adminTeamsId, momentText) {
        try {
            console.log(`Processing new moment from admin ${adminTeamsId}: ${momentText}`);
            
            // Create the moment
            const moment = await this.createMomentFromText(adminTeamsId, momentText);
            if (!moment) {
                throw new Error('Failed to create moment');
            }

            console.log(`Created moment ID ${moment.id}: ${moment.title}`);
            return {
                success: true,
                moment: moment,
                message: `✅ **Moment created successfully!**\n\n"${moment.title}"\n\nI'll notify the team at the appropriate time and collect greetings! 🎉`
            };

        } catch (error) {
            console.error('Error processing new moment:', error.message);
            return {
                success: false,
                error: error.message,
                message: `❌ Failed to create moment: ${error.message}`
            };
        }
    }

    async getDailyNotifications() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const moments = await this.getMomentsForNotification(today);
            
            return moments.map(moment => ({
                id: moment.id,
                title: moment.title,
                category: moment.moment_category,
                celebrant_name: moment.celebrant_name || 'Team member',
                celebration_date: moment.celebration_date,
                notification_days: moment.notification_days,
                greeting_prompt: this.getGreetingPrompt(moment.moment_category, moment.celebrant_name)
            }));

        } catch (error) {
            console.error('Error getting daily notifications:', error.message);
            return [];
        }
    }

    getGreetingPrompt(category, celebrantName = 'them') {
        const prompts = {
            'welcome': `would you like to welcome ${celebrantName} to the team?`,
            'celebration': `would you like to send ${celebrantName} congratulations?`,
            'farewell': `would you like to share a memory or farewell message for ${celebrantName}?`
        };
        return prompts[category] || `would you like to send ${celebrantName} a message?`;
    }
}

module.exports = ThunaiAPIClient;