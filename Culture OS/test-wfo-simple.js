/**
 * Simple WFO Test - Debug the exact issue
 */

const { GroqChatModel } = require('./src/app/groqChatModel');
const WFOHandler = require('./src/wfo/WFOHandler');
const config = require('./src/config');

async function testSimpleWFO() {
    console.log('🔍 Testing Simple WFO Logic\n');
    
    try {
        // Initialize WFO Handler
        console.log('1. Initializing WFO Handler...');
        const groqModel = new GroqChatModel({
            apiKey: config.groqApiKey,
            model: config.groqModelName
        });
        
        const wfoHandler = new WFOHandler(groqModel);
        console.log('✅ WFO Handler initialized');
        
        // Test the exact conversation
        const testUserId = 'Alex Wilber';
        const testMessages = [
            'Week',
            'all day', 
            'all days next week',
            'Tuesday and Thursday'
        ];
        
        console.log('\n2. Testing conversation flow...\n');
        
        for (let i = 0; i < testMessages.length; i++) {
            const message = testMessages[i];
            console.log(`--- Message ${i + 1}: "${message}" ---`);
            
            // Check if WFO can handle it
            const canHandle = wfoHandler.canHandle(message, { userId: testUserId });
            console.log(`   Can handle: ${canHandle}`);
            
            if (canHandle) {
                try {
                    // Process the message
                    const result = await wfoHandler.process(message, { userId: testUserId });
                    console.log(`   ✅ Response: ${result.message}`);
                    console.log(`   State: ${result.conversationState}`);
                } catch (error) {
                    console.log(`   ❌ Error processing: ${error.message}`);
                    console.log(`   Error details:`, error);
                }
            } else {
                console.log(`   ❌ WFO Handler cannot handle this message`);
            }
            
            console.log('');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack:', error.stack);
    }
}

// Run test
testSimpleWFO();