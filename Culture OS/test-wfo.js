/**
 * WFO Testing Script
 * ==================
 * Test both user-triggered keywords and configuration management
 * 
 * Usage:
 * 1. Start system with start-all.ps1
 * 2. Run this script: node test-wfo.js
 * 3. Test keywords in Teams chat: "Week" or "Daily"
 */

const config = require('./src/config');
const WFOHandler = require('./src/wfo/WFOHandler');
const { GroqChatModel } = require('./src/app/groqChatModel');

async function testWFOConfiguration() {
    console.log('\n🧪 WFO TESTING SCRIPT');
    console.log('======================');
    
    try {
        // Initialize components
        const groqModel = new GroqChatModel({
            apiKey: config.groqApiKey,
            model: config.groqModelName
        });
        
        const wfoHandler = new WFOHandler(groqModel);
        
        console.log('\n📋 Current WFO Configuration:');
        console.log('===============================');
        const configStatus = wfoHandler.getConfigStatus();
        console.log(JSON.stringify(configStatus, null, 2));
        
        console.log('\n🔄 Testing Configuration Toggles:');
        console.log('==================================');
        
        // Test toggling testing mode
        console.log('\n1. Testing Mode Toggle:');
        const testModeResult = wfoHandler.toggleTestingMode(false);
        console.log(`   Previous: ${testModeResult.previous} → Current: ${testModeResult.current}`);
        
        // Toggle back
        wfoHandler.toggleTestingMode(true);
        console.log(`   Toggled back to: ${wfoHandler.getConfigStatus().testingMode.enabled}`);
        
        // Test toggling proactive scheduling
        console.log('\n2. Proactive Scheduling Toggle:');
        const proactiveResult = wfoHandler.toggleProactiveScheduling(true);
        console.log(`   Previous: ${proactiveResult.previous} → Current: ${proactiveResult.current}`);
        
        console.log('\n🎯 Testing Keyword Detection:');
        console.log('===============================');
        
        const testMessages = [
            'Week',
            'WEEKLY',
            'weekly routine',
            'Daily',
            'DAILY',
            'daily routine',
            'hello world',
            'tell me a joke'
        ];
        
        for (const message of testMessages) {
            const canHandle = wfoHandler.canHandle(message, { userId: 'test_user' });
            console.log(`   "${message}" → ${canHandle ? '✅ WFO handles' : '❌ Passes through'}`);
        }
        
        console.log('\n🏥 Health Check:');
        console.log('=================');
        const healthCheck = await wfoHandler.healthCheck();
        console.log(JSON.stringify(healthCheck, null, 2));
        
        console.log('\n📊 Configuration Summary:');
        console.log('==========================');
        console.log(`🧪 Testing Mode: ${configStatus.testingMode.enabled ? 'ENABLED' : 'DISABLED'}`);
        console.log(`🔤 User Triggered: ${configStatus.testingMode.userTriggered ? 'ENABLED' : 'DISABLED'}`);
        console.log(`⏰ Proactive Scheduling: ${configStatus.proactiveScheduling.enabled ? 'ENABLED' : 'DISABLED'}`);
        console.log(`🗓️ Weekly Collection: ${configStatus.proactiveScheduling.weeklyCollection.enabled ? 'ENABLED' : 'DISABLED'} (${configStatus.proactiveScheduling.weeklyCollection.dayOfWeek === 5 ? 'Friday' : 'Day ' + configStatus.proactiveScheduling.weeklyCollection.dayOfWeek} ${configStatus.proactiveScheduling.weeklyCollection.hour}:${configStatus.proactiveScheduling.weeklyCollection.minute.toString().padStart(2, '0')})`);
        console.log(`🌅 Monday Follow-up: ${configStatus.proactiveScheduling.mondayFollowup.enabled ? 'ENABLED' : 'DISABLED'} (${configStatus.proactiveScheduling.mondayFollowup.dayOfWeek === 1 ? 'Monday' : 'Day ' + configStatus.proactiveScheduling.mondayFollowup.dayOfWeek} ${configStatus.proactiveScheduling.mondayFollowup.hour}:${configStatus.proactiveScheduling.mondayFollowup.minute.toString().padStart(2, '0')})`);
        console.log(`📅 Daily Reminder: ${configStatus.proactiveScheduling.dailyReminder.enabled ? 'ENABLED' : 'DISABLED'} (${configStatus.proactiveScheduling.dailyReminder.hour}:${configStatus.proactiveScheduling.dailyReminder.minute.toString().padStart(2, '0')})`);
        
        console.log('\n✅ WFO Testing Complete!');
        console.log('\n🎮 How to Test in Teams:');
        console.log('=========================');
        console.log('1. Start the system: .\\start-all.ps1');
        console.log('2. Open Teams and message the bot');
        console.log('3. Type "Week" → Should trigger weekly WFO collection');
        console.log('4. Type "Daily" → Should trigger daily WFO collection');
        console.log('5. Respond with your WFO plans in any format');
        console.log('6. Confirm when asked (1 for Yes, 2 for No)');
        console.log('\n💡 Remember: Both testing and scheduled modes can run simultaneously!');
        
    } catch (error) {
        console.error('\n❌ WFO Testing Error:', error);
        console.error('Stack:', error.stack);
    }
}

// Run the test if this file is executed directly
if (require.main === module) {
    testWFOConfiguration();
}

module.exports = { testWFOConfiguration };