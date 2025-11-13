/**
 * Context-Aware Message Router - WFO Module
 * ==========================================
 * 
 * KEY DESIGN PRINCIPLES IMPLEMENTATION:
 * 1. ✅ Zero Coupling: Complete isolation from existing moment detection logic
 * 2. ✅ LLM-First: No hardcoded patterns, intelligent classification via Groq
 * 3. ✅ Flexible Input: Accepts any amount of WFO data from users
 * 4. ✅ Context-Aware: Tracks conversation state, knows what questions were asked
 * 5. ✅ Smart Collection: Prevents over-messaging with state tracking
 * 6. ✅ Confirmation-Based: Always confirms extracted data before storage
 * 
 * Proper approach: Track conversation state and route based on context
 * LLM only processes responses when we know what question was asked
 */

class ContextAwareMessageRouter {
    constructor(groqModel) {
        this.groqModel = groqModel;
        this.conversationStates = new Map(); // userId -> current state
    }

    /**
     * Route message based on CONVERSATION CONTEXT, not universal detection
     * This is the correct approach for multi-module bot
     */
    async routeMessage(message, userId, conversationContext = {}) {
        
        // 1. Check if this is a response to a specific question
        const currentState = this.conversationStates.get(userId);
        
        if (currentState) {
            console.log(`[DEBUG] User ${userId} responding to: ${currentState.expectingResponseFor}`);
            return await this.handleContextualResponse(message, userId, currentState);
        }
        
        // 2. Check if this is a proactive trigger (system-initiated)
        const proactiveCheck = await this.checkProactiveTriggers(userId);
        if (proactiveCheck.shouldTrigger) {
            return await this.handleProactiveTrigger(proactiveCheck, userId, message);
        }
        
        // 3. Detect new conversation intent (user-initiated)
        return await this.detectNewIntent(message, userId, conversationContext);
    }

    /**
     * Handle responses when we KNOW what we asked about
     */
    async handleContextualResponse(message, userId, currentState) {
        const { expectingResponseFor, questionData } = currentState;
        
        switch (expectingResponseFor) {
            case 'wfo_collection':
            case 'waiting_wfo_weekly_response':
            case 'waiting_wfo_daily_response':
                console.log('[CONTEXT] Processing WFO response');
                return await this.processWFOResponse(message, userId, questionData);
                
            case 'moment_confirmation':
                console.log('[CONTEXT] Processing moment confirmation');
                return await this.processMomentConfirmation(message, userId, questionData);
                
            case 'wfo_confirmation':
            case 'waiting_wfo_weekly_confirmation':
            case 'waiting_wfo_daily_confirmation':
                console.log('[CONTEXT] Processing WFO confirmation');
                return await this.processWFOConfirmation(message, userId, questionData);
                
            case 'food_order':
                console.log('[CONTEXT] Processing food order');
                return await this.processFoodOrder(message, userId, questionData);
                
            case 'parking_booking':
                console.log('[CONTEXT] Processing parking booking');
                return await this.processParkingBooking(message, userId, questionData);
                
            default:
                console.log('[CONTEXT] Unknown expectation, clearing state');
                this.clearState(userId);
                return await this.detectNewIntent(message, userId);
        }
    }

    /**
     * Process moment confirmation when user responds to moment detection
     */
    async processMomentConfirmation(message, userId, questionData) {
        const confirmationPrompt = `
        User was asked to confirm a detected moment: "${JSON.stringify(questionData.detectedMoment)}"
        User responded: "${message}"
        
        Is this a confirmation (yes) or denial (no)?
        
        Return JSON:
        {
            "confirmed": true/false,
            "confidence": 0.9
        }
        `;

        try {
            const llmResponse = await this.callLLM(confirmationPrompt);
            const confirmation = this.parseJSON(llmResponse);
            
            this.clearState(userId);
            
            if (confirmation.confirmed && confirmation.confidence > 0.7) {
                return {
                    route: 'moments_confirmed',
                    data: questionData.detectedMoment,
                    originalMessage: questionData.originalMessage,
                    processingMethod: 'user_confirmed'
                };
            } else {
                return {
                    route: 'moments_cancelled',
                    data: { reason: 'User declined or unclear response' },
                    processingMethod: 'user_declined'
                };
            }
            
        } catch (error) {
            console.error('[ERROR] Moment confirmation failed:', error);
            this.clearState(userId);
            return { route: 'error', error: error.message };
        }
    }

    /**
     * Process WFO confirmation after data extraction
     * PRINCIPLE: Confirmation-Based - Always confirms extracted data before storage
     */
    async processWFOConfirmation(message, userId, questionData) {
        const confirmationPrompt = `
        User was asked to confirm their WFO data:
        Routine: ${questionData.routineType || 'weekly'}
        Extracted: ${JSON.stringify(questionData.extractedWFOData)}
        Summary: "${questionData.extractedWFOData.summary || 'WFO schedule'}"
        
        User responded: "${message}"
        
        Analyze if this is:
        1. Confirmation (yes, correct, save it, looks good, etc.)
        2. Denial/Changes wanted (no, wrong, change it, not right, etc.)
        
        Return JSON:
        {
            "confirmed": true/false,
            "confidence": 0.9,
            "user_intent": "confirmed|denied|unclear"
        }
        `;

        try {
            const llmResponse = await this.callLLM(confirmationPrompt);
            const confirmation = this.parseJSON(llmResponse);
            
            console.log(`[WFO] Confirmation result for ${userId}:`, confirmation);
            
            this.clearState(userId);
            
            if (confirmation.confirmed && confirmation.confidence > 0.7) {
                // CONFIRMED - Save the WFO data
                const saveResult = await this.saveWFOData(userId, questionData);
                
                return {
                    route: 'wfo_confirmed_and_saved',
                    data: {
                        extractedData: questionData.extractedWFOData,
                        saveResult: saveResult,
                        routineType: questionData.routineType,
                        targetPeriod: questionData.targetPeriod
                    },
                    originalQuestion: questionData.originalQuestion,
                    processingMethod: 'wfo_user_confirmed_and_saved'
                };
            } else {
                // DENIED - Offer to re-ask or clarify
                return {
                    route: 'wfo_cancelled',
                    data: { 
                        reason: 'User wants changes or declined',
                        extractedData: questionData.extractedWFOData,
                        routineType: questionData.routineType,
                        canRetry: true
                    },
                    processingMethod: 'wfo_user_declined'
                };
            }
            
        } catch (error) {
            console.error('[ERROR] WFO confirmation failed:', error);
            this.clearState(userId);
            return { 
                route: 'error', 
                error: error.message,
                data: { context: 'wfo_confirmation' }
            };
        }
    }

    /**
     * Save WFO data to database (integrates with WFO API)
     */
    async saveWFOData(userId, questionData) {
        try {
            const wfoData = questionData.extractedWFOData;
            const routineType = questionData.routineType;
            
            // Prepare data for WFO API
            const savePayload = {
                user_name: userId,
                week_start_date: wfoData.target_period || questionData.targetPeriod,
                monday_status: wfoData.days_extracted?.monday || 'unknown',
                tuesday_status: wfoData.days_extracted?.tuesday || 'unknown',
                wednesday_status: wfoData.days_extracted?.wednesday || 'unknown',
                thursday_status: wfoData.days_extracted?.thursday || 'unknown',
                friday_status: wfoData.days_extracted?.friday || 'unknown',
                confidence_score: wfoData.confidence || 0.8,
                notes: `${routineType} collection: ${wfoData.summary || 'User provided WFO schedule'}`,
                collection_method: routineType,
                source: 'user_triggered_testing'
            };
            
            console.log(`[WFO] Saving data for ${userId}:`, savePayload);
            
            // TODO: Integrate with WFO API endpoint
            // const response = await fetch(`${config.wfo.apiUrl}/wfo/availability/collect`, {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(savePayload)
            // });
            
            // For now, simulate successful save
            const mockSaveResult = {
                success: true,
                id: Date.now(),
                saved_at: new Date().toISOString(),
                data_saved: savePayload
            };
            
            // Update collection attempt to mark as successful
            await this.updateCollectionAttempt(userId, routineType, true);
            
            return mockSaveResult;
            
        } catch (error) {
            console.error('[WFO] Error saving WFO data:', error);
            
            // Update collection attempt to mark as failed
            await this.updateCollectionAttempt(userId, questionData.routineType, false);
            
            throw error;
        }
    }

    /**
     * Update collection attempt status
     */
    async updateCollectionAttempt(userId, routineType, success) {
        try {
            // TODO: Update wfo_collection_attempts table
            console.log(`[WFO] Updating collection attempt: ${userId}, ${routineType}, success: ${success}`);
            
            // This would integrate with WFO API to update the attempt logged earlier
            
        } catch (error) {
            console.error('[WFO] Error updating collection attempt:', error);
        }
    }

    /**
     * Process WFO response when we know we asked about WFO
     * PRINCIPLE: Flexible Input - Accepts any amount of WFO data from users
     */
    async processWFOResponse(message, userId, questionData) {
        const routineType = questionData.routineType || 'weekly'; // weekly or daily
        const targetPeriod = routineType === 'daily' ? questionData.targetDate : questionData.weekStart;
        
        const processingPrompt = `
        CONTEXT: User was asked about WFO (Work From Office) plans
        Routine Type: ${routineType}
        Target Period: ${targetPeriod}
        Question Asked: "${questionData.originalQuestion || 'WFO availability question'}"
        User Response: "${message}"
        
        TASK: Extract WFO availability data with maximum flexibility
        
        PRINCIPLES:
        1. Accept ANY amount of data - partial schedules are OK
        2. Handle natural language formats
        3. For "Daily" routine, user can still provide weekly data
        4. Default unknown days to 'unknown' status
        
        EXTRACTION RULES:
        - Days: monday, tuesday, wednesday, thursday, friday
        - Status per day: "office", "home", "hybrid", "leave", "unknown"
        - Extract whatever data is provided, don't assume missing days
        
        EXAMPLES:
        "Monday and Tuesday office" → {"monday": "office", "tuesday": "office"}
        "WFH Wednesday and Thursday" → {"wednesday": "home", "thursday": "home"}  
        "In office Mon-Wed" → {"monday": "office", "tuesday": "office", "wednesday": "office"}
        "Tomorrow office" → {tomorrow_day: "office"}
        "Full week from home" → all days: "home"
        
        Return JSON:
        {
            "routine_type": "${routineType}",
            "target_period": "${targetPeriod}",
            "days_extracted": {
                "monday": "office|home|hybrid|leave|unknown",
                "tuesday": "office|home|hybrid|leave|unknown",
                "wednesday": "office|home|hybrid|leave|unknown", 
                "thursday": "office|home|hybrid|leave|unknown",
                "friday": "office|home|hybrid|leave|unknown"
            },
            "total_office_days": 3,
            "has_partial_data": true,
            "confidence": 0.9,
            "summary": "Readable summary of extracted schedule",
            "needs_clarification": false,
            "extracted_from": "natural language response"
        }
        `;

        try {
            const llmResponse = await this.callLLM(processingPrompt);
            const wfoData = this.parseJSON(llmResponse);
            
            console.log(`[WFO] Extracted data for ${userId}:`, wfoData);
            
            // Set confirmation state based on routine type
            const confirmationState = routineType === 'daily' ? 
                'waiting_wfo_daily_confirmation' : 'waiting_wfo_weekly_confirmation';
            
            this.setState(userId, {
                expectingResponseFor: confirmationState,
                questionData: {
                    extractedWFOData: wfoData,
                    originalQuestion: questionData.originalQuestion,
                    originalResponse: message,
                    routineType: routineType,
                    targetPeriod: targetPeriod
                }
            });
            
            return {
                route: 'wfo_confirmation_needed',
                data: wfoData,
                originalQuestion: questionData.originalQuestion,
                needsConfirmation: true,
                processingMethod: 'wfo_extracted_needs_confirmation',
                routineType: routineType
            };
            
        } catch (error) {
            console.error('[ERROR] WFO response processing failed:', error);
            
            // Graceful fallback - ask for clarification
            return {
                route: 'wfo_clarification_needed',
                data: { 
                    originalMessage: message,
                    error: 'Could not parse WFO data',
                    routineType: routineType
                },
                processingMethod: 'wfo_clarification_fallback'
            };
        }
    }

    /**
     * Detect new conversation intent (user-initiated)
     */
    async detectNewIntent(message, userId, conversationContext = {}) {
        const intentPrompt = `
        Analyze this message to detect the user's intent for starting a new conversation.
        
        Message: "${message}"
        
        Classify as ONE of these intents:
        1. "moment_sharing" - User sharing a celebration, birthday, anniversary, achievement (OPERATIONAL)
        2. "casual_chat" - Jokes, recipes, weather, general conversation, fun questions (NON-OPERATIONAL)
        3. "information_request" - Asking for facts, help, explanations (NON-OPERATIONAL)  
        4. "admin_command" - Administrative commands, system operations (OPERATIONAL)
        
        IMPORTANT: 
        - If user asks for jokes, recipes, casual chat, fun questions → "casual_chat" (NON-OPERATIONAL)
        - If user shares celebrations, achievements → "moment_sharing" (OPERATIONAL - needs confirmation)
        - Most conversations are NON-OPERATIONAL and should get direct LLM responses
        
        If "moment_sharing", extract:
        - person_name: who is being celebrated
        - moment_type: birthday, anniversary, promotion, achievement, etc.
        - when: date if mentioned
        
        Return JSON:
        {
            "intent": "moment_sharing|general_chat|admin_command|help_request",
            "confidence": 0.8,
            "extracted_data": {},
            "reasoning": "explanation"
        }
        `;

        try {
            const llmResponse = await this.callLLM(intentPrompt);
            const intent = this.parseJSON(llmResponse);
            
            if (intent.intent === 'moment_sharing' && intent.confidence > 0.7) {
                // OPERATIONAL: Needs confirmation before proceeding
                this.setState(userId, {
                    expectingResponseFor: 'moment_confirmation',
                    questionData: {
                        detectedMoment: intent.extracted_data,
                        originalMessage: message
                    }
                });
                
                return {
                    route: 'moments_confirmation',
                    data: intent.extracted_data,
                    needsConfirmation: true,
                    processingMethod: 'operational_detection'
                };
            }
            
            if (intent.intent === 'casual_chat' || intent.intent === 'information_request') {
                // NON-OPERATIONAL: Direct LLM response
                return {
                    route: 'direct_llm',
                    data: { originalMessage: message, intent: intent.intent },
                    processingMethod: 'non_operational'
                };
            }
            
            return {
                route: 'direct_llm',
                data: { originalMessage: message },
                processingMethod: 'default_non_operational'
            };
            
        } catch (error) {
            console.error('[ERROR] Intent detection failed:', error);
            return { route: 'general', data: {}, error: error.message };
        }
    }

    /**
     * Check if system should proactively trigger any module
     */
    async checkProactiveTriggers(userId) {
        try {
            // Check WFO API if collection needed
            const wfoCheck = await fetch(`http://localhost:8001/wfo/api/v1/availability/check/${userId}`);
            const wfoData = await wfoCheck.json();
            
            if (wfoData.collection_needed) {
                return {
                    shouldTrigger: true,
                    module: 'wfo',
                    data: wfoData
                };
            }
            
            // TODO: Add other module checks (food reminders, parking notifications, etc.)
            
            return { shouldTrigger: false };
            
        } catch (error) {
            console.error('[ERROR] Proactive check failed:', error);
            return { shouldTrigger: false };
        }
    }

    /**
     * Handle proactive system-initiated interactions
     */
    async handleProactiveTrigger(trigger, userId, message) {
        switch (trigger.module) {
            case 'wfo':
                // Set expectation state BEFORE asking question
                this.setState(userId, {
                    expectingResponseFor: 'wfo_collection',
                    questionData: {
                        originalQuestion: trigger.data.message_template,
                        targetWeek: trigger.data.week_target,
                        collectionType: trigger.data.collection_type
                    },
                    timestamp: new Date().toISOString()
                });
                
                return {
                    route: 'wfo_proactive',
                    data: trigger.data,
                    message: trigger.data.message_template,
                    expectingResponse: true
                };
                
            // TODO: Add other proactive modules
            default:
                return { route: 'general', data: {} };
        }
    }

    /**
     * Conversation state management
     */
    setState(userId, state) {
        this.conversationStates.set(userId, state);
        console.log(`[STATE] Set for ${userId}:`, state);
    }

    clearState(userId) {
        this.conversationStates.delete(userId);
        console.log(`[STATE] Cleared for ${userId}`);
    }

    getState(userId) {
        return this.conversationStates.get(userId) || null;
    }

    getUserState(userId) {
        return this.conversationStates.get(userId) || null;
    }

    setUserState(userId, state) {
        this.conversationStates.set(userId, state);
    }

    /**
     * Helper methods
     */
    async callLLM(prompt) {
        const messages = [
            { role: 'system', content: 'You are an expert message processor. Return only valid JSON.' },
            { role: 'user', content: prompt }
        ];
        return await this.groqModel.sendChatCompletion(messages);
    }

    parseJSON(response) {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("No JSON found");
        return JSON.parse(jsonMatch[0]);
    }
}

/**
 * COMPLETE INTEGRATION EXAMPLE:
 * 
 * // Initialize router and response generator
 * const router = new ContextAwareMessageRouter(groqModel);
 * const friendlyResponses = new FriendlyResponseGenerator(groqModel);
 * 
 * // Route message with proper context
 * const routing = await router.routeMessage(message, userId, conversationContext);
 * 
 * switch(routing.route) {
 *   case 'direct_llm':
 *     // NON-OPERATIONAL: Jokes, recipes, casual chat
 *     const casualResponse = await friendlyResponses.generateCasualResponse(
 *       routing.data.originalMessage, routing.data.intent
 *     );
 *     return sendMessage(casualResponse);
 *     
 *   case 'moments_confirmation':
 *     // OPERATIONAL: Ask for moment confirmation
 *     const momentConfirm = await friendlyResponses.generateMomentConfirmation(routing.data);
 *     return sendMessage(momentConfirm);
 *     
 *   case 'moments_confirmed':
 *     // Save moment and send friendly success
 *     await saveMomentToAPI(routing.data);
 *     const momentSuccess = await friendlyResponses.generateSuccessMessage('moment_saved', routing.data);
 *     return sendMessage(momentSuccess);
 *     
 *   case 'wfo_proactive':
 *     // System asking user about WFO
 *     return sendMessage(routing.message);
 *     
 *   case 'wfo_confirmation_needed':
 *     // Ask for WFO confirmation
 *     const wfoConfirm = await friendlyResponses.generateWFOConfirmation(routing.data);
 *     return sendMessage(wfoConfirm);
 *     
 *   case 'wfo_confirmed':
 *     // Save WFO data and send friendly success
 *     await saveWFOToAPI(routing.data);
 *     const wfoSuccess = await friendlyResponses.generateSuccessMessage('wfo_saved', routing.data);
 *     return sendMessage(wfoSuccess);
 *     
 *   case 'moments_cancelled':
 *   case 'wfo_cancelled':
 *     return sendMessage("No problem! Let me know if there's anything else I can help with! 😊");
 * }
 */

module.exports = { ContextAwareMessageRouter };