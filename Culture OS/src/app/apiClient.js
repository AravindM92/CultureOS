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
            console.log(`Looking up Teams user: ${teamsUserId}`);
            const response = await this.client.get(`/users/teams-id/${encodeURIComponent(teamsUserId)}`);
            return response.data;
        } catch (error) {
            if (error.response?.status === 404) {
                console.log(`Teams user not found: ${teamsUserId}`);
                return null;
            }
            console.error('Error getting user by Teams ID:', error.message);
            return null;
        }
    }

    async getUserByEmail(email) {
        try {
            if (!email) return null;
            const response = await this.client.get(`/users/email/${encodeURIComponent(email)}`);
            return response.data;
        } catch (error) {
            if (error.response?.status === 404) {
                return null;
            }
            console.error('Error getting user by email:', error.message);
            return null;
        }
    }

    async isAdmin(teamsUserId, userEmail = null) {
        try {
            let user = null;
            
            // Try email first if available
            if (userEmail) {
                user = await this.getUserByEmail(userEmail);
            }
            
            // Fallback to Teams ID lookup
            if (!user) {
                user = await this.getUserByTeamsId(teamsUserId);
            }
            
            if (!user) return false;
            
            // Check if user has admin role (is_admin field)
            return user.is_admin === true;
        } catch (error) {
            console.error('Error checking admin status:', error);
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

    async findUserByName(name) {
        try {
            const response = await this.client.get(`/users/name/${encodeURIComponent(name)}`);
            return response.data;
        } catch (error) {
            if (error.response?.status === 404) {
                return null;
            }
            console.error('Error finding user by name:', error.message);
            return null;
        }
    }

    async findUserByEmail(email) {
        try {
            const users = await this.getAllUsers();
            return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
        } catch (error) {
            console.error('Error finding user by email:', error.message);
            return null;
        }
    }

    async searchUsers(query) {
        try {
            const users = await this.getAllUsers();
            const lowerQuery = query.toLowerCase();
            return users.filter(u => 
                u.name.toLowerCase().includes(lowerQuery) ||
                u.email.toLowerCase().includes(lowerQuery)
            );
        } catch (error) {
            console.error('Error searching users:', error.message);
            return [];
        }
    }

    async createUser(userData) {
        try {
            // Ensure userData matches UserCreate schema
            const userPayload = {
                teams_user_id: userData.teams_user_id || userData.teamsUserId,
                name: userData.name,
                email: userData.email,
                is_admin: userData.is_admin || false
            };
            
            console.log('Creating user with payload:', userPayload);
            const response = await this.client.post('/users/', userPayload);
            console.log('User created successfully:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error creating user:', error.response?.data || error.message);
            throw new Error(error.response?.data?.detail || 'Failed to create user');
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
            // Ensure momentData matches MomentCreate schema
            const momentPayload = {
                person_name: momentData.person_name,
                moment_type: momentData.moment_type,
                moment_date: momentData.moment_date,
                description: momentData.description || null,
                created_by: momentData.created_by
            };
            
            console.log('Creating moment with payload:', momentPayload);
            const response = await this.client.post('/moments/', momentPayload);
            console.log('Moment created successfully:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error creating moment:', error.response?.data || error.message);
            throw new Error(error.response?.data?.detail || 'Failed to create moment');
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

            // 3. Find or create celebrant user if name was detected
            let celebrantUser = null;
            if (analysis.celebrant_name) {
                console.log(`Looking for user with name: ${analysis.celebrant_name}`);
                const allUsers = await this.getAllUsers();
                
                // Try exact match first
                celebrantUser = allUsers.find(user => 
                    user.name.toLowerCase() === analysis.celebrant_name.toLowerCase()
                );
                
                // Try partial match if exact match fails
                if (!celebrantUser) {
                    celebrantUser = allUsers.find(user => 
                        user.name.toLowerCase().includes(analysis.celebrant_name.toLowerCase()) ||
                        analysis.celebrant_name.toLowerCase().includes(user.name.toLowerCase())
                    );
                }
                
                if (celebrantUser) {
                    console.log(`Found existing user: ${celebrantUser.name} (ID: ${celebrantUser.id})`);
                } else {
                    console.log(`User '${analysis.celebrant_name}' not found in database`);
                    // Don't create placeholder users automatically - let the API handle the error
                }
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

            // 6. Create moment with correct schema
            const personName = celebrantUser?.name || analysis.celebrant_name;
            if (!personName) {
                throw new Error('Could not determine celebrant name from the text');
            }
            
            const momentData = {
                person_name: personName,
                moment_type: analysis.moment_type,
                moment_date: celebrationDate.toISOString().split('T')[0],
                description: momentText,
                created_by: adminUser.teams_user_id
            };
            
            console.log(`Creating moment for: ${personName}`);
            console.log(`Moment type: ${analysis.moment_type}`);
            console.log(`Date: ${celebrationDate.toISOString().split('T')[0]}`);

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

    async addGreeting(momentId, teamsUserId, greetingText, momentType = 'general') {
        try {
            const user = await this.getUserByTeamsId(teamsUserId);
            if (!user) {
                console.error('User not found for Teams ID:', teamsUserId);
                return false;
            }

            const greetingData = {
                moment_id: momentId,
                user_id: user.teams_user_id, // Use teams_user_id as per schema
                greeting_text: greetingText,
                moment_type: momentType
            };

            console.log('Creating greeting with payload:', greetingData);
            const response = await this.client.post('/greetings/', greetingData);
            return response.data;
        } catch (error) {
            console.error('Error adding greeting:', error.response?.data || error.message);
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