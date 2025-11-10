/**
 * Proper WFO Conversation Test - Simulates real conversation flow
 */

const { GroqChatModel } = require('./src/app/groqChatModel');
const WFOHandler = require('./src/wfo/WFOHandler');
const config = require('./src/config');

async function testRealConversation() {
    console.log('🗣️ Testing Real WFO Conversation Flow\n');
    
    try {
        // Initialize ONE WFO Handler instance (like in real bot)
        console.log('1. Initializing WFO Handler...');
        const groqModel = new GroqChatModel({
            apiKey: config.groqApiKey,
            model: config.groqModelName
        });
        
        const wfoHandler = new WFOHandler(groqModel);
        const userId = 'Alex Wilber';
        console.log('✅ WFO Handler initialized\n');
        
        // Simulate REAL conversation
        console.log('2. Starting conversation...\n');
        
        // Step 1: User says "Week"
        console.log('👤 User: "Week"');
        let response = await wfoHandler.process('Week', { userId });
        console.log('🤖 Bot:', response.message);
        console.log('📊 State:', response.conversationState);
        console.log('');
        
        // Step 2: User responds with office plan
        console.log('👤 User: "Tuesday and Thursday"');
        const canHandle2 = wfoHandler.canHandle('Tuesday and Thursday', { userId });
        console.log('🔍 Can handle response:', canHandle2);
        
        if (canHandle2) {
            response = await wfoHandler.process('Tuesday and Thursday', { userId });
            console.log('🤖 Bot:', response.message);
            console.log('📊 State:', response.conversationState);
        } else {
            console.log('❌ Bot cannot handle the response');
        }
        console.log('');
        
        // Step 3: User confirms
        console.log('👤 User: "Yes, correct"');
        const canHandle3 = wfoHandler.canHandle('Yes, correct', { userId });
        console.log('🔍 Can handle confirmation:', canHandle3);
        
        if (canHandle3) {
            response = await wfoHandler.process('Yes, correct', { userId });
            console.log('🤖 Bot:', response.message);
            console.log('📊 State:', response.conversationState);
        } else {
            console.log('❌ Bot cannot handle the confirmation');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack:', error.stack);
    }
}

// Run test
testRealConversation();