// Simple WFO Handler - Manual Mode Only (Original Design)
const axios = require('axios');

class WFOHandler {
    constructor() {
        this.conversationStates = new Map(); // Simple state tracking
        this.wfoApiUrl = 'http://localhost:8001';
        console.log('🏢 WFO Handler initialized - Simple manual mode');
    }

    // Simple trigger detection
    canHandle(message, userContext = {}) {
        const userId = userContext.userId;
        
        // Check if user is in WFO conversation
        if (this.conversationStates.has(userId)) {
            return true;
        }
        
        // Check for trigger words
        const messageLower = message.toLowerCase().trim();
        return messageLower === 'week' || messageLower === 'daily';
    }

    // Simple process method
    async process(message, userContext = {}) {
        const userId = userContext.userId;
        const messageLower = message.toLowerCase().trim();
        
        // Check if user is in conversation
        const userState = this.conversationStates.get(userId);
        
        if (!userState) {
            // Start new WFO conversation
            if (messageLower === 'week') {
                this.conversationStates.set(userId, { type: 'weekly', step: 'waiting_response' });
                return {
                    type: 'wfo_question',
                    message: 'Hey! 👋 Could you share your office plans for next week? (e.g., "Monday to Wednesday" or "Tues, Thurs, Fri")'
                };
            } else if (messageLower === 'daily') {
                this.conversationStates.set(userId, { type: 'daily', step: 'waiting_response' });
                return {
                    type: 'wfo_question', 
                    message: 'Hi! 👋 What\'s your office plan for tomorrow?'
                };
            }
        } else {
            // User is responding - this will be handled by main LLM in app.js
            return {
                type: 'wfo_process_with_llm',
                message: message,
                userId: userId,
                wfoType: userState.type,
                needsLLMProcessing: true
            };
        }
    }

    // Save WFO data to API (DB only)
    async saveWFOData(userId, wfoData) {
        try {
            const response = await axios.post(`${this.wfoApiUrl}/api/v1/availability/save`, {
                user_id: userId,
                schedule_data: wfoData
            });
            return response.data;
        } catch (error) {
            console.error('[WFO] Error saving data:', error.message);
            throw error;
        }
    }

    // Clear user conversation state
    clearUserState(userId) {
        this.conversationStates.delete(userId);
    }

    // Get user conversation state
    getUserState(userId) {
        return this.conversationStates.get(userId);
    }
}

module.exports = WFOHandler;