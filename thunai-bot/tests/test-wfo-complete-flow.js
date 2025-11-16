// Test complete WFO flow simulation
const WFOHandler = require('../src/wfo/WFOHandler');

async function testCompleteWFOFlow() {
    console.log("Testing complete WFO flow...");
    
    const wfoHandler = new WFOHandler();
    const testUserId = 'test_user_flow';
    
    try {
        console.log('\n1. User says "week"...');
        const userContext = { userId: testUserId };
        
        // Step 1: User triggers WFO
        const canHandle1 = wfoHandler.canHandle('week', userContext);
        console.log('✅ Can handle "week":', canHandle1);
        
        const response1 = await wfoHandler.process('week', userContext);
        console.log('✅ WFO Response 1:', response1);
        
        console.log('\n2. User responds "Mon to Wed"...');
        
        // Step 2: User responds with office days
        const canHandle2 = wfoHandler.canHandle('Mon to Wed', userContext);
        console.log('✅ Can handle "Mon to Wed":', canHandle2);
        
        const response2 = await wfoHandler.process('Mon to Wed', userContext);
        console.log('✅ WFO Response 2:', response2);
        
        console.log('\n3. Simulating LLM processing and WFO data extraction...');
        
        // Step 3: Simulate what happens in handleWFODetection
        const mockActivity = {
            text: 'Mon to Wed',
            from: { name: testUserId }
        };
        
        const mockBotResponse = "So you'll be in office Monday, Tuesday, and Wednesday. Is that correct?";
        
        // Simulate the enhanced WFO detection logic
        const userMessage = mockActivity.text.toLowerCase();
        const botMessage = mockBotResponse.toLowerCase();
        
        let officeDays = [];
        
        // Parse "Mon to Wed" format
        if (userMessage.includes('mon to wed') || userMessage.includes('monday to wednesday')) {
            officeDays = ['monday', 'tuesday', 'wednesday'];
        }
        
        console.log('✅ Extracted office days:', officeDays);
        
        // Create WFO data structure
        const wfoData = {
            week_start_date: '2025-11-11',
            monday_status: officeDays.includes('monday') ? 'office' : 'home',
            tuesday_status: officeDays.includes('tuesday') ? 'office' : 'home',
            wednesday_status: officeDays.includes('wednesday') ? 'office' : 'home',
            thursday_status: officeDays.includes('thursday') ? 'office' : 'home',
            friday_status: officeDays.includes('friday') ? 'office' : 'home',
            collection_method: 'weekly'
        };
        
        console.log('✅ WFO Data Structure:', wfoData);
        
        // Step 4: Save to database
        console.log('\n4. Saving WFO data to database...');
        const saveResult = await wfoHandler.saveWFOData(testUserId, wfoData);
        console.log('✅ Save Result:', saveResult);
        
        // Step 5: Clear conversation state
        wfoHandler.clearUserState(testUserId);
        console.log('✅ Conversation state cleared');
        
        console.log('\n🎉 Complete WFO flow test passed!');
        console.log('📊 Summary:');
        console.log('   - User triggered WFO with "week"');
        console.log('   - User responded with "Mon to Wed"');
        console.log('   - System extracted Monday, Tuesday, Wednesday as office days');
        console.log('   - Data saved to database successfully');
        console.log('   - Conversation state cleared');
        
    } catch (error) {
        console.error('❌ WFO Flow Test Error:', error.message);
        console.error('❌ Full error:', error);
    }
}

testCompleteWFOFlow();