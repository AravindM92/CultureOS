/**
 * Test the complete Teams conversation flow including fallback responses
 */

const axios = require('axios');

async function testCompleteConversationFlow() {
  console.log('🧪 TESTING COMPLETE TEAMS CONVERSATION FLOW');
  console.log('==========================================\n');
  
  // Test what happens when we simulate the bot's mock response system
  console.log('📝 Testing: "Suresh is celebrating his birthday today"');
  
  // Check database before
  console.log('\n📊 BEFORE - Database state:');
  try {
    const usersResponse = await axios.get('http://localhost:8000/api/v1/users/');
    const users = usersResponse.data;
    const sureshUser = users.find(u => u.name.toLowerCase().includes('suresh'));
    console.log(`   Suresh user: ${sureshUser ? sureshUser.name : 'Not found'}`);
    
    const momentsResponse = await axios.get('http://localhost:8000/api/v1/moments/');
    const moments = momentsResponse.data;
    const sureshMoments = moments.filter(m => m.person_name.toLowerCase().includes('suresh'));
    console.log(`   Suresh moments: ${sureshMoments.length}`);
    
  } catch (error) {
    console.error('Error checking database:', error.message);
  }
  
  // Simulate the exact flow that happens in Teams
  console.log('\n🤖 SIMULATING TEAMS BOT FLOW:');
  
  // Step 1: Mock response system (what happens when Groq fails)
  console.log('1. User sends: "Suresh is celebrating his birthday today"');
  
  // Simulate mock response logic
  const userMessage = "Suresh is celebrating his birthday today";
  const mockResponseClass = require('./Culture OS/src/app/mockResponses.js');
  const mockResponses = new mockResponseClass.MockThunaiResponses();
  const mockResponse = mockResponses.getResponse(userMessage);
  
  console.log('2. Groq AI fails (firewall), falls back to mock response:');
  console.log(`   Mock response: "${mockResponse}"`);
  
  // Step 3: Check if mock response triggers moment detection
  console.log('3. Bot calls handleMomentDetection with mock response...');
  
  // Simulate handleMomentDetection logic
  const botResponse = mockResponse;
  
  // Check if bot response mentions celebration
  const mentionsCelebration = botResponse.includes('create') || botResponse.includes('moment') || 
      botResponse.includes('birthday') || botResponse.includes('promotion') || 
      botResponse.includes('anniversary') || botResponse.includes('celebration');
  
  console.log(`   Bot response mentions celebration: ${mentionsCelebration}`);
  
  if (!mentionsCelebration) {
    console.log('❌ Mock response does not trigger moment detection');
    console.log('   This is why Teams Playground conversations fail!');
    return;
  }
  
  // Extract celebration type
  const botResponseLower = botResponse.toLowerCase();
  let celebrationType = 'celebration';
  
  if (botResponseLower.includes('birthday') || botResponseLower.includes('bday')) {
    celebrationType = 'birthday';
  } else if (botResponseLower.includes('promotion') || botResponseLower.includes('promoted')) {
    celebrationType = 'promotion';
  } else if (botResponseLower.includes('anniversary')) {
    celebrationType = 'work_anniversary';
  }
  
  console.log(`   Detected celebration type: ${celebrationType}`);
  
  // Extract celebrant name from user input
  let celebrantName = null;
  const userWords = userMessage.split(' ');
  for (let i = 0; i < userWords.length; i++) {
    const word = userWords[i].replace(/[^\w]/g, '');
    if (word.length > 2 && word[0].toUpperCase() === word[0] && 
        !['The', 'This', 'That', 'When', 'Where', 'What', 'Who', 'Happy', 'Birthday', 'Is', 'His', 'Her', 'Their'].includes(word)) {
      celebrantName = word;
      break;
    }
  }
  
  console.log(`   Extracted celebrant name: ${celebrantName}`);
  
  if (celebrantName) {
    console.log('4. Creating user and moment...');
    
    try {
      // Test the API client directly
      const apiClientPath = require('path').join(__dirname, 'Culture OS', 'src', 'app', 'apiClient.js');
      const ThunaiAPIClient = require(apiClientPath);
      const apiClient = new ThunaiAPIClient('http://localhost:8000/api/v1');
      
      // Check if user exists
      let celebrant = await apiClient.findUserByName(celebrantName);
      
      if (!celebrant) {
        // Create user
        const userData = {
          teams_user_id: `teams-${celebrantName.toLowerCase()}-playground`,
          name: celebrantName,
          email: `${celebrantName.toLowerCase()}@company.com`,
          is_admin: false
        };
        
        celebrant = await apiClient.createUser(userData);
        console.log(`   User created: ${celebrant ? celebrant.name : 'Failed'}`);
      } else {
        console.log(`   User exists: ${celebrant.name}`);
      }
      
      if (celebrant) {
        // Create moment
        const momentData = {
          person_name: celebrant.name,
          moment_type: celebrationType,
          moment_date: new Date().toISOString().split('T')[0],
          description: userMessage,
          created_by: 'admin_teams_id'
        };
        
        const moment = await apiClient.createMoment(momentData);
        console.log(`   Moment created: ${moment ? 'Yes' : 'Failed (but might be Unicode issue)'}`);
      }
      
    } catch (error) {
      console.error('   Error in API calls:', error.message);
    }
  }
  
  // Check database after
  console.log('\n📊 AFTER - Database state:');
  try {
    const usersResponse = await axios.get('http://localhost:8000/api/v1/users/');
    const users = usersResponse.data;
    const sureshUser = users.find(u => u.name.toLowerCase().includes('suresh'));
    console.log(`   Suresh user: ${sureshUser ? sureshUser.name + ' (ID: ' + sureshUser.id + ')' : 'Not found'}`);
    
    const momentsResponse = await axios.get('http://localhost:8000/api/v1/moments/');
    const moments = momentsResponse.data;
    const sureshMoments = moments.filter(m => m.person_name.toLowerCase().includes('suresh'));
    console.log(`   Suresh moments: ${sureshMoments.length}`);
    sureshMoments.forEach(moment => {
      console.log(`     - ${moment.moment_type} on ${moment.moment_date}: ${moment.description}`);
    });
    
  } catch (error) {
    console.error('Error checking database after:', error.message);
  }
  
  console.log('\n✅ This simulates the EXACT flow that should happen in Teams Playground');
  console.log('   Now try sending "Suresh is celebrating his birthday today" in Teams!');
}

testCompleteConversationFlow().catch(console.error);