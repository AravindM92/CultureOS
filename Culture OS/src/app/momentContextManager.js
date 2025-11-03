/**
 * Moment Detection and Admin Context Manager
 * Handles natural conversation analysis for moment opportunities
 */

const ThunaiAPIClient = require('./apiClient');

class MomentContextManager {
    constructor(apiClient) {
        this.apiClient = apiClient;
        this.activeContexts = new Map(); // userId -> context data
        
        // Keywords that indicate moment-worthy events
        this.momentKeywords = {
            birthday: ['birthday', 'bday', 'born today', 'turning', 'celebrates birthday'],
            promotion: ['promoted', 'promotion', 'new role', 'advanced', 'got promoted'],
            achievement: ['achieved', 'accomplished', 'completed', 'finished', 'success', 'won'],
            anniversary: ['anniversary', 'work anniversary', 'years with', 'joined'],
            celebration: ['celebrate', 'congratulate', 'well done', 'great job', 'amazing work'],
            milestone: ['milestone', 'goal reached', 'target met', 'breakthrough']
        };
    }

    // Detect if message contains moment-worthy content
    detectMomentOpportunity(message) {
        const lowerMessage = message.toLowerCase();
        const detected = [];

        for (const [category, keywords] of Object.entries(this.momentKeywords)) {
            if (keywords.some(keyword => lowerMessage.includes(keyword))) {
                detected.push(category);
            }
        }

        return detected.length > 0 ? detected : null;
    }

    // Extract potential celebrant name from message
    extractCelebrantName(message) {
        // Simple regex patterns to find names
        const patterns = [
            /(\w+)'s (birthday|promotion|anniversary)/i,
            /(\w+) (got promoted|is celebrating|achieved)/i,
            /congratulations? (\w+)/i,
            /well done (\w+)/i,
            /(\w+) (completed|finished|won)/i
        ];

        for (const pattern of patterns) {
            const match = message.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }

        // Look for capitalized words that might be names
        const words = message.split(' ');
        const capitalizedWords = words.filter(word => 
            /^[A-Z][a-z]+$/.test(word) && 
            !['The', 'This', 'That', 'We', 'Our', 'Team'].includes(word)
        );

        return capitalizedWords.length > 0 ? capitalizedWords[0] : null;
    }

    // Extract and validate celebrant from message (returns user object or null)
    async extractCelebrant(messageText, context) {
        const celebrantName = this.extractCelebrantName(messageText);
        if (!celebrantName) {
            return null;
        }

        console.log(`Looking for celebrant: ${celebrantName}`);
        
        // Try to find user in database by exact name match
        const user = await this.apiClient.findUserByName(celebrantName);
        
        if (user) {
            console.log(`✅ Found celebrant in database: ${JSON.stringify(user)}`);
            return {
                type: 'existing',
                name: user.name,
                id: user.id,
                email: user.email,
                teams_user_id: user.teams_user_id,
                exists: true
            };
        } else {
            console.log(`❌ Celebrant '${celebrantName}' not found in users table`);
            return {
                type: 'missing',
                name: celebrantName,
                id: null,
                email: null,
                teams_user_id: null,
                exists: false,
                needs_creation: true
            };
        }
    }

    // Create adaptive card response for admin
    createAdminMomentSuggestion(momentTypes, celebrantName, originalMessage) {
        const momentType = momentTypes[0]; // Use first detected type
        const celebrantText = celebrantName ? ` for ${celebrantName}` : '';
        
        return {
            type: "AdaptiveCard",
            version: "1.4",
            body: [
                {
                    type: "TextBlock",
                    text: `🎉 This sounds like a ${momentType}${celebrantText}! This could be a great moment to celebrate.`,
                    wrap: true,
                    size: "Medium"
                }
            ],
            actions: [
                {
                    type: "Action.Submit",
                    title: "🎊 Yes, Create Moment",
                    data: {
                        action: "create_moment",
                        momentType: momentType,
                        celebrantName: celebrantName,
                        originalText: originalMessage
                    }
                },
                {
                    type: "Action.Submit", 
                    title: "📝 Not now",
                    data: {
                        action: "dismiss_moment"
                    }
                }
            ]
        };
    }

    // Handle admin's response to moment suggestion
    async handleMomentAction(action, data, adminUserId, adminEmail = null) {
        if (action === 'create_moment') {
            return await this.createMomentFlow(data, adminUserId, adminEmail);
        } else if (action === 'dismiss_moment') {
            return "👍 No problem! I'll keep listening for other moments to celebrate.";
        }
    }

    // Start moment creation flow
    async createMomentFlow(data, adminUserId, adminEmail = null) {
        const { celebrantName, momentType, originalText } = data;
        
        // Try to find celebrant in database
        if (celebrantName) {
            const celebrant = await this.apiClient.findUserByName(celebrantName);
            
            if (celebrant) {
                // Celebrant found - create moment
                return await this.createMomentInDatabase(celebrant, momentType, originalText, adminUserId, adminEmail);
            } else {
                // Celebrant not found - prompt for details
                this.activeContexts.set(adminUserId, {
                    type: 'awaiting_celebrant_details',
                    celebrantName,
                    momentType,
                    originalText,
                    adminEmail
                });
                
                return this.createCelebrantSearchCard(celebrantName);
            }
        } else {
            // No celebrant detected - prompt for celebrant
            this.activeContexts.set(adminUserId, {
                type: 'awaiting_celebrant_name',
                momentType,
                originalText,
                adminEmail
            });
            
            return "🎊 I'd love to help create this moment! Who should we celebrate? Please tell me their name or email.";
        }
    }

    // Create card for celebrant search/details
    createCelebrantSearchCard(celebrantName) {
        return {
            type: "AdaptiveCard",
            version: "1.4", 
            body: [
                {
                    type: "TextBlock",
                    text: `🔍 I couldn't find "${celebrantName}" in our user database.`,
                    wrap: true,
                    weight: "Bolder"
                },
                {
                    type: "TextBlock",
                    text: "Please provide more details to help me find them:",
                    wrap: true
                }
            ],
            actions: [
                {
                    type: "Action.Submit",
                    title: "📧 Provide Email",
                    data: {
                        action: "provide_email",
                        celebrantName
                    }
                },
                {
                    type: "Action.Submit",
                    title: "👤 Full Name",
                    data: {
                        action: "provide_full_name", 
                        celebrantName
                    }
                },
                {
                    type: "Action.Submit",
                    title: "❌ Cancel",
                    data: {
                        action: "cancel_moment"
                    }
                }
            ]
        };
    }

    // Handle user providing celebrant details
    async handleCelebrantDetails(message, adminUserId) {
        const context = this.activeContexts.get(adminUserId);
        if (!context) return null;

        if (context.type === 'awaiting_celebrant_details' || context.type === 'awaiting_celebrant_name') {
            // Try to find user with provided details
            let celebrant = null;
            
            // Check if it's an email
            if (message.includes('@')) {
                celebrant = await this.apiClient.findUserByEmail(message.trim());
            } else {
                // Treat as name
                celebrant = await this.apiClient.findUserByName(message.trim());
            }

            if (celebrant) {
                // Found celebrant - create moment
                this.activeContexts.delete(adminUserId);
                return await this.createMomentInDatabase(celebrant, context.momentType, context.originalText, adminUserId, context.adminEmail);
            } else {
                // Still not found - search and suggest
                const searchResults = await this.apiClient.searchUsers(message.trim());
                
                if (searchResults.length > 0) {
                    return this.createUserSelectionCard(searchResults, context);
                } else {
                    return `❌ I still couldn't find anyone with "${message}". Please try:
• Their full name as it appears in the system
• Their email address
• Or type "cancel" to stop creating this moment`;
                }
            }
        }

        return null;
    }

    // Create card for user selection when multiple matches found
    createUserSelectionCard(users, context) {
        const actions = users.slice(0, 5).map(user => ({
            type: "Action.Submit",
            title: `${user.name} (${user.email})`,
            data: {
                action: "select_celebrant",
                userId: user.id,
                context: context
            }
        }));

        actions.push({
            type: "Action.Submit",
            title: "❌ None of these",
            data: { action: "cancel_moment" }
        });

        return {
            type: "AdaptiveCard", 
            version: "1.4",
            body: [
                {
                    type: "TextBlock",
                    text: "👥 I found multiple users. Please select the right person:",
                    wrap: true,
                    weight: "Bolder"
                }
            ],
            actions: actions
        };
    }

    // Create moment in database
    async createMomentInDatabase(celebrant, momentType, originalText, adminUserId, adminEmail = null) {
        try {
            // Get admin user - try email first, then Teams ID
            let admin = null;
            if (adminEmail) {
                admin = await this.apiClient.getUserByEmail(adminEmail);
            }
            if (!admin) {
                admin = await this.apiClient.getUserByTeamsId(adminUserId);
            }
            
            if (!admin) {
                return "❌ Error: Could not verify admin user.";
            }

            // Extract date from original text or use today as fallback
            const extractedDate = this.extractDateFromText(originalText);
            const momentDate = extractedDate || new Date().toISOString().split('T')[0];

            // Create moment data with proper API format (matches database schema)
            const momentData = {
                person_name: celebrant.name,  // Changed from celebrant_name to person_name
                moment_type: momentType,      // Changed from event_type to moment_type  
                moment_date: momentDate,
                description: originalText,
                created_by: admin.teams_user_id  // Changed from admin.id to admin.teams_user_id
            };

            console.log('Creating moment with data:', momentData);

            const result = await this.apiClient.createMoment(momentData);
            
            if (result) {
                return `🎉 **Moment Created Successfully!**
                
**Celebrant:** ${celebrant.name}
**Type:** ${momentType}
**Date:** ${momentDate}
**Description:** ${originalText}

The team will love celebrating this! ✨`;
            } else {
                return `😔 I'm sorry, but there was an issue saving this moment to our database.

🌟 **Alternative Solution:** Please try creating this moment using the **Thunai Dashboard** application. Our dashboard team has built a reliable interface for moment creation.

The dashboard provides:
• Easy moment creation forms
• User management tools  
• Direct database access
• Better error handling

Thank you for your patience! 🙏`;
            }
        } catch (error) {
            console.error('Error creating moment:', error);
            return `😔 I'm sorry, but I encountered an issue while creating this moment.

🌟 **Alternative Solution:** Please try creating this moment using the **Thunai Dashboard** application. Our dashboard team has built a reliable interface for moment creation.

The dashboard provides:
• Easy moment creation forms
• User management tools  
• Direct database access
• Better error handling

Thank you for your patience! 🙏`;
        }
    }

    // Extract date from text (handles various formats)
    extractDateFromText(text) {
        // Pattern 1: MM/DD/YYYY or DD/MM/YYYY
        const datePattern1 = /(\d{1,2})\/(\d{1,2})\/(\d{4})/;
        const match1 = text.match(datePattern1);
        if (match1) {
            const [, part1, part2, year] = match1;
            // Assume MM/DD format for US dates
            const month = part1.padStart(2, '0');
            const day = part2.padStart(2, '0');
            return `${year}-${month}-${day}`;
        }

        // Pattern 2: MM/DD (current year)
        const datePattern2 = /(\d{1,2})\/(\d{1,2})(?!\d)/;
        const match2 = text.match(datePattern2);
        if (match2) {
            const [, month, day] = match2;
            const currentYear = new Date().getFullYear();
            return `${currentYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }

        // Pattern 3: Named dates like "tomorrow", "next week", "November 6"
        const lowerText = text.toLowerCase();
        const today = new Date();
        
        if (lowerText.includes('tomorrow')) {
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);
            return tomorrow.toISOString().split('T')[0];
        }
        
        if (lowerText.includes('yesterday')) {
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);
            return yesterday.toISOString().split('T')[0];
        }

        // Pattern 4: Month Day format (November 6, Nov 6, etc.)
        const monthNames = {
            'january': '01', 'jan': '01',
            'february': '02', 'feb': '02',
            'march': '03', 'mar': '03',
            'april': '04', 'apr': '04',
            'may': '05',
            'june': '06', 'jun': '06',
            'july': '07', 'jul': '07',
            'august': '08', 'aug': '08',
            'september': '09', 'sep': '09', 'sept': '09',
            'october': '10', 'oct': '10',
            'november': '11', 'nov': '11',
            'december': '12', 'dec': '12'
        };

        for (const [monthName, monthNum] of Object.entries(monthNames)) {
            const monthPattern = new RegExp(`${monthName}\\s+(\\d{1,2})`, 'i');
            const monthMatch = text.match(monthPattern);
            if (monthMatch) {
                const day = monthMatch[1].padStart(2, '0');
                const currentYear = new Date().getFullYear();
                return `${currentYear}-${monthNum}-${day}`;
            }
        }

        return null; // No date found
    }

    // Check if user has active context
    hasActiveContext(userId) {
        return this.activeContexts.has(userId);
    }

    // Clear user context
    clearContext(userId) {
        this.activeContexts.delete(userId);
    }
}

module.exports = { MomentContextManager };