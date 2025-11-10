/**
 * Test WFO Handler with API Integration
 */

const { GroqChatModel } = require('./src/app/groqChatModel');
const WFOHandler = require('./src/wfo/WFOHandler');
const config = require('./src/config');

async function testWFOWithAPI() {
    console.log('🌐 Testing WFO Handler with API Integration\n');
    
    try {
        // Initialize WFO Handler
        console.log('1. Initializing WFO Handler...');
        const groqModel = new GroqChatModel({
            apiKey: config.groqApiKey,
            model: config.groqModelName
        });
        
        const wfoHandler = new WFOHandler(groqModel);
        console.log('✅ WFO Handler initialized\n');
        
        // Test API connection
        console.log('2. Testing WFO API connection...');
        const apiConnected = await wfoHandler.wfoAPI.testConnection();
        console.log(`API Connected: ${apiConnected ? '✅' : '❌'}\n`);
        
        if (!apiConnected) {
            console.log('⚠️  WFO API not available. Please start the WFO API service:');
            console.log('   cd wfo-prediction-api');
            console.log('   python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload');
            return;
        }
        
        // Test conversation flow
        const userId = 'Alex Wilber';
        console.log('3. Testing conversation flow...\n');
        
        // Step 1: User says "Week"
        console.log('👤 User: "Week"');
        const canHandle1 = await wfoHandler.canHandle('Week', { userId });
        console.log(`🔍 Can handle: ${canHandle1}`);
        
        if (canHandle1) {
            const response1 = await wfoHandler.process('Week', { userId });
            console.log('🤖 Bot:', response1.message);
            console.log('📊 State:', response1.conversationState);
        }
        console.log('');
        
        // Step 2: User responds with schedule
        console.log('👤 User: "Tuesday and Thursday"');
        const canHandle2 = await wfoHandler.canHandle('Tuesday and Thursday', { userId });
        console.log(`🔍 Can handle: ${canHandle2}`);
        
        if (canHandle2) {
            const response2 = await wfoHandler.process('Tuesday and Thursday', { userId });
            console.log('🤖 Bot:', response2.message);
            console.log('📊 State:', response2.conversationState);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack:', error.stack);
    }
}

// Run test
testWFOWithAPI();