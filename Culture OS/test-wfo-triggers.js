/**
 * Test script for WFO Handler - User-triggered testing modes
 * Tests "Week" and "Daily" keyword detection and workflow processing
 */

const { WFOHandler } = require('./src/wfo/WFOHandler');

async function testWFOTriggers() {
    console.log('🧪 Testing WFO Handler - User-triggered modes\n');
    
    const wfoHandler = new WFOHandler();
    const testUserId = 'test_user_123';
    
    // Test cases for keyword detection
    const testMessages = [
        // Weekly triggers
        'Week',
        'week',
        'WEEK',
        'Weekly check-in please',
        
        // Daily triggers  
        'Daily',
        'daily',
        'DAILY',
        'Daily routine time',
        
        // Non-triggers
        'Hello there',
        'How are you?',
        'What about next week?',
        'I had a great day',
    ];
    
    console.log('=== Testing Keyword Detection ===\n');
    
    for (const message of testMessages) {
        const canHandle = wfoHandler.canHandle(message);
        console.log(`Message: "${message}" → Can Handle: ${canHandle ? '✅' : '❌'}`);
    }
    
    console.log('\n=== Testing Weekly Workflow ===\n');
    
    try {
        // Test weekly trigger
        const weeklyResponse = await wfoHandler.handleMessage('Week', testUserId);
        console.log('Weekly Trigger Response:');
        console.log(JSON.stringify(weeklyResponse, null, 2));
        
    } catch (error) {
        console.error('Weekly test failed:', error.message);
    }
    
    console.log('\n=== Testing Daily Workflow ===\n');
    
    try {
        // Test daily trigger
        const dailyResponse = await wfoHandler.handleMessage('Daily', testUserId);
        console.log('Daily Trigger Response:');
        console.log(JSON.stringify(dailyResponse, null, 2));
        
    } catch (error) {
        console.error('Daily test failed:', error.message);
    }
    
    console.log('\n=== Testing Configuration ===\n');
    
    const config = require('./src/config');
    console.log('WFO Configuration:');
    console.log(`- Testing Mode: ${config.wfo?.testingMode?.enabled}`);
    console.log(`- Weekly Enabled: ${config.wfo?.testingMode?.weeklyEnabled}`);
    console.log(`- Daily Enabled: ${config.wfo?.testingMode?.dailyEnabled}`);
    console.log(`- Proactive Enabled: ${config.wfo?.proactiveScheduling?.enabled}`);
    
    console.log('\n🎉 WFO Handler testing complete!');
}

// Run the test
if (require.main === module) {
    testWFOTriggers().catch(console.error);
}

module.exports = { testWFOTriggers };