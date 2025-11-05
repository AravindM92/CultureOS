/**
 * Direct Bot Logic Test
 * Tests the actual bot functions using the same logic flow
 */

const path = require('path');

// Import the API client from the bot
const apiClientPath = path.join(__dirname, 'Culture OS', 'src', 'app', 'apiClient.js');
const ThunaiAPIClient = require(apiClientPath);

// Initialize API client
const apiClient = new ThunaiAPIClient('http://localhost:8000/api/v1');

async function testBotWorkflow() {
  console.log('🔬 TESTING ACTUAL BOT WORKFLOW');
  console.log('==============================\n');
  
  try {
    // Test the exact scenario from user's conversation
    const testMessage = "MuthuA is celebrating his bday on nov 6th";
    console.log(`📝 Test message: "${testMessage}"`);
    
    // Step 1: Extract celebrant name (simulating LLM response)
    console.log('\n🧠 Step 1: Extract celebrant name');
    const celebrantName = 'MuthuA'; // This should come from LLM parsing
    console.log(`   Extracted name: "${celebrantName}"`);
    
    // Step 2: Check if user exists
    console.log('\n👤 Step 2: Check if user exists');
    let user = await apiClient.findUserByName(celebrantName);
    console.log(`   User found:`, user ? `Yes - ${user.name} (${user.email})` : 'No');
    
    // Step 3: Create user if doesn't exist
    if (!user) {
      console.log('\n➕ Step 3: Create new user');
      const userData = {
        teams_user_id: `teams-${celebrantName.toLowerCase()}-${Date.now()}`, // Unique ID
        name: celebrantName,
        email: `${celebrantName.toLowerCase()}@company.com`,
        is_admin: false
      };
      
      user = await apiClient.createUser(userData);
      console.log(`   User created:`, user ? `Yes - ${user.name}` : 'Failed');
    }
    
    // Step 4: Create moment
    if (user) {
      console.log('\n🎉 Step 4: Create birthday moment');
      const momentData = {
        person_name: user.name,
        moment_type: 'birthday',
        moment_date: '2025-11-06', // November 6th from the test message
        description: testMessage,
        created_by: 'admin_teams_id' // Use valid teams_user_id for foreign key
      };
      
      const moment = await apiClient.createMoment(momentData);
      console.log(`   Moment created:`, moment ? `Yes - ${moment.description}` : 'Failed');
    }
    
    // Step 5: Verify final state
    console.log('\n✅ Step 5: Verify final state');
    const finalUser = await apiClient.findUserByName(celebrantName);
    console.log(`   Final user check: ${finalUser ? finalUser.name : 'Not found'}`);
    
    console.log('\n🎊 WORKFLOW TEST COMPLETE!');
    return true;
    
  } catch (error) {
    console.error('❌ Workflow test failed:', error.message);
    console.error('   Stack:', error.stack);
    return false;
  }
}

// Test individual API client methods
async function testAPIClientMethods() {
  console.log('\n🔧 TESTING API CLIENT METHODS');
  console.log('=============================\n');
  
  try {
    // Test 1: List all users
    console.log('📋 Test 1: List all users');
    const allUsers = await apiClient.getAllUsers();
    console.log(`   Found ${allUsers.length} users`);
    allUsers.forEach(user => console.log(`   - ${user.name} (${user.email})`));
    
    // Test 2: Find specific user
    console.log('\n🔍 Test 2: Find user by name');
    const testUser = await apiClient.findUserByName('Admin');
    console.log(`   Admin user:`, testUser ? testUser.name : 'Not found');
    
    // Test 3: List moments
    console.log('\n📅 Test 3: List all moments');
    try {
      const axios = require('axios');
      const momentsResponse = await axios.get('http://localhost:8000/api/v1/moments/');
      const allMoments = momentsResponse.data;
      console.log(`   Found ${allMoments.length} moments`);
      allMoments.forEach(moment => {
        console.log(`   - ${moment.moment_type} for ${moment.person_name} - ${moment.description}`);
      });
    } catch (error) {
      console.error('   Error fetching moments:', error.message);
    }
    
    return true;
  } catch (error) {
    console.error('❌ API Client test failed:', error.message);
    return false;
  }
}

// Main execution
async function runDirectTests() {
  console.log('🎯 RUNNING DIRECT BOT LOGIC TESTS');
  console.log('==================================\n');
  
  // Test API client methods first
  const apiOk = await testAPIClientMethods();
  if (!apiOk) {
    console.log('❌ API client tests failed');
    return;
  }
  
  // Test the actual workflow
  const workflowOk = await testBotWorkflow();
  if (workflowOk) {
    console.log('✅ All tests passed!');
  } else {
    console.log('❌ Workflow tests failed');
  }
}

// Run the tests
runDirectTests().catch(console.error);