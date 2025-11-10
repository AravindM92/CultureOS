/**
 * Universal LLM-First Message Detector (JavaScript)
 * ================================================
 * Replaces ALL hardcoded detection patterns with LLM intelligence
 * Handles both Moments and WFO detection without hardcoded keywords
 */

class UniversalMessageDetector {
    constructor(groqModel) {
        this.groqModel = groqModel;
    }

    /**
     * Universal message classification using LLM ONLY
     * NO hardcoded patterns - pure AI intelligence
     * 
     * @param {string} message - User message to classify
     * @param {Object} userContext - Additional user context
     * @returns {Object} Classification result
     */
    async detectMessageIntent(message, userContext = {}) {
        const classificationPrompt = `
        Analyze this message and classify its intent. Return JSON only.
        
        Message: "${message}"
        User Context: ${JSON.stringify(userContext)}
        
        Classify into one of these categories:
        1. "moment" - User sharing celebration, achievement, birthday, anniversary, promotion, etc.
        2. "wfo_response" - User responding about work from office plans/availability  
        3. "wfo_proactive" - System should ask about WFO plans (trigger collection)
        4. "general" - General conversation
        5. "admin" - Administrative commands
        
        If "moment", extract:
        - moment_type: birthday, work_anniversary, promotion, achievement, new_hire, lwd, other
        - person_name: who is being celebrated
        - moment_date: when (if mentioned)
        - description: what happened
        
        If "wfo_response", extract:
        - days_mentioned: array of days user mentioned
        - availability: object with day -> status mapping
        - time_period: tomorrow, this_week, next_week, specific_dates
        - office_days_count: number of office days mentioned
        
        Return JSON format:
        {
            "intent": "moment|wfo_response|wfo_proactive|general|admin",
            "confidence": 0.0-1.0,
            "extracted_data": {},
            "reasoning": "why you classified it this way"
        }
        `;

        try {
            const messages = [
                { role: 'system', content: 'You are an expert message classifier. Return only valid JSON.' },
                { role: 'user', content: classificationPrompt }
            ];

            const llmResponse = await this.groqModel.sendChatCompletion(messages);
            const classification = this.parseLLMResponse(llmResponse);
            
            // Add metadata
            classification.original_message = message;
            classification.user_context = userContext;
            classification.processing_method = "llm_only";
            classification.timestamp = new Date().toISOString();
            
            return classification;
            
        } catch (error) {
            console.error('[ERROR] LLM classification failed:', error);
            
            // Fallback classification
            return {
                intent: "general",
                confidence: 0.1,
                extracted_data: {},
                reasoning: `LLM classification failed: ${error.message}`,
                original_message: message,
                fallback_used: true,
                error: error.message
            };
        }
    }

    /**
     * Parse and validate LLM JSON response
     */
    parseLLMResponse(llmResponse) {
        try {
            // Extract JSON from response
            const jsonMatch = llmResponse.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error("No JSON found in LLM response");
            }

            const classification = JSON.parse(jsonMatch[0]);
            
            // Validate and set defaults
            classification.intent = classification.intent || "general";
            classification.confidence = classification.confidence || 0.5;
            classification.extracted_data = classification.extracted_data || {};
            classification.reasoning = classification.reasoning || "Default classification";
            
            return classification;
            
        } catch (error) {
            throw new Error(`Invalid JSON from LLM: ${error.message}`);
        }
    }

    /**
     * Check if message is a moment (celebration/achievement)
     */
    isMomentMessage(classification) {
        return classification.intent === "moment" && classification.confidence > 0.6;
    }

    /**
     * Check if message is WFO response 
     */
    isWFOResponse(classification) {
        return classification.intent === "wfo_response" && classification.confidence > 0.6;
    }

    /**
     * Check if should trigger WFO collection
     */
    needsWFOCollection(classification) {
        return classification.intent === "wfo_proactive" && classification.confidence > 0.7;
    }

    /**
     * Route message based on LLM classification
     * REPLACES ALL hardcoded if/includes patterns
     */
    async routeMessage(message, userContext) {
        const classification = await this.detectMessageIntent(message, userContext);
        
        console.log('[DEBUG] Message classification:', {
            intent: classification.intent,
            confidence: classification.confidence,
            reasoning: classification.reasoning
        });

        if (this.isMomentMessage(classification)) {
            return {
                route: 'moments',
                classification,
                data: classification.extracted_data
            };
        } 
        
        if (this.isWFOResponse(classification)) {
            return {
                route: 'wfo_response',
                classification, 
                data: classification.extracted_data
            };
        }
        
        if (this.needsWFOCollection(classification)) {
            return {
                route: 'wfo_collection',
                classification,
                data: classification.extracted_data
            };
        }

        return {
            route: 'general',
            classification,
            data: {}
        };
    }
}

/**
 * INTEGRATION EXAMPLE - Replace hardcoded detection:
 * 
 * // OLD HARDCODED WAY (❌ REMOVE):
 * function detectMomentType(message) {
 *   if (message.includes('birthday')) return 'birthday';
 *   if (message.includes('promotion')) return 'promotion';
 *   // ... hardcoded patterns
 * }
 * 
 * // NEW LLM WAY (✅ USE):
 * const detector = new UniversalMessageDetector(groqModel);
 * const routing = await detector.routeMessage(message, userContext);
 * 
 * switch(routing.route) {
 *   case 'moments':
 *     return handleMoment(routing.data);
 *   case 'wfo_response': 
 *     return handleWFOResponse(routing.data);
 *   case 'wfo_collection':
 *     return triggerWFOCollection(routing.data);
 *   default:
 *     return handleGeneral(routing.data);
 * }
 */

module.exports = { UniversalMessageDetector };