/**
 * Friendly Response Generator - WFO Module
 * =========================================
 * 
 * KEY DESIGN PRINCIPLES IMPLEMENTATION:
 * 1. ✅ Zero Coupling: Independent response generation, no shared utilities
 * 2. ✅ LLM-First: All responses generated via Groq model, no templates
 * 3. ✅ Flexible Input: Handles any data structure for confirmation generation
 * 4. ✅ Context-Aware: Generates responses based on conversation context
 * 5. ✅ Smart Collection: Friendly tone encourages participation without pressure
 * 6. ✅ Confirmation-Based: Specializes in generating confirmation messages
 * 
 * Generates colleague-friendly responses without technical/database language
 * Maintains warm, human tone for all interactions
 */

class FriendlyResponseGenerator {
    constructor(groqModel) {
        this.groqModel = groqModel;
    }

    /**
     * Generate friendly confirmation message for moments
     */
    async generateMomentConfirmation(momentData) {
        const prompt = `
        Generate a friendly colleague confirmation message for this detected celebration:
        
        Person: ${momentData.person_name}
        Type: ${momentData.moment_type}
        Date: ${momentData.moment_date || 'not specified'}
        Description: ${momentData.description || 'celebration'}
        
        TONE: Warm, friendly colleague - NOT technical
        AVOID: "database", "system", "application", "data", "record"
        USE: Natural, human language like talking to a friend
        
        Ask for confirmation in a casual way.
        
        Example: "That sounds wonderful! Just to make sure I got it right - you're saying it's John's birthday tomorrow? Should I help coordinate a team greeting for him?"
        `;

        try {
            const response = await this.callLLM(prompt);
            return this.cleanResponse(response);
        } catch (error) {
            // Fallback friendly message
            return `That sounds like a great celebration! Just to confirm - you're talking about ${momentData.person_name}'s ${momentData.moment_type}? Should I help the team coordinate something special?`;
        }
    }

    /**
     * Generate friendly WFO confirmation message
     */
    async generateWFOConfirmation(wfoData) {
        const officeDays = Object.entries(wfoData.days_extracted)
            .filter(([day, status]) => status === 'office')
            .map(([day, status]) => this.capitalizeDay(day));

        const prompt = `
        Generate a friendly colleague confirmation for office plans:
        
        Office days: ${officeDays.join(', ')}
        Total office days: ${wfoData.total_office_days}
        
        TONE: Casual colleague planning together - NOT technical
        AVOID: "database", "system", "data extraction", "processing"
        USE: Natural planning language like coordinating with a work buddy
        
        Confirm their plans casually and mention coordination.
        
        Example: "Great! So you'll be in the office on Monday and Wednesday - that works perfectly for me! Should I note this down so we can coordinate our work?"
        `;

        try {
            const response = await this.callLLM(prompt);
            return this.cleanResponse(response);
        } catch (error) {
            // Fallback friendly message
            return `Perfect! So you're planning to be in the office on ${officeDays.join(' and ')}. That's great - we can coordinate our time together! Should I make a note of this?`;
        }
    }

    /**
     * Generate friendly success messages (NO DATABASE LANGUAGE)
     */
    async generateSuccessMessage(type, data) {
        const prompts = {
            moment_saved: `
                Generate a warm, friendly response for successfully noting a celebration.
                
                Person: ${data.person_name}
                Type: ${data.moment_type}
                
                TONE: Excited colleague who's happy to help coordinate
                AVOID: "saved to database", "recorded", "stored", "data"
                USE: "I'll remember", "I've got it noted", "I'll make sure", "I'll coordinate"
                
                Focus on the human aspect - helping the team celebrate together.
            `,
            
            wfo_saved: `
                Generate a casual, friendly response for noting office plans.
                
                Office days: ${data.office_days || 'office days'}
                
                TONE: Colleague who's coordinating schedules together  
                AVOID: "database", "system updated", "data saved"
                USE: "Got it!", "Perfect!", "I'll remember", "We're all set"
                
                Focus on coordination and working together.
            `
        };

        try {
            const response = await this.callLLM(prompts[type] || prompts.moment_saved);
            return this.cleanResponse(response);
        } catch (error) {
            // Fallback messages
            const fallbacks = {
                moment_saved: `Wonderful! I've got it noted and I'll help make sure the team knows about ${data.person_name}'s special day. This is going to be great! 🎉`,
                wfo_saved: `Perfect! I've got your office plans noted. Looking forward to coordinating our time together! 😊`,
                wfo_confirmed_and_saved: `Excellent! I've got your ${data.routineType || 'weekly'} office schedule saved. Thanks for confirming - this will help everyone coordinate! 🏢✨`,
                wfo_cancelled: `No worries! ${data.canRetry ? 'Feel free to let me know if you want to try again later.' : 'Let me know if you need anything else!'} 😊`
            };
            return fallbacks[type] || fallbacks.moment_saved;
        }
    }

    /**
     * Generate direct LLM responses for casual chat
     */
    async generateCasualResponse(message, intent) {
        const prompt = `
        Respond to this casual message as a friendly, helpful colleague:
        
        Message: "${message}"
        Intent: ${intent}
        
        TONE: Warm, friendly colleague - personable and helpful
        BE: Natural, conversational, supportive
        AVOID: Technical language, formal responses
        
        If they ask for jokes, recipes, help - be genuinely helpful and friendly.
        Keep it conversational like talking to a work friend.
        `;

        try {
            const response = await this.callLLM(prompt);
            return this.cleanResponse(response);
        } catch (error) {
            return "I'd love to help with that! Could you tell me a bit more about what you're looking for?";
        }
    }

    /**
     * Helper methods
     */
    async callLLM(prompt) {
        const messages = [
            { role: 'system', content: 'You are a warm, friendly colleague. Be natural and conversational, never technical.' },
            { role: 'user', content: prompt }
        ];
        return await this.groqModel.sendChatCompletion(messages);
    }

    cleanResponse(response) {
        // Handle both string and object responses from Groq API
        const responseText = typeof response === 'string' ? response : response.content || response.message || String(response);
        
        // Remove any technical terms that might slip through
        return responseText
            .replace(/database/gi, 'my notes')
            .replace(/system/gi, 'I')
            .replace(/application/gi, 'I') 
            .replace(/data/gi, 'information')
            .replace(/record/gi, 'note')
            .replace(/stored/gi, 'noted')
            .replace(/processing/gi, 'working on')
            .trim();
    }

    capitalizeDay(day) {
        return day.charAt(0).toUpperCase() + day.slice(1);
    }
}

module.exports = { FriendlyResponseGenerator };