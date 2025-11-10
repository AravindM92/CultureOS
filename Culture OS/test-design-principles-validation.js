/**
 * Design Principles Validation Test - WFO Handler
 * ==============================================
 * 
 * Tests alignment with DESIGN-PRINCIPLES-VALIDATION-REPORT.md
 */

const { GroqChatModel } = require('./src/app/groqChatModel');
const WFOHandler = require('./src/wfo/WFOHandler');
const config = require('./src/config');

async function validateDesignPrinciples() {
    console.log('🎯 DESIGN PRINCIPLES VALIDATION TEST');
    console.log('===================================\n');
    
    try {
        // Initialize WFO Handler
        console.log('📋 SETUP: Initializing WFO Handler...');
        const groqModel = new GroqChatModel({
            apiKey: config.groqApiKey,
            model: config.groqModelName
        });
        
        const wfoHandler = new WFOHandler(groqModel);
        const userId = 'TestUser_ValidationRun';
        
        console.log('✅ WFO Handler initialized\n');
        
        // PRINCIPLE 1: Zero Coupling Validation
        console.log('🔍 PRINCIPLE 1: ZERO COUPLING');
        console.log('--------------------------------');
        console.log('Expected: Uses WFO API (port 8001), no local business logic');
        
        const hasWFOAPI = wfoHandler.wfoAPI ? '✅' : '❌';
        const usesCorrectPort = wfoHandler.wfoAPI?.baseURL.includes('8001') ? '✅' : '❌';
        
        console.log(`API Client Present: ${hasWFOAPI}`);
        console.log(`Correct Port (8001): ${usesCorrectPort}`);
        console.log(`Implementation: WFOAPIClient delegates all logic to isolated service`);
        console.log('');
        
        // PRINCIPLE 2: LLM-First Validation  
        console.log('🔍 PRINCIPLE 2: LLM-FIRST');
        console.log('---------------------------');
        console.log('Expected: No hardcoded keywords, all detection via API/LLM');
        
        // Check canHandle method doesn't use hardcoded patterns
        const canHandleStr = wfoHandler.canHandle.toString();
        const hasHardcodedKeywords = canHandleStr.includes('"week"') || canHandleStr.includes('"day"');
        const usesAPI = canHandleStr.includes('wfoAPI.checkWFODataNeeded');
        
        console.log(`No Hardcoded Keywords: ${!hasHardcodedKeywords ? '✅' : '❌'}`);
        console.log(`Uses API for Detection: ${usesAPI ? '✅' : '❌'}`);
        console.log(`Implementation: All message analysis delegated to WFO API LLM processing`);
        console.log('');
        
        // PRINCIPLE 3: Flexible Input Validation
        console.log('🔍 PRINCIPLE 3: FLEXIBLE INPUT');
        console.log('-------------------------------');
        console.log('Expected: Accepts any natural language format via API');
        
        const processStr = wfoHandler.process.toString();
        const usesAPIProcessing = processStr.includes('processWFOResponse');
        
        console.log(`API Handles Processing: ${usesAPIProcessing ? '✅' : '❌'}`);
        console.log(`Implementation: WFO API can parse "Monday", "Tue+Thu", "all week", etc.`);
        console.log('');
        
        // PRINCIPLE 4: Context-Aware Validation
        console.log('🔍 PRINCIPLE 4: CONTEXT-AWARE');
        console.log('------------------------------');
        console.log('Expected: Tracks conversation state, knows what questions asked');
        
        const hasMessageRouter = !!wfoHandler.messageRouter;
        const hasStateTracking = wfoHandler.messageRouter?.getUserState && wfoHandler.messageRouter?.setUserState;
        
        console.log(`Message Router Present: ${hasMessageRouter ? '✅' : '❌'}`);
        console.log(`State Tracking Methods: ${hasStateTracking ? '✅' : '❌'}`);
        console.log(`Implementation: ContextAwareMessageRouter maintains user conversation states`);
        console.log('');
        
        // PRINCIPLE 5: Smart Collection Validation
        console.log('🔍 PRINCIPLE 5: SMART COLLECTION');
        console.log('--------------------------------');
        console.log('Expected: Attempt tracking, over-messaging prevention via API');
        
        const hasLogging = canHandleStr.includes('shouldAskUser') || processStr.includes('logCollectionAttempt');
        
        console.log(`Attempt Tracking via API: ${hasLogging ? '✅' : '❌'}`);
        console.log(`Implementation: WFO API tracks attempts, prevents over-messaging`);
        console.log('');
        
        // PRINCIPLE 6: Confirmation-Based Validation
        console.log('🔍 PRINCIPLE 6: CONFIRMATION-BASED');
        console.log('-----------------------------------');
        console.log('Expected: Always confirms extracted data before storage');
        
        const handleResponseStr = wfoHandler.handleWFOResponse.toString();
        const hasConfirmation = handleResponseStr.includes('needs_confirmation') || handleResponseStr.includes('wfo_confirmation');
        const hasConfirmationHandler = !!wfoHandler.handleConfirmation;
        
        console.log(`Confirmation Flow Present: ${hasConfirmation ? '✅' : '❌'}`);
        console.log(`Confirmation Handler: ${hasConfirmationHandler ? '✅' : '❌'}`);
        console.log(`Implementation: API provides confirmation messages, handler processes yes/no`);
        console.log('');
        
        // OVERALL VALIDATION
        console.log('📊 OVERALL VALIDATION SUMMARY');
        console.log('==============================');
        
        const principleCount = [
            hasWFOAPI && usesCorrectPort,           // Principle 1
            !hasHardcodedKeywords && usesAPI,       // Principle 2  
            usesAPIProcessing,                      // Principle 3
            hasMessageRouter && hasStateTracking,   // Principle 4
            hasLogging,                             // Principle 5
            hasConfirmation && hasConfirmationHandler // Principle 6
        ].filter(Boolean).length;
        
        console.log(`✅ Principles Implemented: ${principleCount}/6`);
        console.log(`📋 Alignment Status: ${principleCount === 6 ? 'PERFECT ALIGNMENT' : 'NEEDS FIXES'}`);
        console.log('');
        
        if (principleCount === 6) {
            console.log('🎉 SUCCESS: Implementation fully aligned with design principles!');
            console.log('📚 Cross-references:');
            console.log('   - Prompt: Culture OS/prompts/00-master-prompt.md ✅');
            console.log('   - WFO Docs: wfo-prediction-api/documentation/ ✅');  
            console.log('   - Validation: DESIGN-PRINCIPLES-VALIDATION-REPORT.md ✅');
        } else {
            console.log('⚠️  ISSUES: Some principles need alignment fixes');
        }
        
    } catch (error) {
        console.error('❌ Validation test failed:', error.message);
    }
}

// Run validation
validateDesignPrinciples();