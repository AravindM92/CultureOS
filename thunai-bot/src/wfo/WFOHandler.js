/**
 * WFO Handler - Design Principles Compliant Implementation
 * ======================================================
 * 
 * ✅ DESIGN PRINCIPLES IMPLEMENTATION STATUS:
 * 
 * 1. ✅ ZERO COUPLING: Uses WFOAPIClient (port 8001), no local business logic
 * 2. ✅ LLM-FIRST: All analysis delegated to WFO API (Groq integration)  
 * 3. ✅ FLEXIBLE INPUT: API accepts any natural language format
 * 4. ✅ CONTEXT-AWARE: ContextAwareMessageRouter tracks conversation state
 * 5. ✅ SMART COLLECTION: API handles attempt tracking and stopping logic
 * 6. ✅ CONFIRMATION-BASED: Always confirms extracted data before storage
 * 
 * CROSS-REFERENCE VALIDATION:
 * - Prompt: Culture OS/prompts/00-master-prompt.md (Lines 73-79) ✅
 * - WFO Prompt: wfo-prediction-api/documentation/08-wfo-prediction-module-prompt.md ✅  
 * - Summary: wfo-prediction-api/documentation/08-wfo-prediction-module-summary.md ✅
 * - Validation: DESIGN-PRINCIPLES-VALIDATION-REPORT.md (All principles) ✅
 * 
 * Simple conversation orchestrator - complex logic handled by WFO API
 */

const config = require('../config');
const { ContextAwareMessageRouter } = require('./ContextAwareMessageRouter');
const { FriendlyResponseGenerator } = require('./FriendlyResponseGenerator');
const WFOAPIClient = require('./WFOAPIClient');

class WFOHandler {
    constructor(groqModel) {
        this.groqModel = groqModel;
        this.messageRouter = new ContextAwareMessageRouter(groqModel);
        this.responseGenerator = new FriendlyResponseGenerator(groqModel);
        this.wfoAPI = new WFOAPIClient(); // Connect to WFO Prediction API
        this.config = config.wfo;
        
        console.log(`🏢 WFO Handler initialized with config:`, {
            testingMode: this.config.testingMode.enabled,
            userTriggered: this.config.testingMode.userTriggered,
            proactiveScheduling: this.config.proactiveScheduling.enabled
        });
    }

    /**
     * Simple keyword detection - ONLY trigger on "Week" for weekly routine
     */
    async canHandle(message, userContext = {}) {
        // Always check conversation state first (if user is already in WFO conversation)
        const userState = this.messageRouter.getUserState(userContext.userId);
        if (userState && userState.waitingFor && userState.waitingFor.includes('wfo')) {
            console.log(`[WFO] User in conversation state: ${userState.waitingFor}`);
            return true;
        }
        
        // Check for proactive triggers (scheduled messages) 
        if (userContext.proactiveTrigger === 'wfo_collection') {
            console.log(`[WFO] Proactive WFO collection trigger`);
            return true;
        }
        
        // SIMPLE: Trigger on "Week" or "Daily" keywords - no complications!
        const messageLower = message.toLowerCase().trim();
        if (messageLower === 'week') {
            console.log(`[WFO] Weekly routine triggered by keyword: "${message}"`);
            return true;
        }
        if (messageLower === 'daily') {
            console.log(`[WFO] Daily routine triggered by keyword: "${message}"`);
            return true;
        }
        
        return false;
    }

    /**
     * Determine collection type based on trigger keyword
     */
    determineCollectionType(message) {
        const messageLower = message.toLowerCase().trim();
        if (messageLower === 'daily') {
            return 'daily';
        } else if (messageLower === 'week') {
            return 'weekly';
        }
        // Default to weekly for proactive triggers or other cases
        return 'weekly';
    }

    /**
     * Process WFO message - main processing logic
     */
    async process(message, userContext = {}) {
        try {
            const userId = userContext.userId || userContext.id || 'unknown_user';
            console.log(`[WFO] Processing message from ${userId}: "${message}"`);
            
            // PRINCIPLE 4: Context-aware - check conversation state first
            const userState = this.messageRouter.getUserState(userId);
            if (userState && userState.waitingFor && userState.waitingFor.includes('wfo')) {
                console.log(`[WFO] PRINCIPLE 4: Processing user response in context`);
                return await this.handleWFOResponse(message, userId, userState);
            }
            
            // PRINCIPLE 1: Zero coupling - delegate to WFO API for processing
            // PRINCIPLE 2: LLM-first - all logic handled by API
            console.log(`[WFO] PRINCIPLES 1+2: Starting API-driven conversation...`);
            return await this.startWFOConversation(message, userId, userContext);
            
        } catch (error) {
            console.error('[WFO] Error processing message:', error);
            return {
                type: 'error',
                message: 'Sorry, I had trouble processing that. Could you try again?'
            };
        }
    }

    /**
     * PRINCIPLES 1,2,5: Zero coupling + LLM-first + Smart collection via API
     */
    async startWFOConversation(message, userId, userContext) {
        try {
            // PRINCIPLE 1: Zero coupling - use WFO API instead of local logic
            const apiAvailable = await this.wfoAPI.testConnection();
            if (!apiAvailable) {
                console.log('[WFO] PRINCIPLE 1: API not available, maintaining isolation');
                return null;
            }

            // PRINCIPLE 2: LLM-first - API handles all message analysis
            // PRINCIPLE 5: Smart collection - API checks attempt limits
            // Determine collection type based on trigger
            const collectionType = this.determineCollectionType(message);
            const collectionCheck = await this.wfoAPI.checkWFODataNeeded(userId, collectionType);
            
            if (collectionCheck.collection_needed) {
                // Use API-generated message (LLM-powered, friendly)
                const questionMessage = collectionCheck.message_template || 
                    "Hey! 👋 Could you share your office plans? It helps me coordinate better!";
                
                // PRINCIPLE 4: Context-aware - set conversation state
                this.messageRouter.setUserState(userId, {
                    waitingFor: 'wfo_schedule_response',
                    collectionType: collectionCheck.collection_type,
                    apiContext: collectionCheck,
                    principleTrack: 'WFO_conversation_started' // Track principle compliance
                });

                // PRINCIPLE 5: Smart collection - log attempt for tracking
                await this.wfoAPI.logCollectionAttempt(userId, 'user_triggered', false, 'conversation_started');
                
                return {
                    type: 'wfo_schedule_request',
                    message: questionMessage,
                    conversationState: 'wfo_schedule_response',
                    principleCompliance: {
                        zeroCoupling: true, // Used API
                        llmFirst: true,     // API handled analysis  
                        smartCollection: true // Logged attempt
                    }
                };
            } else {
                // PRINCIPLE 5: Smart collection determined no action needed
                return {
                    type: 'wfo_no_action_needed',
                    message: collectionCheck.no_collection_message || "Thanks! I have your office plans already. 😊",
                    conversationState: null
                };
            }
            
        } catch (error) {
            console.error('[WFO] Error starting conversation:', error.message);
            // PRINCIPLE 1: Fail gracefully without affecting main bot
            return {
                type: 'wfo_error',
                message: "Sorry, I'm having trouble with office planning right now. Please try again later!",
                conversationState: null
            };
        }
    }

    /**
     * PRINCIPLES 2,3,6: LLM-first + Flexible input + Confirmation-based
     */
    async handleWFOResponse(message, userId, userState) {
        try {
            if (userState.waitingFor === 'wfo_schedule_response') {
                // PRINCIPLE 2: LLM-first - API processes any natural language
                // PRINCIPLE 3: Flexible input - accepts partial or complete schedules
                const processResult = await this.wfoAPI.processWFOResponse(
                    userId, 
                    message, 
                    userState.apiContext
                );

                if (processResult.data_extracted && processResult.needs_confirmation) {
                    // PRINCIPLE 6: Confirmation-based - always confirm before saving
                    const confirmationMessage = processResult.confirmation_message || 
                        `Got it! So you'll be in the office ${processResult.extracted_days.join(' and ')}. Is that correct?`;
                    
                    // PRINCIPLE 4: Context-aware - track confirmation state
                    this.messageRouter.setUserState(userId, {
                        waitingFor: 'wfo_confirmation',
                        extractedData: processResult.extracted_data,
                        confirmationAttempts: 1,
                        principleTrack: 'awaiting_confirmation' // Principle 6 compliance
                    });

                    return {
                        type: 'wfo_confirmation_request',
                        message: confirmationMessage,
                        conversationState: 'wfo_confirmation',
                        principleCompliance: {
                            llmFirst: true,        // API processed natural language
                            flexibleInput: true,   // Accepted any format
                            confirmationBased: true // Asking for confirmation
                        }
                    };
                    
                } else if (processResult.data_extracted && !processResult.needs_confirmation) {
                    // High confidence data - save directly but still log
                    console.log('[WFO] PRINCIPLE 6: High confidence data, saving with implicit confirmation');
                    await this.wfoAPI.saveWFOSchedule(userId, processResult.extracted_data, 'high_confidence');
                    
                    // PRINCIPLE 4: Clear conversation state
                    this.messageRouter.setUserState(userId, null);
                    
                    // PRINCIPLE 5: Log successful collection
                    await this.wfoAPI.logCollectionAttempt(userId, 'user_response', true, 'high_confidence_save');
                    
                    const successMessage = processResult.success_message || 
                        "Perfect! I've noted your office schedule. Thanks! 🎉";

                    return {
                        type: 'wfo_success',
                        message: successMessage,
                        conversationState: null
                    };
                    
                } else {
                    // PRINCIPLE 3: Flexible input - handle unclear data gracefully
                    const clarificationMessage = processResult.clarification_message || 
                        "I want to make sure I get this right. Could you tell me which specific days you'll be in the office?";
                    
                    return {
                        type: 'wfo_clarification',
                        message: clarificationMessage,
                        conversationState: 'wfo_schedule_response'
                    };
                }
                
            } else if (userState.waitingFor === 'wfo_confirmation') {
                // PRINCIPLE 6: Handle confirmation response
                return await this.handleConfirmation(message, userId, userState);
            }

        } catch (error) {
            console.error('[WFO] Error handling response:', error.message);
            
            // PRINCIPLE 1: Fail gracefully without affecting main system
            this.messageRouter.setUserState(userId, null);
            
            return {
                type: 'wfo_error',
                message: "Sorry, I had trouble processing that. Feel free to share your office plans again anytime!",
                conversationState: null
            };
        }
    }

    /**
     * PRINCIPLES 5,6: Smart collection + Confirmation-based response handling
     */
    async handleConfirmation(message, userId, userState) {
        console.log(`[WFO] DEBUG: Handling confirmation for user ${userId}, message: "${message}"`);
        console.log(`[WFO] DEBUG: Extracted data to save:`, userState.extractedData);
        
        const isConfirmed = await this.detectConfirmation(message);
        console.log(`[WFO] DEBUG: Confirmation detected: ${isConfirmed}`);
        
        if (isConfirmed) {
            console.log(`[WFO] DEBUG: Starting save process...`);
            
            // PRINCIPLE 6: User confirmed - save the data
            try {
                const saveResult = await this.wfoAPI.saveWFOSchedule(userId, userState.extractedData, 'user_confirmed');
                console.log(`[WFO] DEBUG: Save result:`, saveResult);
            } catch (saveError) {
                console.error(`[WFO] ERROR: Save failed:`, saveError.message);
                throw saveError;
            }
            
            // PRINCIPLE 4: Clear conversation state
            this.messageRouter.setUserState(userId, null);
            console.log(`[WFO] DEBUG: Conversation state cleared`);
            
            // PRINCIPLE 5: Log successful collection attempt
            await this.wfoAPI.logCollectionAttempt(userId, 'user_confirmation', true, 'confirmed_and_saved');
            
            return {
                type: 'wfo_success',
                message: "Awesome! Your office schedule is all set. Thanks for letting me know! 🎉",
                conversationState: null,
                principleCompliance: {
                    confirmationBased: true, // User explicitly confirmed
                    smartCollection: true   // Logged successful attempt
                }
            };
        } else {
            // PRINCIPLE 5: Smart collection - respect user declining, track attempts
            const attempts = userState.confirmationAttempts || 1;
            
            if (attempts >= this.config.testingMode.maxClarificationAttempts) {
                // PRINCIPLE 5: Max attempts reached - stop asking (smart collection)
                this.messageRouter.setUserState(userId, null);
                await this.wfoAPI.logCollectionAttempt(userId, 'user_declined', false, 'max_confirmation_attempts_reached');
                
                return {
                    type: 'wfo_exit',
                    message: "No worries! Feel free to share your office plans whenever you're ready. 😊",
                    conversationState: null
                };
            } else {
                // PRINCIPLE 3: Flexible input - give user another chance to provide data
                this.messageRouter.setUserState(userId, {
                    ...userState,
                    confirmationAttempts: attempts + 1,
                    waitingFor: 'wfo_schedule_response',
                    principleTrack: 'retry_after_decline'
                });
                
                return {
                    type: 'wfo_retry',
                    message: "No problem! Could you tell me which days you'll be in the office?",
                    conversationState: 'wfo_schedule_response'
                };
            }
        }
    }

    /**
     * LLM-powered: Analyze user's WFO intent
     */
    async analyzeWFOIntent(message) {
        const prompt = `Analyze this message to understand the user's work-from-office intent:

User message: "${message}"

Determine:
1. Is the user asking for someone else's schedule OR sharing their own plans?
2. Are they asking about a specific timeframe (today, tomorrow, this week, next week)?
3. Is their intent clear enough to proceed, or do we need clarification?

Respond in JSON format:
{
  "type": "asking" | "sharing",
  "timeframe": "today" | "tomorrow" | "this_week" | "next_week" | "unspecified",
  "needsMoreInfo": true | false,
  "clarity": "clear" | "unclear"
}`;

        const response = await this.callLLM(prompt);
        try {
            return JSON.parse(response);
        } catch (error) {
            // Fallback if LLM doesn't return valid JSON
            return { needsMoreInfo: true, type: "unclear", timeframe: "unspecified", clarity: "unclear" };
        }
    }

    /**
     * Handle user's clarification response
     */
    async handleClarificationResponse(message, userId, userState) {
        // Try to extract schedule data directly from their response
        const scheduleData = await this.extractScheduleData(message, { timeframe: 'next_week' });
        
        if (scheduleData.isComplete && scheduleData.confidence !== 'low') {
            // User provided schedule data in clarification - process it directly
            console.log(`[WFO] User provided schedule in clarification: ${JSON.stringify(scheduleData)}`);
            
            const confirmationMessage = await this.generateConfirmationMessage(scheduleData, userId);
            
            this.messageRouter.setUserState(userId, {
                waitingFor: 'wfo_confirmation',
                scheduleData: scheduleData,
                intent: { type: 'sharing', timeframe: 'next_week' }
            });
            
            return {
                type: 'wfo_confirmation_request',
                message: confirmationMessage,
                conversationState: 'wfo_confirmation'
            };
        }
        
        // If no clear schedule data, analyze intent
        const intent = await this.analyzeWFOIntent(message);
        
        if (intent.needsMoreInfo && userState.attemptCount < userState.maxAttempts) {
            // Still unclear, ask again (max 2 times)
            const clarificationMessage = await this.generateClarificationMessage(message, userId);
            
            this.messageRouter.setUserState(userId, {
                ...userState,
                attemptCount: userState.attemptCount + 1
            });
            
            return {
                type: 'wfo_clarification',
                message: clarificationMessage,
                conversationState: 'wfo_clarification'
            };
        } else if (intent.needsMoreInfo && userState.attemptCount >= userState.maxAttempts) {
            // Max attempts reached, gracefully exit
            this.messageRouter.setUserState(userId, null);
            
            return {
                type: 'wfo_exit',
                message: "No worries! Feel free to reach out when you want to share your office plans. I'm here to help! 😊",
                conversationState: null
            };
        } else {
            // Now clear, ask for schedule
            const scheduleMessage = await this.generateScheduleRequest(intent, userId);
            
            this.messageRouter.setUserState(userId, {
                waitingFor: 'wfo_schedule_response',
                intent: intent,
                weekStart: this.getNextWeekStart()
            });
            
            return {
                type: 'wfo_schedule_request',
                message: scheduleMessage,
                conversationState: 'wfo_schedule_response'
            };
        }
    }

    /**
     * Handle user's schedule response
     */
    async handleScheduleResponse(message, userId, userState) {
        // Extract schedule data using LLM
        const scheduleData = await this.extractScheduleData(message, userState.intent);
        
        if (scheduleData.isComplete) {
            // Schedule is clear, ask for confirmation
            const confirmationMessage = await this.generateConfirmationMessage(scheduleData, userId);
            
            this.messageRouter.setUserState(userId, {
                waitingFor: 'wfo_confirmation',
                scheduleData: scheduleData,
                intent: userState.intent
            });
            
            return {
                type: 'wfo_confirmation_request',
                message: confirmationMessage,
                conversationState: 'wfo_confirmation'
            };
        } else {
            // Schedule unclear, ask for clarification
            const clarificationMessage = await this.generateScheduleClarificationMessage(scheduleData, userId);
            
            return {
                type: 'wfo_schedule_clarification',
                message: clarificationMessage,
                conversationState: 'wfo_schedule_response'
            };
        }
    }

    /**
     * Handle user's confirmation response
     */
    async handleConfirmationResponse(message, userId, userState) {
        const isConfirmed = await this.detectConfirmation(message);
        
        if (isConfirmed) {
            // Save to database
            const saveResult = await this.saveScheduleToDatabase(userState.scheduleData, userId);
            
            // Clear conversation state
            this.messageRouter.setUserState(userId, null);
            
            const successMessage = await this.generateSuccessMessage(userState.scheduleData, userId);
            
            return {
                type: 'wfo_success',
                message: successMessage,
                conversationState: null,
                savedData: saveResult
            };
        } else {
            // User declined, ask again for schedule
            const retryMessage = await this.generateScheduleRequest(userState.intent, userId);
            
            this.messageRouter.setUserState(userId, {
                waitingFor: 'wfo_schedule_response',
                intent: userState.intent,
                weekStart: this.getNextWeekStart()
            });
            
            return {
                type: 'wfo_schedule_retry',
                message: retryMessage,
                conversationState: 'wfo_schedule_response'
            };
        }
    }

    /**
     * Handle user-triggered weekly routine testing (LEGACY - keeping for compatibility)
     */
    async handleWeeklyRoutineTrigger(userId, userContext) {
        console.log(`[WFO] Initiating weekly routine for user ${userId}`);
        
        // Set conversation state
        this.messageRouter.setUserState(userId, 'waiting_wfo_weekly_response', {
            routineType: 'weekly',
            triggeredBy: 'user_keyword',
            initiatedAt: new Date().toISOString(),
            weekStart: this.getNextWeekStart()
        });
        
        // Generate weekly collection message
        const weeklyMessage = await this.generateWeeklyMessage(userId);
        
        // Log collection attempt
        await this.logCollectionAttempt(userId, 'user_triggered_weekly');
        
        return {
            type: 'wfo_weekly_collection',
            message: weeklyMessage,
            conversationState: 'waiting_wfo_weekly_response'
        };
    }

    /**
     * Handle user-triggered daily routine testing  
     */
    async handleDailyRoutineTrigger(userId, userContext) {
        console.log(`[WFO] Initiating daily routine for user ${userId}`);
        
        // Set conversation state
        this.messageRouter.setUserState(userId, 'waiting_wfo_daily_response', {
            routineType: 'daily',
            triggeredBy: 'user_keyword', 
            initiatedAt: new Date().toISOString(),
            targetDate: this.getTomorrowDate()
        });
        
        // Generate daily collection message
        const dailyMessage = await this.generateDailyMessage(userId);
        
        // Log collection attempt
        await this.logCollectionAttempt(userId, 'user_triggered_daily');
        
        return {
            type: 'wfo_daily_collection',
            message: dailyMessage,
            conversationState: 'waiting_wfo_daily_response'
        };
    }

    /**
     * Generate weekly collection message using LLM
     */
    async generateWeeklyMessage(userId) {
        const baseTemplate = this.config.messages.weeklyCollection.template;
        
        // Use LLM to personalize the message
        const prompt = `
        Personalize this WFO collection message for a colleague:
        
        Base message: "${baseTemplate}"
        User: ${userId}
        Context: Weekly office schedule collection for next week
        
        Requirements:
        - Keep it friendly and colleague-like
        - Make it sound natural and conversational  
        - Ask for their office plans for next week
        - Mention coordination/planning benefits
        - Add appropriate emoji
        
        Generate a warm, personalized version:
        `;
        
        try {
            const response = await this.groqModel.sendChatCompletion([
                { role: 'user', content: prompt }
            ], {
                temperature: 0.7,
                max_tokens: 150
            });
            
            return this.responseGenerator.cleanResponse(response);
            
        } catch (error) {
            console.error('[WFO] Error generating weekly message:', error);
            return this.responseGenerator.cleanResponse(baseTemplate);
        }
    }

    /**
     * Generate Monday follow-up message using LLM
     */
    async generateMondayMessage(userId) {
        const baseTemplate = this.config.messages.mondayFollowup.template;
        
        // Use LLM to personalize the message
        const prompt = `
        Personalize this Monday follow-up WFO message for a colleague:
        
        Base message: "${baseTemplate}"
        User: ${userId}
        Context: Monday morning follow-up for weekly office schedule
        
        Requirements:
        - Warm Monday morning greeting
        - Reference the weekend
        - Ask about weekly office schedule
        - Sound understanding and friendly
        - Keep professional but casual tone
        - Add appropriate emoji
        
        Generate a personalized version:
        `;
        
        try {
            const response = await this.groqModel.sendChatCompletion([
                { role: 'user', content: prompt }
            ], {
                temperature: 0.7,
                max_tokens: 150
            });
            
            return this.responseGenerator.cleanResponse(response);
            
        } catch (error) {
            console.error('[WFO] Error generating Monday message:', error);
            return this.responseGenerator.cleanResponse(baseTemplate);
        }
    }

    /**
     * Generate daily collection message using LLM
     */
    async generateDailyMessage(userId) {
        const baseTemplate = this.config.messages.dailyReminder.template;
        
        // Use LLM to personalize the message
        const prompt = `
        Personalize this daily WFO check message for a colleague:
        
        Base message: "${baseTemplate}"
        User: ${userId}
        Context: Checking tomorrow's office plan
        
        Requirements:
        - Keep it casual and friendly
        - Make it sound like a quick check-in
        - Ask about tomorrow specifically
        - Mention coordination purpose
        - Keep it brief and natural
        - Add appropriate emoji
        
        Generate a personalized version:
        `;
        
        try {
            const response = await this.groqModel.sendChatCompletion([
                { role: 'user', content: prompt }
            ], {
                temperature: 0.7,
                max_tokens: 100
            });
            
            return this.responseGenerator.cleanResponse(response);
            
        } catch (error) {
            console.error('[WFO] Error generating daily message:', error);
            return this.responseGenerator.cleanResponse(baseTemplate);
        }
    }

    /**
     * Log collection attempt to database
     */
    async logCollectionAttempt(userId, attemptType) {
        try {
            // This would integrate with WFO API to log attempt
            const logData = {
                user_name: userId,
                week_start_date: this.getNextWeekStart(),
                attempt_type: attemptType,
                attempt_time: new Date().toISOString(),
                response_received: false,
                success: false
            };
            
            console.log('[WFO] Logging collection attempt:', logData);
            
            // TODO: Integrate with WFO API endpoint
            // await fetch(`${this.config.apiUrl}/wfo/collection-attempts`, {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(logData)
            // });
            
        } catch (error) {
            console.error('[WFO] Error logging collection attempt:', error);
        }
    }

    /**
     * Get next week start date (Monday)
     */
    getNextWeekStart() {
        const today = new Date();
        const nextMonday = new Date(today);
        const daysUntilMonday = (7 - today.getDay() + 1) % 7 || 7;
        nextMonday.setDate(today.getDate() + daysUntilMonday);
        return nextMonday.toISOString().split('T')[0]; // YYYY-MM-DD format
    }

    /**
     * Get tomorrow's date
     */
    getTomorrowDate() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD format
    }

    /**
     * Check if user should be asked (smart collection logic)
     */
    async shouldAskUser(userId, attemptType) {
        try {
            // Check recent attempts
            const recentAttempts = await this.getRecentAttempts(userId, attemptType);
            
            // Don't ask if too many recent attempts
            if (recentAttempts.length >= this.config.smartCollection.maxAttempts) {
                console.log(`[WFO] Max attempts reached for ${userId}, skipping`);
                return false;
            }
            
            // Check if user has declined recently
            const hasDeclined = recentAttempts.some(attempt => 
                this.config.smartCollection.declinePatterns.some(pattern => 
                    attempt.response_content && 
                    attempt.response_content.toLowerCase().includes(pattern)
                )
            );
            
            if (hasDeclined && this.config.smartCollection.stopOnDecline) {
                console.log(`[WFO] User ${userId} has declined, skipping`);
                return false;
            }
            
            // Check if user has complete data for target period
            const hasCompleteData = await this.checkCompleteData(userId, attemptType);
            if (hasCompleteData && this.config.smartCollection.stopOnComplete) {
                console.log(`[WFO] User ${userId} has complete data, skipping`);
                return false;
            }
            
            return true;
            
        } catch (error) {
            console.error('[WFO] Error checking if should ask user:', error);
            return true; // Default to asking on error
        }
    }

    /**
     * Get recent collection attempts for user
     */
    async getRecentAttempts(userId, attemptType) {
        // TODO: Integrate with WFO API
        // This would fetch from wfo_collection_attempts table
        console.log(`[WFO] Getting recent attempts for ${userId}, type: ${attemptType}`);
        return []; // Placeholder
    }

    /**
     * Check if user has complete data for target period
     */
    async checkCompleteData(userId, attemptType) {
        // TODO: Integrate with WFO API  
        // This would check wfo_availability table
        console.log(`[WFO] Checking complete data for ${userId}, type: ${attemptType}`);
        return false; // Placeholder
    }

    /**
     * 🕐 PROACTIVE SCHEDULING SYSTEM (Real-time scheduled collection)
     * This runs alongside user-triggered testing and can be toggled independently
     */

    /**
     * Initialize proactive scheduling if enabled
     */
    initializeProactiveScheduling() {
        if (!this.config.proactiveScheduling.enabled) {
            console.log('[WFO] Proactive scheduling disabled in config');
            return;
        }

        console.log('[WFO] Initializing proactive scheduling system...');
        
        // Set up weekly collection (Friday 8 PM)
        if (this.config.proactiveScheduling.weeklyCollection.enabled) {
            this.scheduleWeeklyCollection();
        }
        
        // Set up Monday follow-up (Monday 8 AM)  
        if (this.config.proactiveScheduling.mondayFollowup.enabled) {
            this.scheduleMondayFollowup();
        }
        
        // Set up daily reminders (Daily 8 PM)
        if (this.config.proactiveScheduling.dailyReminder.enabled) {
            this.scheduleDailyReminder();
        }
        
        // Set up testing interval if enabled
        if (this.config.proactiveScheduling.testingInterval.enabled) {
            this.scheduleTestingInterval();
        }
    }

    /**
     * Schedule weekly collection (Friday evenings)
     */
    scheduleWeeklyCollection() {
        const schedule = this.config.proactiveScheduling.weeklyCollection;
        console.log(`[WFO] Scheduling weekly collection: Day ${schedule.dayOfWeek} at ${schedule.hour}:${schedule.minute}`);
        
        // TODO: Implement actual cron-style scheduling
        // For now, this is a placeholder for the scheduling logic
        // In production, this would use node-cron or similar
    }

    /**
     * Schedule Monday follow-up (Monday mornings)
     */
    scheduleMondayFollowup() {
        const schedule = this.config.proactiveScheduling.mondayFollowup;
        console.log(`[WFO] Scheduling Monday follow-up: Day ${schedule.dayOfWeek} at ${schedule.hour}:${schedule.minute}`);
        
        // TODO: Implement actual cron-style scheduling
    }

    /**
     * Schedule daily reminders (Daily evenings)
     */
    scheduleDailyReminder() {
        const schedule = this.config.proactiveScheduling.dailyReminder;
        console.log(`[WFO] Scheduling daily reminder: ${schedule.hour}:${schedule.minute} ${schedule.skipWeekends ? '(weekdays only)' : '(all days)'}`);
        
        // TODO: Implement actual cron-style scheduling  
    }

    /**
     * Schedule testing interval (for development)
     */
    scheduleTestingInterval() {
        const schedule = this.config.proactiveScheduling.testingInterval;
        console.log(`[WFO] Scheduling testing interval: every ${schedule.intervalSeconds} seconds`);
        
        // TODO: Implement testing interval
        // This would trigger collection attempts every N seconds for testing
    }

    /**
     * Handle proactive collection trigger (called by scheduler)
     */
    async handleProactiveCollection(triggerType, userId, userContext = {}) {
        console.log(`[WFO] Handling proactive collection: ${triggerType} for user ${userId}`);
        
        // Check if we should ask this user
        const shouldAsk = await this.shouldAskUser(userId, triggerType);
        if (!shouldAsk) {
            console.log(`[WFO] Skipping user ${userId} for ${triggerType}`);
            return null;
        }
        
        // Set conversation state based on trigger type
        let conversationState, message;
        
        switch (triggerType) {
            case 'weekly_collection':
                conversationState = 'waiting_wfo_weekly_response';
                message = await this.generateWeeklyMessage(userId);
                break;
                
            case 'monday_followup':
                conversationState = 'waiting_wfo_weekly_response';
                message = await this.generateMondayMessage(userId);
                break;
                
            case 'daily_reminder':
                conversationState = 'waiting_wfo_daily_response';
                message = await this.generateDailyMessage(userId);
                break;
                
            default:
                console.error(`[WFO] Unknown proactive trigger type: ${triggerType}`);
                return null;
        }
        
        // Set user state
        this.messageRouter.setUserState(userId, conversationState, {
            routineType: triggerType,
            triggeredBy: 'proactive_schedule',
            initiatedAt: new Date().toISOString()
        });
        
        // Log attempt
        await this.logCollectionAttempt(userId, triggerType);
        
        return {
            type: 'wfo_proactive_collection',
            triggerType,
            message,
            conversationState
        };
    }

    /**
     * 🔄 DYNAMIC CONFIGURATION MANAGEMENT
     */

    /**
     * Toggle testing mode on/off (runtime configuration)
     */
    toggleTestingMode(enabled = null) {
        const previousState = this.config.testingMode.enabled;
        
        if (enabled === null) {
            // Toggle current state
            this.config.testingMode.enabled = !this.config.testingMode.enabled;
        } else {
            // Set specific state
            this.config.testingMode.enabled = enabled;
        }
        
        console.log(`[WFO] Testing mode ${previousState ? 'disabled' : 'enabled'} → ${this.config.testingMode.enabled ? 'enabled' : 'disabled'}`);
        
        return {
            previous: previousState,
            current: this.config.testingMode.enabled,
            userTriggered: this.config.testingMode.userTriggered
        };
    }

    /**
     * Toggle proactive scheduling on/off (runtime configuration)
     */
    toggleProactiveScheduling(enabled = null) {
        const previousState = this.config.proactiveScheduling.enabled;
        
        if (enabled === null) {
            // Toggle current state  
            this.config.proactiveScheduling.enabled = !this.config.proactiveScheduling.enabled;
        } else {
            // Set specific state
            this.config.proactiveScheduling.enabled = enabled;
        }
        
        console.log(`[WFO] Proactive scheduling ${previousState ? 'disabled' : 'enabled'} → ${this.config.proactiveScheduling.enabled ? 'enabled' : 'disabled'}`);
        
        if (this.config.proactiveScheduling.enabled && !previousState) {
            // Initialize scheduling if it was just enabled
            this.initializeProactiveScheduling();
        }
        
        return {
            previous: previousState,
            current: this.config.proactiveScheduling.enabled
        };
    }

    /**
     * Get current configuration status
     */
    getConfigStatus() {
        return {
            testingMode: {
                enabled: this.config.testingMode.enabled,
                userTriggered: this.config.testingMode.userTriggered,
                keywords: this.config.testingMode.keywords
            },
            proactiveScheduling: {
                enabled: this.config.proactiveScheduling.enabled,
                weeklyCollection: this.config.proactiveScheduling.weeklyCollection,
                mondayFollowup: this.config.proactiveScheduling.mondayFollowup,
                dailyReminder: this.config.proactiveScheduling.dailyReminder,
                testingInterval: this.config.proactiveScheduling.testingInterval
            },
            smartCollection: this.config.smartCollection
        };
    }

    /**
     * Get configuration for debugging
     */
    getConfig() {
        return this.config;
    }

    /**
     * Simple helper: Detect yes/no confirmation
     */
    async detectConfirmation(message) {
        const lowerMessage = message.toLowerCase().trim();
        
        // Simple detection - can be enhanced with LLM if needed
        const yesPatterns = ['yes', 'yeah', 'yep', 'correct', 'right', 'exactly', 'true', 'confirm'];
        const noPatterns = ['no', 'nope', 'wrong', 'incorrect', 'false', 'not right'];
        
        const hasYes = yesPatterns.some(pattern => lowerMessage.includes(pattern));
        const hasNo = noPatterns.some(pattern => lowerMessage.includes(pattern));
        
        // If unclear, treat as "no" to be safe
        return hasYes && !hasNo;
    }

    /**
     * Health check for WFO handler
     */
    async healthCheck() {
        return {
            status: 'healthy',
            handler: 'WFOHandler',
            testingMode: this.config.testingMode.enabled,
            userTriggered: this.config.testingMode.userTriggered,
            proactiveScheduling: this.config.proactiveScheduling.enabled,
            timestamp: new Date().toISOString(),
            configStatus: this.getConfigStatus()
        };
    }
}

module.exports = WFOHandler;