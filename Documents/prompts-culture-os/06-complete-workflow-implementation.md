# Complete Workflow Implementation - CultureOS

## Overview
End-to-end implementation guide for the complete CultureOS workflow: from moment detection to team notifications, greeting collection, and final card delivery.

## 🔄 **Complete Workflow Architecture**

```
📱 Teams Message → 🤖 Bot Analysis → 🧠 AI Detection → 💾 Database Storage
        ↓
📢 Team Notification → 👥 Greeting Collection → 🎨 Card Generation → 🎉 Delivery
        ↓
📊 Analytics Tracking → 📈 Engagement Metrics → 🔄 Continuous Improvement
```

## 🚀 **Phase 1: Core Moment Detection (Currently Complete)**

### ✅ **Already Implemented**
- Natural language moment detection via Groq AI
- User creation and validation
- Moment storage with proper date parsing
- Confirmation workflows with natural language responses
- Database operations for users and moments

## 📢 **Phase 2: Team Notification System**

### **Notification Manager (Culture OS/src/app/notificationManager.js)**
```javascript
const { CardFactory } = require('@microsoft/teams.api');
const ThunaiAPIClient = require('./apiClient');

class NotificationManager {
    constructor() {
        this.apiClient = new ThunaiAPIClient();
    }

    /**
     * Send moment notification to team channel
     * @param {Object} moment - Moment details from database
     * @param {Object} conversationReference - Teams conversation reference
     * @returns {Object} Notification result
     */
    async sendMomentNotification(moment, conversationReference) {
        try {
            console.log(`🔔 Sending moment notification for ${moment.person_name}`);

            // Create adaptive card for moment announcement
            const announcementCard = this.createMomentAnnouncementCard(moment);
            
            // Send to team channel (this would need Teams SDK integration)
            const notificationResult = await this.sendToTeamChannel(
                announcementCard, 
                conversationReference
            );

            // Update moment as notified in database
            await this.apiClient.updateMoment(moment.id, {
                notification_sent: true,
                notification_date: new Date().toISOString()
            });

            // Start greeting collection workflow
            await this.initiateGreetingCollection(moment, conversationReference);

            return {
                success: true,
                momentId: moment.id,
                notificationId: notificationResult.id,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('Failed to send moment notification:', error);
            return {
                success: false,
                error: error.message,
                momentId: moment.id
            };
        }
    }

    /**
     * Create adaptive card for moment announcement
     * @param {Object} moment - Moment details
     * @returns {Object} Adaptive card
     */
    createMomentAnnouncementCard(moment) {
        const momentEmojis = {
            birthday: '🎂',
            work_anniversary: '🎊', 
            promotion: '🚀',
            achievement: '🏅',
            new_hire: '👋',
            lwd: '🌟'
        };

        const emoji = momentEmojis[moment.moment_type] || '🎉';
        const momentDate = new Date(moment.moment_date).toLocaleDateString();

        return CardFactory.adaptiveCard({
            $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
            type: "AdaptiveCard",
            version: "1.4",
            body: [
                {
                    type: "Container",
                    style: "emphasis",
                    items: [
                        {
                            type: "ColumnSet",
                            columns: [
                                {
                                    type: "Column",
                                    width: "auto",
                                    items: [
                                        {
                                            type: "TextBlock",
                                            text: emoji,
                                            size: "ExtraLarge"
                                        }
                                    ]
                                },
                                {
                                    type: "Column", 
                                    width: "stretch",
                                    items: [
                                        {
                                            type: "TextBlock",
                                            text: `${this.formatMomentType(moment.moment_type)} Celebration!`,
                                            weight: "Bolder",
                                            size: "Large",
                                            color: "Accent"
                                        },
                                        {
                                            type: "TextBlock",
                                            text: `Let's celebrate ${moment.person_name}`,
                                            size: "Medium",
                                            wrap: true
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                {
                    type: "Container",
                    spacing: "Medium", 
                    items: [
                        {
                            type: "FactSet",
                            facts: [
                                {
                                    title: "Celebrant:",
                                    value: moment.person_name
                                },
                                {
                                    title: "Occasion:",
                                    value: this.formatMomentType(moment.moment_type)
                                },
                                {
                                    title: "Date:",
                                    value: momentDate
                                },
                                {
                                    title: "Description:",
                                    value: moment.description || 'Special celebration'
                                }
                            ]
                        }
                    ]
                },
                {
                    type: "Container",
                    style: "good",
                    items: [
                        {
                            type: "TextBlock",
                            text: "🎯 **Help us celebrate!** Click below to add your personal greeting message.",
                            wrap: true,
                            weight: "Bolder"
                        }
                    ]
                }
            ],
            actions: [
                {
                    type: "Action.Submit",
                    title: "📝 Add Your Greeting",
                    data: {
                        action: "add_greeting",
                        moment_id: moment.id,
                        moment_type: moment.moment_type,
                        person_name: moment.person_name
                    }
                },
                {
                    type: "Action.OpenUrl",
                    title: "📊 View All Greetings",
                    url: `https://your-app.com/moments/${moment.id}/greetings`
                }
            ]
        });
    }

    /**
     * Format moment type for display
     * @param {string} momentType - Raw moment type
     * @returns {string} Formatted display name
     */
    formatMomentType(momentType) {
        const typeMap = {
            birthday: 'Birthday',
            work_anniversary: 'Work Anniversary',
            promotion: 'Promotion',
            achievement: 'Achievement', 
            new_hire: 'Welcome New Team Member',
            lwd: 'Farewell'
        };
        return typeMap[momentType] || 'Celebration';
    }

    /**
     * Send card to team channel
     * @param {Object} card - Adaptive card
     * @param {Object} conversationReference - Teams conversation
     * @returns {Object} Send result
     */
    async sendToTeamChannel(card, conversationReference) {
        // This is a placeholder - actual implementation would use Teams SDK
        // to send to the appropriate channel/conversation
        
        console.log('📤 Sending card to team channel...');
        console.log('Card:', JSON.stringify(card, null, 2));
        
        // Simulate successful send
        return {
            id: `notification_${Date.now()}`,
            timestamp: new Date().toISOString(),
            conversationId: conversationReference.conversation.id
        };
    }

    /**
     * Initiate greeting collection workflow
     * @param {Object} moment - Moment details
     * @param {Object} conversationReference - Teams conversation
     */
    async initiateGreetingCollection(moment, conversationReference) {
        console.log(`📬 Starting greeting collection for moment ${moment.id}`);
        
        // Schedule greeting collection reminder
        setTimeout(async () => {
            await this.sendGreetingReminder(moment, conversationReference);
        }, 24 * 60 * 60 * 1000); // 24 hours later

        // Schedule final card generation
        const celebrationDate = new Date(moment.moment_date);
        const now = new Date();
        const timeUntilCelebration = celebrationDate.getTime() - now.getTime();
        
        if (timeUntilCelebration > 0) {
            setTimeout(async () => {
                await this.generateFinalCard(moment);
            }, timeUntilCelebration);
        }
    }

    /**
     * Send greeting collection reminder
     * @param {Object} moment - Moment details
     * @param {Object} conversationReference - Teams conversation
     */
    async sendGreetingReminder(moment, conversationReference) {
        console.log(`⏰ Sending greeting reminder for moment ${moment.id}`);
        
        const reminderCard = this.createGreetingReminderCard(moment);
        await this.sendToTeamChannel(reminderCard, conversationReference);
    }

    /**
     * Create greeting reminder card
     * @param {Object} moment - Moment details
     * @returns {Object} Reminder card
     */
    createGreetingReminderCard(moment) {
        const celebrationDate = new Date(moment.moment_date);
        const daysUntil = Math.ceil((celebrationDate - new Date()) / (1000 * 60 * 60 * 24));

        return CardFactory.adaptiveCard({
            $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
            type: "AdaptiveCard",
            version: "1.4",
            body: [
                {
                    type: "Container",
                    style: "attention",
                    items: [
                        {
                            type: "TextBlock",
                            text: `⏰ Reminder: ${moment.person_name}'s ${this.formatMomentType(moment.moment_type)}`,
                            weight: "Bolder",
                            size: "Large"
                        },
                        {
                            type: "TextBlock",
                            text: `Only ${daysUntil} day(s) left to add your greeting message!`,
                            wrap: true
                        }
                    ]
                }
            ],
            actions: [
                {
                    type: "Action.Submit",
                    title: "📝 Add Greeting Now",
                    data: {
                        action: "add_greeting",
                        moment_id: moment.id,
                        urgent: true
                    }
                }
            ]
        });
    }
}

module.exports = { NotificationManager };
```

## 💌 **Phase 3: Greeting Collection System**

### **Greeting Manager (Culture OS/src/app/greetingManager.js)**
```javascript
const { CardFactory } = require('@microsoft/teams.api');
const ThunaiAPIClient = require('./apiClient');

class GreetingManager {
    constructor() {
        this.apiClient = new ThunaiAPIClient();
    }

    /**
     * Handle greeting submission from adaptive card
     * @param {Object} activity - Teams activity with greeting data
     * @returns {Object} Processing result
     */
    async handleGreetingSubmission(activity) {
        try {
            const greetingData = activity.value;
            console.log(`💌 Processing greeting submission:`, greetingData);

            // Validate greeting data
            if (!greetingData.moment_id || !greetingData.greeting_text) {
                throw new Error('Missing required greeting data');
            }

            // Get moment details
            const moment = await this.apiClient.getMoment(greetingData.moment_id);
            if (!moment) {
                throw new Error(`Moment ${greetingData.moment_id} not found`);
            }

            // Create greeting record
            const greetingRecord = {
                moment_id: greetingData.moment_id,
                author_name: activity.from.name,
                author_teams_id: activity.from.id,
                greeting_text: greetingData.greeting_text.trim(),
                greeting_type: 'personal', // vs template
                created_at: new Date().toISOString()
            };

            const savedGreeting = await this.apiClient.createGreeting(greetingRecord);

            // Send confirmation to user
            const confirmationCard = this.createGreetingConfirmationCard(
                savedGreeting, 
                moment
            );

            return {
                success: true,
                greeting: savedGreeting,
                confirmationCard: confirmationCard
            };

        } catch (error) {
            console.error('Failed to process greeting submission:', error);
            return {
                success: false,
                error: error.message,
                errorCard: this.createErrorCard(error.message)
            };
        }
    }

    /**
     * Create greeting input card
     * @param {Object} moment - Moment details
     * @returns {Object} Greeting input card
     */
    createGreetingInputCard(moment) {
        return CardFactory.adaptiveCard({
            $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
            type: "AdaptiveCard",
            version: "1.4",
            body: [
                {
                    type: "Container",
                    style: "emphasis",
                    items: [
                        {
                            type: "TextBlock",
                            text: `✍️ Add Your Greeting for ${moment.person_name}`,
                            weight: "Bolder",
                            size: "Large"
                        },
                        {
                            type: "TextBlock",
                            text: `${this.formatMomentType(moment.moment_type)} • ${new Date(moment.moment_date).toLocaleDateString()}`,
                            color: "Accent"
                        }
                    ]
                },
                {
                    type: "Container",
                    spacing: "Medium",
                    items: [
                        {
                            type: "TextBlock",
                            text: "💭 **Your personal message:**",
                            weight: "Bolder"
                        },
                        {
                            type: "Input.Text",
                            id: "greeting_text",
                            placeholder: "Write your heartfelt message here...",
                            isMultiline: true,
                            maxLength: 500
                        }
                    ]
                },
                {
                    type: "Container",
                    style: "good",
                    items: [
                        {
                            type: "TextBlock",
                            text: "💡 **Tips:** Be personal, positive, and specific. Share a memory, express gratitude, or offer congratulations!",
                            wrap: true,
                            size: "Small"
                        }
                    ]
                }
            ],
            actions: [
                {
                    type: "Action.Submit",
                    title: "📤 Submit Greeting",
                    data: {
                        action: "submit_greeting",
                        moment_id: moment.id,
                        moment_type: moment.moment_type,
                        person_name: moment.person_name
                    }
                },
                {
                    type: "Action.Submit",
                    title: "🎲 Use Template",
                    data: {
                        action: "use_template",
                        moment_id: moment.id,
                        moment_type: moment.moment_type
                    }
                }
            ]
        });
    }

    /**
     * Create greeting confirmation card
     * @param {Object} greeting - Saved greeting
     * @param {Object} moment - Moment details
     * @returns {Object} Confirmation card
     */
    createGreetingConfirmationCard(greeting, moment) {
        return CardFactory.adaptiveCard({
            $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
            type: "AdaptiveCard",
            version: "1.4",
            body: [
                {
                    type: "Container",
                    style: "good",
                    items: [
                        {
                            type: "TextBlock", 
                            text: "✅ Your greeting has been added!",
                            weight: "Bolder",
                            size: "Large"
                        },
                        {
                            type: "TextBlock",
                            text: `Thank you for contributing to ${moment.person_name}'s ${this.formatMomentType(moment.moment_type)} celebration!`,
                            wrap: true
                        }
                    ]
                },
                {
                    type: "Container",
                    spacing: "Medium",
                    items: [
                        {
                            type: "TextBlock",
                            text: "📝 **Your message:**",
                            weight: "Bolder"
                        },
                        {
                            type: "Container",
                            style: "emphasis",
                            items: [
                                {
                                    type: "TextBlock",
                                    text: greeting.greeting_text,
                                    wrap: true,
                                    fontType: "Monospace"
                                }
                            ]
                        }
                    ]
                },
                {
                    type: "Container",
                    spacing: "Medium",
                    items: [
                        {
                            type: "TextBlock",
                            text: `🎯 We'll include your message in the final celebration card for ${moment.person_name}!`,
                            wrap: true,
                            color: "Accent"
                        }
                    ]
                }
            ],
            actions: [
                {
                    type: "Action.Submit",
                    title: "📊 View All Greetings",
                    data: {
                        action: "view_all_greetings",
                        moment_id: moment.id
                    }
                }
            ]
        });
    }

    /**
     * Get greeting templates for moment type
     * @param {string} momentType - Type of moment
     * @returns {Array} Template suggestions
     */
    getGreetingTemplates(momentType) {
        const templates = {
            birthday: [
                "Happy Birthday! 🎉 Hope your special day is filled with joy and celebration!",
                "Wishing you a fantastic birthday and an amazing year ahead! 🎂",
                "Happy Birthday! May all your wishes come true today! 🎈"
            ],
            work_anniversary: [
                "Congratulations on your work anniversary! 🎊 Thank you for your dedication!",
                "Amazing milestone! Thank you for being such a valuable team member! 🏆",
                "Happy work anniversary! Your contributions make such a difference! 🌟"
            ],
            promotion: [
                "Congratulations on your well-deserved promotion! 🚀",
                "So proud of your achievement! You've earned this promotion! ⭐",
                "Way to go! Your hard work and dedication have paid off! 🎯"
            ],
            achievement: [
                "Outstanding achievement! Your hard work has paid off! 🏅",
                "Congratulations! This is a fantastic accomplishment! 💪",
                "Amazing work! You should be very proud of this achievement! 🌟"
            ],
            new_hire: [
                "Welcome to the team! We're excited to have you aboard! 👋",
                "Welcome! Looking forward to working with you! 🎯",
                "Great to have you join us! Welcome to our amazing team! 🎉"
            ],
            lwd: [
                "Thank you for all your contributions! Wishing you the best! 🌟",
                "It's been wonderful working with you! Best of luck ahead! 🍀",
                "You'll be missed! Thank you for everything you've done! 💫"
            ]
        };

        return templates[momentType] || [
            "Congratulations! 🎉",
            "Wishing you all the best! 🌟",
            "So happy for you! 🎯"
        ];
    }

    /**
     * Create template selection card
     * @param {Object} moment - Moment details
     * @returns {Object} Template selection card
     */
    createTemplateSelectionCard(moment) {
        const templates = this.getGreetingTemplates(moment.moment_type);
        
        const templateChoices = templates.map((template, index) => ({
            title: `Template ${index + 1}`,
            value: template
        }));

        return CardFactory.adaptiveCard({
            $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
            type: "AdaptiveCard", 
            version: "1.4",
            body: [
                {
                    type: "Container",
                    items: [
                        {
                            type: "TextBlock",
                            text: `🎲 Choose a Template for ${moment.person_name}`,
                            weight: "Bolder",
                            size: "Large"
                        },
                        {
                            type: "Input.ChoiceSet",
                            id: "template_choice",
                            style: "expanded",
                            choices: templateChoices
                        }
                    ]
                }
            ],
            actions: [
                {
                    type: "Action.Submit",
                    title: "✅ Use Selected Template",
                    data: {
                        action: "submit_template_greeting",
                        moment_id: moment.id
                    }
                },
                {
                    type: "Action.Submit", 
                    title: "✍️ Write Custom Message",
                    data: {
                        action: "custom_greeting",
                        moment_id: moment.id
                    }
                }
            ]
        });
    }

    formatMomentType(momentType) {
        const typeMap = {
            birthday: 'Birthday',
            work_anniversary: 'Work Anniversary', 
            promotion: 'Promotion',
            achievement: 'Achievement',
            new_hire: 'Welcome',
            lwd: 'Farewell'
        };
        return typeMap[momentType] || 'Celebration';
    }

    createErrorCard(message) {
        return CardFactory.adaptiveCard({
            $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
            type: "AdaptiveCard",
            version: "1.4", 
            body: [
                {
                    type: "Container",
                    style: "attention",
                    items: [
                        {
                            type: "TextBlock",
                            text: "❌ Error Processing Greeting",
                            weight: "Bolder",
                            size: "Large"
                        },
                        {
                            type: "TextBlock",
                            text: message,
                            wrap: true
                        }
                    ]
                }
            ]
        });
    }
}

module.exports = { GreetingManager };
```

## 🎨 **Phase 4: Card Generation System**

### **Card Generator (Culture OS/src/app/cardGenerator.js)**
```javascript
const { CardFactory } = require('@microsoft/teams.api');
const ThunaiAPIClient = require('./apiClient');

class CardGenerator {
    constructor() {
        this.apiClient = new ThunaiAPIClient();
    }

    /**
     * Generate final celebration card with all greetings
     * @param {number} momentId - Moment ID
     * @returns {Object} Generated card and delivery info
     */
    async generateFinalCard(momentId) {
        try {
            console.log(`🎨 Generating final card for moment ${momentId}`);

            // Get moment details and greetings
            const moment = await this.apiClient.getMoment(momentId);
            const greetings = await this.apiClient.getGreetingsForMoment(momentId);

            if (!moment) {
                throw new Error(`Moment ${momentId} not found`);
            }

            // Generate the celebration card
            const celebrationCard = this.createCelebrationCard(moment, greetings);
            
            // Create summary card for team
            const summaryCard = this.createSummaryCard(moment, greetings.length);

            // Mark moment as completed
            await this.apiClient.updateMoment(momentId, {
                status: 'completed',
                card_generated: true,
                completed_at: new Date().toISOString()
            });

            return {
                success: true,
                momentId: momentId,
                celebrationCard: celebrationCard,
                summaryCard: summaryCard,
                greetingCount: greetings.length,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('Failed to generate final card:', error);
            return {
                success: false,
                error: error.message,
                momentId: momentId
            };
        }
    }

    /**
     * Create the main celebration card with all greetings
     * @param {Object} moment - Moment details
     * @param {Array} greetings - All greetings for this moment
     * @returns {Object} Celebration card
     */
    createCelebrationCard(moment, greetings) {
        const momentEmojis = {
            birthday: '🎂',
            work_anniversary: '🎊',
            promotion: '🚀', 
            achievement: '🏅',
            new_hire: '👋',
            lwd: '🌟'
        };

        const emoji = momentEmojis[moment.moment_type] || '🎉';
        const momentDate = new Date(moment.moment_date).toLocaleDateString();

        // Create greeting items for the card
        const greetingItems = greetings.map(greeting => ({
            type: "Container",
            spacing: "Medium",
            separator: true,
            items: [
                {
                    type: "ColumnSet",
                    columns: [
                        {
                            type: "Column",
                            width: "auto",
                            items: [
                                {
                                    type: "TextBlock",
                                    text: "💌",
                                    size: "Medium"
                                }
                            ]
                        },
                        {
                            type: "Column",
                            width: "stretch", 
                            items: [
                                {
                                    type: "TextBlock",
                                    text: greeting.greeting_text,
                                    wrap: true,
                                    fontType: "Default",
                                    size: "Default"
                                },
                                {
                                    type: "TextBlock",
                                    text: `— ${greeting.author_name}`,
                                    size: "Small",
                                    color: "Accent",
                                    horizontalAlignment: "Right",
                                    spacing: "Small"
                                }
                            ]
                        }
                    ]
                }
            ]
        }));

        return CardFactory.adaptiveCard({
            $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
            type: "AdaptiveCard",
            version: "1.4",
            body: [
                {
                    type: "Container",
                    style: "emphasis",
                    items: [
                        {
                            type: "ColumnSet",
                            columns: [
                                {
                                    type: "Column",
                                    width: "auto",
                                    items: [
                                        {
                                            type: "TextBlock",
                                            text: emoji,
                                            size: "ExtraLarge"
                                        }
                                    ]
                                },
                                {
                                    type: "Column",
                                    width: "stretch",
                                    items: [
                                        {
                                            type: "TextBlock",
                                            text: `🎉 ${this.formatMomentType(moment.moment_type)}!`,
                                            weight: "Bolder",
                                            size: "ExtraLarge",
                                            color: "Accent"
                                        },
                                        {
                                            type: "TextBlock",
                                            text: `Celebrating ${moment.person_name}`,
                                            size: "Large",
                                            wrap: true
                                        },
                                        {
                                            type: "TextBlock",
                                            text: momentDate,
                                            color: "Accent",
                                            size: "Medium"
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                {
                    type: "Container",
                    spacing: "Large",
                    items: [
                        {
                            type: "TextBlock",
                            text: `💕 **Messages from the Team** (${greetings.length} greeting${greetings.length !== 1 ? 's' : ''})`,
                            weight: "Bolder",
                            size: "Medium"
                        }
                    ]
                },
                ...greetingItems,
                {
                    type: "Container",
                    spacing: "Large",
                    style: "good",
                    items: [
                        {
                            type: "TextBlock",
                            text: `🌟 **From all of us at the team - we hope your ${this.formatMomentType(moment.moment_type).toLowerCase()} is amazing!** 🌟`,
                            wrap: true,
                            horizontalAlignment: "Center",
                            weight: "Bolder"
                        }
                    ]
                }
            ]
        });
    }

    /**
     * Create summary card for team notification
     * @param {Object} moment - Moment details
     * @param {number} greetingCount - Number of greetings received
     * @returns {Object} Summary card
     */
    createSummaryCard(moment, greetingCount) {
        return CardFactory.adaptiveCard({
            $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
            type: "AdaptiveCard",
            version: "1.4",
            body: [
                {
                    type: "Container",
                    style: "good",
                    items: [
                        {
                            type: "TextBlock",
                            text: "🎊 Celebration Card Delivered!",
                            weight: "Bolder",
                            size: "Large"
                        },
                        {
                            type: "TextBlock",
                            text: `${moment.person_name}'s ${this.formatMomentType(moment.moment_type).toLowerCase()} celebration card has been delivered with ${greetingCount} heartfelt message${greetingCount !== 1 ? 's' : ''} from the team!`,
                            wrap: true
                        }
                    ]
                },
                {
                    type: "Container",
                    spacing: "Medium",
                    items: [
                        {
                            type: "FactSet",
                            facts: [
                                {
                                    title: "Celebrant:",
                                    value: moment.person_name
                                },
                                {
                                    title: "Occasion:", 
                                    value: this.formatMomentType(moment.moment_type)
                                },
                                {
                                    title: "Team Participation:",
                                    value: `${greetingCount} greeting${greetingCount !== 1 ? 's' : ''} collected`
                                },
                                {
                                    title: "Card Delivered:",
                                    value: new Date().toLocaleString()
                                }
                            ]
                        }
                    ]
                },
                {
                    type: "Container",
                    style: "emphasis",
                    items: [
                        {
                            type: "TextBlock",
                            text: "🙏 Thank you to everyone who participated in making this celebration special!",
                            wrap: true,
                            horizontalAlignment: "Center",
                            weight: "Bolder"
                        }
                    ]
                }
            ]
        });
    }

    formatMomentType(momentType) {
        const typeMap = {
            birthday: 'Birthday',
            work_anniversary: 'Work Anniversary',
            promotion: 'Promotion', 
            achievement: 'Achievement',
            new_hire: 'Welcome',
            lwd: 'Farewell'
        };
        return typeMap[momentType] || 'Celebration';
    }
}

module.exports = { CardGenerator };
```

## 🔄 **Complete Workflow Integration**

### **Workflow Orchestrator (Culture OS/src/app/workflowOrchestrator.js)**
```javascript
const { NotificationManager } = require('./notificationManager');
const { GreetingManager } = require('./greetingManager');
const { CardGenerator } = require('./cardGenerator');
const ThunaiAPIClient = require('./apiClient');

class WorkflowOrchestrator {
    constructor() {
        this.notificationManager = new NotificationManager();
        this.greetingManager = new GreetingManager();
        this.cardGenerator = new CardGenerator();
        this.apiClient = new ThunaiAPIClient();
    }

    /**
     * Execute complete moment workflow
     * @param {Object} moment - Moment created from detection
     * @param {Object} conversationReference - Teams conversation
     */
    async executeMomentWorkflow(moment, conversationReference) {
        try {
            console.log(`🚀 Starting complete workflow for moment ${moment.id}`);

            // Phase 1: Send team notification
            const notificationResult = await this.notificationManager.sendMomentNotification(
                moment,
                conversationReference
            );

            if (!notificationResult.success) {
                throw new Error(`Failed to send notification: ${notificationResult.error}`);
            }

            // Phase 2: Schedule greeting collection period
            this.scheduleGreetingCollection(moment, conversationReference);

            // Phase 3: Schedule card generation
            this.scheduleCardGeneration(moment, conversationReference);

            console.log(`✅ Workflow initiated successfully for moment ${moment.id}`);

            return {
                success: true,
                momentId: moment.id,
                workflowId: `workflow_${moment.id}_${Date.now()}`,
                phases: {
                    notification: notificationResult,
                    greetingCollection: 'scheduled',
                    cardGeneration: 'scheduled'
                }
            };

        } catch (error) {
            console.error('Workflow execution failed:', error);
            return {
                success: false,
                error: error.message,
                momentId: moment.id
            };
        }
    }

    /**
     * Schedule greeting collection period
     * @param {Object} moment - Moment details
     * @param {Object} conversationReference - Teams conversation
     */
    scheduleGreetingCollection(moment, conversationReference) {
        const celebrationDate = new Date(moment.moment_date);
        const now = new Date();
        const daysUntilCelebration = Math.ceil((celebrationDate - now) / (1000 * 60 * 60 * 24));

        // Send reminder based on time until celebration
        let reminderDelay;
        if (daysUntilCelebration > 3) {
            reminderDelay = 24 * 60 * 60 * 1000; // 1 day
        } else if (daysUntilCelebration > 1) {
            reminderDelay = 12 * 60 * 60 * 1000; // 12 hours
        } else {
            reminderDelay = 4 * 60 * 60 * 1000; // 4 hours
        }

        setTimeout(async () => {
            await this.notificationManager.sendGreetingReminder(moment, conversationReference);
        }, reminderDelay);

        console.log(`📅 Greeting reminder scheduled for moment ${moment.id} in ${reminderDelay / 1000 / 60 / 60} hours`);
    }

    /**
     * Schedule card generation
     * @param {Object} moment - Moment details
     * @param {Object} conversationReference - Teams conversation
     */
    scheduleCardGeneration(moment, conversationReference) {
        const celebrationDate = new Date(moment.moment_date);
        const now = new Date();

        // Generate card 2 hours before celebration or immediately if celebration is past
        let generationTime = new Date(celebrationDate.getTime() - (2 * 60 * 60 * 1000));
        
        if (generationTime <= now) {
            generationTime = new Date(now.getTime() + (5 * 60 * 1000)); // 5 minutes from now
        }

        const delay = generationTime.getTime() - now.getTime();

        setTimeout(async () => {
            await this.executeCardGeneration(moment, conversationReference);
        }, delay);

        console.log(`🎨 Card generation scheduled for moment ${moment.id} at ${generationTime.toISOString()}`);
    }

    /**
     * Execute card generation phase
     * @param {Object} moment - Moment details
     * @param {Object} conversationReference - Teams conversation
     */
    async executeCardGeneration(moment, conversationReference) {
        try {
            console.log(`🎨 Executing card generation for moment ${moment.id}`);

            const cardResult = await this.cardGenerator.generateFinalCard(moment.id);

            if (cardResult.success) {
                // Send celebration card to celebrant (private message)
                await this.sendPrivateCelebrationCard(
                    moment,
                    cardResult.celebrationCard,
                    conversationReference
                );

                // Send summary to team channel
                await this.sendTeamSummary(
                    cardResult.summaryCard,
                    conversationReference
                );

                console.log(`✅ Card generation completed for moment ${moment.id}`);
            } else {
                throw new Error(`Card generation failed: ${cardResult.error}`);
            }

        } catch (error) {
            console.error('Card generation phase failed:', error);
        }
    }

    /**
     * Send private celebration card to celebrant
     * @param {Object} moment - Moment details
     * @param {Object} card - Celebration card
     * @param {Object} conversationReference - Teams conversation
     */
    async sendPrivateCelebrationCard(moment, card, conversationReference) {
        console.log(`💌 Sending private celebration card to ${moment.person_name}`);
        
        // This would use Teams SDK to send a private message
        // Implementation depends on how you identify the celebrant's Teams ID
        
        // For now, log the card that would be sent
        console.log('Celebration card:', JSON.stringify(card, null, 2));
    }

    /**
     * Send team summary card
     * @param {Object} card - Summary card
     * @param {Object} conversationReference - Teams conversation
     */
    async sendTeamSummary(card, conversationReference) {
        console.log(`📊 Sending team summary card`);
        
        // This would send to the team channel
        console.log('Summary card:', JSON.stringify(card, null, 2));
    }
}

module.exports = { WorkflowOrchestrator };
```

## 📊 **Analytics & Tracking**

### **Analytics Manager (Culture OS/src/app/analyticsManager.js)**
```javascript
class AnalyticsManager {
    constructor() {
        this.apiClient = new ThunaiAPIClient();
    }

    /**
     * Track moment completion metrics
     * @param {number} momentId - Moment ID
     */
    async trackMomentCompletion(momentId) {
        try {
            const moment = await this.apiClient.getMoment(momentId);
            const greetings = await this.apiClient.getGreetingsForMoment(momentId);
            
            const analytics = {
                moment_id: momentId,
                moment_type: moment.moment_type,
                total_greetings: greetings.length,
                participation_rate: this.calculateParticipationRate(greetings.length),
                completion_time: new Date().toISOString(),
                days_to_complete: this.calculateDaysToComplete(moment.created_at)
            };

            console.log('📊 Moment Analytics:', analytics);
            
            // Store analytics (would extend database schema)
            // await this.apiClient.createAnalytics(analytics);

        } catch (error) {
            console.error('Failed to track moment completion:', error);
        }
    }

    calculateParticipationRate(greetingCount) {
        // Assuming average team size of 10 for calculation
        const estimatedTeamSize = 10;
        return Math.min(greetingCount / estimatedTeamSize, 1.0);
    }

    calculateDaysToComplete(createdAt) {
        const created = new Date(createdAt);
        const completed = new Date();
        return Math.ceil((completed - created) / (1000 * 60 * 60 * 24));
    }
}

module.exports = { AnalyticsManager };
```

---
**This comprehensive workflow implementation covers the complete CultureOS journey from moment detection to final card delivery, with proper scheduling, user interactions, and analytics tracking.**