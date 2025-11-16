// Test WFO persistence to database
const axios = require('axios');

async function testWFOPersistence() {
    console.log("Testing WFO persistence to database...");
    
    const wfoApiUrl = 'http://localhost:8001';
    const testUserId = 'test_user_persistence';
    
    try {
        // Test 1: Check WFO API health
        console.log('\n1. Testing WFO API health...');
        const healthResponse = await axios.get(`${wfoApiUrl}/health`);
        console.log('✅ WFO API Health:', healthResponse.data);
        
        // Test 2: Save WFO data
        console.log('\n2. Testing WFO data save...');
        const wfoData = {
            user_id: testUserId,
            schedule_data: {
                week_start_date: '2025-11-11',
                monday_status: 'office',
                tuesday_status: 'office', 
                wednesday_status: 'office',
                thursday_status: 'home',
                friday_status: 'home',
                collection_method: 'weekly'
            }
        };
        
        const saveResponse = await axios.post(`${wfoApiUrl}/api/v1/availability/save`, wfoData);
        console.log('✅ WFO Save Response:', saveResponse.data);
        
        // Test 3: Retrieve saved data
        console.log('\n3. Testing WFO data retrieval...');
        const retrieveResponse = await axios.get(`${wfoApiUrl}/api/v1/availability/user/${testUserId}?week_start_date=2025-11-11`);
        console.log('✅ WFO Retrieved Data:', retrieveResponse.data);
        
        // Test 4: Check data needed
        console.log('\n4. Testing WFO data needed check...');
        const checkResponse = await axios.get(`${wfoApiUrl}/api/v1/availability/check/${testUserId}?week_start_date=2025-11-11`);
        console.log('✅ WFO Check Response:', checkResponse.data);
        
        console.log('\n🎉 All WFO persistence tests passed!');
        
    } catch (error) {
        console.error('❌ WFO Persistence Test Error:', error.message);
        if (error.response) {
            console.error('❌ Response Status:', error.response.status);
            console.error('❌ Response Data:', error.response.data);
        }
    }
}

testWFOPersistence();